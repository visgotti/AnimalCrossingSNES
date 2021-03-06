import { AbstractInputSystem } from "./AbstractInputSystem";
import { Inventory } from "../Core/Inventory";
import {PixiElement} from "pixidom.js/lib";
export class KeyboardInputSystem extends AbstractInputSystem {
    constructor(inventory: Inventory) {
        super(inventory);
    }
    public registerItemSpriteEvents(itemElement : PixiElement, slotIndex: number, item: any) {
    }
    public registerTabElementEvents(tabElement, tabIndex: number) {
    }
    public registerEvents() {
    }
    public unregisterEvents() {
    }
}