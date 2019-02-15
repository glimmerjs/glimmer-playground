import Component, { tracked } from "@glimmer/component";

import FileSystem from "../../../utils/file-system";
import { inspect } from "./-utils/inspect-program";

export default class Visualizer extends Component {
  args: {
    fs: FileSystem
  };

  @tracked
  get compilation() {
    let { fs } = this.args;

    let resolutionMap = fs.toResolutionMap();

    return inspect(resolutionMap);
  }
}