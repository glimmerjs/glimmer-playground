import Component, { tracked } from "@glimmer/component";
import { BundleCompiler, CompilerDelegate, Specifier, specifierFor } from "@glimmer/bundle-compiler";
import { ComponentCapabilities, ProgramSymbolTable } from "@glimmer/interfaces";
import { SerializedTemplateBlock } from "@glimmer/wire-format";
import { CompilableTemplate, CompileOptions } from "@glimmer/opcode-compiler";
import { CompilableTemplate as ICompilableTemplate } from "@glimmer/runtime";
import { TYPE_MASK, OPERAND_LEN_MASK, ARG_SHIFT } from '@glimmer/encoder';
import { METADATA } from "./-utils/debug-opcodes";

import FileSystem, { File } from "../../../utils/file-system";
import ResolutionMap from "../../../utils/resolution-map";
import { ConstantPool } from "@glimmer/program";

export default class Visualizer extends Component {
  args: {
    fs: FileSystem
  };

  @tracked('args')
  get output() {
    let { fs } = this.args;

    let resolutionMap = fs.toResolutionMap();
    console.log(resolutionMap);
    let delegate = new VisualizerCompilerDelegate(resolutionMap);
    let bundle = new BundleCompiler(delegate);
    let buffer = '';

    for (let specifier in resolutionMap) {
      let [type, path] = specifier.split(':');

      if (type !== 'template') {
        continue;
      }

      let mod = resolutionMap[specifier];
      let source = mod.meta.source;

      header(specifier);

      subheader('Source');
      print(source);

      subheader('Intermediate Representation (IR)');
      print(extractIR(mod));

      let bundleSpec = specifierFor(path, 'default');
      bundle.add(bundleSpec, source);
    }

    let compilation = bundle.compile();

    header('Compiled Output');

    subheader('Data Segment');
    print(compilation.pool);

    subheader('Code Segment');
    let bytes = new Uint16Array(compilation.heap.buffer);
    printOpcodes(bytes, compilation.pool);

    function header(title) {
      print(`\n${title}`);
      print("=".repeat(title.length));
    }

    function subheader(title) {
      print(`\n*** ${title}\n`);
    }

    function printOpcodes(bytes: Uint16Array, pool: ConstantPool) {
      let pc = 0;

      while (pc < bytes.length) {
        let opcode = bytes[pc] & TYPE_MASK;
        let size = ((bytes[pc] & OPERAND_LEN_MASK) >> ARG_SHIFT) + 1;

        let op = METADATA[opcode];
        if (op) {
          print(`${toHex(opcode)} ${op.name}`);
        } else {
          print(`${toHex(opcode)} xx`);
        }

        for (let i = 0; i < size; i++) {
          let operand = bytes[pc + i + 1];
          if (op.ops[i] && op.ops[i].type === 'str') {
            let str = pool.strings[operand]
              .replace(/\n/g, '\\n')
              .replace(/\t/g, '\\t');

            print(`  "${str}" (${toHex(operand)})`);
          }
        }

        pc += size;
      }
    }

    function printBytes(bytes: Uint8Array) {
      let formatted = Array.from(bytes)
        .map(n => n.toString(16))
        .map(n => `0${n}`.substr(-2))
        .map(n => `0x${n}`)
        .join(' ');

      print(formatted);
    }

    function print(text) {
      if (typeof text !== 'string') {
        text = JSON.stringify(text, null, 2);
      }

      buffer += `${text}\n`;
    }

    return buffer;
  }
}

function toHex(num: number) {
  let hex = `0${num.toString(16)}`.substr(-2);
  return `0x${hex}`;
}

function extractIR(mod) {
  let json = JSON.parse(mod.block);
  return JSON.stringify(json);
}

const capabilities: ComponentCapabilities = {
  staticDefinitions: false,
  dynamicLayout: false,
  dynamicTag: true,
  prepareArgs: false,
  createArgs: true,
  attributeHook: true,
  elementHook: true
};

class VisualizerCompilerDelegate implements CompilerDelegate {
  constructor(private map: {}) {
  }

  hasComponentInScope(componentName: string, referrer: Specifier): boolean {
    let key = `template:/glimmer-repl/components/${componentName}`;
    return key in this.map;
  }

  resolveComponentSpecifier(componentName: string, referrer: Specifier): Specifier {
    return specifierFor(`/glimmer-repl/components/${componentName}`, 'default');
  }

  getComponentCapabilities(specifier: Specifier): ComponentCapabilities {
    return capabilities;
  }
  getComponentLayout(specifier: Specifier, block: SerializedTemplateBlock, options: CompileOptions<Specifier>): ICompilableTemplate<ProgramSymbolTable> {
    return CompilableTemplate.topLevel(block, options);
  }
  hasHelperInScope(helperName: string, referrer: Specifier): boolean {
    return helperName === 'action';
  }

  resolveHelperSpecifier(helperName: string, referrer: Specifier): Specifier {
    return specifierFor(`/glimmer-repl/helpers/${helperName}`, 'default');
  }

  hasModifierInScope(modifierName: string, referrer: Specifier): boolean {
    throw new Error("Method not implemented.");
  }
  resolveModifierSpecifier(modifierName: string, referrer: Specifier): Specifier {
    throw new Error("Method not implemented.");
  }
  hasPartialInScope(partialName: string, referrer: Specifier): boolean {
    throw new Error("Method not implemented.");
  }
  resolvePartialSpecifier(partialName: string, referrer: Specifier): Specifier {
    throw new Error("Method not implemented.");
  }
}