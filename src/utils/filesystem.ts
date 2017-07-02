/// <reference path="../../node_modules/typescript/lib/typescriptServices.d.ts" />

let count = 1;

class Filesystem {
  createComponentEntry() {
    return new ComponentEntry();
  }
}

const DEFAULT_TEMPLATE = `
<div>
  <h1>Welcome to Glimmer!</h1>
  <p>You have clicked the button {{count}} times.</p>
  <button onclick={{action increment}}>Click</button>
</div>
`.trim();

const DEFAULT_COMPONENT = `
import Component, { tracked } from '@glimmer/component';
export default class extends Component {
  @tracked count = 1;
  increment() {
    this.count++;
  }
}
`.trim();


class ComponentEntry {
  id: number;
  name: string;
  template: File;
  component: File;

  constructor() {
    this.id = count++;
    this.name = `untitled-${this.id}`;
    this.template = new File(`${this.name}.hbs`, 'handlebars', DEFAULT_TEMPLATE);
    this.component = new File(`${this.name}.ts`, 'typescript', DEFAULT_COMPONENT);
  }
}

class File {
  constructor(public fileName: string, public language: string, public sourceText = '') {
  }

  get model() {
    console.log(this.sourceText);
    if (this._model) { return this._model; }
    let model = this._model = monaco.editor.createModel(this.sourceText, this.language, toURI(this.fileName));
    model.updateOptions({
      tabSize: 2,
      insertSpaces: true
    });
    return model;
  }

  _model: monaco.editor.IModel;

  emit() {
    let source = ts.createSourceFile(this.fileName, this.sourceText, ts.ScriptTarget.ES2015);
    let outputText: string;

    let host = {
      getSourceFile: function (fileName) { return source; },
      writeFile: function (_name, text) { outputText = text; },
      getDefaultLibFileName: function () { return "lib.d.ts"; },
      useCaseSensitiveFileNames: function () { return false; },
      getCanonicalFileName: function (fileName) { return fileName; },
      getCurrentDirectory: function () { return ""; },
      getNewLine: function () { return "\r\n"; },
      fileExists: function (fileName) { return fileName === this.fileName; },
      readFile: function () { return ""; },
      directoryExists: function () { return true; },
      getDirectories: function () { return []; }
    };

    let program = ts.createProgram([this.fileName], {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2015,
      noLib: true,
      noResolve: true
    }, host);

    let result = program.emit();

    return outputText;
  }
}

function toURI(path: string) {
  return monaco.Uri.parse(`file:///${path}`);
}

export default new Filesystem();