# 批量添加荣耀小游戏Bundle配置工具

这个工具可以自动为所有分包添加`honor-minigame`属性配置，避免手动一个一个文件夹点击设置的繁琐过程。

## 文件说明

- `batch-set-bundle.js` - Node.js版本脚本
- `batch-set-bundle.py` - Python版本脚本
- `packages/snake-tools/dist/tool-router/batch-bundle-setter.js` - 工具类版本

## 使用方法

### 方法1: 使用Node.js脚本（推荐）

```bash
# 在项目根目录执行
node batch-set-bundle.js
```

### 方法2: 使用Python脚本

```bash
# 在项目根目录执行
python3 batch-set-bundle.py
```

### 方法3: 在Cocos Creator中使用

将 `packages/snake-tools/dist/tool-router/batch-bundle-setter.js` 集成到Cocos Creator的工具中。

## 功能特性

- ✅ 自动扫描所有分包目录
- ✅ 只添加`honor-minigame`属性，保持其他配置不变
- ✅ 智能检测：只添加缺失的属性，不覆盖现有配置
- ✅ 详细的进度显示
- ✅ 错误处理和统计
- ✅ 安全操作：不会破坏现有配置

## 配置内容

脚本会自动为每个分包的meta文件添加以下`honor-minigame`属性：

```json
{
  "compressionType": {
    "honor-minigame": "zip"
  },
  "optimizeHotUpdate": {
    "honor-minigame": false
  },
  "inlineSpriteFrames": {
    "honor-minigame": false
  },
  "isRemoteBundle": {
    "honor-minigame": true
  }
}
```

**注意：** 脚本只会添加缺失的`honor-minigame`属性，不会修改现有的其他平台配置。

## 注意事项

1. **备份重要**：运行脚本前建议备份项目
2. **路径检查**：确保分包路径正确：`/Users/zoutao/project/snake-minigame/assets/subpackages`
3. **权限检查**：确保有读写.meta文件的权限
4. **Meta文件格式**：脚本会查找`分包名.meta`文件（如`activityCenter.meta`）
5. **环境要求**：
   - Node.js版本：建议12.0+
   - Python版本：建议3.6+

## 输出示例

```
🚀 开始批量设置Bundle配置...
📁 分包路径: /Users/zoutao/project/snake-minigame/assets/subpackages
📦 找到 120 个分包

[1/120] 处理分包: activityCenter
✅ activityCenter 设置成功

[2/120] 处理分包: activityCenterMeetingGift
✅ activityCenterMeetingGift 设置成功

...

==================================================
📊 批量设置Bundle配置完成
==================================================
✅ 成功: 120 个分包
❌ 失败: 0 个分包

🎉 批量设置完成！
```

## 故障排除

### 常见错误

1. **路径不存在**：检查分包路径是否正确
2. **权限不足**：确保有读写文件的权限
3. **JSON格式错误**：检查.meta文件格式是否正确
4. **环境问题**：确保Node.js或Python环境正常

### 解决方案

1. 检查项目路径是否正确
2. 使用管理员权限运行脚本
3. 手动检查有问题的.meta文件
4. 重新安装Node.js或Python环境
