import Component, { tracked } from '@glimmer/component';

export default class extends Component {
  @tracked confirm: boolean = false;

  toggle() {
    this.confirm = !this.confirm;
  }
}