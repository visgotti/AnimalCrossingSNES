import {ClientSystem} from "gotti";
import {MESSAGES, SYSTEMS} from "../../../Shared/Constants";
import {ClientPlayer} from "../../Assemblages/ClientPlayer";
import {GameStateData, GameValues} from "../../../Shared/types";
import {START_POSITIONS} from "../../../Shared/GameData";
import {NPCMovementComponent} from "../NPCMovement/Component";
import assert = require("assert");

export class PlayerManagerSystem extends ClientSystem {
    constructor() {
        super(SYSTEMS.PLAYER_MANAGER)
    }

    onClear(): void {}
    async onStart() {
        this.initializePlayer(this.globals.gameStateData);
    }
    private initializePlayer(gameState: GameStateData) {
        this.globals.clientPlayer = this.initializeEntity(new ClientPlayer(), gameState);
        this.globals.clientPlayer.once('gameobject-ready', gameObject => {
            if(this.$api.needsTutorial()) {
                this.globals.clientPlayer.getComponent(SYSTEMS.PLAYER_MOVEMENT).disabled = true;
                this.globals.clientPlayer.addComponent(new NPCMovementComponent(GameValues.PlayerSpeed,this.globals.clientPlayer.getComponent(SYSTEMS.PLAYER_ANIMATION).skeleton))
            }
            this.dispatchAllLocal({
                type: MESSAGES.CLIENT_PLAYER_ENTITY_INITIALIZED,
                data: this.globals.clientPlayer,
            });
        });
    }

    onLocalMessage(message): void {
        switch(message.type) {
            case MESSAGES.FINISHED_TUTORIAL:
                this.globals.clientPlayer.getComponent(SYSTEMS.PLAYER_MOVEMENT).disabled = false;
                this.globals.clientPlayer.removeComponent(SYSTEMS.NPC_MOVEMENT);
                break;
        }
    }

    onPeerMessage(peerId: number | string, message): any {
    }

    onServerMessage(message): any {
    }

    update(delta: any): void {
    }
}