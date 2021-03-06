import { Inventory } from '../Core/Inventory';
import {PixiElement} from "pixidom.js/lib";
export abstract class AbstractInputSystem {
    readonly inventory : Inventory;
    constructor(inventory: Inventory) {
        this.inventory = inventory;
    }
    public abstract registerItemSpriteEvents(itemElement: PixiElement, slotIndex: number, item: any);
    public abstract registerTabElementEvents(tabElement: PixiElement, tabIndex: number);
    public abstract registerEvents();
    public abstract unregisterEvents();
}