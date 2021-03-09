import {Component} from "gotti";
import {SYSTEMS} from "../../../Shared/Constants";
import {Bug} from "../../Assemblages/Bug";
import {Position} from "../../../Shared/Components/Position";
import {getRandomNumber} from "../../../Shared/Utils";
import {BugTypes} from "../../../Shared/types";


const CHANGE_FRAME_IN = .5;

export class BugMovementComponent extends Component {
    private timeSinceLastMovementChange : number = 0;
    private timeSinceFrameChange : number = 0;
    private changeMovementIn : number = 100;
    private velocity : number;
    private angle : number;
    private position : Position;

    private bugType : BugTypes;

    private bug : Bug;

    private curFrame : number;

    private frames : Array<PIXI.Texture> =[];

    private sprite : PIXI.Sprite;
    private gameObject : any;

    constructor(sprite: PIXI.Sprite, frames: Array<PIXI.Texture>) {
        super(SYSTEMS.BUG_MOVEMENT_AND_ANIMATION);
        this.sprite = sprite;
        this.frames = frames;
        this.sprite.texture = this.frames[0];
    }

    private incrFrame() {
        if(++this.curFrame >= this.frames.length - 1) {
            this.curFrame = 0;
        }
        this.sprite.texture = this.frames[this.curFrame];
    }

    private getNewDegreeDirection() : number {
        const nextAngle = getRandomNumber(0, 360);
        const p = this.position.getPosition();
        if(p.x > 1500 && nextAngle > 0 && nextAngle < 180) {
            return this.getNewDegreeDirection();
        }
    }

    private isMovingRight() {
        return true;
    }

    updateMovement(delta: number) {
        if(!this.sprite)  {
            this.sprite = this.bug?.gameObject?.sprite;
        };
        if(!this.sprite) return;
        this.timeSinceLastMovementChange += delta;
        this.timeSinceFrameChange += delta;
        if(this.timeSinceLastMovementChange > this.changeMovementIn) {
            this.timeSinceLastMovementChange = 0;
        }
        if(this.timeSinceFrameChange > CHANGE_FRAME_IN) {
            this.incrFrame();
            this.timeSinceFrameChange = 0;
        }
        this.sprite.scale.x = this.isMovingRight() ? 1 : -1;
        this.gameObject.updatePosition(delta, delta);
    }

    onAdded(entity: Bug) {
        this.bug = entity;
        this.sprite = entity.gameObject?.sprite;
        this.bugType = entity.bugType;
        this.position = entity.getComponent(SYSTEMS.POSITION);
        this.gameObject = entity.gameObject;
        if(!this.position) throw new Error(`Expected position`);
    }
}