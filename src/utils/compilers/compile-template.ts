import { precompile } from '@glimmer/compiler';
import { File } from '../file-system';

export default function compileTemplate(specifier: string, source: string) {
  return JSON.parse(precompile(source, {
    meta: { specifier }
  }));
}
