// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property, executeInEditMode} = cc._decorator;

@ccclass
@executeInEditMode
export default class Dissolve extends cc.Component {

    @property
    _dissolveThreshold: number = 0.5;

    /** 溶解阈值 */
    @property({type: cc.Float, slide: true, min: 0, max: 1, step: 0.01})
    get dissolveThreshold() {
        return this._dissolveThreshold;
    }
    set dissolveThreshold(value: number) {
        this._dissolveThreshold = value;
        this.setDissolveThreshold(value);
    }

    /** 是否溶解 */
    @property(cc.Boolean)
    isDissolve: boolean = true;

    /** 边缘宽度 */
    @property
    _edgeWidth: number = 0.1;

    @property({type: cc.Float, slide: true, min: 0, max: 0.3, step: 0.01})
    get edgeWidth() {
        return this._edgeWidth;
    }
    set edgeWidth(value: number) {
        this._edgeWidth = value;
        this.setEdgeWidth(value);
    }

    /** 发光强度 */
    @property
    _glowIntensity: number = 1.0;

    @property({type: cc.Float, slide: true, min: 0, max: 3, step: 0.1})
    get glowIntensity() {
        return this._glowIntensity;
    }
    set glowIntensity(value: number) {
        this._glowIntensity = value;
        this.setGlowIntensity(value);
    }

    /** 边缘颜色 */
    @property(cc.Color)
    edgeColor: cc.Color = cc.color(255, 76, 0, 255); // 默认燃烧色 (1.0, 0.3, 0.0, 1.0)

    /** UV动画速度 */
    @property(cc.Vec2)
    uvSpeed: cc.Vec2 = cc.v2(0.0, 0.55); // 默认向上滚动

    private _material: cc.Material = null;

    onLoad() {
        const sprite = this.node.getComponent(cc.Sprite);
        if (sprite) {
            this._material = sprite.getMaterial(0);
            if (this._material) {
                this._material.setProperty('dissolveThreshold', this.dissolveThreshold);
                this._material.setProperty('edgeWidth', this.edgeWidth);
                this._material.setProperty('glowIntensity', this.glowIntensity);
                // 将 cc.Color (0-255) 转换为 shader 需要的 0-1 范围
                const edgeColorVec4 = new cc.Vec4(
                    this.edgeColor.getR() / 255,
                    this.edgeColor.getG() / 255,
                    this.edgeColor.getB() / 255,
                    this.edgeColor.getA() / 255
                );
                this._material.setProperty('edgeColor', edgeColorVec4);
                this._material.setProperty('uvSpeed', this.uvSpeed);
            }
        }
    }

    private setDissolveThreshold(threshold: number) {
        if (this._material) {
            this._material.setProperty('dissolveThreshold', threshold);
        }
    }

    private setEdgeWidth(width: number) {
        if (this._material) {
            this._material.setProperty('edgeWidth', width);
        }
    }

    private setGlowIntensity(intensity: number) {
        if (this._material) {
            this._material.setProperty('glowIntensity', intensity);
        }
    }

    protected update(dt: number): void {
        if (!this.isDissolve) return;

        this.dissolveThreshold += 0.1 * dt;
        if (this.dissolveThreshold >= 1) {
            this.dissolveThreshold = 0;
        }
    }
}
