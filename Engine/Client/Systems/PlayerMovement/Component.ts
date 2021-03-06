import {Component} from "gotti";
import {SYSTEMS} from "../../../Shared/Constants";

import {EntityTypes} from "../../../Shared/types";
export class PlayerMovementComponent extends Component {
    public speed : number;
    public lookingDirection :  'north' | 'south' | 'east' | 'west' = 'south'
    private velocityX: number = 0;
    private velocityY: number = 0;
    private previous: string;
    constructor(speed : number) {
        super(SYSTEMS.PLAYER_MOVEMENT);
        this.speed = speed;
    }
    onAdded(entity) {
    }
    get isSprinting() {
        return Math.abs(this.velocityX) > this.speed || Math.abs(this.velocityY) > this.speed;
    }
    public setVelocities(x: number, y: number) {
        this.velocityX = x;
        this.velocityY = y;
    }
    get movingDirection() : 'north' | 'south' | 'east' | 'west' {
        if(this.velocityX != 0) {
            if(this.velocityX > 0) return 'east';
            return 'west';
        } else if(this.velocityY != 0) {
            if(this.velocityY > 0) return 'south';
            return 'north';
        }
        return null;
    }
}