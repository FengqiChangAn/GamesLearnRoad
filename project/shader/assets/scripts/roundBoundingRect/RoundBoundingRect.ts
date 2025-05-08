import { CommonUtil } from "../util/CommonUtil";

const { ccclass, property, requireComponent, executeInEditMode } = cc._decorator;

@ccclass
@executeInEditMode
@requireComponent(cc.Sprite)
export class RoundBoundingRect extends cc.Component {

    @property
    _edge: number = 0.15;

    @property({
        type: cc.Float, 
        tooltip: "圆角半径占较短边边长的比例，0到0.5之间",
        slide: true,
        min: 0,
        max: 0.5,
    })
    get edge() {
        return this._edge;
    }

    set edge(value: number) {
        this._edge = value;
        if(CC_EDITOR) {
            this.resize();
        }
    }

    @property
    _customRadius: boolean = false;

    @property({ type: cc.Boolean, tooltip: "是否启用自定义圆角半径" })
    get customRadius() {
        return this._customRadius;
    }

    set customRadius(value: boolean) {
        this._customRadius = value;
        if(CC_EDITOR) {
            this.resize();
        }
    }

    @property
    _leftRadius: number = 0.15;

    @property({ 
        type: cc.Float, 
        tooltip: "自定义左边圆角半径，0到0.5之间",
        slide: true,
        min: 0,
        max: 0.5,
        visible: function(this: RoundBoundingRect) { return this.customRadius; }
    })
    get leftRadius() {
        return this._leftRadius;
    }

    set leftRadius(value: number) {
        this._leftRadius = value;
        if(CC_EDITOR) {
            this.resize();
        }
    }

    @property
    _rightRadius: number = 0.15;

    @property({ 
        type: cc.Float, 
        tooltip: "自定义右边圆角半径，0到0.5之间",
        slide: true,
        min: 0,
        max: 0.5,
        visible: function(this: RoundBoundingRect) { return this.customRadius; }
    })
    get rightRadius() {
        return this._rightRadius;
    }

    set rightRadius(value: number) {
        this._rightRadius = value;
        if(CC_EDITOR) {
            this.resize();
        }
    }

    protected start(): void {
        const sprite = this.node.getComponent(cc.Sprite);
        const material = sprite.getMaterial(0);
        const w = this.node.width;
        const h = this.node.height;
        const u_radius = CommonUtil.limit(0, 0.5, this.edge) * Math.min(w, h);
        const custom_radius = new cc.Vec2(
            CommonUtil.limit(0, 0.5, this.leftRadius) * Math.min(w, h),
            CommonUtil.limit(0, 0.5, this.rightRadius) * Math.min(w, h)
        );
        material.setProperty("u_radius", u_radius);
        material.setProperty("u_size", cc.v2(w, h));
        material.setProperty("is_custom_radius", this.customRadius ? 1 : 0);
        material.setProperty("u_custom_radius", custom_radius);
        sprite.setMaterial(0, material);
    }

    resize() {
        const sprite = this.node.getComponent(cc.Sprite);
        const material = sprite.getMaterial(0);
        const w = this.node.width;
        const h = this.node.height;
        const u_radius = CommonUtil.limit(0, 0.5, this.edge) * Math.min(w, h);
        const custom_radius = new cc.Vec2(
            CommonUtil.limit(0, 0.5, this.leftRadius) * Math.min(w, h),
            CommonUtil.limit(0, 0.5, this.rightRadius) * Math.min(w, h)
        );
        material.setProperty("u_radius", u_radius);
        material.setProperty("u_size", cc.v2(w, h));
        material.setProperty("is_custom_radius", this.customRadius ? 1 : 0);
        material.setProperty("u_custom_radius", custom_radius);
        sprite.setMaterial(0, material);
    }
} 