import Component, { tracked } from "@glimmer/component";
import FileSystem, { File } from "../../../utils/file-system";
import SolarizedTheme from "../../../utils/monaco/themes/solarized-dark";
import { debounce } from "decko";
import { saveAs } from "file-saver";

declare function vsRequire(deps: string[], cb: any);
declare var typings;

let _id = 1;
class ComponentFiles {
  id: number;
  isEditable = true;

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
    let { template, component, helper } = files;
    files.template = fs.createFileFromJSON(template);
    files.component = component ? fs.createFileFromJSON(component) : null;
    return new ComponentFiles(files)
  }
}

class HelperFiles {
  id: number;
  isEditable = true;
  @tracked name: string;
  @tracked helper: File;

  constructor(options: Partial<HelperFiles>) {
    this.id = _id++;
    Object.assign(this, options);
  }

  toJSON() {
    let { name, helper } = this;
    return { name, helper };
  }

  static fromJSON(fs: FileSystem, files) {
    let { helper } = files;
    files.helper = helper ? fs.createFileFromJSON(helper) : null;
    return new this(files)
  }
}

const NEW_COMPONENT_NAMES = [
  'GlimmerApp',
  'SecondComponent',
  'ThirdComponent',
  'FourthComponent',
  'FifthComponent',
  'CalmDownWithTheComponents'
];

const DEFAULT_APP = {
  helpers: [],
  components: [{
    name: 'GlimmerApp',
    template: {
      fileName: pathForTemplate('GlimmerApp'),
      sourceText: `<h1>Welcome to the Glimmer Playground!</h1>
<p>You have clicked the button {{count}} times.</p>
<button onclick={{action increment}}>Click</button>`
    },
    component: {
      fileName: pathForComponent('GlimmerApp'),
      sourceText: `import Component, { tracked } from '@glimmer/component';
export default class extends Component {
  @tracked count = 1;
  increment() {
    this.count++;
  }
}`
    }
  }]
};

export default class GlimmerRepl extends Component {
  @tracked components: ComponentFiles[] = [];
  @tracked helpers: HelperFiles[] = [];
  @tracked isLoaded = false;
  @tracked shareIsVisible = false;
  @tracked jsZipIsLoading = false;

  fs = new FileSystem();
  lastUnknownComponent = null;

  didInsertElement() {
    waitForDependencies()
      .then(() => {
        this.isLoaded = true;
        this.init();
      });
  }

  init() {
    let { fs } = this;

    let { components, helpers } = this.initComponents();
    this.components = components
      .map(json => ComponentFiles.fromJSON(fs, json));
    this.components[0].isEditable = false;

    this.helpers = helpers.map(json => HelperFiles.fromJSON(fs, json));

    fs.onChange(() => {
      this.serialize();
    });
  }

  initComponents() {
    let { searchParams } = new URL(document.location.toString());
    let app = searchParams.get('app');

    return app ? JSON.parse(decodeURIComponent(atob(app))) : DEFAULT_APP;
  }

  @debounce(200)
  serialize() {
    let { components, helpers } = this;
    let serializable = { components, helpers }
    let serialized = JSON.stringify(serializable);
    let encoded = btoa(encodeURIComponent(serialized));
    history.replaceState(null, null, `?app=${encoded}`);
  }

  nameForNewComponent() {
    let name = this.lastUnknownComponent;
    if (name) {
      this.lastUnknownComponent = null;
      return name;
    }

    let count = this.components.length;
    name = NEW_COMPONENT_NAMES[count];

    if (name) { return name; }

    return `Component${count+1}`;
  }

  saveUnknownComponent(componentName: string) {
    this.lastUnknownComponent = componentName;
  }

  createNewHelper() {
    let name = `helper${this.helpers.length + 1}`
    let helperPath = pathForHelper(name);
    let helper = this.fs.createFile(helperPath, `export default function helper() {}`);

    let files = new HelperFiles({
      name,
      helper,
    });

    this.helpers = [...this.helpers, files];
    this.serialize();
  }

  createNewComponent() {
    let name = this.nameForNewComponent();
    let templatePath = pathForTemplate(name);
    let template = this.fs.createFile(templatePath, `<div>\n</div>`);

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
};`);
    files.component = component;
    this.serialize();
  }

  removeComponentImplementation(files: ComponentFiles) {
    files.component.remove();
    files.component = null;
    this.components = this.components;
  }

  private nameChanged(files: ComponentFiles | HelperFiles, name) {
    files.name = name;
    this.fs.didChange();
  }

  helperNameDidChange(files: HelperFiles, name: string) {
    let { helper } = files;
    helper.fileName = pathForHelper(name);
    this.nameChanged(files, name);
  }

  componentNameDidChange(files: ComponentFiles, name: string) {
    let { component, template } = files;

    template.fileName = pathForTemplate(name);
    if (component) {
      component.fileName = pathForComponent(name);
    }

    this.nameChanged(files, name);
  }

  removeHelper(files: HelperFiles) {
    files.helper.remove();
    this.helpers = this.helpers.filter(h => h !== files);
  }

  removeComponent(files: ComponentFiles) {
    files.template.remove();
    if (files.component) { files.component.remove(); }

    this.components = this.components.filter(c => c !== files);
  }

  @tracked isVisualizerShowing = false;

  toggleVisualizer() {
    this.isVisualizerShowing = !this.isVisualizerShowing;
  }

  toggleShare() {
    this.shareIsVisible = !this.shareIsVisible;
  }
  
  download() {
    this.jsZipIsLoading = true;
  
    loadJSZip().then((JSZip) => {
      this.jsZipIsLoading = false;
      let zip = new JSZip();
      let prefix = 'glimmer-app/';
  
      this.components.forEach(function(file) {
        if(file.component) {
          zip.file(
            prefix + pathForComponent(file.name),
            file.component.sourceText
          );
        }
  
        zip.file(
          prefix + pathForTemplate(file.name),
          file.template.sourceText
        );
      });
  
      this.helpers.forEach(function(file) {
        zip.file(
          prefix + pathForHelper(file.name),
          file.helper.sourceText
        );
      });
  
      zip.generateAsync({type:"blob"}).then(function(content) {
        saveAs(content, "glimmer-playground.zip");
      });
    });
  }
}

function pathForTemplate(name) {
  return `src/ui/components/${name}/template.hbs`;
}

function pathForHelper(name) {
  return `src/ui/components/${name}/helper.ts`;
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

const JSZIP_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js';

function loadJSZip() {
  return new Promise((resolve, reject) => {
    vsRequire([JSZIP_URL], (script) => {
      resolve(script);
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
