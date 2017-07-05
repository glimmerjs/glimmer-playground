/// <reference path="../../node_modules/typescript/lib/typescriptServices.d.ts" />

import ResolutionMap from "./resolution-map";

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

export default class FileSystem {
  files: File[] = [];

  createTemplateFile(fileName: string) {
    return this.createFile(fileName, 'handlebars', DEFAULT_TEMPLATE);
  }

  createComponentFile(fileName: string) {
    return this.createFile(fileName, 'typescript', DEFAULT_COMPONENT);
  }

  createFile(fileName: string, language: string, sourceText) {
    let file = new File(this, fileName, language, sourceText);
    this.files.push(file);
    this.didChange();
    return file;
  }

  toResolutionMap() {
    try {
      return new ResolutionMap(this.files).toJSON();
    } catch (e) {
      console.log("Error while compiling program", e);
      return {};
    }
  }

  didChange() {
    this.onChange();
  }

  onChange = () => {};
}

export class File {
  fs: FileSystem;
  fileName: string;
  language: string;
  sourceText: string;

  constructor(fs: FileSystem, fileName: string, language: string, sourceText = '') {
    this.fs = fs;
    this.fileName = fileName;
    this.language = language;
    this.sourceText = sourceText;
  }

  didChange() {
    this.fs.didChange();
  }
}
