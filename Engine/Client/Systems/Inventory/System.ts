import {ClientSystem} from "gotti";
import {MESSAGES, SYSTEMS} from "../../../Shared/Constants";
import {ClientPlayer} from "../../Assemblages/ClientPlayer";
import {InventoryComponent} from "./Component";
import {EntityTypes} from "../../../Shared/types";
import {InventoryUI} from "./ui";

export class InventorySystem extends ClientSystem {
    private ui: InventoryUI;
    private toolUi : PIXI.Container;
    constructor() {
        super(SYSTEMS.INVENTORY);
    }
    onClear(): void {
    }

    onLocalMessage(message): void {
        switch(message.type) {
            case MESSAGES.CLIENT_PLAYER_ENTITY_INITIALIZED:
                this.globals.clientPlayer.on('skeleton-ready')
        }
    }


    onStart() {
    }


    onEntityAddedComponent(entity: any, component : InventoryComponent) {
        if(entity.type !== EntityTypes.ClientPlayer) {
            throw new Error('Only expected inventory component to be added to client player.')
        }
        //this.ui = new Inventory()
        entity.on('added-item', ({ itemName, data }) => {
            console.log('HANDLING ADD ITEM TO INVENTORY ', itemName, data)
        });
    }

    onPeerMessage(peerId: number | string, message): any {
    }

    onServerMessage(message): any {
    }

    update(delta: any): void {
    }

}