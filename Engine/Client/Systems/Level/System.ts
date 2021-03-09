import Gotti, {ClientSystem} from "gotti";
import {MESSAGES, SYSTEMS} from "../../../Shared/Constants";
import {Position} from "../../../Shared/Components/Position";

const CAMERA_OFFSET_X = 3;
const CAMERA_OFFSET_Y = 20;
const LOG_EVERY = 1000;
export class LevelSystem extends ClientSystem {
    private clientPositionComponent : Position;
    private levelLink : any;
    constructor() {
        super(SYSTEMS.LEVEL);
    }
    onClear(): void {
    }
    onLocalMessage(message): void {
        switch(message.type) {
            case MESSAGES.CLIENT_PLAYER_ENTITY_INITIALIZED:
                this.clientPositionComponent  = this.globals.clientPlayer.getComponent(SYSTEMS.POSITION);
                this.globals.tileWorld.bindCameraCenter(this.clientPositionComponent.getPosition(), { x: CAMERA_OFFSET_X, y: CAMERA_OFFSET_Y });
                setTimeout(() => {
                    this.globals.fadeIn();
                }, 100);
                break;
        }
    }
    onServerMessage(message): any {}
    onStart() {}
    onEntityAddedComponent(entity: any, component) {}
    onEntityRemovedComponent(entity: any, component) {}
    update(delta: any): void {
        if(this.globals.tileWorld.loadedMap?.initialized && !this.globals.tileWorld.isLoading) {
            this.globals.tileWorld.update(delta);
        }
    }

    onPeerMessage(peerId: number | string, message): any {}
}