import {SYSTEMS} from "../../../Shared/Constants";

import {ClientSystem} from "gotti";
import {DialogueComponent} from './Component';
export class DialogueSystem extends ClientSystem {
    constructor() {
        super(SYSTEMS.DIALOGUE);
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