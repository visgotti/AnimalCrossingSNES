import {Entity} from "gotti";
import {EntityTypes} from "../../Shared/types";
import { ItemDropComponent } from "../Systems/ItemDrop/Component";

export class DroppedItem extends Entity {
    public gameObject : any;
    public destroyTimeout: any;
    constructor(droppedItemSeq: number) {
        super(droppedItemSeq, EntityTypes.DroppedItem);
    }
    initialize(data?: { gameObject: any, itemName: string, data: any }): void {
        this.gameObject = data.gameObject;
        this.gameObject.entity = this;
        this.addComponent(new ItemDropComponent(data.itemName))
    }
}
