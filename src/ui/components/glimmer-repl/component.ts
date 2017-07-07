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

  toJSON() {
    let { name, template, component } = this;
    return { name, template, component };
  }

  static fromJSON(fs: FileSystem, files) {
    let { template, component } = files;
    files.template = fs.createFileFromJSON(template);
    files.component = component ? fs.createFileFromJSON(component) : null;
    return new ComponentFiles(files)
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

const DEFAULT_APP = [{
  name: 'my-glimmer-app',
  template: {
    fileName: pathForTemplate('my-glimmer-app'),
    sourceText: `<div>
  <h1>Welcome to Glimmer!</h1>
  <p>You have clicked the button {{count}} times.</p>
  <button onclick={{action increment}}>Click</button>
</div>`
  },
  component: {
    fileName: pathForComponent('my-glimmer-app'),
    sourceText: `import Component, { tracked } from '@glimmer/component';
export default class extends Component {
  @tracked count = 1;
  increment() {
    this.count++;
  }
}`
  }
}];

export default class GlimmerRepl extends Component {
  @tracked components: ComponentFiles[] = [];
  @tracked isLoaded = false;

  fs = new FileSystem();

  didInsertElement() {
    waitForDependencies()
      .then(() => {
        this.isLoaded = true;
        this.init();
      });
  }

  init() {
    let { fs } = this;

    let components = this.initComponents();
    this.components = components
      .map(json => ComponentFiles.fromJSON(fs, json));

    fs.onChange(() => {
      this.serialize();
    });
  }

  initComponents() {
    let { searchParams } = new URL(document.location.toString());
    let app = searchParams.get('app');

    return app ? JSON.parse(decodeURIComponent(atob(app))) : DEFAULT_APP;
  }

  serialize() {
    let serialized = JSON.stringify(this.components);
    let encoded = btoa(encodeURIComponent(serialized));
    history.replaceState(null, null, `?app=${encoded}`);
  }

  nameForNewComponent() {
    let count = this.components.length;
    let name = NEW_COMPONENT_NAMES[count];

    if (name) { return name; }

    return `my-component-${count+1}`;
  }

  createNewComponent() {
    let name = this.nameForNewComponent();
    let templatePath = pathForTemplate(name);
    let template = this.fs.createFile(templatePath, `<${name}>\n</${name}>`);

    let files = new ComponentFiles({
      name,
      template,
      component: null
    });

    this.components = [...this.components, files];
    this.serialize();
  }

  addComponentImplementation(files: ComponentFiles) {
    let { name } = files;
    let componentPath = pathForComponent(name);
    let component = this.fs.createFile(componentPath, `import Component, { tracked } from "@glimmer/component";
    
export default class extends Component {
  @tracked magicNumber = 42;
});`);
    files.component = component;
    this.serialize();
  }

  componentNameDidChange(files: ComponentFiles, name: string) {
    let { component, template } = files;

    template.fileName = pathForTemplate(name);
    if (component) {
      component.fileName = pathForComponent(name);
    }

    files.name = name;
    this.fs.didChange();
  }
}

function pathForTemplate(name) {
  return `src/ui/components/${name}/template.hbs`;
}

function pathForComponent(name) {
  return `src/ui/components/${name}/component.ts`;
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

  ts.typescriptDefaults.setCompilerOptions({
    target: ts.ScriptTarget.ES2017,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    module: ts.ModuleKind.ES2015,
    experimentalDecorators: true,
    allowNonTsExtensions: true,
    traceResolution: true,
    noEmit: true
  });

  for (let filename in typings) {
    let content = typings[filename];
    ts.typescriptDefaults.addExtraLib(content, `file:///${filename}`);
  }
}
