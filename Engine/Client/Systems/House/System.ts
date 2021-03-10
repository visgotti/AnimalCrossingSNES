import {ClientSystem} from "gotti";
import {SYSTEMS} from "../../../Shared/Constants";

export class HouseSystem extends ClientSystem {
    constructor() {
        super(SYSTEMS.HOUSE);
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