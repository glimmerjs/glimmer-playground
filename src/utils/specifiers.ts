export function specifierForTemplate(fileName: string) {
  let segments = fileName.split('/')
  let name = segments[segments.length-2];
  return `template:/glimmer-repl/components/${name}`;
}

export function specifierForComponent(fileName: string) {
  let segments = fileName.split('/')
  let name = segments[segments.length-2];
  return `component:/glimmer-repl/components/${name}`;
}
