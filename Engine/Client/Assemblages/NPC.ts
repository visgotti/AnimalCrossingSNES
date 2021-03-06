import {Entity} from "gotti";
import {EntityTypes, GameValues, NPC_TYPES, PlayerActions, PlayerInput} from "../../Shared/types";
import {Position} from "../../Shared/Components/Position";
import {GridPathFinder} from "../lib/Pathfinder";
import { PathfindingComponent } from '../Systems/PathFinding/Component';
import {PlayerMovementComponent} from "../Systems/PlayerMovement/Component";
import {NPCMovementComponent} from "../Systems/NPCMovement/Component";
import {PlayerAnimationComponent} from "../Systems/PlayerAnimation/Component";
export class NPC extends Entity {
    public action : PlayerActions = 'idle';
    readonly npcType : NPC_TYPES;
    constructor(type: NPC_TYPES) {
        super(1, EntityTypes.NPC);
        this.npcType = type;
    }
    initialize(data: { x?: number, y?: number, speed?: number, pathfinder: GridPathFinder, playerType: 'default' | 'wife' }): void {
        this.addComponent(new Position(data?.x, data?.y));
        this.addComponent(new PathfindingComponent(data.pathfinder))
        this.addComponent(new NPCMovementComponent(100));
        this.addComponent(new PlayerAnimationComponent("player", data.playerType))
    }
}