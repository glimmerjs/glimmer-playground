import { opcodeMetadata, Operand } from "./opcode-metadata";
import { compile } from "./compiler";
import { OpcodeSize } from "@glimmer/encoder";
import { hydrateProgram } from "@glimmer/program";

import { toHex } from '../hex/helper';
import hexdump from './hexdump';
import { CompilerArtifacts, ConstantPool } from "@glimmer/interfaces";

export function inspect(map: {}) {
  let templates = {};
  let helpers = {};

  for (let specifier in map) {
    let [type, path] = specifier.split(':');
    if (type === 'template') {
      templates[specifier] = map[specifier];
    }

    if (type === 'helper') {
      helpers[specifier] = map[specifier];
    }
  }

  let { heap, pool: constants } = compile(templates, helpers);

  let buffer = Array.from(new Uint8Array(heap.buffer))
    .map(n => toHex(n));

  let opcodes = inspectOpcodes({ heap, constants });

  return {
    hexdump: hexdump(heap.buffer),
    byteLength: heap.buffer.byteLength,
    buffer,
    opcodes,
    constants
  };
}

const UNKNOWN_OP = {
  name: 'UNKNOWN_OP_CODE',
  operands: 0,
  ops: []
};

function inspectOpcodes(artifacts: CompilerArtifacts) {
  let program = hydrateProgram(artifacts);

  let pc = 0;
  let ops = [];
  let opcode = program.opcode(pc);
  let size = artifacts.heap.buffer.byteLength / 4;

  while (pc < size) {
    let op = opcodeMetadata(opcode.type, opcode.isMachine) || UNKNOWN_OP;

    let operands = op.ops.map((operand, offset) => {
      let val: number;
      switch (offset) {
        case 0:
          val = opcode.op1;
          break;
        case 1:
          val = opcode.op2;
          break;
        case 3:
          val = opcode.op3;
          break;
      }

      return operandFor(operand, val, artifacts.constants);
    });

    ops.push({
      name: op.name,
      opcode: opcode.type,
      operands
    });

    pc += opcode.size
    opcode = program.opcode(pc);
  }

  return ops;
}

function operandFor(operand: Operand, rawValue: any, pool: ConstantPool) {
  let value: any = rawValue;

  switch (operand.type) {
    case 'str':
      value = pool.strings[rawValue]
        .replace(/\n/g, '\\n');
      value = `"${value}"`;
      break;
  }

  return {
    type: operand.type,
    name: operand.name,
    rawValue,
    value
  };
}

