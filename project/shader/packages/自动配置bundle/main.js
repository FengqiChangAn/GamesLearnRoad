'use strict';
const path = require('path');

//在重写Editor.Menu之前，先持有其引用，在必要的时候可以还原回去
//并且这一行必须写在文件前面，因为CustomMenu需要继承Editor.Menu,
//但是又不能直接extends Editor.Menu，因为Editor.Menu本身会被CustomMenu覆盖
if (!Editor.__Menu__) {
  Editor.__Menu__ = Editor.Menu;
};


module.exports = {
  load() {
    // execute when package loaded
    Editor.Menu = CustomMenu;//应用自定义菜单
  },

  unload() {
    // execute when package unloaded
    Editor.Menu = Editor.__Menu__;//恢复原来的菜单逻辑
  },

  // register your ipc messages here
  messages: {
    'active'() {
      Editor.Menu = CustomMenu;
      Editor.log("已启用自定义上下文菜单");

    },
    'disactive'() {
      Editor.Menu = Editor.__Menu__;
      Editor.log("已停用自定义上下文菜单");
    },
  },
};


//template菜单模版
//https://docs.cocos.com/creator/2.4/api/zh/editor/main/menu.html
class CustomMenu extends Editor.__Menu__ {
  constructor(template, webContent) {
    //打印编辑器默认菜单数据
    // Editor.log(template);

    let menuLocation;//菜单所在区域

    //判断是哪种菜单，暂时没有找到很优雅的办法
    //构造函数的template是编辑器自带的菜单配置数组，
    //可以添加/删除/重写template的元素实现自定义菜单功能
    if (template.length > 0) {
      let first = template[0];
      if (first.label == "创建节点")//场景节点右键菜单
        menuLocation = "node";
      else if (first.label == "新建")//asset右键菜单
        menuLocation = "asset";
      else if (first.label == "Remove")//脚本组件菜单
        menuLocation = "component";
      else if (first.path && first.path.startsWith("渲染组件"))//添加组件菜单
        menuLocation = "addcomponent";
      //还有其他区域的菜单比如控制台面板菜单，就不再列举了
    }

    if (menuLocation == "asset") {
      //TODO 在这里插入asset右键菜单
      let assetInfo = getSelectedFirstAssetInfo();

      Editor.log(assetInfo);

      template.push({ type: "separator" });
      template.push({
        label: '自动配置Bundle', click: () => {
          if (assetInfo.type != "folder") {
            Editor.log("自动配置bundle: 点击事件,请选择文件夹");
            return;
          }
          convertToBundle(assetInfo.path);
          Editor.log('配置bundle成功');
        }
      });
    }
    else if (menuLocation == "node") {
      //在这里插入场景节点右键菜单
      let node_selection = Editor.Selection.curSelection("node");
      let insertIndex = 1;

      template.splice(insertIndex++, 0, { type: "separator" });
      template.splice(insertIndex++, 0, { label: "创建Sprite（精灵）", click: template[0].submenu[1].submenu[0].click });
      template.splice(insertIndex++, 0, { type: "separator" });

      let groupMenuEnable = true;
      let groupMenu = { label: "测试二级菜单", enabled: true, submenu: [] };

      template.splice(insertIndex++, 0, groupMenu);

      groupMenu.submenu.push({
        label: "测试二级菜单1", enabled: groupMenuEnable, click: () => {
          Editor.log("测试二级菜单1");
        }
      });
      groupMenu.submenu.push({
        label: "测试二级菜单2", enabled: groupMenuEnable, click: () => {
          Editor.log("测试二级菜单2");
        }
      });

    }
    else if (menuLocation == "component") {
      //在这里插入组件菜单，可传递节点uuid，
      let params = template[0].params;
      //Editor.log(params);
      template.push({ type: "separator" });
      template.push({
        label: '测试组件脚本菜单', enabled: true, click: () => {
          Editor.log("测试组件脚本菜单");
        }
      });
    }
    else if (menuLocation == "addcomponent") {
      //在这里插入添加组件菜单，可传递节点uuid
      let params = template[0].params;
      let nodeUuid = params[0];

      //添加选中节点的同名脚本
      template.unshift({ type: "separator" });
      template.unshift({
        label: '测试添加脚本菜单', enabled: true, click: () => {
          Editor.log("测试添加脚本菜单");
        }
      });
    }

    super(template, webContent);
  }

}

/**
* 获取资源管理器中选中的第一个资源
* @returns 
*/
function getSelectedFirstAssetInfo() {
  let asset_selection = Editor.Selection.curSelection("asset");
  if (asset_selection == null || asset_selection.length == 0) {
    return null;
  }

  let info = Editor.assetdb.assetInfoByUuid(asset_selection[0]);

  return info;
}

function convertToBundle(folderPath) {
  const assetPath = folderPath;

  Editor.log("自动配置bundle: 配置bundle")

  if (!Editor.assetdb.existsByPath(folderPath)) {
    Editor.log('选择的文件夹不存在！', folderPath);
    return;
  }

  // Editor.log('正在将文件夹转换成bundle...', assetPath)

  // 加载 .meta 文件
  const meta = Editor.assetdb.loadMetaByPath(assetPath);
  if (!meta) {
    Editor.log('未找到 .meta 文件！');
    return;
  }

  // Editor.log('正在修改 .meta 文件...', meta);

  // 修改 .meta 文件内容
  meta.isBundle = true; // 设置为 Bundle

  // Editor.log('meta.isBundle', meta.isBundle);

  meta.bundleName = path.basename(folderPath); // 使用文件夹名称作为 Bundle 名称

  // Editor.log('meta.bundleName', meta.bundleName);

  meta.priority = 3; // 设置优先级

  // Editor.log('meta.priority', meta.priority);

  meta.compressionType = {
    wechatgame: 'zip',
    bytedance: 'zip',
    alipay: 'zip',
    quickgame: 'zip',
    qgame: 'zip',
    huawei: 'zip',
    xiaomi: 'zip'
  };
  meta.isRemoteBundle = {
    wechatgame: true,
    bytedance: true,
    alipay: true,
    quickgame: true,
    qgame: true,
    huawei: true,
    xiaomi: true
  };

  // Editor.log('meta:');

  const serializableMeta = createSerializableMeta(meta);
  const jsonString = safeStringify(serializableMeta);

  if (!jsonString) {
    Editor.error('序列化裁剪后的 meta 失败');
    return;
  }

  // Editor.log('转化为JSON字符串:', jsonString);

  // 保存修改后的 .meta 文件
  Editor.assetdb.saveMeta(meta.uuid, jsonString, (err) => {
    if (err) {
      Editor.log(`保存 .meta 文件时发生错误: ${err.message}`);
    } else {
      Editor.log(`文件夹 ${folderPath} 的 .meta 文件已成功修改！`);
    }
  });

  Editor.log(`文件夹 ${folderPath} 的 .meta 文件已成功修改！`);
}

function safeStringify(obj, indent = 2) {
  const cache = new Set();
  const retVal = JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (cache.has(value)) {
        return undefined; // 跳过循环引用
      }
      cache.add(value);
    }
    return value;
  }, indent);
  return retVal;
}

function createSerializableMeta(meta) {
  return {
    uuid: meta.uuid,
    isBundle: meta.isBundle || false,
    bundleName: meta.bundleName || '',
    priority: meta.priority || 3,

    compressionType: {
      wechatgame: meta.compressionType?.wechatgame || 'zip',
      bytedance: meta.compressionType?.bytedance || 'zip',
      alipay: meta.compressionType?.alipay || 'zip',
      quickgame: meta.compressionType?.quickgame || 'zip',
      qgame: meta.compressionType?.qgame || 'zip',
      huawei: meta.compressionType?.huawei || 'zip',
      xiaomi: meta.compressionType?.xiaomi || 'zip'
    },

    optimizeHotUpdate: {
      wechatgame: meta.optimizeHotUpdate?.wechatgame || false,
      bytedance: meta.optimizeHotUpdate?.bytedance || false,
      alipay: meta.optimizeHotUpdate?.alipay || false,
      quickgame: meta.optimizeHotUpdate?.quickgame || false,
      qgame: meta.optimizeHotUpdate?.qgame || false,
      huawei: meta.optimizeHotUpdate?.huawei || false,
      xiaomi: meta.optimizeHotUpdate?.xiaomi || false
    },

    inlineSpriteFrames: {
      wechatgame: meta.inlineSpriteFrames?.wechatgame || false,
      bytedance: meta.inlineSpriteFrames?.bytedance || false,
      alipay: meta.inlineSpriteFrames?.alipay || false,
      quickgame: meta.inlineSpriteFrames?.quickgame || false,
      qgame: meta.inlineSpriteFrames?.qgame || false,
      huawei: meta.inlineSpriteFrames?.huawei || false,
      xiaomi: meta.inlineSpriteFrames?.xiaomi || false
    },

    isRemoteBundle: {
      wechatgame: meta.isRemoteBundle?.wechatgame || true,
      bytedance: meta.isRemoteBundle?.bytedance || true,
      alipay: meta.isRemoteBundle?.alipay || true,
      quickgame: meta.isRemoteBundle?.quickgame || true,
      qgame: meta.isRemoteBundle?.qgame || true,
      huawei: meta.isRemoteBundle?.huawei || true,
      xiaomi: meta.isRemoteBundle?.xiaomi || true
    }
  };
}