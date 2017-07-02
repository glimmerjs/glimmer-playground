import Component, { tracked } from "@glimmer/component";
import fs from "../../../utils/filesystem";

interface ComponentEntry {
  template: string;
  component: string;
}

declare function vsRequire(deps: string[], cb: any);
declare var typings;

export default class GlimmerRepl extends Component {
  @tracked components = [fs.createComponentEntry()];
  @tracked revision = 1;
  @tracked isLoaded = false;

  didInsertElement() {
    waitForDependencies()
      .then(() => {
        this.isLoaded = true;
      });

  }

  addComponent() {
    this.components.push(fs.createComponentEntry());
    this.components = this.components;
  }

  fileDidChange(file) {
    this.revision++;
  }
}

function waitForDependencies() {
  return new Promise((resolve, reject) => {
    vsRequire(['vs/editor/editor.main', 'vs/language/typescript/lib/typescriptServices'], () => {
      initializeTypeScript();
      resolve();
    });
  });
}

function initializeTypeScript() {
  let ts = monaco.languages.typescript;

  for (let filename in typings) {
    let content = typings[filename];
    ts.typescriptDefaults.addExtraLib(content, `file:///${filename}`);
  }

  ts.typescriptDefaults.setCompilerOptions({
    target: ts.ScriptTarget.ES2016,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    module: ts.ModuleKind.ES2015,
    experimentalDecorators: true,
    allowNonTsExtensions: true,
    traceResolution: true,
    noEmit: true
  });
}