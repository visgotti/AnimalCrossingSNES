import {COLLIDER_TAGS, SYSTEMS} from "../../../Shared/Constants";
import {ClientSystem} from "gotti";
import {GridPathFinder} from "../../lib/Pathfinder";
import {resolveColliderType} from "../../lib/Gottimation/utils";

export class PathfindingSystem extends ClientSystem {
    private pathfindingPlugin : any;
    private pathfinder : GridPathFinder;
    private isInitialized : boolean = false;
    constructor() {
        super(SYSTEMS.PATHFINDING);
        this.pathfindingPlugin = {
            name: 'pathfinding',
            type: 'collision',
            tagAs: [COLLIDER_TAGS.blocking],
            onAddedColliderWithTagA: (collider) => {
                switch(resolveColliderType(collider.shapeData)) {
                    case "polygon":
                        this.globals.pathfinder.toggleBlockingPolygon(collider.shapeData, true);
                        break;
                    case "rect":
                        this.globals.pathfinder.toggleBlockingRect(collider.shapeData, true);
                        break;
                }
            },
        }
    }

    onEntityAddedComponent(entity: any, component) {
    }

    onInit() {
        this.globals.tileWorld.use(this.pathfindingPlugin);
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