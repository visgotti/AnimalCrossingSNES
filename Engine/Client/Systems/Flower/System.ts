import {ClientSystem} from "gotti";
import {SYSTEMS} from "../../../Shared/Constants";

export class FlowerSystem extends ClientSystem{
    constructor() {
        super(SYSTEMS.BUG_SPAWN)
    }
    onClear(): void {
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