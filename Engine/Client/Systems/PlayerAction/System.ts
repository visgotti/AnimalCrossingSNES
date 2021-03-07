import {ClientSystem} from "gotti";
import {MESSAGES, SYSTEMS} from "../../../Shared/Constants";
import {PlayerActionComponent} from "./Component";

type ValidTools = 'net' | 'shovel'

export class PlayerActionSystem extends ClientSystem {
    private clientPlayerComponent : PlayerActionComponent;
    constructor() {
        super(SYSTEMS.PLAYER_ACTION);
    }
    onInit() {}

    onClear(): void {
    }

    private makeToolUi() {
    }



    private repositionToolUI() {
    }

    onStart() {
    }
    onStop() {}

    onPeerMessage(peerId: number | string, message): any {
    }

    onServerMessage(message): any {
    }

    onEntityAddedComponent(entity: any, component) {
        this.clientPlayerComponent = component;
    }

    update(delta: any): void {
        if(this.globals.clientPlayer) {
        }
    }

    private handlePlayerEquipItem(itemName: string) {
        if(itemName === 'net' || itemName === 'shovel' || itemName === 'axe') {
            this.clientPlayerComponent.actionAttachment = itemName;
        } else {
            this.clientPlayerComponent.actionAttachment = null;
        }
    }

    onLocalMessage(message): void {
        switch(message.type) {
            case MESSAGES.USE_ITEM:
                this.handlePlayerEquipItem(message.data);
                break;
        }
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