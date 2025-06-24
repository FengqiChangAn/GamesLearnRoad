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

  // $ 是用于 绑定HTML模板中的 DOM 元素 的一个快捷方式。
  $: {
    tabs: '#tabs',// 将 id 为 tabs 的 DOM 元素绑定到 this.$tabs
  },

  // 当模板和样式成功加载和初始化时执行的方法。
  ready() {
    this.$tabs.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') {
        const category = e.target.dataset.category;
        Editor.log(`点击了类别: ${category}`);

        // 根据类别执行逻辑
        switch (category) {
          case 'builtin':
            Editor.log('切换到内置控件菜单');
            break;
          case 'cloud':
            Editor.log('切换到云组件菜单');
            break;
          case 'custom':
            Editor.log('切换到自定义控件菜单');
            break;
          default:
            Editor.log('未知类别');
        }
      }
    });
  },

  // 注册你的 ipc 消息
  // 卡在如何监听资源拖动事件
  messages: {
    'custom-widget:hello'(event) {
      Editor.log('Hello!');
    }
  }
});