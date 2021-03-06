import {ClientSystem} from "gotti";
import {MESSAGES, SYSTEMS} from "../../../Shared/Constants";
import {ClientPlayer} from "../../Assemblages/ClientPlayer";

export class PlayerManagerSystem extends ClientSystem {
    constructor() {
        super(SYSTEMS.PLAYER_MANAGER)
    }

    onClear(): void {}
    async onStart() {
        this.createInitialClientPlayer();
    }
    private createInitialClientPlayer() {
        this.globals.clientPlayer = this.initializeEntity(new ClientPlayer(), this.globals.gameStateData);
        this.dispatchLocal({
            type: MESSAGES.CLIENT_PLAYER_ENTITY_INITIALIZED,
            data: this.globals.clientPlayer,
            to: [SYSTEMS.LEVEL, /*SYSTEMS.TREE,*/ SYSTEMS.GAME_STATE]
        });
    }

    onLocalMessage(message): void {
    }

    onPeerMessage(peerId: number | string, message): any {
    }

    onServerMessage(message): any {
    }

    update(delta: any): void {
    }
}