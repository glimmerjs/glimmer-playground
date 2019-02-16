import Component, { tracked } from '@glimmer/component';
import { ESCAPE, TAB } from '../../../utils/keys';

const FOCUSABLE_ELEMENTS = [
  '[tabindex]',
  'a',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])'
];

const handleKeydown = function(e) {
  if (e.keyCode === ESCAPE) {
    this.escapeKeyPressed();
  }

  if(e.keyCode === TAB) {
    this.tabKeyPressed(e);
  }
};

const keepFocus = function(e) {
  if(!this.el.contains(e.target)) {
    this.focusableElements[0].focus();
  }
};

export default class extends Component {
  handleKeydown = null;
  keepFocus = null;
  el = null;

  constructor(owner, args) {
    super(owner, args);
    this.handleKeydown = handleKeydown.bind(this);
    this.keepFocus = keepFocus.bind(this);
  }

  didInsertElement() {
    let firstNode = <HTMLElement>this.bounds.firstNode;
    this.el = firstNode.nodeType === 3 ? firstNode.nextElementSibling : firstNode;

    let firstFocusable = <HTMLElement>this.focusableElements[0];
    firstFocusable.focus();

    this.setupEvents();
  }

  willDestroy() {
    this.teardownEvents();
  }

  setupEvents() {
    document.addEventListener('keydown', this.handleKeydown);
    document.body.addEventListener('focus', this.keepFocus, true);
  }

  teardownEvents() {
    document.removeEventListener('keydown', this.handleKeydown);
    document.body.removeEventListener('focus', this.keepFocus, true);
  }

  get focusableElements() {
    return Array.from(
      this.el.querySelectorAll(FOCUSABLE_ELEMENTS.join(','))
    );
  }

  hide() {
    this.teardownEvents();
    this.args.hide();
  }

  escapeKeyPressed() {
    this.hide();
  }

  tabKeyPressed(event) {
    let elements = this.focusableElements;
    let index = elements.indexOf(document.activeElement);
    let firstElementActive = index === 0;
    let lastElementActive = index === elements.length - 1;

    if (firstElementActive && event.shiftKey) {
      event.preventDefault();
      let el = <HTMLElement>elements[elements.length - 1];
      el.focus();
    } else if (lastElementActive && !event.shiftKey) {
      event.preventDefault();
      let el = <HTMLElement>elements[0];
      el.focus();
    }
  }
}