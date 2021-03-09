import {BugTypes, DroppedItemData, EntityTypes} from "../../Shared/types";
import {Entity} from "gotti";

import { Position } from "../../Shared/Components/Position";
import { BugMovementComponent } from "../Systems/BugMovementAndAnimation/Component";
import { BugSpawnComponent } from "../Systems/BugSpawn/Component";
import { ItemDropComponent } from "../Systems/ItemDrop/Component";

export type BugSpawnData = {
    type: BugTypes,
    speed: number,
    position: { x: number, y: number },
    angle: number,
    size: number,
    sprite: PIXI.Sprite,
    frames: Array<PIXI.Texture>,
}

export class Bug extends Entity {
    readonly bugType : BugTypes;
    public gameObject : any;
    constructor(id, type: BugTypes, gameObject: any) {
        super(id, EntityTypes.Bug)
        this.bugType = type;
        this.gameObject = gameObject;
        this.gameObject.entity = this;
    }
    initialize(data?: BugSpawnData) {
        this.addComponent(new Position(data.position.x, data.position.y));
        this.addComponent(new BugSpawnComponent());
        this.addComponent(new BugMovementComponent(data.sprite, data.frames));
        this.addComponent(new ItemDropComponent('', ''));
    }
}