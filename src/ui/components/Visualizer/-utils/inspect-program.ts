import { METADATA, Operand } from "./opcode-metadata";
import { compile } from "./compiler";
import { ConstantPool } from "@glimmer/program";
import { TYPE_MASK, OPERAND_LEN_MASK, ARG_SHIFT } from '@glimmer/encoder';

import { toHex } from '../hex/helper';
import hexdump from './hexdump';

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

  let { heap, pool } = compile(templates, helpers);

  let buffer = Array.from(new Uint8Array(heap.buffer))
    .map(n => toHex(n));

  let opcodes = inspectOpcodes(heap.buffer, pool);

  return {
    hexdump: hexdump(heap.buffer),
    byteLength: heap.buffer.byteLength,
    buffer,
    opcodes,
    pool
  };
}

const UNKNOWN_OP = {
  name: 'UNKNOWN_OP_CODE',
  operands: 0,
  ops: []
};

function inspectOpcodes(buffer: ArrayBuffer, pool: ConstantPool) {
  let bytes = new Uint16Array(buffer);
  let pc = 0;
  let ops = [];

  while (pc < bytes.length) {
    let opcode = bytes[pc] & TYPE_MASK;
    let size = ((bytes[pc] & OPERAND_LEN_MASK) >> ARG_SHIFT) + 1;

    let op = METADATA[opcode] || UNKNOWN_OP;

    let operands = op.ops.map((operand, offset) => {
      let val = bytes[pc + offset + 1];
      return operandFor(operand, val, pool);
    });

    ops.push({
      name: op.name,
      opcode,
      operands
    });

    pc += size;
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

