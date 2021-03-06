import {Component} from "gotti";
import {PlayerActions, PlayerDirections} from "../../../Shared/types";
import {SYSTEMS} from "../../../Shared/Constants";

export class PlayerActionComponent extends Component {
    public action : PlayerActions;
    public actionDirection : string;
    public actionAttachmentSlot?: 'tool' | 'body';
    public actionAttachment?: 'water' | 'hatchet' | 'hoe' | 'pole';
    public repeatingAction: boolean = false;
    constructor() {
        super(SYSTEMS.PLAYER_ACTION);
    }
    onAdded(entity) {
    }

    public startAction(action: PlayerActions, direction?: PlayerDirections, repeatingAction?: boolean) {
        console.error('starting action', action);
        if(this.action) {
            this.stopAction();
        }
        this.action = action;
        this.actionDirection = direction
        this.repeatingAction = !!repeatingAction;
        if(this.action === 'swing') {
            this.actionAttachment = 'hatchet'
        } else {
            this.actionAttachment = null;
        }
        this.emit('start-action', { action, direction })
    }
    public stopAction() {
        const prev= this.action;
        const prevDir = this.actionDirection;
        this.action = null;
        this.actionDirection = null;
        this.emit('stop-action', { action: prev, direction: prevDir })
    }
}