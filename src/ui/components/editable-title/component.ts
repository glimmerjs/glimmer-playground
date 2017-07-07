import Component, { tracked } from '@glimmer/component';

const RETURN_KEY = 13;
const ESCAPE_KEY = 27;

export default class extends Component {
  _value: string;
  element: HTMLElement;
  inputStyle: string;

  didInsertElement() {
    let style = window.getComputedStyle(this.element);
    this.inputStyle = `font: ${style.font}; color: ${style.color};`;
  }

  didUpdate() {
    setTimeout(() => {
      let input: HTMLElement = this.element.querySelector('input');
      if (input) {
        input.addEventListener('keyup', event => this.handleKeyUp(event));
        input.focus();
      }
    }, 0);
  }

  handleKeyUp(event: KeyboardEvent) {
    switch (event.keyCode) {
      case ESCAPE_KEY:
        this.value = this.args.value;
        this.isEditing = false;
      case RETURN_KEY:
        this.isEditing = false;
        break;
      default:
        let value = this.value = (event.target as HTMLInputElement).value;
        this.onChange(value);
    }
  }

  onChange(value: string) {
    let { onChange } = this.args;

    if (onChange) {
      onChange(value);
    }
  }

  @tracked isEditing = false;

  @tracked
  get value() {
    let val = this._value === undefined ? this.args.value : this._value;
    return val;
  }

  set value(value) {
    this._value = value;
  }

  startEditing(event: MouseEvent) {
    // Switch into editing mode
    this.isEditing = true;

    // Listen for clicks on the body to exit editing mode
    let { body } = document;
    let onBodyClick = () => {
      this.isEditing = false;
      body.removeEventListener('click', onBodyClick);
    };

    body.addEventListener('click', onBodyClick);

    // Make sure we stop the current click event or else we'll trigger the click
    // event handler on the body we just added.
    event.stopPropagation();
  }
}
