import { AbstractInputSystem } from "./AbstractInputSystem";
import { Inventory } from "../Core/Inventory";
import {PixiElement} from "pixidom.js/lib";
export class MouseInputSystem extends AbstractInputSystem {
    private registeredDragItself : boolean = false;
    private listeningForMouseMove : boolean = false;
    constructor(inventory: Inventory) {
        super(inventory);
        this.handleDragMove = this.handleDragMove.bind(this);
        this.handleDragItemStart = this.handleDragItemStart.bind(this);
    }
    public registerItemSpriteEvents(itemElement : PixiElement, slotIndex: number, item: any) {
        itemElement.onMouseDown((e) => {
            let isRightClick = false;
            if('button' in e.data.originalEvent) {
                isRightClick = e.data.originalEvent.button == 2
            } else if ('which' in e.data.originalEvent) {
                isRightClick = e.data.originalEvent.which == 3;
            }
            if(isRightClick) {
                this.inventory.showContextMenu(slotIndex, e.data.originalEvent.clientX, e.data.originalEvent.clientY);
            } else {
                this.inventory.selectItem(slotIndex);
            }
        });
        itemElement.on('pointerover', () => {
            this.inventory.hoverItem(slotIndex);
        })
        itemElement.on('pointerout', () => {
            this.inventory.hoverItem(-1);
        })
        /*
        itemElement.onMouseOver(() => {
        });
        itemElement.onMouseOut(() => {
        });

         */
        itemElement.onMouseUp(() => {
            if(this.inventory.draggingItem && !this.registeredDragItself) {
                this.unregisterInventoryMove();
                this.registeredDragItself = false;
                this.inventory.endDragging();
            }
        });
        itemElement.onDoubleClick(() => {
            this.inventory.equipItem(slotIndex)
        });
        itemElement.onDragMove(() => {});
        itemElement.onDragStart(() => {
            if(!this.listeningForMouseMove) {
                this.registeredDragItself = true;
                this.inventory.startDragging(slotIndex);
                this.registerInventoryMove();
            }
        }, 0);
        itemElement.onDragEnd(() => {
            if(this.registeredDragItself) {
                this.unregisterInventoryMove();
                this.registeredDragItself = false;
                this.inventory.endDragging();
            }
        })
    }
    public registerTabElementEvents(tabElement : PixiElement, tabIndex: number) {
        tabElement.onMouseUp(() => {
            this.inventory.selectTab(tabIndex)
        });
        tabElement.onMouseDown(() => {
            this.inventory.pressTab(tabIndex)
        });
        tabElement.onMouseOver((e) => {
            const isDown = e.data.originalEvent.buttons === undefined
                ? e.data.originalEvent.which === 1
                : e.data.originalEvent.buttons === 1;
            this.inventory.hoverTab(tabIndex, isDown)
        });
        tabElement.onMouseOut(() => {
            this.inventory.defaultTab(tabIndex);
        });
    }
    private handleDragMove(e) {
        this.inventory.moveDragging(e.data.global.x, e.data.global.y, e.data.originalEvent.movementX, e.data.originalEvent.movementY);
    }
    private registerInventoryMove() {
        this.listeningForMouseMove = true;
        this.inventory.on('pointermove', this.handleDragMove);
    }
    private unregisterInventoryMove() {
        this.listeningForMouseMove = false;
        this.inventory.off('pointermove', this.handleDragMove);
    }

    private handleDragItemStart() {
        if(!this.registeredDragItself) {
            this.registerInventoryMove()
        }
    }

    public registerEvents() {
        let listenObj;
        if(typeof document !== 'undefined') {
            listenObj = document;
        } else if (typeof window !== 'undefined') {
            listenObj = window;
        }
        if(!listenObj) throw new Error(`No object to listen for mouse events.`);
        this.inventory.onDragItemStart(this.handleDragItemStart);
    }
    public unregisterEvents() {
        this.inventory.offDragItemStart(this.handleDragItemStart);
        if(this.listeningForMouseMove) {
            this.unregisterInventoryMove()
        }
    }
}