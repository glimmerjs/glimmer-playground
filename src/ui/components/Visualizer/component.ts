import Component, { tracked } from "@glimmer/component";

import FileSystem from "../../../utils/file-system";
import { inspect } from "./-utils/inspect-program";

export default class Visualizer extends Component {
  args: {
    fs: FileSystem
  };

  @tracked('args')
  get compilation() {
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
