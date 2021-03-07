import {Entity} from "gotti";
import { TreeComponent } from "../Systems/Tree/Component";
import {Position} from "../../Shared/Components/Position";
import {FlowerComponent} from "../Systems/Flower/Component";
import {DroppedItemData, FlowerState, FlowerTypes, ItemTypes} from "../../Shared/types";



export type FlowerParams = {
    position: { x: number, y: number },
}
export class Flower extends Entity {
    private flowerComponent : FlowerComponent;
    readonly initializedState : DroppedItemData<FlowerState>;
    readonly flowerType : FlowerTypes;
    constructor(data: DroppedItemData<FlowerState>) {
        super(data.uid, ItemTypes.FLOWER);
        this.flowerType = data.name as FlowerTypes;
        this.initializedState = data;
    }
    initialize(type: FlowerTypes) {
        const { x, y, state } = this.initializedState
        this.addComponent(new Position(x, y));
        this.flowerComponent = new FlowerComponent(state);
        this.addComponent(this.flowerComponent);
    }
    get timeAlive() {
        return this.flowerComponent.timeAlive;
    }
}