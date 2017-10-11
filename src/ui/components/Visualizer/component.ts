import Component, { tracked } from "@glimmer/component";
import { BundleCompiler, CompilerDelegate, Specifier, specifierFor } from "@glimmer/bundle-compiler";
import { ComponentCapabilities, ProgramSymbolTable } from "@glimmer/interfaces";
import { CompilableTemplate, CompileOptions } from "@glimmer/opcode-compiler";
import { CompilableTemplate as ICompilableTemplate } from "@glimmer/runtime";
import { TYPE_MASK, OPERAND_LEN_MASK, ARG_SHIFT } from '@glimmer/encoder';
import { ConstantPool } from "@glimmer/program";

import FileSystem, { File } from "../../../utils/file-system";
import ResolutionMap from "../../../utils/resolution-map";
import { inspect } from "./-utils/inspect-program";

export default class Visualizer extends Component {
  args: {
    fs: FileSystem
  };

  @tracked('args')
  get opcodes() {
    let { fs } = this.args;

    let resolutionMap = fs.toResolutionMap();

    return inspect(resolutionMap);
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
