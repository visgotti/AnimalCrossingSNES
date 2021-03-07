import {BugTypes, DroppedItemData, EntityTypes} from "../../Shared/types";
import {Entity} from "gotti";

import { Position } from "../../Shared/Components/Position";
import { BugMovementComponent } from "../Systems/BugMovement/Component";
import { BugSpawnComponent } from "../Systems/BugSpawn/Component";
import { ItemDropComponent } from "../Systems/ItemDrop/Component";

export type BugSpawnData = {
    type: BugTypes,
    speed: number,
    position: { x: number, y: number },
    direction: string,
    size: number,
}

export class Bug extends Entity {
    readonly bugType : BugTypes;
    constructor(id, type: BugTypes) {
        super(id, EntityTypes.Bug)
        this.bugType = type;
    }
    initialize(data?: BugSpawnData) {
        this.addComponent(new Position(data.position.x, data.position.y));
        this.addComponent(new BugSpawnComponent());
        this.addComponent(new BugMovementComponent());
        this.addComponent(new ItemDropComponent('', ''));
    }
}