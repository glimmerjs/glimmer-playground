/* This file is copied from Glimmer VM's @glimmer/debug package, which is not currently published on npm. */

import { Option, Dict } from '@glimmer/interfaces';

const tuple = <T extends string[]>(...args: T) => args;

// TODO: How do these map onto constant and machine types?
export const OPERAND_TYPES = tuple(
  'u32',
  'i32',
  'handle',
  'bool',
  'str',
  'option-str',
  'str-array',
  'array',
  'unknown',
  'primitive',
  'scope',
  'symbol-table',
  'register',
  'meta'
);

function isOperandType(s: string): s is OperandType {
  return OPERAND_TYPES.indexOf(s as any) !== -1;
}

export type OperandType = typeof OPERAND_TYPES[number];

export interface Operand {
  type: OperandType;
  name: string;
}

export type OperandList = ([] | [Operand] | [Operand, Operand] | [Operand, Operand, Operand]) &
  Operand[];

export interface NormalizedMetadata {
  name: string;
  mnemonic: string;
  before: null;
  stackChange: Option<number>;
  ops: OperandList;
  operands: number;
  check: boolean;
}

export type Stack = [string[], string[]];

export interface RawOperandMetadata {
  kind: 'machine' | 'syscall';
  format: RawOperandFormat;
  skip?: true;
  operation: string;
  'operand-stack'?: [string[], string[]];
  notes?: string;
}

export type RawOperandFormat = string | string[];

export function normalize(key: string, input: RawOperandMetadata): NormalizedMetadata {
  let name;

  if (input.format === undefined) {
    throw new Error(`Missing format in ${JSON.stringify(input)}`);
  }

  if (Array.isArray(input.format)) {
    name = input.format[0];
  } else {
    name = input.format;
  }

  let ops: OperandList = Array.isArray(input.format) ? operands(input.format.slice(1)) : [];

  return {
    name,
    mnemonic: key,
    before: null,
    stackChange: stackChange(input['operand-stack']),
    ops,
    operands: ops.length,
    check: input.skip === true ? false : true,
  };
}

function stackChange(stack?: Stack): Option<number> {
  if (stack === undefined) {
    return 0;
  }

  let before = stack[0];
  let after = stack[1];

  if (hasRest(before) || hasRest(after)) {
    return null;
  }

  return after.length - before.length;
}

function hasRest(input: string[]): boolean {
  if (!Array.isArray(input)) {
    throw new Error(`Unexpected stack entry: ${JSON.stringify(input)}`);
  }
  return input.some(s => s.slice(-3) === '...');
}

function operands(input: string[]): OperandList {
  if (!Array.isArray(input)) {
    throw new Error(`Expected operands array, got ${JSON.stringify(input)}`);
  }
  return input.map(op) as OperandList;
}

function op(input: string): Operand {
  let [name, type] = input.split(':');

  if (isOperandType(type)) {
    return { name, type };
  } else {
    throw new Error(`Expected operand, found ${JSON.stringify(input)}`);
  }
}

export function normalizeAll(parsed: {
  machine: Dict<RawOperandMetadata>;
  syscall: Dict<RawOperandMetadata>;
}): { machine: Dict<NormalizedMetadata>; syscall: Dict<NormalizedMetadata> } {
  let machine = normalizeParsed(parsed.machine);
  let syscall = normalizeParsed(parsed.syscall);

  return { machine, syscall };
}

export function normalizeParsed(parsed: Dict<RawOperandMetadata>): Dict<NormalizedMetadata> {
  let out = Object.create(null) as Dict<NormalizedMetadata>;

  for (let key of Object.keys(parsed)) {
    out[key] = normalize(key, parsed[key]);
  }

  return out;
}

export function buildEnum(
  name: string,
  parsed: Dict<NormalizedMetadata>,
  offset: number,
  max?: number
): { enumString: string; predicate: string } {
  let e = [`export const enum ${name} {`];

  let last: number;

  Object.keys(parsed).forEach((key, i) => {
    e.push(`  ${parsed[key].name} = ${offset + i},`);
    last = i;
  });

  e.push(`  Size = ${last! + offset + 1},`);
  e.push('}');

  let enumString = e.join('\n');

  let predicate;

  if (max) {
    predicate = strip`
      export function is${name}(value: number): value is ${name} {
        return value >= ${offset} && value <= ${max};
      }
    `;
  } else {
    predicate = strip`
      export function is${name}(value: number): value is ${name} {
        return value >= ${offset};
      }
    `;
  }

  return { enumString, predicate };
}

export function strip(strings: TemplateStringsArray, ...args: unknown[]) {
  let out = '';
  for (let i = 0; i < strings.length; i++) {
    let string = strings[i];
    let dynamic = args[i] !== undefined ? String(args[i]) : '';

    out += `${string}${dynamic}`;
  }

  out = out.match(/^\s*?\n?([\s\S]*?)\n?\s*$/)![1];

  let min = Number.MAX_SAFE_INTEGER;

  for (let line of out.split('\n')) {
    let leading = line.match(/^\s*/)![0].length;

    min = Math.min(min, leading);
  }

  let stripped = '';

  for (let line of out.split('\n')) {
    stripped += line.slice(min) + '\n';
  }

  return stripped;
}

export const META_KIND = tuple('METADATA', 'MACHINE_METADATA');
export type META_KIND = (typeof META_KIND)[number];

export function buildSingleMeta(
  kind: META_KIND,
  all: Dict<NormalizedMetadata>,
  key: keyof typeof all
): string {
  let e = kind === 'MACHINE_METADATA' ? 'MachineOp' : 'Op';
  return `${kind}[${e}.${all[key].name}] = ${stringify(all[key], 0)};`;
}

function stringify(o: unknown, pad: number): string {
  if (typeof o !== 'object' || o === null) {
    if (typeof o === 'string') {
      return `'${o}'`;
    }
    return JSON.stringify(o);
  }

  if (Array.isArray(o)) {
    return `[${o.map(v => stringify(v, pad)).join(', ')}]`;
  }

  let out = ['{'];

  for (let key of Object.keys(o)) {
    out.push(`${' '.repeat(pad + 2)}${key}: ${stringify((o as Dict)[key], pad + 2)},`);
  }

  out.push(`${' '.repeat(pad)}}`);

  return out.join('\n');
}

export function buildMetas(kind: META_KIND, all: Dict<NormalizedMetadata>): string {
  let out = [];

  for (let key of Object.keys(all)) {
    out.push(buildSingleMeta(kind, all, key));
  }

  return out.join('\n\n');
}

import { MachineOp, Op } from '@glimmer/interfaces';
import { fillNulls } from '@glimmer/util';

export function opcodeMetadata(op: MachineOp | Op, isMachine: 0 | 1): Option<NormalizedMetadata> {
  let value = isMachine ? MACHINE_METADATA[op] : METADATA[op];

  return value || null;
}

export interface NormalizedMetadata {
  name: string;
  mnemonic: string;
  before: null;
  stackChange: Option<number>;
  ops: OperandList;
  operands: number;
  check: boolean;
}

const METADATA: Option<NormalizedMetadata>[] = fillNulls(Op.Size);
const MACHINE_METADATA: Option<NormalizedMetadata>[] = fillNulls(MachineOp.Size);
MACHINE_METADATA[MachineOp.PushFrame] = {
  name: 'PushFrame',
  mnemonic: 'pushf',
  before: null,
  stackChange: 2,
  ops: [],
  operands: 0,
  check: true,
};

MACHINE_METADATA[MachineOp.PopFrame] = {
  name: 'PopFrame',
  mnemonic: 'popf',
  before: null,
  stackChange: -2,
  ops: [],
  operands: 0,
  check: false,
};

MACHINE_METADATA[MachineOp.InvokeVirtual] = {
  name: 'InvokeVirtual',
  mnemonic: 'vcall',
  before: null,
  stackChange: -1,
  ops: [],
  operands: 0,
  check: true,
};

MACHINE_METADATA[MachineOp.InvokeStatic] = {
  name: 'InvokeStatic',
  mnemonic: 'scall',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'offset',
      type: 'u32',
    },
  ],
  operands: 1,
  check: true,
};

MACHINE_METADATA[MachineOp.Jump] = {
  name: 'Jump',
  mnemonic: 'goto',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'to',
      type: 'u32',
    },
  ],
  operands: 1,
  check: true,
};

MACHINE_METADATA[MachineOp.Return] = {
  name: 'Return',
  mnemonic: 'ret',
  before: null,
  stackChange: 0,
  ops: [],
  operands: 0,
  check: false,
};

MACHINE_METADATA[MachineOp.ReturnTo] = {
  name: 'ReturnTo',
  mnemonic: 'setra',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'offset',
      type: 'i32',
    },
  ],
  operands: 1,
  check: true,
};
METADATA[Op.Helper] = {
  name: 'Helper',
  mnemonic: 'ncall',
  before: null,
  stackChange: null,
  ops: [
    {
      name: 'helper',
      type: 'handle',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.SetNamedVariables] = {
  name: 'SetNamedVariables',
  mnemonic: 'vsargs',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'register',
      type: 'u32',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.SetBlocks] = {
  name: 'SetBlocks',
  mnemonic: 'vbblocks',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'register',
      type: 'u32',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.SetVariable] = {
  name: 'SetVariable',
  mnemonic: 'sbvar',
  before: null,
  stackChange: -1,
  ops: [
    {
      name: 'symbol',
      type: 'u32',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.SetAotBlock] = {
  name: 'SetAotBlock',
  mnemonic: 'sbblock',
  before: null,
  stackChange: -3,
  ops: [
    {
      name: 'symbol',
      type: 'u32',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.SetJitBlock] = {
  name: 'SetJitBlock',
  mnemonic: 'sjblock',
  before: null,
  stackChange: -3,
  ops: [
    {
      name: 'symbol',
      type: 'u32',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.GetVariable] = {
  name: 'GetVariable',
  mnemonic: 'symload',
  before: null,
  stackChange: 1,
  ops: [
    {
      name: 'symbol',
      type: 'u32',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.GetProperty] = {
  name: 'GetProperty',
  mnemonic: 'getprop',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'property',
      type: 'str',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.GetBlock] = {
  name: 'GetBlock',
  mnemonic: 'blockload',
  before: null,
  stackChange: 3,
  ops: [
    {
      name: 'block',
      type: 'u32',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.HasBlock] = {
  name: 'HasBlock',
  mnemonic: 'hasblockload',
  before: null,
  stackChange: 1,
  ops: [
    {
      name: 'block',
      type: 'u32',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.HasBlockParams] = {
  name: 'HasBlockParams',
  mnemonic: 'hasparamsload',
  before: null,
  stackChange: -2,
  ops: [
    {
      name: 'block',
      type: 'u32',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.Concat] = {
  name: 'Concat',
  mnemonic: 'concat',
  before: null,
  stackChange: null,
  ops: [
    {
      name: 'count',
      type: 'u32',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.Constant] = {
  name: 'Constant',
  mnemonic: 'rconstload',
  before: null,
  stackChange: 1,
  ops: [
    {
      name: 'constant',
      type: 'unknown',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.Primitive] = {
  name: 'Primitive',
  mnemonic: 'pconstload',
  before: null,
  stackChange: 1,
  ops: [
    {
      name: 'constant',
      type: 'primitive',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.PrimitiveReference] = {
  name: 'PrimitiveReference',
  mnemonic: 'ptoref',
  before: null,
  stackChange: 0,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.ReifyU32] = {
  name: 'ReifyU32',
  mnemonic: 'reifyload',
  before: null,
  stackChange: 1,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.Dup] = {
  name: 'Dup',
  mnemonic: 'dup',
  before: null,
  stackChange: 1,
  ops: [
    {
      name: 'register',
      type: 'u32',
    },
    {
      name: 'offset',
      type: 'u32',
    },
  ],
  operands: 2,
  check: true,
};

METADATA[Op.Pop] = {
  name: 'Pop',
  mnemonic: 'pop',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'count',
      type: 'u32',
    },
  ],
  operands: 1,
  check: false,
};

METADATA[Op.Load] = {
  name: 'Load',
  mnemonic: 'put',
  before: null,
  stackChange: -1,
  ops: [
    {
      name: 'register',
      type: 'u32',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.Fetch] = {
  name: 'Fetch',
  mnemonic: 'regload',
  before: null,
  stackChange: 1,
  ops: [
    {
      name: 'register',
      type: 'u32',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.RootScope] = {
  name: 'RootScope',
  mnemonic: 'rscopepush',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'symbols',
      type: 'u32',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.VirtualRootScope] = {
  name: 'VirtualRootScope',
  mnemonic: 'vrscopepush',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'register',
      type: 'u32',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.ChildScope] = {
  name: 'ChildScope',
  mnemonic: 'cscopepush',
  before: null,
  stackChange: 0,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.PopScope] = {
  name: 'PopScope',
  mnemonic: 'scopepop',
  before: null,
  stackChange: 0,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.Text] = {
  name: 'Text',
  mnemonic: 'apnd_text',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'contents',
      type: 'str',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.Comment] = {
  name: 'Comment',
  mnemonic: 'apnd_comment',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'contents',
      type: 'str',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.AppendHTML] = {
  name: 'AppendHTML',
  mnemonic: 'apnd_dynhtml',
  before: null,
  stackChange: -1,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.AppendSafeHTML] = {
  name: 'AppendSafeHTML',
  mnemonic: 'apnd_dynshtml',
  before: null,
  stackChange: -1,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.AppendDocumentFragment] = {
  name: 'AppendDocumentFragment',
  mnemonic: 'apnd_dynfrag',
  before: null,
  stackChange: -1,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.AppendNode] = {
  name: 'AppendNode',
  mnemonic: 'apnd_dynnode',
  before: null,
  stackChange: -1,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.AppendText] = {
  name: 'AppendText',
  mnemonic: 'apnd_dyntext',
  before: null,
  stackChange: -1,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.OpenElement] = {
  name: 'OpenElement',
  mnemonic: 'apnd_tag',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'tag',
      type: 'str',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.OpenDynamicElement] = {
  name: 'OpenDynamicElement',
  mnemonic: 'apnd_dyntag',
  before: null,
  stackChange: -1,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.PushRemoteElement] = {
  name: 'PushRemoteElement',
  mnemonic: 'apnd_remotetag',
  before: null,
  stackChange: -3,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.StaticAttr] = {
  name: 'StaticAttr',
  mnemonic: 'apnd_attr',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'name',
      type: 'str',
    },
    {
      name: 'value',
      type: 'str',
    },
    {
      name: 'namespace',
      type: 'option-str',
    },
  ],
  operands: 3,
  check: true,
};

METADATA[Op.DynamicAttr] = {
  name: 'DynamicAttr',
  mnemonic: 'apnd_dynattr',
  before: null,
  stackChange: -1,
  ops: [
    {
      name: 'name',
      type: 'str',
    },
    {
      name: 'trusting',
      type: 'bool',
    },
    {
      name: 'namespace',
      type: 'option-str',
    },
  ],
  operands: 3,
  check: true,
};

METADATA[Op.ComponentAttr] = {
  name: 'ComponentAttr',
  mnemonic: 'apnd_cattr',
  before: null,
  stackChange: -1,
  ops: [
    {
      name: 'name',
      type: 'str',
    },
    {
      name: 'trusting',
      type: 'bool',
    },
    {
      name: 'namespace',
      type: 'option-str',
    },
  ],
  operands: 3,
  check: true,
};

METADATA[Op.FlushElement] = {
  name: 'FlushElement',
  mnemonic: 'apnd_flushtag',
  before: null,
  stackChange: 0,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.CloseElement] = {
  name: 'CloseElement',
  mnemonic: 'apnd_closetag',
  before: null,
  stackChange: 0,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.PopRemoteElement] = {
  name: 'PopRemoteElement',
  mnemonic: 'apnd_closeremotetag',
  before: null,
  stackChange: 0,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.Modifier] = {
  name: 'Modifier',
  mnemonic: 'apnd_modifier',
  before: null,
  stackChange: -1,
  ops: [
    {
      name: 'helper',
      type: 'handle',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.BindDynamicScope] = {
  name: 'BindDynamicScope',
  mnemonic: 'setdynscope',
  before: null,
  stackChange: null,
  ops: [
    {
      name: 'names',
      type: 'str-array',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.PushDynamicScope] = {
  name: 'PushDynamicScope',
  mnemonic: 'dynscopepush',
  before: null,
  stackChange: 0,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.PopDynamicScope] = {
  name: 'PopDynamicScope',
  mnemonic: 'dynscopepop',
  before: null,
  stackChange: 0,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.CompileBlock] = {
  name: 'CompileBlock',
  mnemonic: 'cmpblock',
  before: null,
  stackChange: 0,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.PushBlockScope] = {
  name: 'PushBlockScope',
  mnemonic: 'scopeload',
  before: null,
  stackChange: 1,
  ops: [
    {
      name: 'scope',
      type: 'scope',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.PushSymbolTable] = {
  name: 'PushSymbolTable',
  mnemonic: 'dsymload',
  before: null,
  stackChange: 1,
  ops: [
    {
      name: 'table',
      type: 'symbol-table',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.InvokeYield] = {
  name: 'InvokeYield',
  mnemonic: 'invokeyield',
  before: null,
  stackChange: null,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.JumpIf] = {
  name: 'JumpIf',
  mnemonic: 'iftrue',
  before: null,
  stackChange: -1,
  ops: [
    {
      name: 'to',
      type: 'u32',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.JumpUnless] = {
  name: 'JumpUnless',
  mnemonic: 'iffalse',
  before: null,
  stackChange: -1,
  ops: [
    {
      name: 'to',
      type: 'u32',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.JumpEq] = {
  name: 'JumpEq',
  mnemonic: 'ifeq',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'to',
      type: 'i32',
    },
    {
      name: 'comparison',
      type: 'i32',
    },
  ],
  operands: 2,
  check: true,
};

METADATA[Op.AssertSame] = {
  name: 'AssertSame',
  mnemonic: 'assert_eq',
  before: null,
  stackChange: 0,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.Enter] = {
  name: 'Enter',
  mnemonic: 'blk_start',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'args',
      type: 'u32',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.Exit] = {
  name: 'Exit',
  mnemonic: 'blk_end',
  before: null,
  stackChange: 0,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.ToBoolean] = {
  name: 'ToBoolean',
  mnemonic: 'anytobool',
  before: null,
  stackChange: 0,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.EnterList] = {
  name: 'EnterList',
  mnemonic: 'list_start',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'address',
      type: 'u32',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.ExitList] = {
  name: 'ExitList',
  mnemonic: 'list_end',
  before: null,
  stackChange: 0,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.PutIterator] = {
  name: 'PutIterator',
  mnemonic: 'toiter',
  before: null,
  stackChange: 0,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.Iterate] = {
  name: 'Iterate',
  mnemonic: 'iter',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'end',
      type: 'u32',
    },
  ],
  operands: 1,
  check: false,
};

METADATA[Op.Main] = {
  name: 'Main',
  mnemonic: 'main',
  before: null,
  stackChange: -2,
  ops: [
    {
      name: 'state',
      type: 'register',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.IsComponent] = {
  name: 'IsComponent',
  mnemonic: 'iscomponent',
  before: null,
  stackChange: 0,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.ContentType] = {
  name: 'ContentType',
  mnemonic: 'ctload',
  before: null,
  stackChange: 1,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.CurryComponent] = {
  name: 'CurryComponent',
  mnemonic: 'curry',
  before: null,
  stackChange: null,
  ops: [
    {
      name: 'templateMeta',
      type: 'meta',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.PushComponentDefinition] = {
  name: 'PushComponentDefinition',
  mnemonic: 'cmload',
  before: null,
  stackChange: 1,
  ops: [
    {
      name: 'spec',
      type: 'handle',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.PushDynamicComponentInstance] = {
  name: 'PushDynamicComponentInstance',
  mnemonic: 'dciload',
  before: null,
  stackChange: 0,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.PushCurriedComponent] = {
  name: 'PushCurriedComponent',
  mnemonic: 'curriedload',
  before: null,
  stackChange: 0,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.ResolveDynamicComponent] = {
  name: 'ResolveDynamicComponent',
  mnemonic: 'cdload',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'templateMeta',
      type: 'meta',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.PushArgs] = {
  name: 'PushArgs',
  mnemonic: 'argsload',
  before: null,
  stackChange: null,
  ops: [
    {
      name: 'names',
      type: 'str-array',
    },
    {
      name: 'positionalCount',
      type: 'u32',
    },
    {
      name: 'synthetic',
      type: 'bool',
    },
  ],
  operands: 3,
  check: true,
};

METADATA[Op.PushEmptyArgs] = {
  name: 'PushEmptyArgs',
  mnemonic: 'emptyargsload',
  before: null,
  stackChange: 1,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.PopArgs] = {
  name: 'PopArgs',
  mnemonic: 'argspop',
  before: null,
  stackChange: null,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.PrepareArgs] = {
  name: 'PrepareArgs',
  mnemonic: 'argsprep',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'state',
      type: 'register',
    },
  ],
  operands: 1,
  check: false,
};

METADATA[Op.CaptureArgs] = {
  name: 'CaptureArgs',
  mnemonic: 'argscapture',
  before: null,
  stackChange: 0,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.CreateComponent] = {
  name: 'CreateComponent',
  mnemonic: 'comp_create',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'flags',
      type: 'u32',
    },
    {
      name: 'state',
      type: 'register',
    },
  ],
  operands: 2,
  check: true,
};

METADATA[Op.RegisterComponentDestructor] = {
  name: 'RegisterComponentDestructor',
  mnemonic: 'comp_dest',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'state',
      type: 'register',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.PutComponentOperations] = {
  name: 'PutComponentOperations',
  mnemonic: 'comp_elops',
  before: null,
  stackChange: 0,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.GetComponentSelf] = {
  name: 'GetComponentSelf',
  mnemonic: 'comp_selfload',
  before: null,
  stackChange: 1,
  ops: [
    {
      name: 'state',
      type: 'register',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.GetComponentTagName] = {
  name: 'GetComponentTagName',
  mnemonic: 'comp_tagload',
  before: null,
  stackChange: 1,
  ops: [
    {
      name: 'state',
      type: 'register',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.GetAotComponentLayout] = {
  name: 'GetAotComponentLayout',
  mnemonic: 'comp_alayoutload',
  before: null,
  stackChange: 2,
  ops: [
    {
      name: 'state',
      type: 'register',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.GetJitComponentLayout] = {
  name: 'GetJitComponentLayout',
  mnemonic: 'comp_jlayoutload',
  before: null,
  stackChange: 2,
  ops: [
    {
      name: 'state',
      type: 'register',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.BindEvalScope] = {
  name: 'BindEvalScope',
  mnemonic: 'eval_scope',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'state',
      type: 'register',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.SetupForEval] = {
  name: 'SetupForEval',
  mnemonic: 'eval_setup',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'state',
      type: 'register',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.PopulateLayout] = {
  name: 'PopulateLayout',
  mnemonic: 'comp_layoutput',
  before: null,
  stackChange: -2,
  ops: [
    {
      name: 'state',
      type: 'register',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.InvokeComponentLayout] = {
  name: 'InvokeComponentLayout',
  mnemonic: 'comp_invokelayout',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'state',
      type: 'register',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.BeginComponentTransaction] = {
  name: 'BeginComponentTransaction',
  mnemonic: 'comp_begin',
  before: null,
  stackChange: 0,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.CommitComponentTransaction] = {
  name: 'CommitComponentTransaction',
  mnemonic: 'comp_commit',
  before: null,
  stackChange: 0,
  ops: [],
  operands: 0,
  check: true,
};

METADATA[Op.DidCreateElement] = {
  name: 'DidCreateElement',
  mnemonic: 'comp_created',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'state',
      type: 'register',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.DidRenderLayout] = {
  name: 'DidRenderLayout',
  mnemonic: 'comp_rendered',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'state',
      type: 'register',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.InvokePartial] = {
  name: 'InvokePartial',
  mnemonic: 'invokepartial',
  before: null,
  stackChange: 1,
  ops: [
    {
      name: 'templateMeta',
      type: 'meta',
    },
    {
      name: 'symbols',
      type: 'str-array',
    },
    {
      name: 'evalInfo',
      type: 'array',
    },
  ],
  operands: 3,
  check: true,
};

METADATA[Op.ResolveMaybeLocal] = {
  name: 'ResolveMaybeLocal',
  mnemonic: 'eval_varload',
  before: null,
  stackChange: 1,
  ops: [
    {
      name: 'local',
      type: 'str',
    },
  ],
  operands: 1,
  check: true,
};

METADATA[Op.Debugger] = {
  name: 'Debugger',
  mnemonic: 'debugger',
  before: null,
  stackChange: 0,
  ops: [
    {
      name: 'symbols',
      type: 'str-array',
    },
    {
      name: 'evalInfo',
      type: 'array',
    },
  ],
  operands: 2,
  check: true,
};
