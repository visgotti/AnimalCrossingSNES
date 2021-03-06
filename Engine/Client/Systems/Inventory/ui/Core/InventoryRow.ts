import { ItemSlot } from "./ItemSlot";
import { Inventory } from "./Inventory";
import {PixiElement} from "pixidom.js/lib";

export class InventoryRow extends PIXI.Container {
    inventory: Inventory;
    public rowIndex: number;
    public slotsItemData: Array<any> = [];
    public slotElements : Array<PixiElement> = [];
    isVisible: boolean = false;
    private _isClosing: boolean = false;
    constructor(inventory: Inventory, rowIndex) {
        super();
        this.inventory = inventory;
        this.rowIndex = rowIndex;
        this.slotsItemData = this.inventory.currentFocusedItemsData.slice(this.firstGlobalSlotIndex, this.lastGlobalSlotIndex+1)
        this.on('show', () => {
            if(this._isClosing) return;
            this.isVisible = true;
            if(!this.slotElements) {
                this.slotElements = new Array(this.inventory.itemsPerRow);
            }
            for(let i = 0; i < this.inventory.itemsPerRow; i++) {
                this.updateSlotSprite(i);
            }
        });
        this.on('hide', () => {
            if(this._isClosing) return;
            this.isVisible = false;
            this.slotElements.forEach(s => {
                s?.destroy && s.destroy();
            })
            this.slotElements = null;
        });
        this.handleInventoryTabSelected = this.handleInventoryTabSelected.bind(this);
        this.inventory.onTabSelected(this.handleInventoryTabSelected);
        const g = new PIXI.Graphics();
        g.lineStyle(1, 0xff0000, 1);
        g.beginFill(0x00ff00, 1);
        g.drawRect(1, 1, this.inventory.styleOpts.width-2, this.inventory.styleOpts.itemRowHeight);
        g.endFill();
        this.addChild(g);
    }

    public getSlotIndexFromPoint(p: { x: number, y: number }) : number {
        const global = this.getGlobalPosition();
        const rect = { x: global.x, y: global.y, w: this.width, h: this.height };
        if(p.x >= rect.x && p.x <= rect.x + rect.w && p.y >= rect.y && p.y <= rect.y + rect.h){
            for(let i = 0; i < this.slotElements.length; i++) {
                const slot = this.slotElements[i];
                const offsetX = p.x - rect.x;
                if(offsetX >= slot.x && offsetX <= slot.x + slot.width) {
                    return this.rowIndex * this.inventory.itemsPerRow + i;
                }
            }
        }
        return -1;
    }

    private handleInventoryTabSelected() {
        this.slotsItemData = this.inventory.currentFocusedItemsData.slice(this.firstGlobalSlotIndex, this.lastGlobalSlotIndex+1)
        if(this.isVisible) {
            this.slotsItemData.forEach((d, i) => this.updateSlotSprite(i));
        }
    }

    get firstGlobalSlotIndex() : number {
        return this.rowIndex * this.inventory.itemsPerRow;
    }

    get lastGlobalSlotIndex() : number {
        return this.firstGlobalSlotIndex + this.inventory.itemsPerRow - 1
    }

    public updateSlotSprite(relativeIndex: number, globalIndex=-1) {
        const itemData = this.slotsItemData[relativeIndex]
        globalIndex = (globalIndex < 0 || (!globalIndex && globalIndex !== 0)) ? this.rowIndex * this.inventory.itemsPerRow + relativeIndex : globalIndex;
        const log = globalIndex === 5;
        const slotElement = this.slotElements[relativeIndex] || new PixiElement;
        const previousItemPreview = slotElement?.children[0];
        let newItemPreview;
        if (globalIndex === this.inventory.draggingToIndex) {
            // @ts-ignore
            newItemPreview = this.inventory.getItemSlotElement(globalIndex, 'dragTo', ['hovered', 'default'], previousItemPreview)
        } else if(globalIndex === this.inventory.hoveredSlotIndex) {
            // @ts-ignore
            newItemPreview = this.inventory.getItemSlotElement(globalIndex, 'hovered', ['default'], previousItemPreview)
        } else if (globalIndex === this.inventory.selectedSlotIndex) {
            // @ts-ignore
            newItemPreview = this.inventory.getItemSlotElement(globalIndex, 'selected', ['hovered', 'default'], previousItemPreview)
        } else {
            // @ts-ignore
            newItemPreview = this.inventory.getItemSlotElement(globalIndex, 'default', [], previousItemPreview)
        }
        // if there was a previous item preview and the user did not return the same object for the new preview, make sure we remove it from the parent element.
        if(previousItemPreview && newItemPreview !== previousItemPreview) {
            previousItemPreview.parent?.removeChild(previousItemPreview);
        }
        if(newItemPreview.parent && newItemPreview.parent != slotElement) {
            throw new Error(`The returned item preview has a parent which is not the old slot element.. something is most likely wrong within the getItemPreview factory`)
        }
        if(!newItemPreview.parent) {
            slotElement.addChild(newItemPreview);
        }
        if(!slotElement['_registered_inventory_events']) {
            this.inventory.applyInputSystemsOnItem(slotElement, globalIndex, itemData);
            slotElement['_registered_inventory_events'] = true;
        }
        this.slotElements[relativeIndex] = slotElement;

        if(globalIndex !== this.inventory.draggingIndex) {
            slotElement.y = 0;
            slotElement.x = this.inventory.calculateSlotRowPosition(relativeIndex);
        }

        if(slotElement.parent && slotElement.parent !== this) {
            if(slotElement['_previousParent'] !== this) {
                throw new Error(`The returned slotElement had a parent that was not its parent row.. something is wrong inside updateSlot.`)
            }
            delete slotElement['_previousParent'];
            slotElement.parent.removeChild(slotElement);
        }
        if(!slotElement.parent) {
            this.addChild(slotElement);
        }
    }
    public onInventoryClose() {
        this._isClosing = true;
        this.inventory.offTabSelected(this.handleInventoryTabSelected);
        this.slotElements?.forEach(s => {
            s.parent?.removeChild(s);
        })
        this.slotElements = null;
        this.slotsItemData = null;
    }

    public updateSlotData(slotIndex: number, itemData: any) {
        this.slotsItemData[slotIndex] = itemData;
        if(!this.isVisible) return;
        this.updateSlotSprite(slotIndex);
    }
}