import { File } from './file-system';
import * as GlimmerComponent from '@glimmer/component';
import compileTypeScript from './compilers/compile-typescript';
import compileTemplate from './compilers/compile-template';
import { specifierForTemplate, specifierForComponent } from "./specifiers";

export default class ResolutionMap {
  files: File[];

  constructor(files: File[]) {
    this.files = files;
  }

  toJSON() {
    let map = {};

    for (let { fileName, language, sourceText } of this.files) {
      let specifier;

      switch (language) {
        case 'handlebars':
          specifier = specifierForTemplate(fileName);
          map[specifier] = compileTemplate(specifier, sourceText);
          break;
        case 'typescript':
          specifier = specifierForComponent(fileName);
          let code = compileTypeScript(fileName, sourceText);
          let mod = evalTypeScript(code);
          if (!mod || !mod.default) { throw new Error(`${fileName} did not export a default export.`); }
          map[specifier] = mod.default;
          break;
        default:
          throw new Error(`Unknown language ${language}`);
      }
    }

    return map;
  }
}

let packages = {
  '@glimmer/component': GlimmerComponent
};

function evalTypeScript(source: string) {
  let require = function(pkgName) {
    return packages[pkgName];
  };

  let tsExports = eval(`(function(exports) { ${source}; return exports; })({})`);

  return tsExports;
}
