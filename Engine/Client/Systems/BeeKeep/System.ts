import {ClientSystem} from "gotti";
import {SYSTEMS} from "../../../Shared/Constants";

export class BeeKeepSystem extends ClientSystem {
    constructor() {
        super(SYSTEMS.BEE_KEEP)
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