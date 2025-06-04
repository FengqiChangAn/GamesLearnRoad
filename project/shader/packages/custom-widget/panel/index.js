const { readFileSync } = require('fs');
const { join } = require('path');

const PACKAGE_PATH = Editor.url(`packages://custom-widget/`);
const DIR_PATH = join(PACKAGE_PATH, 'panel/');

// panel/index.js, this filename needs to match the one registered in package.json
Editor.Panel.extend({
  // css style for panel
  style: readFileSync(join(DIR_PATH, 'index.css')) + '',

  // html template for panel
  template: readFileSync(join(DIR_PATH, 'index.html')) + '',

  // element and variable binding
  $: {
    tabs: '#tabs',
  },

  // method executed when template and styles are successfully loaded and initialized
  ready () {
    this.$tabs.addEventListener('click', (e) => {
      Editor.Ipc.sendToMain('custom-widget:clicked');
    });
  },

  // register your ipc messages here
  messages: {
    'custom-widget:hello' (event) {
      Editor.log('Hello!');
    }
  }
});