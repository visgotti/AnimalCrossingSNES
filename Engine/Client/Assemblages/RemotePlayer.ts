import {Entity} from "gotti";
import {EntityTypes, GameValues, PlayerActions, PlayerInput} from "../../Shared/types";
import {InputComponent} from "../Systems/Input/Component";
import {Position} from "../../Shared/Components/Position";
import {PlayerMovementComponent} from "../Systems/PlayerMovement/Component";

export class RemotePlayer extends Entity {
    public action : PlayerActions = 'idle';

    constructor() {
        super(1, EntityTypes.ClientPlayer);
    }

    initialize(data?: any): void {
        this.addComponent(new Position(data?.x, data?.y));
        this.addComponent(new PlayerMovementComponent(GameValues.PlayerSpeed));
    }
}