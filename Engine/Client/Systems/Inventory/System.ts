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
import assert = require("assert");
import {GlobalGameData, ItemTypeInventoryActionLookup} from "../../../Shared/GameData";

class InventorySlot extends PIXI.Container {
    public bg : PIXI.Sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
    public itemSprite : PIXI.Sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
    public quantityText : PIXI.extras.BitmapText = new PIXI.extras.BitmapText('', { font: 'stroke-small'});
    public itemName : string = null;
    private _quantity : number = 0;
    constructor() {
        super();
        this.addChild(this.bg);
        this.addChild(this.itemSprite);
        this.addChild(this.quantityText)
    }

    set texture(t: PIXI.Texture) {
        this.itemSprite.texture = t;
        if(t) {
            if(t.width < this.bg.width) {
                this.itemSprite.x = (this.bg.width / 2) - (t.width / 2)
            } else {
                const diff = t.width - this.bg.width;
                this.itemSprite.x = diff/2;
            }
            if(t.height < this.bg.height) {
                this.itemSprite.y = (this.bg.height / 2) - (t.height / 2)
            } else {
                const diff = t.height - this.bg.height;
                this.itemSprite.y = diff/2;
            }
        }
    }

    get quantity() : number { return this._quantity }
    set quantity(v: number) {
        this._quantity = v || 0;
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
class ContextMenuOption extends PIXI.Container {
    readonly bg : PIXI.Sprite = new PIXI.Sprite();
    private bitmapText : PIXI.extras.BitmapText;
    callback : Function;
    constructor(option: string, callback: Function) {
        super();
        this.callback = callback;
        this.addChild(this.bg);
        this.bg.y -= 3;
        this.bg.x -= 2;
        this.bitmapText = new PIXI.extras.BitmapText(option, { font: 'stroke-small'});
        this.addChild(this.bitmapText)
    }
}
class ContextMenu extends PIXI.Container {
    readonly bg : PIXI.Sprite = new PIXI.Sprite();
    public options: Array<ContextMenuOption> = [];
    readonly selectedOptionTexture : PIXI.Texture;
    constructor(bgTexture: PIXI.Texture, selectedOptionTexture: PIXI.Texture) {
        super();
        this.selectedOptionTexture = selectedOptionTexture
        this.bg.texture = bgTexture;
        this.addChild(this.bg);
    }
    public clear() {
        this.visible = false;
        this.options.forEach(o => {
            o.destroy();
        });
        this.options.length = 0;
    }
    public setSelectedOption(index: number) {
        this.options.forEach((o, i) => {
            if(i === index) {
                o.bg.texture = this.selectedOptionTexture
            } else {
                o.bg.texture = PIXI.Texture.EMPTY;
            }
        });
    }
    public setOptions(options: Array<{ action: string, callback: Function }>) {
        this.clear();
        this.visible = true;
        const space = (this.bg.height-30) / options.length;
        this.options = options.map((o, i) => {
            const opt = new ContextMenuOption(o.action, o.callback);
            opt.y = (space * i) + 15;
            opt.x = 5;
            this.addChild(opt);
            return opt;
        });
    }
}


type PossibleActions = 'drop' | 'plant' | 'equip'

export class InventorySystem extends ClientSystem {
    private toolUi : PIXI.Container;

    private inventoryContainer : PIXI.Container = new PIXI.Container();
    private backgroundSprite : PIXI.Sprite;
    private selectedBackgroundTexture : PIXI.Texture;
    private inventoryTextures : InventoryTextures;
    private itemIconTextures : ItemTextures

    private inventorySlots : Array<InventorySlot> = [];
    private currentSelectedItemOptionIndex : number;
    private curSelectedIndex : number = 0;
    private clientPlayer : ClientPlayer;
    private itemContextMenu : ContextMenu;
    private timeSinceInventoryToggled : number = 1;
    private timeSinceInventoryAction : number = 1;

    private inventoryPointer : PIXI.Sprite = new PIXI.Sprite();
    private previousInput: PlayerInput;


    constructor() {
        super(SYSTEMS.INVENTORY);
        this.recenterInterface = this.recenterInterface.bind(this);
        this.inventoryContainer.visible = false;
    }

    get isOpen() : boolean {
        return this.inventoryContainer.visible;
    }

    public isInventoryOpen() : boolean {
        return this.inventoryContainer.visible;
    }

    get isItemMenuOpen() : boolean {
        return this.itemContextMenu.visible;
    }

    onClear(): void {
    }

    public addItem(itemName: string, quantity: number) : { success: boolean, error?: string } {
        if(quantity < 0) throw new Error(`Use positive values for addItem api, if you want to remove items use removeItem, also with a positive value.`)
        if(!this.clientPlayer) throw new Error(`No player initialized.`)

        let firstOpen = -1;
        for(let i = 0; i < this.inventorySlots.length; i++) {
            if(!this.inventorySlots[i].itemName && firstOpen < 0) {
                firstOpen = i;
            }
            if(this.inventorySlots[i].itemName === itemName) {
                const nextquantity = this.inventorySlots[i].quantity + quantity;
                const e : InventoryChangeEvent = { type: 'update', name: itemName, quantity };
                this.updateInventorySlot(i, itemName, nextquantity);
                this.globals.clientPlayer.emit(PLAYER_EVENTS.INVENTORY_CHANGE, e);
                this.assertInventoryStateSync();
                return { success: true };
            }
        }
        if(firstOpen > -1) {
            this.updateInventorySlot(firstOpen, itemName, quantity);
            const e : InventoryChangeEvent = { type: 'add', name: itemName, quantity, index: firstOpen };
            this.globals.clientPlayer.emit(PLAYER_EVENTS.INVENTORY_CHANGE, e);
            this.assertInventoryStateSync();
            return { success: true };
        }
        return { success: false, error: 'No room in inventory.' }
    }
    private assertInventoryStateSync(gameStateData?: GameStateData) {
        gameStateData = gameStateData || this.globals.clientPlayer.gameState
        let checked = [];
        for(let i = 0; i < gameStateData.inventory.length; i++) {
            const { index, name, quantity } = gameStateData.inventory[i];
            const { itemName: slotName, quantity: slotQuantity } = this.inventorySlots[index];
            if(slotName !== name) {
                console.error('Expected the slot name at index', index, 'to be equal to game state:', name, 'but it was:', slotName)
                assert.strictEqual(slotName, name);
            }
            if(slotQuantity !== quantity) {
                console.error('Expected the slot quantity at index', index, 'to be equal to game state:', quantity, 'but it was:', slotQuantity)
                assert.strictEqual(slotQuantity, quantity);
            }
            checked.push(index);
        }
        for(let i = 0; i < this.inventorySlots.length; i++) {
            if(!checked.includes(i)) {
                const { itemName, quantity } = this.inventorySlots[i];
                if(itemName !== null) {
                    console.error('Expected the slot name at index', i, 'to be equal to null because it was not in the game state but it was:', itemName)
                    assert.strictEqual(itemName, null);
                }
                if(itemName !== null) {
                    console.error('Expected the slot quantity at index', i, 'to be equal to 0 because it was not in the game state but it was:', quantity)
                    assert.strictEqual(quantity, 0);
                }
            }
        }
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
                    this.assertInventoryStateSync();
                    return { success: true }
                } else {
                    this.updateInventorySlot(i, itemName, nextQuantity);
                    const e : InventoryChangeEvent = { type: 'update', name: itemName, index: i, quantity: -quantity };
                    this.globals.clientPlayer.emit(PLAYER_EVENTS.INVENTORY_CHANGE, e);
                    this.assertInventoryStateSync();
                    return { success: true }
                }
            }
        }
        return { success: false, error: `Did not find the item: ${itemName} in player's inventory` }
    }

    private initInventoryFromGameState(gameState: GameStateData) {
        gameState.inventory.forEach(({ index, name, quantity }) => {
            this.updateInventorySlot(index, name, quantity);
        });
        this.assertInventoryStateSync(this.globals.gameStateData);
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
        this.itemIconTextures = this.globals.gameTextures.items.icons;
        this.inventoryPointer = new PIXI.Sprite();
        this.backgroundSprite = new PIXI.Sprite(this.inventoryTextures.background);
        this.inventoryContainer.addChild(this.backgroundSprite);
        const padX = 10;
        const slotW = (this.inventoryTextures.background.width - (padX*2)) / INVENTORY_COLUMNS;
        const slotH = this.inventoryTextures.background.height / INVENTORY_ROWS;
        for(let row = 0; row < INVENTORY_ROWS; row++) {
            for(let col = 0; col < INVENTORY_COLUMNS; col++) {
                const slot = new InventorySlot();
                slot.x = (col * slotW) + padX + 2; // extra 2 padding since the left side of the interface texture is kind of wonky.
                slot.y = row * slotH + 5;
                if(col === 0 || col === 7) {
                    slot.y += 6;
                }
                if(col === 1 || col === 6) {
                    slot.y += 3
                }
                if(row === 0) {
                    slot.y += 3;
                } else {
                    slot.y -= 3;
                }

                slot.bg.texture = this.inventoryTextures.item.emptyBackground;
                this.inventoryContainer.addChild(slot);
                this.inventorySlots.push(slot);
            }
        }
        const options = [];

        this.itemContextMenu = new ContextMenu(this.inventoryTextures.contextMenu.background, this.inventoryTextures.contextMenu.selectedBackground);
        this.inventoryContainer.addChild(this.itemContextMenu);
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
            this.inventorySlots[slotIndex].texture = PIXI.Texture.EMPTY;
            this.inventorySlots[slotIndex].quantity = 0;
            this.inventorySlots[slotIndex].itemName = null;
        }
    }

    public updateInventorySlot(slotIndex: number, itemName, totalQuantity) {
        this.removeInventorySlot(slotIndex);
        const slot = this.inventorySlots[slotIndex];
        slot.itemName = itemName;
        const texture = this.itemIconTextures[itemName];
        slot.texture = texture;
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
        this.inventoryPointer.x = this.inventorySlots[slotIndex].x + 5;
        const slotH = this.inventoryTextures.item.emptyBackground.height;
        this.inventoryPointer.y = this.inventorySlots[slotIndex].y + (slotH-2);
    }
    private toggleInventory(show: boolean) {
        this.inventoryContainer.visible = show;
        this.inventoryPointer.texture = this.inventoryTextures.item.pointer;
        this.inventoryPointer.visible = show;
        this.timeSinceInventoryToggled = 0;
        if(!show) {
            this.itemContextMenu.visible = false;
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

    get currentSelectedItemSlot() : InventorySlot {
        return this.inventorySlots[this.curSelectedIndex]
    }

    get currentSelectedItemData() : { globalData: GlobalItemData, inventoryData: InventoryItem } {
        const { itemName, quantity } = this.inventorySlots[this.curSelectedIndex];
        if(itemName) {
            return {
                globalData: GlobalGameData.items[itemName],
                inventoryData: { index: this.curSelectedIndex, name: itemName, quantity },
            }
        }
        return null;
    }

    private showItemOptions() : boolean {
        if(!this.currentSelectedItemData) return false;
        this.itemContextMenu.visible = true;
        this.itemContextMenu.x = this.currentSelectedItemSlot.x + this.currentSelectedItemSlot.bg.width - 3;
        this.itemContextMenu.y = this.currentSelectedItemSlot.y + (this.currentSelectedItemSlot.bg.height) - 10
        const type = this.currentSelectedItemData.globalData.type;
        const opts = ItemTypeInventoryActionLookup[type].map((o: PossibleActions) => {
            return {
                action: o,
                callback: () => {
                    if(o === 'equip') {
                        this.dispatchAllLocal({
                            type: MESSAGES.EQUIP_ITEM,
                            data: this.currentSelectedItemData.inventoryData.name
                        })
                    } else if (o === 'plant') {
                        if(!(this.$api.getFocusedHole())) {
                            console.error('no hole.')
                        } else {
                            console.error('DO PLANT')
                        }
                    } else if (o === 'drop') {
                        if(!(this.$api.dropItemFromPlayer(this.currentSelectedItemData.inventoryData.name))) {
                            console.error('CANT DROP.')
                        } else {
                            console.error('DROPT')
                        }
                    }
                }
            }
        });
        this.inventoryPointer.texture = this.inventoryTextures.contextMenu.pointer
        this.itemContextMenu.setOptions(opts);
        this.setCurrentSelectedItemOption(0);
        return true;
    }

    private hideItemOptions()  {
        this.itemContextMenu.clear();
        this.setSelectedItemSlot(this.curSelectedIndex)
    }
    private setCurrentSelectedItemOption(index: number) {
        this.currentSelectedItemOptionIndex = index;
        this.itemContextMenu.setSelectedOption(index);
        if(this.itemContextMenu.options[index]) {
            this.inventoryPointer.x = this.itemContextMenu.x - (this.inventoryPointer.width/2 + 7);
            this.inventoryPointer.y = this.itemContextMenu.y + this.itemContextMenu.options[index].y
        }
    }
    get currentSelectedItemOptionText() : string {
        if(this.itemContextMenu.visible) {
            // @ts-ignore
            return this.itemContextMenu.children[this.currentSelectedItemOptionIndex].children[1].text;
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
            if(this.currentSelectedItemOptionIndex === this.itemContextMenu.options.length-1) {
                this.setCurrentSelectedItemOption(0);
            } else {
                this.setCurrentSelectedItemOption(this.currentSelectedItemOptionIndex+1)
            }
        } else if(up) {
            if(this.currentSelectedItemOptionIndex === 0) {
                this.setCurrentSelectedItemOption(this.itemContextMenu.options.length-1);
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

    get curSelectedOptionCallback() : Function {
        if(this.itemContextMenu.visible && this.itemContextMenu.options[this.currentSelectedItemOptionIndex]) {
            return this.itemContextMenu.options[this.currentSelectedItemOptionIndex].callback;
        }
        return () => {};
    }
    update(delta: any): void {
        if(!this.$api.gameStateInitialized() || !this.clientPlayer) return;
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
                this.curSelectedOptionCallback();
                this.timeSinceInventoryAction = 0;
            } else if((moveDown && this.canDoInventoryInputAction('moveDown')) || (moveUp && this.canDoInventoryInputAction('moveUp'))) {
                this.doMoveSelectedItemOption(
                    moveUp && this.canDoInventoryInputAction('moveUp'),
                    moveDown && this.canDoInventoryInputAction('moveDown')
                );
                this.timeSinceInventoryAction = 0;
            } else if (cancel && this.canDoInventoryInputAction('cancel')) {
                this.hideItemOptions();
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