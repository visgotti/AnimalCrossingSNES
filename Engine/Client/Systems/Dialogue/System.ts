import {SYSTEMS} from "../../../Shared/Constants";

import {ClientSystem} from "gotti";
import {DialogueComponent} from './Component';
import {DialogueInterface} from "../../../Shared/types";
export class DialogueSystem extends ClientSystem {
    private container : PIXI.Container = new PIXI.Container();
    private backgroundSprite : PIXI.Sprite = new PIXI.Sprite();
    private dialogueTextures : DialogueInterface;
    private dialogueText : PIXI.extras.BitmapText;
    constructor() {
        super(SYSTEMS.DIALOGUE);
    }

    onClear(): void {
    }

    onLocalMessage(message): void {
    }

    onPeerMessage(peerId: number | string, message): any {
    }

    onStart() {
        this.dialogueText = new PIXI.extras.BitmapText('', { font: 'ns-small' });
        this.dialogueText.maxWidth = this.dialogueTextures.npc.diaglogueBackground.width - 8;
    }

    public addDialogue(text: string, character: string) {
    }

    onServerMessage(message): any {
    }

    update(delta: any): void {
    }
}