import Component, { tracked } from '@glimmer/component';

export default class extends Component {
  @tracked fullUrl = '';
  @tracked tinyUrl = '';
  @tracked fullUrlCopied = false;
  @tracked tinyUrlCopied = false;
  @tracked tinyUrlFetching = false;

  constructor(options) {
    super(options);
    this.fullUrl = window.location.href;
  }

  generateTinyurl() {
    this.tinyUrlFetching = true;
    let url = "https://glimmer-url-shortener-official.herokuapp.com/?url=" + this.fullUrl;
    fetch(url).then((response) => {
      this.tinyUrlFetching = false;
      return response.text();
    }).then((text) => {
      this.tinyUrl = text;
    }).catch(() => {
      this.tinyUrlFetching = false;
    });

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
