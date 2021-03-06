import {SYSTEMS} from "../../../Shared/Constants";
import {Component} from "gotti";
import {GridPathFinder} from "../../lib/Pathfinder";
export class PathfindingComponent extends Component {
    readonly pathfinder : GridPathFinder;
    constructor(pathfinder: GridPathFinder) {
        super(SYSTEMS.PATHFINDING);
        this.pathfinder = pathfinder
    }
}