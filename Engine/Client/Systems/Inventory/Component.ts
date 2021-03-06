import {Component} from "gotti";
import {SYSTEMS} from "../../../Shared/Constants";

export class InventoryComponent extends Component {
    private itemsByName: {[itemName: string]: number } = {};
    constructor() {
        super(SYSTEMS.INVENTORY);
    }

    public addItem(itemName: string, data?: any) : boolean {
        this.emit('added-item', { itemName, data });
        if(itemName in this.itemsByName) {
            this.itemsByName[itemName]++;
        } else {
            this.itemsByName[itemName] = 1;
        }
        return true;
    }
}