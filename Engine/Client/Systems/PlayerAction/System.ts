import {ClientSystem} from "gotti";
import {SYSTEMS} from "../../../Shared/Constants";
import {ClientPlayer} from "../../Assemblages/ClientPlayer";
import {PlayerInput} from "../../../Shared/types";
import {PlayerActionComponent} from "./Component";

type ItemData = { hotkey: number, displaySprite: PIXI.Sprite, backgroundSprite: PIXI.Sprite, description?: string, displayName?: string }
type ActionItemStates = {
    hatchet: { state: HatchetStates } & ItemData ,
    hoe:{ state: HoeStates } & ItemData ,
    pole: { state: PoleStates } & ItemData ,
    watercan: { state: WaterCanStates } & ItemData ,
}
type WaterCanStates = 'default' | 'full'
type HatchetStates = 'default';
type HoeStates = 'default';
type PoleStates = 'default';

type ValidTools = 'hatchet' | 'hoe' | 'watercan' | 'pole';

const SpriteToolItemSize= 40;

export class PlayerActionSystem extends ClientSystem {
    private ui : PIXI.Container;
    private _currentSelectedTool : ValidTools = 'hatchet';

    constructor() {
        super(SYSTEMS.PLAYER_ACTION);
        this._currentSelectedTool = 'hatchet';
    }
    onInit() {
        // @ts-ignore
   //     this.itemBackgroundTextures.default = makeRectTexture(SpriteToolItemSize, SpriteToolItemSize, 0x000000, 0xffffff, 2, this.globals.renderer);
        // @ts-ignore
  //      this.itemBackgroundTextures.selected = makeRectTexture(SpriteToolItemSize, SpriteToolItemSize, 0x000000, 0xe6e073, 2, this.globals.renderer);
        this.addApi(this.setTool);
    }

    onClear(): void {
    }

    private makeToolUi() {
    }

    private repositionToolUI() {
    }

    onStart() {
        this.repositionToolUI = this.repositionToolUI.bind(this);
        this.makeToolUi();
        document.addEventListener('resize', this.repositionToolUI);
    }
    onStop() {
        document.removeEventListener('resize', this.repositionToolUI);
    }

    public setTool(v : ValidTools) {
    }


    onPeerMessage(peerId: number | string, message): any {
    }

    onServerMessage(message): any {
    }

    update(delta: any): void {
        if(this.globals.clientPlayer) {
        }
    }
    onLocalMessage(message): void {
    }
}

function makeRectTexture(w, h, color, outlineColor, outlineWidth, renderer) : PIXI.Texture {
    outlineColor = outlineColor ? outlineColor : color;
    outlineWidth = outlineWidth ? outlineWidth : 0;
    const g = new PIXI.Graphics();
    g.beginFill(color);
    if(outlineWidth) {
        g.lineStyle(outlineWidth, outlineColor);
    }
    g.drawRect(outlineWidth, outlineWidth, w-outlineWidth, h-outlineWidth);
    const texture = PIXI.RenderTexture.create(w, h);
    renderer.render(g, texture);
    return texture;
}