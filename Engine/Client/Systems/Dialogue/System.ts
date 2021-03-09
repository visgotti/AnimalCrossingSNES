import {COLLIDER_TAGS, SYSTEMS} from "../../../Shared/Constants";

import {ClientSystem} from "gotti";
import {DialogueComponent} from './Component';
import {DialogueInterface} from "../../../Shared/types";
import {NPC} from "../../Assemblages/NPC";

type DialogueQuestionData = {
    question: string,
    responses?: Array<{ response: string, question: DialogueQuestionData }>
}

type DialogueData = {
    npc: string,
    questions: DialogueQuestionData
}

export class DialogueSystem extends ClientSystem {
    private container : PIXI.Container = new PIXI.Container();
    private backgroundSprite : PIXI.Sprite = new PIXI.Sprite();
    private dialogueTextures : DialogueInterface;
    private dialogueText : PIXI.extras.BitmapText;
    private responseContainer: PIXI.Container = new PIXI.Container();
    private responsePointer: PIXI.Sprite = new PIXI.Sprite();
    private responseBackground: PIXI.Sprite = new PIXI.Sprite();

    private continueBtn : PIXI.Graphics = new PIXI.Graphics();

    private curResponseOptions : Array<PIXI.Container> = [];

    private curQuestion : DialogueQuestionData;

    private talkableIcon : PIXI.Sprite;

    private playerNpcDialogueCollisionPlugin : any;
    private focusedNpc : NPC;
    constructor() {
        super(SYSTEMS.DIALOGUE);

        this.playerNpcDialogueCollisionPlugin = {
            type: 'collision',
            name: 'dialogue',
            tagAs: [COLLIDER_TAGS.in_front_of_client_player],
            tagBs: [COLLIDER_TAGS.npc],
            onCollisionStart: (colA, colB) => {
                if(!this.focusedNpc) {
                    this.focusedNpc = colB.gameObject.entity;
                }
            },
            onCollision: (colA, colB) => {
                if(!this.focusedNpc) {
                    this.focusedNpc = colB.gameObject.entity;
                }
            },
            onCollisionEnd: (colA, colB) => {
                if(this.focusedNpc === colB.gameObject.entity) {
                    this.focusedNpc = null;
                }
            },
        }
    }

    onClear(): void {
    }

    onLocalMessage(message): void {
    }

    onPeerMessage(peerId: number | string, message): any {
    }

    onInit() {
        this.addApi(this.isInDialogue);
        this.globals.tileWorld.use(this.playerNpcDialogueCollisionPlugin);
    }

    public playDialogue(dialogueData: DialogueData) {
        this.container.visible = true;
    }

    onStart() {
        this.backgroundSprite.texture = this.globals.gameTextures.dialogue.npc.diaglogueBackground;
        this.container.addChild(this.backgroundSprite);
        this.container.visible = false;
        this.responseBackground.texture = this.globals.gameTextures.dialogue.response.background;
        this.responsePointer.texture = this.globals.gameTextures.dialogue.response.pointer;
        this.responseContainer.addChild(this.responseBackground);
        this.dialogueText = new PIXI.extras.BitmapText('', { font: 'ns-small' });
        this.responseContainer.addChild(this.dialogueText);
        this.responseContainer.addChild(this.continueBtn);
        this.continueBtn.x = this.backgroundSprite.texture.width / 2 - (this.continueBtn.width/2);
        this.continueBtn.y = this.backgroundSprite.texture.height - (this.continueBtn.height+1)
     //   this.dialogueText.maxWidth = this.dialogueTextures.npc.diaglogueBackground.width - 8;
    }

    public displayDialogue(text: string, character: string) {
        this.container.visible = true;
    }

    private clearResponse() {
        this.curResponseOptions.forEach(o => {
            o.destroy(false);
        });
        this.curResponseOptions.length = 0;
        this.responseContainer.visible = false;
    }

    private setSelectedResponse(index: number) {
        this.responsePointer.parent?.removeChild(this.responsePointer);
        let selectedY = -1;
        this.curResponseOptions.forEach((o, i) => {
            if(i === index) {
                selectedY = this.curResponseOptions[index].y;
                // @ts-ignore
                o.children[0].texture = this.globals.gameTextures.dialogue.response.selectedOptionBackground;
            } else {
                // @ts-ignore
                o.children[0].texture = PIXI.Texture.EMPTY
            }
        })
        this.responseContainer.addChild(this.responsePointer);
        if(selectedY > -1) {
            this.responsePointer.y = selectedY;
            this.responsePointer.x =  -this.responsePointer.width;
        }
    }

    get currentSelectedResponseOptionIndex() : number {
        if(!this.curResponseOptions.length) return -1;
        for(let i = 0; i < this.curResponseOptions.length; i++) {
            // @ts-ignore
            if(this.curResponseOptions[i].children[0].texture === this.globals.gameTextures.dialogue.response.selectedOptionBackground) {
                return i;
            }
        }
        return -1;
    }

    public displayResponse(options: Array<string>) {
        this.clearResponse();
        options.forEach((o, i) => {
            const bg = new PIXI.Sprite();
            const text = new PIXI.extras.BitmapText(o, { font: 'ns-small'});
            const c = new PIXI.Container();
            c.addChild(bg);
            c.addChild(text);
            this.curResponseOptions.push(c);
            c.y = i*this.globals.gameTextures.dialogue.response.selectedOptionBackground.height;
            this.responseContainer.addChild(c);
        });
        this.setSelectedResponse(0);
    }

    public isInDialogue() : boolean {
        return !!this.container.visible
    }

    onServerMessage(message): any {
    }

    update(delta: any): void {
        if(this.globals.clientPlayer && this.globals.clientPlayer.playerInput.grab && this.focusedNpc) {
        }
    }
}