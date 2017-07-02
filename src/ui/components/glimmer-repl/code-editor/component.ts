/// <reference path="../../../../../node_modules/monaco-editor/monaco.d.ts" />

import Component, { tracked } from '@glimmer/component';

export default class CodeEditor extends Component {
  editor: monaco.editor.IStandaloneCodeEditor;

  didInsertElement() {
    let file = this.args.file;
    let { language, model } = file;
    const code = `import Component from "@glimmer/component";`

    let editor = this.editor = monaco.editor.create(this.element as HTMLElement, {
      language,
      model
    });

    editor.onDidChangeModelContent(event => {
      file.sourceText = editor.getValue();
      this.args.onFileDidChange(file);
    });
  }
}