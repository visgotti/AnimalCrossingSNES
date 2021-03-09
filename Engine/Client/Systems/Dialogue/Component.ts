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
    }
    public showDialogue(dialogue: string, time?: number) {
    }
}