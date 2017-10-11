import App from './main';
import Application from '@glimmer/application';
import { ComponentManager, setPropertyDidChange } from '@glimmer/component';
import { apps } from './ui/components/Main/Sandbox/component';

const app = new App();
const containerElement = document.getElementById('app');

setPropertyDidChange(() => {
  app.scheduleRerender();
  for (let otherApp of apps) {
    otherApp.scheduleRerender();
  }
});

app.registerInitializer({
  initialize(registry) {
    registry.register(`component-manager:/${app.rootName}/component-managers/main`, ComponentManager);
  }
});

app.renderComponent('Main', containerElement, null);

app.boot();
