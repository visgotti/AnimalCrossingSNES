import {Component} from "gotti";
import {SYSTEMS} from "../../../Shared/Constants";
import {Bug} from "../../Assemblages/Bug";
import {Position} from "../../../Shared/Components/Position";
import {getRandomNumber} from "../../../Shared/Utils";

export class BugMovementComponent extends Component {
    private timeSinceLastMovementChange : number = 0;
    private changeMovementIn : number = 100;
    private velocity : number;
    private angle : number;
    private position : Position;
    constructor() {
        super(SYSTEMS.BUG_MOVEMENT);
    }

    private getNewDegreeDirection() : number {
        const nextAngle = getRandomNumber(0, 360);
        const p = this.position.getPosition();
        if(p.x > 1500 && nextAngle > 0 && nextAngle < 180) {
            return this.getNewDegreeDirection();
        }
    }

    updateMovement(delta: number) {
        this.timeSinceLastMovementChange += delta;
        if(this.timeSinceLastMovementChange > this.changeMovementIn) {
            this.timeSinceLastMovementChange = 0;
        }
    }

    onAdded(entity: Bug) {
        this.position = entity.getComponent(SYSTEMS.POSITION);
        if(!this.position) throw new Error(`Expected position`);
    }
}