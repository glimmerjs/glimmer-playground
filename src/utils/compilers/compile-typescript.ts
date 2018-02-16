import { File } from '../file-system';

export default function compileTypeScript(fileName: string, sourceText: string) {
  let compilerOptions = {
    target: ts.ScriptTarget.ES2016,
    module: ts.ModuleKind.CommonJS,
    experimentalDecorators: true
  };

  return ts.transpileModule(sourceText, {
    compilerOptions,
    fileName
  }).outputText;
}
