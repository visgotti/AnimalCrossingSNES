import {Entity} from "gotti";
import { TreeComponent } from "../Systems/Tree/Component";
import {Position} from "../../Shared/Components/Position";

type TreeParams = {
    position: { x: number, y: number},
    treeTypeIndex: number,
}

export class Tree extends Entity {
    public treeTypeIndex : number;
    public shadowGameObject : any;
    public treeGameObject : any;
    constructor(treeSeq: number) {
        super(treeSeq, 'tree');
    }

    initialize(data: TreeParams) {
        this.addComponent(new Position(data.position.x, data.position.y));
        this.addComponent(new TreeComponent(data.treeTypeIndex));
    }
}