import {ClientSystem} from "gotti";
import {MESSAGES, PLAYER_EVENTS, SYSTEMS} from "../../../Shared/Constants";
import {ClientPlayer} from "../../Assemblages/ClientPlayer";
import {InventoryComponent} from "./Component";
import {
    EntityTypes,
    GameStateData, GameTextures,
    GlobalItemData,
    InventoryItem,
    InventoryTextures, ItemTextures,
    PlayerInput
} from "../../../Shared/types";
import type = Mocha.utils.type;

class InventorySlot extends PIXI.Container {
    public bg : PIXI.Sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
    public itemSprite : PIXI.Sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
    public quantityText : PIXI.extras.BitmapText = new PIXI.extras.BitmapText('', { font: 'ns-small'});
    public itemName : string = null;
    private _quantity : number = 0;
    constructor() {
        super();
        this.addChild(this.bg);
        this.addChild(this.itemSprite);
        this.addChild(this.quantityText)
    }
    get quantity() : number { return this._quantity }
    set quantity(v: number) {
        if(v && v > 1) {
            this.quantityText.text = `${v}`
        } else {
            this.quantityText.text = '';
        }
    }
}
type InventoryChangeEvent = { type: 'add' | 'remove' | 'update', name : string, quantity: number, index?: number };

const INVENTORY_COLUMNS = 8;
const INVENTORY_ROWS = 2;

export class InventorySystem extends ClientSystem {
    private toolUi : PIXI.Container;

    private inventoryContainer : PIXI.Container = new PIXI.Container();
    private backgroundSprite : PIXI.Sprite;
    private selectedBackgroundTexture : PIXI.Texture;
    private inventoryTextures : InventoryTextures;
    private itemTextures : ItemTextures

    private inventorySlots : Array<InventorySlot> = [];
    private currentSelectedItemOptionIndex : number;
    private currentSelectedItemOptions : Array<string>;

    private curSelectedIndex : number = 0;
    private clientPlayer : ClientPlayer;
    private itemMenuContainer : PIXI.Container = new PIXI.Container();
    private timeSinceInventoryToggled : number = 1;
    private timeSinceInventoryAction : number = 1;

    private inventoryPointer : PIXI.Sprite = new PIXI.Sprite();
    private previousInput: PlayerInput;


    constructor() {
        super(SYSTEMS.INVENTORY);
        this.recenterInterface = this.recenterInterface.bind(this);
        this.inventoryContainer.visible = false;
        this.itemMenuContainer.visible = false;
    }

    get isOpen() : boolean {
        return this.inventoryContainer.visible;
    }

    public isInventoryOpen() : boolean {
        return this.inventoryContainer.visible;
    }

    get isItemMenuOpen() : boolean {
        return this.itemMenuContainer.visible;
    }

    onClear(): void {
    }

    public addItem(itemName: string, quantity: number) : { success: boolean, error?: string } {
        if(quantity < 0) throw new Error(`Use positive values for addItem api, if you want to remove items use removeItem, also with a positive value.`)
        if(!this.clientPlayer) throw new Error(`No player initialized.`)

        let firstOpen = -1;
        for(let i = 0; i < this.inventorySlots.length; i++) {
            if(!this.inventorySlots[i].itemName) {
                firstOpen = i;
            }
            if(this.inventorySlots[i].itemName === itemName) {
                const nextquantity = this.inventorySlots[i].quantity + quantity;
                const e : InventoryChangeEvent = { type: 'update', name: itemName, quantity };
                this.updateInventorySlot(i, itemName, nextquantity);
                this.globals.clientPlayer.emit(PLAYER_EVENTS.INVENTORY_CHANGE, e);
                return { success: true };
            }
        }
        if(firstOpen > -1) {
            this.updateInventorySlot(firstOpen, itemName, quantity);
            const e : InventoryChangeEvent = { type: 'add', name: itemName, quantity, index: firstOpen };
            this.globals.clientPlayer.emit(PLAYER_EVENTS.INVENTORY_CHANGE, e);
        }
        return { success: false, error: 'No room in inventory' }
    }

    public removeItem(itemName: string, quantity: number) : { success: boolean, error?: string } {
        if(quantity < 0) throw new Error(`Use positive values for removeItem api.`)
        if(!this.clientPlayer) throw new Error(`No player initialized.`)
        for(let i = 0; i < this.inventorySlots.length; i++) {
            if(this.inventorySlots[i].itemName === itemName) {
                const nextQuantity = this.inventorySlots[i].quantity - quantity;
                if(nextQuantity <= 0) {
                    this.removeInventorySlot(i);
                    const e : InventoryChangeEvent = { type: 'remove', name: itemName, index: i, quantity };
                    this.globals.clientPlayer.emit(PLAYER_EVENTS.INVENTORY_CHANGE, e);
                    return { success: true }
                } else {
                    this.updateInventorySlot(i, itemName, nextQuantity);
                    const e : InventoryChangeEvent = { type: 'update', name: itemName, index: i, quantity: -quantity };
                    this.globals.clientPlayer.emit(PLAYER_EVENTS.INVENTORY_CHANGE, e);
                    return { success: true }
                }
            }
        }
        return { success: false, error: 'No room in inventory' }
    }

    private initInventoryFromGameState(gameState: GameStateData) {
        gameState.inventory.forEach(({ index, name, quantity }) => {
            this.updateInventorySlot(index, name, quantity);
        });
    }

    onLocalMessage(message): void {
        switch(message.type) {
            case MESSAGES.CLIENT_PLAYER_ENTITY_INITIALIZED:
                this.clientPlayer = message.data;
                this.initInventoryFromGameState(this.clientPlayer.getComponent(SYSTEMS.GAME_STATE).data);
                break;
        }
    }

    onStart() {
        this.inventoryTextures = this.globals.gameTextures.inventory;
        this.itemTextures = this.globals.gameTextures.items;
        this.inventoryPointer = new PIXI.Sprite();
        this.backgroundSprite = new PIXI.Sprite(this.inventoryTextures.background);
        this.inventoryContainer.addChild(this.backgroundSprite);
        const slotW = this.inventoryTextures.background.width / INVENTORY_COLUMNS;
        const slotH = this.inventoryTextures.background.height / INVENTORY_ROWS;
        for(let row = 0; row < INVENTORY_ROWS; row++) {
            for(let col = 0; col < INVENTORY_COLUMNS; col++) {
                const slot = new InventorySlot();
                slot.x = col * slotW;
                slot.y = row * slotH;
                slot.bg.texture = this.inventoryTextures.item.emptyBackground;
                this.inventoryContainer.addChild(slot);
                this.inventorySlots.push(slot);
            }
        }
        const itemOptions = [{ name: 'Drop', handler: (itemName: string, quantity: number) => {
            this.removeItem(itemName, quantity);
           // this.$api.dropItemFromPlayer(itemName, quantity)
        }}];
        itemOptions.forEach(({ name, handler }, i) => {
            const c = new PIXI.Container();
            c.addChild(new PIXI.Sprite());
            c.addChild(new PIXI.extras.BitmapText(name, { font: 'ns-small'}));
            c['handler'] = handler;
            this.itemMenuContainer.addChild(c);
            c.y = i * this.inventoryTextures.contextMenu.selectedBackground.height;
        });
        this.inventoryContainer.addChild(this.itemMenuContainer);
        this.inventoryContainer.addChild(this.inventoryPointer);
        this.addApi(this.removeItem);
        this.addApi(this.addItem);
        this.addApi(this.isInventoryOpen);
        this.setSelectedItemSlot(0);
        this.globals.tileWorld.interfaceManager.addChild(this.inventoryContainer);

        this.recenterInterface();
        if(typeof window !== 'undefined') {
            window.addEventListener('resize', this.recenterInterface);
        } else if (typeof document !== 'undefined') {
            document.addEventListener('resize', this.recenterInterface);
        }
    }

    public removeInventorySlot(slotIndex: number) {
        if(this.inventorySlots[slotIndex].itemName) {
            this.inventorySlots[slotIndex].bg.texture = PIXI.Texture.EMPTY;
            this.inventorySlots[slotIndex].itemSprite.texture = PIXI.Texture.EMPTY;
            this.inventorySlots[slotIndex].quantity = 0;
            this.inventorySlots[slotIndex].itemName = null;
        }
    }

    public updateInventorySlot(slotIndex: number, itemName, totalQuantity) {
        this.removeInventorySlot(slotIndex);
        const slot = this.inventorySlots[slotIndex];
        slot.itemName = itemName;
        const texture = this.itemTextures[itemName];
        slot.itemSprite.texture = texture;
        slot.quantity = totalQuantity;
    }
    public setSelectedItemSlot(slotIndex : number) {
        this.inventorySlots[this.curSelectedIndex].bg.texture = this.inventoryTextures.item.emptyBackground;
        if(this.isItemMenuOpen) {
            this.hideItemOptions();
        }
        this.curSelectedIndex = slotIndex;
        this.inventorySlots[slotIndex].bg.texture = this.inventoryTextures.item.selectedBackground;
        this.inventoryPointer.texture =  this.inventoryTextures.item.pointer;
        this.inventoryPointer.x = this.inventorySlots[slotIndex].x
        const slotH = this.inventoryTextures.background.height / INVENTORY_ROWS;
        this.inventoryPointer.y = this.inventorySlots[slotIndex].y + (slotH-2);
    }
    private toggleInventory(show: boolean) {
        this.inventoryContainer.visible = show;
        this.inventoryPointer.texture = this.inventoryTextures.item.pointer;
        this.inventoryPointer.visible = show;
        this.timeSinceInventoryToggled = 0;
        if(!show) {
            this.itemMenuContainer.visible = false;
        }
    }
    onEntityAddedComponent(entity: any, component : InventoryComponent) {
        if(entity.type !== EntityTypes.ClientPlayer) {
            throw new Error('Only expected inventory component to be added to client player.')
        }
        //this.ui = new Inventory()
        entity.on('added-item', ({ itemName, data }) => {
            console.log('HANDLING ADD ITEM TO INVENTORY ', itemName, data)
        });
    }

    onPeerMessage(peerId: number | string, message): any {
    }

    onServerMessage(message): any {
    }

    get inventoryToggleIsCoolingDown() {
        return this.timeSinceInventoryToggled < .3;
    }
    get inventoryActionIsCoolingDown() {
        return (this.timeSinceInventoryAction < .3);
    }
    private canDoInventoryInputAction(inputKey: string) {
        return !this.inventoryToggleIsCoolingDown && (!this.inventoryActionIsCoolingDown || !this.previousInput[inputKey]);
    }

    private getValidMoveTo(input: PlayerInput) : number {
        const {
            moveUp,
            moveDown,
            moveLeft,
            moveRight } = input;
        if(moveUp || moveDown || moveLeft || moveRight) {
            // same behavior for moveUp/moveDown since theres only 2 columns...
            if((moveUp && this.canDoInventoryInputAction('moveUp')) || (moveDown && this.canDoInventoryInputAction('moveDown'))) {
                if(this.curSelectedIndex < INVENTORY_COLUMNS) {
                    return this.curSelectedIndex + INVENTORY_COLUMNS;
                } else {
                    return this.curSelectedIndex - INVENTORY_COLUMNS;
                }
            } else if (moveLeft && this.canDoInventoryInputAction('moveLeft')) {
                if(this.curSelectedIndex % INVENTORY_COLUMNS === 0) {
                    return this.curSelectedIndex + (INVENTORY_COLUMNS-1);
                } else {
                    return this.curSelectedIndex - 1;
                }
            } else if (moveRight && this.canDoInventoryInputAction('moveRight')) {
                if((this.curSelectedIndex+1) % INVENTORY_COLUMNS === 0) {
                    return this.curSelectedIndex - (INVENTORY_COLUMNS-1);
                } else {
                    return this.curSelectedIndex + 1;
                }
            }
        }
        return -1;
    }

    get currentSelectedItemData() : { globalData: GlobalItemData, inventoryData: InventoryItem } {
        const { itemName, quantity } = this.inventorySlots[this.curSelectedIndex];
        if(itemName) {
            return {
                globalData: this.globals.itemData[itemName],
                inventoryData: { index: this.curSelectedIndex, name: itemName, quantity },
            }
        }
        return null;
    }

    private showItemOptions() : boolean {
        if(!this.currentSelectedItemData) return false;
        this.itemMenuContainer.visible = true;
        this.setCurrentSelectedItemOption(0);
        return true;
    }
    private hideItemOptions()  {
        this.itemMenuContainer.visible = false;
        this.setSelectedItemSlot(this.curSelectedIndex)
    }
    private setCurrentSelectedItemOption(index: number) {
        this.currentSelectedItemOptionIndex = index;
        this.itemMenuContainer.children.forEach((c, i) => {
            if(i === index) {
                this.inventoryPointer.texture =  this.inventoryTextures.contextMenu.pointer;
                this.inventoryPointer.x = this.itemMenuContainer.x - this.inventoryPointer.width - 2;
                // @ts-ignore
                c.children[0].texture = i === index ? this.inventoryTextures.contextMenu.selectedBackground : null;
            }
        });
    }
    get currentSelectedItemOptionText() : string {
        if(this.itemMenuContainer.visible) {
            // @ts-ignore
            return this.itemMenuContainer.children[this.currentSelectedItemOptionIndex].children[1].text;
        }
        return null;
    }

    private recenterInterface() {
        /*
        const { ratioW, ratioH } = this.globals.tileWorld.playerCamera;
        const centerX = (window.innerWidth / 2) - ((this.inventoryTextures.background.width / ratioW)/2);
        const centerY = (window.innerHeight / 2) - ((this.inventoryTextures.background.height / ratioH)/2);
        const { x, y } = this.globals.tileWorld.playerCamera.screenToWorld(centerX, centerY)
        this.inventoryContainer.x = x-this.globals.tileWorld.playerCamera.playerViewRect.x;
        this.inventoryContainer.y = y-this.globals.tileWorld.playerCamera.playerViewRect.y;

         */
        const screenWidth = this.globals.renderer.screen.width;
        const screenHeight = this.globals.renderer.screen.height;
        this.inventoryContainer.x  = (screenWidth / 2) - (this.inventoryTextures.background.width/2);
        this.inventoryContainer.y  = (screenHeight/2) - (this.inventoryTextures.background.height/2);
    }

    private doMoveSelectedItemOption(up?: boolean, down?: boolean) {
        if(down) {
            if(this.currentSelectedItemOptionIndex === this.currentSelectedItemOptions.length-1) {
                this.setCurrentSelectedItemOption(0);
            } else {
                this.setCurrentSelectedItemOption(this.currentSelectedItemOptionIndex+1)
            }
        } else if(up) {
            if(this.currentSelectedItemOptionIndex === 0) {
                this.setCurrentSelectedItemOption(this.currentSelectedItemOptions.length-1);
            } else {
                this.setCurrentSelectedItemOption(this.currentSelectedItemOptionIndex+1)
            }
        }
    }

    onStop() {
        if(typeof window !== 'undefined') {
            window.removeEventListener('resize', this.recenterInterface);
        } else if (typeof document !== 'undefined') {
            document.removeEventListener('resize', this.recenterInterface);
        }
    }
    public doCurrentSelectedItemOption() {
    }
    update(delta: any): void {
        if(!this.clientPlayer) return;
        const {
            inventory, grab, moveDown, moveUp, cancel, escape
        } = this.clientPlayer.playerInput;
        this.timeSinceInventoryToggled+=delta;
        if(inventory && !this.inventoryToggleIsCoolingDown) {
            this.toggleInventory(!this.isOpen);
        }
        this.timeSinceInventoryAction += delta;
        if(this.isItemMenuOpen) {
            if(grab && this.canDoInventoryInputAction('grab')) {
                this.doCurrentSelectedItemOption();
                this.timeSinceInventoryAction = 0;
            } else if((moveDown && this.canDoInventoryInputAction('moveDown')) || (moveUp && this.canDoInventoryInputAction('moveUp'))) {
                this.doMoveSelectedItemOption(
                    moveUp && this.canDoInventoryInputAction('moveUp'),
                    moveDown && this.canDoInventoryInputAction('moveDown')
                );
                this.timeSinceInventoryAction = 0;
            } else if (cancel && this.canDoInventoryInputAction('cancel')) {
                this.itemMenuContainer.visible = false;
                this.timeSinceInventoryAction = 0;
            }
        } else if (this.isOpen) {
            const moveTo = this.getValidMoveTo(this.clientPlayer.playerInput);
            if(moveTo > -1) {
                this.setSelectedItemSlot(moveTo);
                this.timeSinceInventoryAction = 0;
            } else if (grab && this.canDoInventoryInputAction('grab')) {
                const showed = this.showItemOptions();
                if(showed) this.timeSinceInventoryAction = 0;
            } else if (cancel && this.canDoInventoryInputAction('cancel')) {
                this.toggleInventory(false);
                this.timeSinceInventoryAction = 0;
            }
        }
        this.previousInput = { ...this.clientPlayer.playerInput }
    }
}