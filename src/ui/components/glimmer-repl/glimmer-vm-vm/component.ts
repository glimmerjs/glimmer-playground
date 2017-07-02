import Component, { tracked } from '@glimmer/component';
import * as GlimmerComponent from '@glimmer/component';
import Application from '@glimmer/application';
import { precompile } from '@glimmer/compiler';
import { ComponentManager } from '@glimmer/component';
import Resolver, { BasicModuleRegistry } from '@glimmer/resolver';
import resolverConfiguration from '../../../../../config/resolver-configuration';

interface ElementApp {
  vmElement: HTMLElement;
}

export const apps: ElementApp[] = [];

export default class GlimmerVMVM extends Component {
  @tracked lastRevision = 0;

  didInsertElement() {
    this.execute();
  }

  didUpdate() {
    this.execute();
  }

  execute() {
    let { lastRevision } = this;
    if (this.args.revision === lastRevision) {
      return;
    }

    this.lastRevision = this.args.revision;

    let components = this.args.components;
    let resolutionMap = {
    };
    let firstName = this.args.components[0].name;

    for (let { name, component, template } of components) {
      let klass = evalTypeScript(component.emit());
      klass = klass && klass.default;
      resolutionMap[`component:/glimmer-repl/components/${name}`] = klass;
      let specifier = `template:/glimmer-repl/components/${name}`;
      try {
        resolutionMap[`template:/glimmer-repl/components/${name}`] = JSON.parse(precompile(template.sourceText, { meta: { specifier } }));
      } catch (e) {
        console.log('Handlebars parse error:', e);
        return;
      }
    }

    class App extends Application {
      vmElement: HTMLElement;

      constructor() {
        let moduleRegistry = new BasicModuleRegistry(resolutionMap);
        let resolver = new Resolver(resolverConfiguration, moduleRegistry);

        super({
          rootName: 'app',
          resolver
        });

        this.vmElement = document.createElement('div');
      }

      render(): void {
        if (this.env['_transaction']) { return; }
        try {
          super.render();
          let oldRerender = this['_rerender'];
          this['_rerender'] = () => {
            try {
              oldRerender.apply(this);
            } catch (e) {
              console.log('ERROR IN RERENDER', e);
              if (this.env['_transaction']) { this.env['_transaction'] = null; }
            }
          };
        } catch (e) {
          console.log('ERROR IN RENDER', e);
          if (this.env['_transaction']) { this.env['_transaction'] = null; }
        }

      }
    }

    const app = new App();
    app.registerInitializer({
      initialize(registry) {
        registry.register(`component-manager:/${app.rootName}/component-managers/main`, ComponentManager);
      }
    });

    if (apps.length > 0) {
      let oldApp = apps.pop();
      oldApp.vmElement.parentNode.removeChild(oldApp.vmElement);
      console.log('old app', oldApp);
    }

    apps.push(app);
    this.element.insertBefore(app.vmElement, null);
    app.renderComponent(firstName, app.vmElement, null);
    app.boot();
    console.log('BOOTED');
  }
}

let packages = {
  '@glimmer/component': GlimmerComponent
};

function evalTypeScript(source: string) {
  let tsExports;
  console.log(source);

  try {
    let require = function(pkgName) {
      return packages[pkgName];
    };

    tsExports = eval(`(function(exports) { ${source}; return exports; })({})`);
  } catch (e) {
    console.log(e);
  }

  return tsExports;
}