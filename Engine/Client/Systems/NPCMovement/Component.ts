import { Component, Entity } from "gotti";
import { SYSTEMS } from "../../../Shared/Constants";
import { Position } from "../../../Shared/Components/Position";
import {NPC} from "../../Assemblages/NPC";
import {getDistance, getMovementDataFromDeltas} from "../../../Shared/Utils";
import {Skeleton} from "../../lib/Gottimation/Runtime/core/Skeleton";
export class NPCMovementComponent extends Component {
    private p: Position ;
    private moveToPosition: { x: number, y: number };
    public makeUpDelta : number = 0;
    private walkSpeed: number;
    private walkSpeedX: number;
    private walkSpeedY: number;
    private x_distanceToTraverse: number;
    private x_traversedSoFar: number;
    private y_distanceToTraverse: number;
    private positionQueue : Array<{ x: number, y :number, direction?: string }> = [];
    private y_traversedSoFar: number;
    private vX: number = 0;
    private vY: number = 0;
    private reachedSpot : boolean = false;
    private _lookingDirectionIndex: number = 0;
    private lockedInDirection: boolean = false;
    private lockedInDirectionTimeout: any;

    private moveToDirection : string;
    private moveToTotalTime: number;
    private moveToTimeLeft: number;
    private entity : NPC;
    private skeleton: Skeleton;
    constructor(walkSpeed, skeleton?: Skeleton) {
        super(SYSTEMS.NPC_MOVEMENT);
        this.walkSpeed = walkSpeed;
        this.skeleton = skeleton;
    }
    onAdded(entity: NPC): void {
        if(!entity.hasComponent(SYSTEMS.POSITION)) {
            throw new Error('For Attack Baddy Component to work the entity needs a position component')
        }
        this.entity = entity;
        this.p = entity.getComponent(SYSTEMS.POSITION);
        this.moveToPosition = { ...this.p.getPosition() };
    }
    set lookingDirectionIndex(value) {
        if(!this.lockedInDirection && value > -1 && value < 4) {
            this._lookingDirectionIndex = value;
        }
    }

    get lookingDirectionIndex() {
        return this._lookingDirectionIndex;
    }

    public lockDirection(direction, lockDuration) {
        this.lockedInDirection = false;
        this.lookingDirectionIndex = direction;
        this.lockedInDirection = true;

        if(this.lockedInDirectionTimeout) {
            clearTimeout(this.lockedInDirectionTimeout);
        }
        this.lockedInDirectionTimeout = setTimeout(() => {
            this.lockedInDirection = false;
            this.lockedInDirectionTimeout = null;
        }, lockDuration);
    }


    private updateWalkSpeeds() {
        const position = this.p.getPosition();
        this.walkSpeedX = 0;
        this.walkSpeedY = 0;
        if(position.x == this.moveToPosition.x && position.y === this.moveToPosition.y) {
            return;
        }
        if(this.vX && this.x_distanceToTraverse !== this.x_traversedSoFar) {
            this.walkSpeedX = this.walkSpeed * this.vX;
        }
        if(this.vY && this.y_distanceToTraverse !== this.y_traversedSoFar) {
            this.walkSpeedY = this.walkSpeed * this.vY;
        }
    }

    public moveToQueue(queue: Array<{ x: number, y: number, direction?: string }>) {
        this.positionQueue = queue;
        const first = this.positionQueue.shift();
        if(first.direction && this.skeleton) {
            this.skeleton.direction = first.direction;
        }
        this.moveTo(first.x, first.y, first.direction);
    }

    public moveTo(x, y, direction?: string)  {
        this.moveToDirection = direction;
        this.reachedSpot = false;
      //  console.error('the distance was', Math.round(getDistance({ x, y }, this.p.getPosition())));
        const position = this.p.getPosition();
        this.moveToPosition = { x: Math.round(x), y: Math.round(y) };
        this.x_distanceToTraverse = Math.abs(this.moveToPosition.x - position.x);
        this.y_distanceToTraverse = Math.abs(this.moveToPosition.y - position.y);
        this.x_traversedSoFar = 0;
        this.y_traversedSoFar = 0;
        this.vX = Math.sign(this.moveToPosition.x - position.x);
        this.vY = Math.sign(this.moveToPosition.y - position.y);
        if(direction && this.skeleton) {
            this.skeleton.direction = direction;
        }
        if(!this.vX && !this.vY) {
            this.reachedSpot = true;
            this.emit('reached-spot', { x, y, direction: this.moveToDirection });
            if(this.skeleton && !this.skeleton.baseTrack.stopped) {
                this.skeleton.stop();
            }
        } else {
            if(this.skeleton && (this.skeleton.baseTrack.stopped || !this.skeleton.baseTrack.currentAction || !this.skeleton.baseTrack.currentAction.includes('walk'))) {
                this.skeleton.play('walk', null, { loop: true });
            }
        }
    }

    public updateMovement(delta, inverseEastWest=false) : { x?: number, y?: number, movingDirectionIndex?: number, lookingDirectionIndex: number, deltaX: number, deltaY: number } {
        const position = this.p.getPosition();
        let nextX = position.x;
        let nextY = position.y;
        this.updateWalkSpeeds();
        if(this.walkSpeedX === 0 && this.walkSpeedY === 0) return { lookingDirectionIndex: this._lookingDirectionIndex, deltaX: 0, deltaY: 0 };
        let dX = 0;
        let dY = 0;
        if(this.x_traversedSoFar !== this.x_distanceToTraverse) {
            dX = delta * this.walkSpeedX;
            this.x_traversedSoFar += Math.abs(dX);
            if(this.x_traversedSoFar >= this.x_distanceToTraverse) {
                this.x_traversedSoFar = this.x_distanceToTraverse;
                nextX = this.moveToPosition.x;
            } else {
                nextX = position.x + dX;
            }
        } else {
          //  console.error('SETTING NEXT X TO THE MOVE TO POISITION.', this.moveToPosition.x);
            nextX = this.moveToPosition.x;
        }
        if(this.y_traversedSoFar !== this.y_distanceToTraverse) {
            dY = delta * this.walkSpeedY;
            this.y_traversedSoFar += Math.abs(dY);
            if(this.y_traversedSoFar >= this.y_distanceToTraverse) {
                this.y_traversedSoFar = this.y_distanceToTraverse;
                nextY = this.moveToPosition.y;
            } else {
                nextY = position.y + dY;
            }
        } else {
           // console.error('SETTING NEXT Y TO THE MOVE TO POISITION.', this.moveToPosition.y;)
            nextY = this.moveToPosition.y;
        }
        this.p.setPosition(nextX, nextY);
        const dirIdx = getMovementDataFromDeltas(dX, dY);
        this.lookingDirectionIndex = dirIdx;
    //    console.error('x to traverse:', this.x_distanceToTraverse);
     //   console.error('traversed so far:', this.x_traversedSoFar);

        if(nextX === this.moveToPosition.x && nextY === this.moveToPosition.y) {
            if(!this.reachedSpot) {
                this.reachedSpot = true;
                this.emit('reached-spot', { ...this.moveToPosition, direction: this.moveToDirection })
            }
            const nextMoveTo = this.positionQueue.shift();
            if(nextMoveTo) {
                this.moveTo(nextMoveTo.x, nextMoveTo.y, nextMoveTo.direction);
            } else {
                this.skeleton?.stop();
            }
        }
        this.skeleton?.update(delta*1000);
        return { x: nextX, y: nextY, movingDirectionIndex: dirIdx, lookingDirectionIndex: this._lookingDirectionIndex, deltaX: dX, deltaY: dY }
    }

    onRemoved(entity: Entity) {
        if(this.skeleton && !this.skeleton.baseTrack.stopped) {
            this.skeleton.stop();
        }
    }
}