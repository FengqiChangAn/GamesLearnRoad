const {ccclass, property} = cc._decorator;

@ccclass
export default class Gray extends cc.Component {
    @property
    _gray: number = 0; // 灰度值

    @property({type: Number, slide: true, min: 0, max: 1, step: 0.01})
    get gray() {
        return this._gray;
    }

    set gray(value: number) {
        this._gray = value;
        this._updateGray();
    }

    // 更新灰度值
    private _updateGray() {
        const material = this.node.getComponent(cc.Sprite).getMaterial(0);  
        material.setProperty('gray', this.gray);
    }

    onLoad() {
        this._updateGray();
    }
}
