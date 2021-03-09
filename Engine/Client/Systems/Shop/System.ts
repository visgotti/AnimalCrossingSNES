import {ClientSystem} from "gotti";
import {InventoryTextures, ItemTextures, PlayerInput} from "../../../Shared/types";
import {ClientPlayer} from "../../Assemblages/ClientPlayer";
class ShopSlot extends PIXI.Container {
    public bg : PIXI.Sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
    public itemSprite : PIXI.Sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
    public priceText : PIXI.extras.BitmapText = new PIXI.extras.BitmapText('', { font: 'ns-small'});
    public itemName : string = null;
    private _price : number = 0;
    constructor() {
        super();
        this.addChild(this.bg);
        this.addChild(this.itemSprite);
        this.addChild(this.priceText)
    }
    get price() : number { return this._price }
    set price(v: number) {
        if(v && v > 1) {
            this._price = v;
            this.priceText.text = `${v}`
        } else {
            this.priceText.text = '';
            this._price = 0;
        }
    }
}
export class ShopSystem extends ClientSystem {
    private shopContainer : PIXI.Container = new PIXI.Container();
    private backgroundSprite : PIXI.Sprite;
    private selectedBackgroundTexture : PIXI.Texture;
    private shopTextures : InventoryTextures;
    private itemIconTextures : ItemTextures

    private shopSlots : Array<ShopSlot> = [];
    private currentSelectedItemOptionIndex : number;
    private currentSelectedItemOptions : Array<string>;

    private curSelectedIndex : number = 0;
    private clientPlayer : ClientPlayer;
    private itemMenuContainer : PIXI.Container = new PIXI.Container();
    private timeSinceShopToggled : number = 1;
    private timeSinceShopAction : number = 1;

    private shopPointer : PIXI.Sprite = new PIXI.Sprite();
    private previousInput: PlayerInput;

    constructor(props) {
        super(props);
    }

    onClear(): void {
    }

    onLocalMessage(message): void {
    }

    onPeerMessage(peerId: number | string, message): any {
    }

    onServerMessage(message): any {
    }

    update(delta: any): void {
    }

}