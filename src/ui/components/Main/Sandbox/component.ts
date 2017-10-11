import Component, { tracked } from '@glimmer/component';
import Application from '@glimmer/application';
import { precompile } from '@glimmer/compiler';
import { ComponentManager } from '@glimmer/component';
import { debounce } from 'decko';
import Resolver, { BasicModuleRegistry } from '@glimmer/resolver';
import resolverConfiguration from '../../../../../config/resolver-configuration';

interface ElementApp extends Application {
  vmElement: HTMLElement;
}

export const apps: ElementApp[] = [];

export default class GlimmerSandbox extends Component {
  @tracked lastError: string = null;

  get element(): HTMLElement {
    return this.bounds.firstNode as HTMLElement;
  }

  didInsertElement() {
    let fs = this.args.fs;

    fs.onChange(() => {
      this.execute();
    });

    this.execute();
  }

  @debounce(600)
  execute() {
    let fs = this.args.fs;
    let resolutionMap;

    this.lastError = null;

    try {
      resolutionMap = fs.toResolutionMap();
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

      _render(): void {
        try {
          super._render();
          let _rerender = this['_rerender'];

          this['_rerender'] = () => {
            try {
              _rerender.apply(this);
            } catch (e) {
              this.reportError(e);
            }
          };
        } catch (e) {
          this.reportError(e);
        }
      }

      reportError(e: Error) {
        console.error(e);

        if (this.env['_transaction']) { this.env['_transaction'] = null; }
        this['_rerender'] = () => { };

        component.lastError = e.toString();

        let matches = e.message && e.message.match(/Could not find template for (\S+)/);
        if (matches) {
          component.args.onUnknownComponent(matches[1]);
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
      oldApp.vmElement.remove();
    }

    apps.push(app);
    this.element.insertBefore(app.vmElement, null);
    app.renderComponent('GlimmerApp', app.vmElement, null);
    app.boot();
  }
}
