import Component, { tracked } from '@glimmer/component';

const handleKeyup = function(e) {
  if (e.keyCode === 27) { 
    this.args.toggle();
  }
};

export default class extends Component {
  @tracked fullUrl = '';
  @tracked tinyUrl = '';
  @tracked fullUrlCopied = false;
  @tracked tinyUrlCopied = false;
  handleKeyup = null;

  constructor(options) {
    super(options);
    this.fullUrl = window.location.href;
    this.handleKeyup = handleKeyup.bind(this);
  }

  didInsertElement() {
    document.getElementById('share-overlay-header').focus();
    document.addEventListener('keyup', this.handleKeyup);
  }

  willDestroy() {
    document.getElementById('share-button').focus();
    document.removeEventListener('keyup', this.handleKeyup);
  }

  generateTinyurl() {
    let url = "https://tinyurl.com/api-create.php?url=" + this.fullUrl;
    this.tinyUrl = 'https://tinyurl.com/blablabla';
  }

  copyToClipboard(id, successProperty) {
    let input = <HTMLInputElement>document.getElementById(id);

    if (input && input.select) {
      input.select();

      try {
        document.execCommand('copy');
        this[successProperty] = true;
      }
      catch (err) {
        alert('please press ctrl/cmd+c to copy');
      }
    }
  }
}