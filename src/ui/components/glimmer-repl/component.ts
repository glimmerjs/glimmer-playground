import Component, { tracked } from "@glimmer/component";
import FileSystem, { File } from "../../../utils/file-system";
import SolarizedTheme from "../../../utils/monaco/themes/solarized-dark";

declare function vsRequire(deps: string[], cb: any);
declare var typings;

let _id = 1;
class ComponentFiles {
  id: number;
  @tracked name: string;
  @tracked template: File;
  @tracked component: File;

  constructor(options: Partial<ComponentFiles>) {
    this.id = _id++;
    Object.assign(this, options);
  }
}

const NEW_COMPONENT_NAMES = [
  'my-glimmer-app',
  'my-second-component',
  'my-third-component',
  'my-fourth-component',
  'my-fifth-component',
  'calm-down-with-the-components'
];

export default class GlimmerRepl extends Component {
  @tracked components: ComponentFiles[] = [];
  @tracked revision = 1;
  @tracked isLoaded = false;

  fs = new FileSystem();

  didInsertElement() {
    waitForDependencies()
      .then(() => {
        this.isLoaded = true;
        this.createNewComponent();
        this.addComponentImplementation(this.components[0]);
      });
  }

  nameForNewComponent() {
    let count = this.components.length;
    let name = NEW_COMPONENT_NAMES[count];

    if (name) { return name; }

    return `my-component-${count+1}`;
  }

  createNewComponent() {
    let name = this.nameForNewComponent();
    let templatePath = `src/ui/components/${name}.hbs`;
    let template = this.fs.createTemplateFile(templatePath);

    let files = new ComponentFiles({
      name,
      template,
      component: null
    });

    this.components = [...this.components, files];
  }

  addComponentImplementation(files: ComponentFiles) {
    let { name } = files;
    let componentPath = `src/ui/components/${name}.ts`;
    let component = this.fs.createComponentFile(componentPath);
    files.component = component;
  }
}

function waitForDependencies() {
  return new Promise((resolve, reject) => {
    vsRequire(['vs/editor/editor.main', 'vs/language/typescript/lib/typescriptServices'], () => {
      initializeTypeScript();
      resolve();
    });
  });
}

function initializeTypeScript() {
  monaco.editor.defineTheme('solarized-dark', SolarizedTheme);

  let ts = monaco.languages.typescript;

  for (let filename in typings) {
    let content = typings[filename];
    ts.typescriptDefaults.addExtraLib(content, `file:///${filename}`);
  }

  ts.typescriptDefaults.setCompilerOptions({
    target: ts.ScriptTarget.ES2016,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    module: ts.ModuleKind.ES2015,
    experimentalDecorators: true,
    allowNonTsExtensions: true,
    traceResolution: true,
    noEmit: true
  });
}
