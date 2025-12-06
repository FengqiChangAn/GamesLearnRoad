// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class Dissolve extends cc.Component {

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
    edgeColor: cc.Color = cc.color(255, 255, 255, 255);

    /** 边缘颜色 */
    @property(cc.Color)
    meshColor: cc.Color = cc.color(255, 255, 255, 255); 

    /** 网格大小 */
    @property
    _meshIntensity: number = 0.1;

    @property({type: cc.Float, slide: true, min: 0.05, max: 0.3, step: 0.01})
    get meshIntensity() {
        return this._meshIntensity;
    }
    set meshIntensity(value: number) {
        this._meshIntensity = value;
        this.setMeshIntensity(value);
    }

    /** 网格透明度 */
    @property
    _meshAphla: number = 1;

    @property({type: cc.Float, slide: true, min: 0, max: 1, step: 0.1})
    get meshAphla() {
        return this._meshAphla;
    }
    set meshAphla(value: number) {
        this._meshAphla = value;
        this.setMeshAphla(value);
    }

    /** 网格距离 */
    @property
    _meshDistance: number = 1;

    @property({type: cc.Float, slide: true, min: 0, max: 1, step: 0.1})
    get meshDistance() {
        return this._meshDistance;
    }
    set meshDistance(value: number) {
        this._meshDistance = value;
        this.setmeshDistance(value);
    }


    private _material: cc.Material = null;

    onLoad() {
        const sprite = this.node.getComponent(cc.Sprite);
        if (sprite) {
            this._material = sprite.getMaterial(0);
            if (this._material) {
                this._material.setProperty('meshIntensity', this.meshIntensity);
                this._material.setProperty('edgeWidth', this.edgeWidth);
                this._material.setProperty('glowIntensity', this.glowIntensity);
                this._material.setProperty('meshAphla', this.meshAphla);
                this._material.setProperty('meshDistance', this.meshDistance);
                // 将 cc.Color (0-255) 转换为 shader 需要的 0-1 范围
                const edgeColorVec4 = new cc.Vec4(
                    this.edgeColor.getR() / 255,
                    this.edgeColor.getG() / 255,
                    this.edgeColor.getB() / 255,
                    this.edgeColor.getA() / 255
                );
                this._material.setProperty('edgeColor', edgeColorVec4);
                const meshColorVec4 = new cc.Vec4(
                    this.meshColor.getR() / 255,
                    this.meshColor.getG() / 255,
                    this.meshColor.getB() / 255,
                    this.meshColor.getA() / 255
                );
                this._material.setProperty('meshColor', meshColorVec4);
            }
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

    private setMeshIntensity(size: number) {
        if (this._material) {
            this._material.setProperty('meshIntensity', size);
        }
    }

    private setMeshAphla(intensity: number) {
        if (this._material) {
            this._material.setProperty('meshAphla', intensity);
        }
    }

    private setmeshDistance(intensity: number) {
        if (this._material) {
            this._material.setProperty('meshDistance', intensity);
        }
    }
}
