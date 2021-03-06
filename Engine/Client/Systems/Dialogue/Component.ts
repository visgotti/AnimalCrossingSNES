import {Component} from "gotti";
import {SYSTEMS} from "../../../Shared/Constants";
import {Position} from "../../../Shared/Components/Position";

export class DialogueComponent extends Component {
    private currentDialogue : string;
    private textDisplayTime : number;
    private currentBitmapText : PIXI.extras.BitmapText;
    private p : Position = null;
    private dialogueTimeout : any;
    constructor() {
        super(SYSTEMS.DIALOGUE);
        this.currentBitmapText = new PIXI.extras.BitmapText('', { font: 'stroke-small'})
    }
    onAdded(entity) {
    }

    public hideDialogue() {
        if(this.dialogueTimeout) {
            clearTimeout(this.dialogueTimeout);
            this.dialogueTimeout = null;
        }
        this.currentBitmapText.text = '';
    }
    public showDialogue(dialogue: string, time?: number) {
        if(this.dialogueTimeout) {
            clearTimeout(this.dialogueTimeout);
            this.dialogueTimeout = null;
        }
        this.hideDialogue();
        this.currentBitmapText.text = dialogue;
        if(time) {
            this.dialogueTimeout = setTimeout(() => {
                this.hideDialogue();
            }, time);
        }
    }
}