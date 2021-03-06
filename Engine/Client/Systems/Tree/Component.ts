import {Component} from "gotti";
import {SYSTEMS} from "../../../Shared/Constants";

export class TreeComponent extends Component {
    readonly treeType : number;
    constructor(treeType: number) {
        super(SYSTEMS.TREE);
        this.treeType = treeType;
    }
}
