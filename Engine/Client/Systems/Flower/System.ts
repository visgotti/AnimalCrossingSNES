import {ClientSystem} from "gotti";
import {COLLIDER_TAGS, MESSAGES, SYSTEMS} from "../../../Shared/Constants";

export class FlowerSystem extends ClientSystem{
    private playerFlowCollisionPlugin;
    private possiblePickupableFlowers : Array<any>
    constructor() {
        super(SYSTEMS.FLOWER)
        const handleCol = (colA, colB) => {
            const player = colA.gameObject.entity;
            const flower = colB.gameObject.entity;
            this.possiblePickupableFlowers.push(flower);
        }
        this.playerFlowCollisionPlugin = {
            type: 'collision',
            name: 'flower',
            tagAs: [COLLIDER_TAGS.client_player],
            tagBs: [COLLIDER_TAGS.flower],
            onCollisionStart: () => {},
            onCollision: () => {},
        }
    }
    onClear(): void {
    }
    private handleInitializedClientPlayer() {
        this.globals.clientPlayer.on('action', ({ actionName }) => {
            if(actionName === 'shovel') {
            }
        })
    }
    onLocalMessage(message): void {
        switch(message.type) {
            case MESSAGES.CLIENT_PLAYER_ENTITY_INITIALIZED:
                this.handleInitializedClientPlayer();
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