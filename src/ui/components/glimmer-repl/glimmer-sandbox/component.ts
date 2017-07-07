import Component, { tracked } from '@glimmer/component';
import Application from '@glimmer/application';
import { precompile } from '@glimmer/compiler';
import { ComponentManager } from '@glimmer/component';
import { debounce } from 'decko';
import Resolver, { BasicModuleRegistry } from '@glimmer/resolver';
import resolverConfiguration from '../../../../../config/resolver-configuration';

interface ElementApp {
  vmElement: HTMLElement;
}

export const apps: ElementApp[] = [];

export default class GlimmerSandbox extends Component {
  @tracked lastError: string = null;

  didInsertElement() {
    let fs = this.args.fs;

    fs.onChange(() => {
      this.execute();
    });

    this.execute();
  }

  @debounce(200)
  execute() {
    let fs = this.args.fs;
    let resolutionMap;

    this.lastError = null;

    try {
      resolutionMap = fs.toResolutionMap();
      console.log(resolutionMap);
    } catch (e) {
      this.lastError = e.toString();
      return;
    }
    let component = this;

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
              component.lastError = e.toString();
              if (this.env['_transaction']) { this.env['_transaction'] = null; }
            }
          };
        } catch (e) {
          component.lastError = e.toString();
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
    }

    apps.push(app);
    this.element.insertBefore(app.vmElement, null);
    app.renderComponent('my-glimmer-app', app.vmElement, null);
    app.boot();
  }
}
