import {Entity} from "gotti";
import {EntityTypes, GameStateData, GameValues, PlayerActions, PlayerInput} from "../../Shared/types";
import {InputComponent} from "../Systems/Input/Component";
import {PlayerMovementComponent} from "../Systems/PlayerMovement/Component";
import {Position} from "../../Shared/Components/Position";
import {PlayerAnimationComponent} from "../Systems/PlayerAnimation/Component";
import {PlayerActionComponent} from "../Systems/PlayerAction/Component";
import {InventoryComponent} from "../Systems/Inventory/Component";
import {GameStateComponent} from "../Systems/GameState/Component";
import { BugCatchComponent } from "../Systems/BugCatch/Component";

export class ClientPlayer extends Entity {
    public action : PlayerActions = 'idle';
    readonly playerInput : PlayerInput = {
        action: false,
        hotkeyIndex: -1,
        mouseX: 0,
        mouseY: 0,
        mouseDown: false,
        aimAngle: 0,
        moveUp: false,
        moveDown: false,
        moveLeft: false,
        moveRight: false,
        inventory: false,
        grab: false,
        sprint: false,
    };

    constructor() {
        super(1, EntityTypes.ClientPlayer);
    }

    initialize(data?: GameStateData): void {
        this.addComponent(new GameStateComponent(data))
        this.addComponent(new InputComponent(this.playerInput));
        this.addComponent(new Position(data.position.x, data.position.y));
        this.addComponent(new PlayerMovementComponent(GameValues.PlayerSpeed));
        this.addComponent(new PlayerAnimationComponent('player', 'default'));
        this.addComponent(new PlayerActionComponent());
        this.addComponent(new InventoryComponent());
        this.addComponent(new BugCatchComponent());
    }
}