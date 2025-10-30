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

    @property({type: cc.Float, slide: true, min: 0, max: 1, step: 0.01})
    get dissolveThreshold() {
        return this._dissolveThreshold;
    }
    set dissolveThreshold(value: number) {
        this._dissolveThreshold = value;
        this.setDissolveThreshold(value);
    }

    @property(cc.Boolean)
    isDissolve: boolean = true;

    onLoad() {
        const material = this.node.getComponent(cc.Sprite).getMaterial(0);
        material.setProperty('dissolveThreshold', this.dissolveThreshold);
    }

    private setDissolveThreshold(threshold: number) {
        const material = this.node.getComponent(cc.Sprite).getMaterial(0);
        material.setProperty('dissolveThreshold', threshold);
    }

    protected update(dt: number): void {
        if(!this.isDissolve) return;

        this.dissolveThreshold += 0.01;
        if(this.dissolveThreshold >= 1) {
            this.dissolveThreshold = 0;
        }
    }
}
