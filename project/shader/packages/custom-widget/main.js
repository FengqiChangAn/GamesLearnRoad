'use strict';

module.exports = {
  load () {
    // 在 package 加载时执行
    Editor.log('custom-widget package loaded');
  },

  unload () {
    // 在 package 卸载时执行
    Editor.log('custom-widget package unloaded');
  },

  // 注册你的 ipc 消息
  messages: {
    'open' () {
      // 打开 package.json 中注册的 entry panel
      Editor.Panel.open('custom-widget');
    },
    'say-hello' () {
      Editor.log('Hello World!');
      // 发送 ipc 消息到 panel
      Editor.Ipc.sendToPanel('custom-widget', 'custom-widget:hello');
    },
    'clicked' () {
      Editor.log('Button clicked!');
    }
  },
};