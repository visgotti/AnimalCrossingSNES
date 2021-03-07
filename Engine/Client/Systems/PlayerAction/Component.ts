import {Component} from "gotti";
import {PlayerActions, PlayerDirections} from "../../../Shared/types";
import {SYSTEMS} from "../../../Shared/Constants";
import {Skeleton} from "../../lib/Gottimation/Runtime/core/Skeleton";

export class PlayerActionComponent extends Component {
    public action : PlayerActions;
    public actionDirection : string;
    public actionAttachmentSlot?: 'tool' | 'body';
    public actionAttachment?: 'shovel' | 'net' | 'axe';
    public repeatingAction: boolean = false;
    private skeleton : Skeleton;


    constructor() {
        super(SYSTEMS.PLAYER_ACTION);
    }
    public startAction(action: PlayerActions, direction?: PlayerDirections, repeatingAction?: boolean) {
        console.error('starting action', action);
        if(this.action) {
            this.stopAction();
        }
        this.action = action;
        this.actionDirection = direction
        this.repeatingAction = !!repeatingAction;
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