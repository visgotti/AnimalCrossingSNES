import {Component} from "gotti";
import {SYSTEMS} from "../../../Shared/Constants";

export class ItemDropComponent extends Component {
    readonly itemName: string;
    readonly itemData : any;
    constructor(itemName: string, itemData?: any) {
        super(SYSTEMS.ITEM_DROP);
        this.itemName = itemName;
        this.itemData = itemData;
    }
}