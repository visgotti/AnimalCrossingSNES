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
import {SYSTEMS} from "../../Shared/Constants";

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
        cancel: false,
        escape: false,
    };

    private gameStateComponent : GameStateComponent;

    constructor() {
        super(1, EntityTypes.ClientPlayer);
    }

    get gameState() : GameStateData {
        if(!this.gameStateComponent) throw new Error(`Dont try to get the gameState from the client before its initialized.`)
        return this.gameStateComponent.data
    }

    initialize(data: GameStateData): void {
        this.gameStateComponent = new GameStateComponent(data)
        this.addComponent(this.gameStateComponent)
        this.addComponent(new InputComponent(this.playerInput));
        this.addComponent(new Position(data.position.x, data.position.y));
        this.addComponent(new PlayerMovementComponent(GameValues.PlayerSpeed));
        this.addComponent(new PlayerAnimationComponent('player'));
        this.addComponent(new PlayerActionComponent());
        this.addComponent(new InventoryComponent());
        this.addComponent(new BugCatchComponent());
    }
}