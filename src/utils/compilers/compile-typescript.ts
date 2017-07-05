import { File } from '../file-system';

export default function compileTypeScript(fileName: string, sourceText: string) {
  let compilerOptions = {
    target: ts.ScriptTarget.ES5,
    modules: ts.ModuleKind.CommonJS,
    experimentalDecorators: true
  };

  return ts.transpileModule(sourceText, {
    compilerOptions,
    fileName
  }).outputText;
}
