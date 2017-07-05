/// <reference path="../../../../../node_modules/monaco-editor/monaco.d.ts" />

import Component, { tracked } from '@glimmer/component';
import { File } from '../../../../utils/file-system';
import debounce from 'lodash.debounce';

export default class CodeEditor extends Component {
  editor: monaco.editor.IStandaloneCodeEditor;
  element: HTMLDivElement;
  resize: (event: Event) => void;

  didInsertElement() {
    let { file } = this.args;

    let model = modelFor(file);

    let editor = this.editor = monaco.editor.create(this.element as HTMLElement, {
      scrollBeyondLastLine: false,
      theme: 'solarized-dark',
      model,
    });

    this.autoResize();

    this.resize = debounce(() => {
      editor.layout();
    }, 50);

    (window.addEventListener as any)('resize', this.resize, { passive: true });

    editor.onDidChangeModelContent(event => {
      file.sourceText = editor.getValue();
      file.didChange();
      this.autoResize();
    });
  }

  willDestroyElement() {
    window.removeEventListener('resize', this.resize);
  }

  autoResize() {
    let { editor, element } = this;
    let lineHeight = editor.getConfiguration().fontInfo.lineHeight;
    let lineCount = editor.getModel().getLineCount();
    let contentHeight = (lineHeight * lineCount) + 12;

    element.style.height = `${contentHeight}px`;
    editor.layout();
  }
}

function modelFor(file: File) {
  let { sourceText, language, fileName } = file;
  let uri = monaco.Uri.parse(`file:///${fileName}`);

  let model = monaco.editor.createModel(sourceText, language, uri);

  model.updateOptions({
    tabSize: 2,
    insertSpaces: true
  });

  return model;
}
