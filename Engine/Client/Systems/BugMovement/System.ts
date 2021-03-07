import {ClientSystem} from "gotti";
import {SYSTEMS} from "../../../Shared/Constants";
import {Bug} from "../../Assemblages/Bug";
import {BugMovementComponent} from "./Component";

export class BugMovementSystem extends ClientSystem {
    private bugs : Array<{ bug: Bug, movementComponent: BugMovementComponent }> = [];
    constructor() {
        super(SYSTEMS.BUG_MOVEMENT)
    }
    onClear(): void {
    }
    onLocalMessage(message): void {
    }

    onPeerMessage(peerId: number | string, message): any {
    }

    onServerMessage(message): any {
    }

    onEntityAddedComponent(entity: Bug, component : BugMovementComponent) {
        this.bugs.push({ bug: entity, movementComponent: component });
    }

    update(delta: any): void {
        this.bugs.forEach(({ bug, movementComponent }) => {
            movementComponent.updateMovement(delta);
        });
    }
}