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
  listeners = [];

  createFile(fileName: string, sourceText) {
    let file = new File(this, fileName, sourceText);
    this.files.push(file);
    this.didChange();
    return file;
  }

  createFileFromJSON({ fileName, sourceText }) {
    return this.createFile(fileName, sourceText);
  }

  toResolutionMap() {
    return new ResolutionMap(this.files).toJSON();
  }

  didChange() {
    this.listeners.forEach(cb => cb());
  }

  onChange(cb: () => void) {
    this.listeners.push(cb);
  }
}

export class File {
  fs: FileSystem;
  fileName: string;
  sourceText: string;

  constructor(fs: FileSystem, fileName: string, sourceText = '') {
    this.fs = fs;
    this.fileName = fileName;
    this.sourceText = sourceText;
  }

  get language() {
    let { fileName } = this;
    let ext = fileName.substr(fileName.lastIndexOf('.'));
    return ext === '.ts' ? 'typescript' : 'handlebars';
  }

  didChange() {
    this.fs.didChange();
  }

  toJSON() {
    let { fileName, sourceText } = this;
    return { fileName, sourceText };
  }

  remove() {
    let { files } = this.fs;
    files.splice(files.indexOf(this), 1);
    this.didChange();
  }
}
