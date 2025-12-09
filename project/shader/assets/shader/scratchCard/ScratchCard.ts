const { ccclass, property } = cc._decorator;

@ccclass('ScratchCard')
export class ScratchCard extends cc.Component {
    @property(cc.Texture2D)
    brushTexture: cc.Texture2D = null; // 笔刷贴图

    private material: cc.Material = null;
    private sprite: cc.Sprite = null;
    private renderTexture: cc.RenderTexture = null; // 渲染纹理，用于缓存刮擦痕迹
    private graphics: cc.Graphics = null; // 用于绘制笔刷的Graphics组件
    private camera: cc.Camera = null; // 用于渲染到RenderTexture的相机
    private lastTouchPos: cc.Vec2 = null; // 上一次触摸位置，用于连续绘制
    private isFirstRender: boolean = true; // 是否是第一次渲染

    onLoad() {
        // 获取Sprite组件和Material
        this.sprite = this.node.getComponent(cc.Sprite);
        if (this.sprite) {
            this.material = this.sprite.getMaterial(0);
        }

        // 初始化RenderTexture和绘制系统
        this.initRenderTexture();

        // 监听节点触摸事件
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    onDestroy() {
        // 移除事件监听
        this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);

        // 清理资源
        if (this.renderTexture) {
            this.renderTexture.destroy();
        }
        if (this.graphics) {
            this.graphics.node.destroy();
        }
        if (this.camera) {
            this.camera.node.destroy();
        }
    }

    /**
     * 初始化RenderTexture和绘制系统
     */
    private initRenderTexture() {
        if (!this.sprite) {
            return;
        }

        // 获取节点尺寸
        const size = this.node.getContentSize();
        const width = size.width;
        const height = size.height;

        // 创建RenderTexture
        this.renderTexture = new cc.RenderTexture();
        this.renderTexture.initWithSize(width, height);

        // 创建Camera用于渲染到RenderTexture
        const cameraNode = new cc.Node('ScratchCardCamera');
        cameraNode.parent = this.node.parent;
        this.camera = cameraNode.addComponent(cc.Camera);
        this.camera.targetTexture = this.renderTexture;
        // 只在第一次渲染时清除，之后不清除以累积绘制内容
        this.camera.clearFlags = cc.Camera.ClearFlags.COLOR;
        this.camera.backgroundColor = cc.color(0, 0, 0, 0); // 透明背景
        this.camera.orthoSize = height / 2; // 正交投影大小
        this.camera.node.setPosition(this.node.position);

        // 创建Graphics节点用于绘制笔刷
        const graphicsNode = new cc.Node('ScratchCardGraphics');
        graphicsNode.parent = cameraNode;
        // Graphics节点相对于Camera节点，位置为(0,0,0)
        // 由于Camera节点在z=10000，Graphics也在z=10000，主场景的Camera看不到它
        // 但我们的Camera（正交投影）仍然可以正确渲染它到RenderTexture
        graphicsNode.setPosition(0, 0, 0);
        this.graphics = graphicsNode.addComponent(cc.Graphics);
        
        // 设置Graphics的混合模式，确保绘制内容能够正确叠加
        // Graphics默认使用正常的混合模式，白色绘制会覆盖之前的内容

        // 将RenderTexture设置为material的cacheTexture
        if (this.material) {
            this.material.setProperty('cacheTexture', this.renderTexture);
        }
    }

    /**
     * 触摸开始事件处理
     */
    private onTouchStart(event: cc.Event.EventTouch) {
        const localPos = this.getLocalPosition(event);
        if (localPos) {
            this.lastTouchPos = localPos;
            this.drawBrush(localPos);
        }
    }

    /**
     * 触摸移动事件处理
     */
    private onTouchMove(event: cc.Event.EventTouch) {
        const localPos = this.getLocalPosition(event);
        if (localPos) {
            // 更新笔刷位置（用于实时预览）
            this.updateBrushPosition(localPos);

            // 如果上次有触摸位置，绘制连线（连续刮擦效果）
            if (this.lastTouchPos) {
                this.drawBrushLine(this.lastTouchPos, localPos);
            } else {
                this.drawBrush(localPos);
            }
            this.lastTouchPos = localPos;
        }
    }

    /**
     * 触摸结束事件处理
     */
    private onTouchEnd(event: cc.Event.EventTouch) {
        this.lastTouchPos = null;
    }

    /**
     * 获取触摸点在节点本地坐标系中的位置
     */
    private getLocalPosition(event: cc.Event.EventTouch): cc.Vec2 | null {
        const screenPos = event.getLocation();
        const localPos = this.node.convertToNodeSpaceAR(cc.v2(screenPos.x, screenPos.y));
        
        // 检查是否在节点范围内
        const size = this.node.getContentSize();
        const width = size.width;
        const height = size.height;
        const offsetX = localPos.x + width / 2;
        const offsetY = height / 2 - localPos.y;

        if (offsetX < 0 || offsetX > width || offsetY < 0 || offsetY > height) {
            return null;
        }

        return localPos;
    }

    /**
     * 更新笔刷位置
     * @param localPos 节点本地坐标
     */
    private updateBrushPosition(localPos: cc.Vec2) {
        if (!this.material || !this.sprite) {
            return;
        }

        // 获取节点的尺寸
        const size = this.node.getContentSize();
        const width = size.width;
        const height = size.height;

        // 计算相对于节点中心的偏移（节点中心是(0,0)）
        // 左上角是(-width/2, height/2)，右下角是(width/2, -height/2)
        const offsetX = localPos.x + width / 2;  // 从左边缘开始计算，范围0到width
        const offsetY = height / 2 - localPos.y; // 从上边缘开始计算，范围0到height

        // 检查是否在节点范围内
        if (offsetX < 0 || offsetX > width || offsetY < 0 || offsetY > height) {
            return;
        }

        // 转换为UV坐标（0-1范围）
        // UV坐标：左上角是(0,0)，右下角是(1,1)
        const u = offsetX / width;
        const v = offsetY / height;

        // 将UV坐标转换为brushX和brushY
        // 左上角(0,0) -> brushX=0, brushY=0
        // 右下角(1,1) -> brushX=-9, brushY=-9
        // 中间(0.5,0.5) -> brushX=-4.5, brushY=-4.5
        const brushX = -9 * u;
        const brushY = -9 * v;

        // 更新material属性（用于实时预览）
        this.material.setProperty('brushX', brushX);
        this.material.setProperty('brushY', brushY);
    }

    /**
     * 在指定位置绘制笔刷
     */
    private drawBrush(pos: cc.Vec2) {
        if (!this.graphics) {
            return;
        }

        // 获取笔刷大小（可以根据brushTexture的尺寸调整）
        const brushSize = 20; // 笔刷半径

        // 设置绘制样式 - alpha=255表示完全刮除（白色不透明）
        this.graphics.fillColor = cc.color(25, 255, 255, 255);
        this.graphics.circle(pos.x, pos.y, brushSize);
        this.graphics.fill();

        // 立即渲染到RenderTexture（累积绘制）
        this.renderToTexture();
    }

    /**
     * 在两点之间绘制笔刷连线（实现连续刮擦效果）
     */
    private drawBrushLine(startPos: cc.Vec2, endPos: cc.Vec2) {
        if (!this.graphics) {
            return;
        }

        const brushSize = 20; // 笔刷半径（与drawBrush保持一致）
        // 计算两点之间的距离
        const dx = endPos.x - startPos.x;
        const dy = endPos.y - startPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.max(1, Math.ceil(distance / (brushSize * 0.5))); // 根据距离计算步数

        // 设置绘制样式 - alpha=255表示完全刮除
        this.graphics.fillColor = cc.color(25, 255, 255, 255);

        // 在两点之间绘制多个圆形，实现连续效果
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = startPos.x + dx * t;
            const y = startPos.y + dy * t;
            this.graphics.circle(x, y, brushSize);
            this.graphics.fill();
        }

        // 立即渲染到RenderTexture（累积绘制）
        this.renderToTexture();
    }

    /**
     * 将Graphics内容渲染到RenderTexture
     */
    private renderToTexture() {
        if (this.camera) {
            // 每次渲染时都清除RenderTexture，然后重新渲染Graphics的所有累积内容
            // 这样可以确保RenderTexture只包含当前Graphics的所有内容
            this.camera.clearFlags = cc.Camera.ClearFlags.COLOR;
            
            // 渲染Camera视野内的所有内容到RenderTexture
            // Graphics的内容会累积在Graphics组件上，每次render都会渲染所有累积的内容
            this.camera.render(this.camera.node.parent);
        }
    }
}