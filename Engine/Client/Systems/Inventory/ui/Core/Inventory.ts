import {InventoryRow} from "./InventoryRow";
import {ScrollList,PixiElement} from "pixidom.js/lib";
import {AbstractInputSystem} from "../Input/AbstractInputSystem";
import {MouseInputSystem} from "../Input/MouseInputSystem";
import {KeyboardInputSystem} from "../Input/KeyboardInputSystem";
import {ControllerInputSystem} from "../Input/ControllerKeyboardSystem";
import {TouchInputSystem} from "../Input/TouchKeyboardSystem";
import {TabLabel, TabStyleHandlers} from "./TabLabel";
import {ContextMenu} from "./ContextMenu";
import defineProperty = Reflect.defineProperty;

export type ItemCallback = (ItemCallbackParams) => void;

export type DragEndItemCallbackParams = ItemCallbackParams & { result : DragEndResult }
export type ItemDragEndCallback = (DragEndItemCallbackParams) => void;
export type ItemDragMoveCallback = (payload: { dragging: ItemCallbackParams, dragTo?: ItemCallbackParams, mouseX: number, mouseY: number, movementX: number, movementY: number }) => void;

type ItemSpriteCallback = (item: any) => PIXI.Sprite | PIXI.Container;

type DragEndResult = 'swap' | 'outside' | 'close'

export type InventoryStyleOptions = {
    itemContainerFactories: ItemSlotContainerFactories,
    width?: number,
    height?: number,
    maxSlots?: number,
    autoResize?: boolean,
    itemPadding?: number,
    itemsPerRow?: number,
    itemRowHeight?: number,
}

export type ItemCallbackParams = {
    inventory: Inventory,
    item: any,
    slotIndex: number,
    slotSprite: PIXI.Container | PIXI.Sprite;
    isSelected: boolean,
    category?: string,
}

type ItemSlotContainerFactories = {
    default: (ItemCallbackParams) => PIXI.Container,
    selected?: (ItemCallbackParams) => PIXI.Container,
    hovered?: (ItemCallbackParams) => PIXI.Container,
    dragTo?: (ItemCallbackParams) => PIXI.Container,
    pressed?: (ItemCallbackParams) => PIXI.Container,
    options?: (ItemSlotContainerFactoryParams) => PIXI.Container,
}

type TabLayoutOption = {
    name: string,
    children?: Array<TabLayoutOption>,
    focusedDisplayContainer: () => PIXI.Container,
    tabLabelContainer: TabStyleHandlers
}

type InventoryLayoutOptions = {
    tabs: Array<TabLayoutOption>
}


const DefaultInventoryLayoutOpts = () => {
    return {
        tabs: [],
    }
}
const DefaultInventoryStyleOpts = () => {
    let defaultWidth;
    let defaultHeight;
    if(typeof window !== 'undefined') {
        defaultWidth = window.innerWidth / 2;
        defaultHeight = window.innerHeight / 2;
    } else {
        defaultHeight = 500;
        defaultWidth = 900;
    }
    return {
        maxSlots: 100,
        width: defaultWidth,
        height: defaultHeight,
        autoResize: true,
        itemPadding: 0,
        itemsPerRow: 5,
        itemRowHeight: 20,
    }
}

const mergeOpts = (defaultOpts: {[key: string]: any }, userOpts?: {[key: string]: any }, requiredUserOpts?: Array<string>) : {[key: string]: any } => {
    if(!userOpts) {
        if(requiredUserOpts && requiredUserOpts.length) {
            throw new Error(`No user props were supplied but we required opts: ${requiredUserOpts}`);
        }
        return defaultOpts;
    }
    for(let key in defaultOpts) {
        if(key in userOpts) {
            defaultOpts[key] = userOpts[key]
        }
    }
    if(requiredUserOpts) {
        requiredUserOpts.forEach(opt => {
            if(opt.includes('.')) {
                const split = opt.split('.');
                let userObj = userOpts;
                for(let i = 0; i < split.length; i++) {
                    userObj = userObj[split[i]];
                    if(!userObj) break;
                }
                if(!userObj) {
                    throw new Error(`Expecting a value at the property path ${split.join(':')}`);
                }
                defaultOpts[split[0]] = userOpts[split[0]];
            } else {
                if(!(opt in userOpts)) {
                    throw new Error(`Expected opt: ${opt} to be provided`)
                }
                defaultOpts[opt] = userOpts[opt];
            }
        })
    }
    return defaultOpts;
}

export type InventoryInputOptions = {
    mouse: boolean,
    keyboard: boolean,
    controller: boolean,
    touch: boolean,
}

const DefaultInventoryInputOptions = () => {
    return {
        mouse: true,
        keyboard: true,
        controller: false,
        touch: false,
    }
}

export type InventoryOpts = {
    styleOpts?: InventoryStyleOptions,
    layoutOpts?: InventoryLayoutOptions,
    inputOpts?: InventoryInputOptions,
}

export type InventoryState = Array<any> | {[category: string]: Array<any> };
type SelectedItemCallback = (payload : { current: ItemCallbackParams, previous: ItemCallbackParams }) => void

export class Inventory extends PIXI.Container {
    readonly __dragMoveHandlers: Array<ItemDragMoveCallback> = []
    readonly _selectedTabListeners: Array<(string) => void> = [];
    readonly _selectedItemListeners: Array<SelectedItemCallback> = [];
    readonly _equippedItemListeners: Array<ItemCallback> = [];
    readonly _itemAddedListeners: Array<ItemCallback> = [];
    readonly _itemRemovedListeners: Array<ItemCallback> = [];
    readonly _openedInventoryListeners: Array<()=>void> = [];
    readonly _closedInventoryListeners: Array<()=>void> = [];
    readonly _swappedSlotListeners: Array<(item1: any, item2: any, item1NewSlotIndex: number, item2NewSlotIndex: number) => void> =[];
    readonly _dragEndHandlers  : Array<ItemDragEndCallback> = [];
    readonly _dragStartHandlers : Array<ItemCallback> = [];
    readonly computedValues: {[name: string]: any} = {};
    private hoveredTab: TabLabel;
    private pressedTab: TabLabel;
    public selectedTab: TabLabel;

    public hoveredSlotIndex : number;

    public currentSelectedSlotIndex: number;
    public itemsSlots: Array<any> = [];
    public styleOpts: InventoryStyleOptions;
    public layoutOpts: InventoryLayoutOptions;
    public inputOpts: InventoryInputOptions;
    public rows: Array<InventoryRow>;

    public slotItemDataByTab : {[tab: string]: Array<any> } = {};

    draggingIndex: number = -1;
    draggingToIndex : number = -1;
    private _selectedSlotIndex : number = -1;

    private cachedRowSlotCalculations: {[slotIndex: number]: number} = {};
    private scrollList : ScrollList;
    private tabContainer : PIXI.Container;
    private tabLabels: Array<TabLabel> = [];

    private inputSystems : Array<AbstractInputSystem> = [];

    public state : InventoryState;
    public selectedItemIndexByCategory : {[tab: string]: number } = {};

    public closedWithTabIndex : number = -1;
    public closedWithSelectedItem : number = -1;

    private contextMenu : ContextMenu;

    constructor(state: InventoryState, opts: InventoryOpts = {}) {
        super()
        opts = opts || {};
        const { styleOpts, layoutOpts, inputOpts } = opts
        this.styleOpts = mergeOpts(DefaultInventoryStyleOpts(), styleOpts, ['itemContainerFactories.default']) as InventoryStyleOptions;
        this.layoutOpts = mergeOpts(DefaultInventoryLayoutOpts(), layoutOpts) as InventoryLayoutOptions;
        this.inputOpts = mergeOpts(DefaultInventoryInputOptions(), inputOpts) as InventoryInputOptions;
        this.validateState(state);
        this.state = state;
        this.interactive = true;
        this.interactiveChildren = true;
        this.visible = false;
        if(this.usingCategoryTabs) {
            this.closedWithTabIndex = 0;
        }
    }

    /*
    TODO: probably a useful idea but eh not worth messing around with any longer for now.
    public addComputedValue(name: string, computation: (items: Array<any>) => any) {
        const allItems = () => {
            let finalArray = [];
            if(this.usingCategoryTabs) {
                this.layoutOpts.tabs.forEach(t => {
                    finalArray = [...finalArray, ...this.state[t.name]]
                });
            } else {
                return [...this.state as Array<any>];
            }
        }
        defineProperty(this.computedValues, name, {
            get(): any {
                const items = allItems();
                return computation(items)
            }
        })
    }
       */

    public showContextMenu(slotIndex: number, eventX: number, eventY: number) {
        if(!this.visible || !this.contextMenu) return;
        this.contextMenu.parent?.removeChild(this.contextMenu);
        this.addChild(this.contextMenu);
        this.clearContextMenu();
        this.contextMenu.visible = true;
        const factory = this.styleOpts.itemContainerFactories.options;
        if(factory) {
            const { rowIndex, slotIndex: relativeSlotIndex } = this.relativeRowIndexesForSlotIndex(slotIndex);
            if(!this.rows[rowIndex]) {
                this.clearContextMenu();
                return;
            }
            const item = factory(this.getSlotItemCallbackParams(slotIndex));
            if(!item) {
                this.clearContextMenu();
                return;
            }
            this.contextMenu.addChild(item);
            this.contextMenu.x = eventX - this.x;
            this.contextMenu.y = eventY - this.y;
        } else {
            this.clearContextMenu();
        }
    }

    public clearContextMenu() {
        if(!this.visible) return;
        if(!this.contextMenu) return;
        this.contextMenu.clear();
        this.contextMenu.visible = false;
    }

    public open(state?: InventoryState) {
        if(this.visible) return;
        this.contextMenu = new ContextMenu();
        this.addChild(this.contextMenu);
        this.visible = true;
        this.tabContainer = new PIXI.Container();
        if(state) {
            this.validateState(state);
            this.state = state;
        }
        this.applyInputOpts();
        this.initializeCategories();
        let selectTabIndex = -1;

        if(this.usingCategoryTabs) {
            selectTabIndex = this.closedWithTabIndex > -1 ? this.closedWithTabIndex : 0;
        }

        selectTabIndex > -1 && this.selectTab(selectTabIndex);

        this.makeNeededRows();
        this.addChild(this.tabContainer);
        // @ts-ignore
        this.scrollList = new ScrollList({ width: this.styleOpts.width, height: this.styleOpts.height });
        this.scrollList.addScrollItems(this.rows);
        this.addChild(this.scrollList);
        this.scrollList.y = this.tabContainer.height;
        if(this.closedWithSelectedItem > -1) {
            this.selectItem(this.closedWithSelectedItem)
        }
        this.emit('opened');
        this._openedInventoryListeners.forEach(l => l());
    }

    private updateSlotStyle(globalIndex: number) {
        if(globalIndex < -1) return;
        const { rowIndex, slotIndex } = this.relativeRowIndexesForSlotIndex(globalIndex);
        this.rows[rowIndex].updateSlotSprite(slotIndex, globalIndex);
    }

    public close() {
        if(this.contextMenu) {
            this.clearContextMenu();
            this.contextMenu.destroy();
            this.contextMenu = null;
        }
        this.draggingIndex > -1 && this.endDragging(true)
        this.draggingToIndex = -1;
        if(this.usingCategoryTabs) {
            this.closedWithTabIndex = this.tabLabels.indexOf(this.selectedTab);
        }
        this.closedWithSelectedItem = this.selectedSlotIndex;
        this.removeInputOpts();

        this.scrollList.spliceScrollItems(0, -1, true);
        this.scrollList.destroy();
        this.scrollList = null;
        this.rows.forEach(r => r.onInventoryClose());
        this.rows.length = 0;
        this.rows = null;
        this.tabContainer.destroy({ children: true });
        this.tabContainer = null;
        this.tabLabels.length = 0;
        this.visible = false;

        this.hoveredSlotIndex = -1;
        this.hoveredTab = null;
        this.selectedTab = null;
        this._selectedSlotIndex = -1;

        this.emit('closed');
        this._closedInventoryListeners.forEach(l => l());
        this.cachedRowSlotCalculations = {};
    }

    private validateState(state : InventoryState) {
        if(this.usingCategoryTabs) {
            if(Array.isArray(state)) {
                throw new Error(`Inventory state was passed in as an array but when using category tabs the state must be in the shape of {[category: string]: Array<itemData>}`)
            }
            const stateKeys = Object.keys(state).sort().join(', ');
            const categories = this.layoutOpts.tabs.map(t => t.name).sort().join(', ');
            if(stateKeys !== categories) {
                throw new Error(`The item state keys: ${stateKeys} do not match up with the categories: ${categories}`)
            }
        } else {
            if(!Array.isArray(state)) {
                throw new Error(`Inventory state is expecting an array of item data when you are not using categories.`)
            }
        }
    }

    get selectedTabIndex() : number {
        if(!this.usingCategoryTabs) return -1;
        return this.layoutOpts.tabs.indexOf(this.layoutOpts.tabs.find(t => t.name == this.lastUsedCategoryName));
    }

    public applyInputSystemsOnItem(itemElement: PixiElement, itemIndex: number, itemData: any) {
        this.inputSystems.forEach(s => {
            s.registerItemSpriteEvents(itemElement, itemIndex, itemData);
        })
    }

    get currentFocusedItemsDataAfterFilter() : Array<any> {
        return this.currentFocusedItemsData.map(i => {
            if(i === null || i === undefined) return null;
            return this.itemFitsFilter(i) ? null : i;
        }).sort((a, b) => {
            if(a === null || b === null) {
                if(a === null) return -1;
                if(b === null) return 1;
            }
            return 0;
        });
    }

    private itemFitsFilter(item: any) : boolean {
        return true;
    }
    get currentFocusedItemsData() : Array<any> {
        if(this.usingCategoryTabs) {
            const tab = this.layoutOpts.tabs[this.selectedTabIndex];
            if(tab) {
                return this.state[tab.name];
            }
        } else {
            return this.state as unknown as Array<any>
        }
    }
    get itemsPerRow() : number {
        return this.styleOpts.itemsPerRow;
    }
    get maxSlots() : number {
        return this.styleOpts.maxSlots;
    }
    get maxItemWidth() : number {
        return Math.floor(this.styleOpts.width / this.itemsPerRow);
    }

    public getNextOpenSlotIndex(category?: number) : number {
        const array = category ? this.state[category] : this.currentFocusedItemsData;
        for(let i = 0; i < array.length; i++) {
            if(array[i] === null) {
                return i;
            }
        }
        return -1;
    }

    get lastUsedCategoryName() : string {
        if(!this.usingCategoryTabs) return null;
        if(this.visible) {
            if(this.selectedTab) return this.selectedTab.category;
        }
        return this.layoutOpts.tabs[this.closedWithTabIndex].name;
    }

    public addItem(item, slotIndex, category?: string) {
        let slotArray : Array<any>;
        if(this.usingCategoryTabs) {
            category = (category !== null && category !== undefined) ? category : this.lastUsedCategoryName;
            if(!(category in this.state)) throw new Error(`Invalid category provided: ${category}`);
            slotArray = this.state[category]
        } else {
            slotArray = this.state as unknown as Array<any>;
        }
        if(slotArray[slotIndex]) {
            throw new Error(`Already have item`)
        }
        if(slotIndex < 0 || slotIndex > slotArray.length - 1) {
            throw new Error(`Slot index: ${slotIndex} is out of range.`)
        }
        slotArray[slotIndex] = item;
        if(this.visible) {
            if(!this.usingCategoryTabs || (category && this.selectedTab.category === category)) {
                const obj = this.relativeRowIndexesForSlotIndex(slotIndex);
                if(obj) {
                    const row = this.rows[obj.rowIndex];
                    row.updateSlotData(obj.slotIndex, item)
                }
            }
        }
        const params = this.getSlotItemCallbackParams(slotIndex);
        this.emit('item-added', params);
        this._itemAddedListeners.forEach(l => l(params));
    }
    public removeItem(slotIndex, category?: string) : any {
        let slotArray : Array<any>;
        if(this.usingCategoryTabs) {
            category = (category !== null && category !== undefined) ? category : this.lastUsedCategoryName;
            if(!(category in this.state)) throw new Error(`Invalid category provided: ${category}`);
            slotArray = this.state[category]
        } else {
            slotArray = this.state as unknown as Array<any>;
        }
        const itemToRemove = slotArray[slotIndex];
        if(itemToRemove === null || itemToRemove === undefined) {
            throw new Error(`No item to remove at index`)
        }
        if(slotIndex < 0 || slotIndex > slotArray.length - 1) {
            throw new Error(`Slot index: ${slotIndex} is out of range.`)
        }
        slotArray[slotIndex] = null;
        if(this.visible) {
            if(!this.usingCategoryTabs || (category && this.selectedTab.category === category)) {
                const obj = this.relativeRowIndexesForSlotIndex(slotIndex);
                if(obj) {
                    const row = this.rows[obj.rowIndex];
                    row.updateSlotData(obj.slotIndex, null)
                }
            }
        }
        const params = this.getSlotItemCallbackParams(slotIndex);
        this.emit('item-removed',  params)
        this._itemRemovedListeners.forEach(l => l(params));
        return itemToRemove;
    }

    public updateStyle(styleObj: InventoryStyleOptions) {
        if('itemPadding' in styleObj) {
            this.cachedRowSlotCalculations = {};
        }
    }
    public applyItemStyle(slotIndex: number, styleType: 'hovered' | 'pressed' | 'selected', backupStyles?: Array<'default' | 'pressed' | 'selected' | 'hovered'>) {
        const slotItem = this.rows
    }

    public hoverItem(slotIndex : number) {
        if(this.draggingIndex > -1) {
            const oldDragTo = this.draggingToIndex;
            if(oldDragTo === this.draggingToIndex) return;
            this.draggingToIndex = slotIndex;
            if(oldDragTo > -1) {
                const old = this.relativeRowIndexesForSlotIndex(oldDragTo);
                this.rows[old.rowIndex].updateSlotSprite(old.slotIndex, oldDragTo);
            }
            if(slotIndex === this.draggingIndex) return;
            const newTo = this.relativeRowIndexesForSlotIndex(slotIndex);
            this.rows[newTo.rowIndex].updateSlotSprite(newTo.slotIndex, oldDragTo);
            return;
        }
        if(this.hoveredSlotIndex === slotIndex) {
            return;
        }
        const oldHovered = this.hoveredSlotIndex;
        this.hoveredSlotIndex = slotIndex;
        if(oldHovered > -1 && oldHovered !== this.selectedSlotIndex) {
            const old = this.relativeRowIndexesForSlotIndex(oldHovered);
            this.rows[old.rowIndex].updateSlotSprite(old.slotIndex, oldHovered);
        }

        const hoveredWasSelected = this.hoveredSlotIndex === this.selectedSlotIndex;
        if(!hoveredWasSelected) {
            if(this.hoveredSlotIndex > -1) {
                const newIndexes = this.relativeRowIndexesForSlotIndex(this.hoveredSlotIndex);
                this.rows[newIndexes.rowIndex].updateSlotSprite(newIndexes.slotIndex, this.hoveredSlotIndex);
            }
        } else {
            this.hoveredSlotIndex = -1;
        }
    }

    public getItemSlotElement(slotIndex: number, styleType: 'hovered' | 'selected' | 'default' | 'dragTo', backupStyles?: Array<'default' | 'pressed' | 'selected' | 'hovered'>, previousContainer?: PIXI.Container | PIXI.Sprite) : PIXI.Container | PIXI.Sprite {
        let factory = this.styleOpts.itemContainerFactories[styleType];
        if(!factory) {
            for(let i = 0; i < backupStyles.length; i++) {
                factory = this.styleOpts.itemContainerFactories[backupStyles[i]];
                if(factory) break;
            }
        }
        if(!factory) throw new Error(`Missing needed factory for style type: ${styleType}`);
        return factory(this.getSlotItemCallbackParams(slotIndex));
    }

    private applyTabStyle(tabIndex: number, styleType: 'hovered' | 'pressed' | 'selected', backupStyles?: Array<'default' | 'pressed' | 'selected' | 'hovered'>) {
        const nextTab : PixiElement = tabIndex > -1 ? this.tabLabels[tabIndex] : null;
        const tabKey = `${styleType}Tab`;
        const old : PixiElement = this[tabKey];

        if(nextTab === old) {
            // no change, return early.
            return;
        }
        if(old) {
            const oldContainer = old.children[0] as PIXI.Container;
            old.removeChild(oldContainer)
            // @ts-ignore
            const c = old.handlers.default(oldContainer);
            old.addChild(c);
        }
        if(nextTab) {
            if(nextTab === this.selectedTab) {
                // the tab was selected, no style should overright it and the new style should be set to null.
                this[tabKey] = null;
                return;
            }
            const oldEl = nextTab.children[0] as PIXI.Container;
            nextTab.removeChild(oldEl);
            // @ts-ignore
            let handler = nextTab.handlers[styleType];
            if(!handler) {
                backupStyles = backupStyles ? backupStyles : [];
                !backupStyles.includes('default') && backupStyles.push('default');
                for(let i = 0; i < backupStyles.length; i++) {
                    // @ts-ignore
                    handler = nextTab.handlers[styleType];
                    if(handler) break;
                }
            }
            let nextEl = handler ? handler(oldEl) : oldEl;
            nextEl = nextEl || oldEl;
            nextTab.addChild(nextEl);
        }
        this[tabKey] = nextTab;
    }
    public defaultTab(tabIndex: number) {
        const tab = this.tabLabels[tabIndex] as PixiElement;
        if(tab === this.pressedTab) {
            this.pressedTab = null;
        }
        if(tab === this.hoveredTab) {
            this.hoveredTab = null;
        }

        if(tab && tab !== this.selectedTab) {
            const oldEl = tab.children[0] as PIXI.Container;
            tab.removeChild(oldEl);
            // @ts-ignore
            let nextEl = tab.handlers.default(oldEl);
            nextEl = nextEl ? nextEl : oldEl;
            tab.addChild(nextEl);
        }
    }
    public hoverTab(tabIndex: number, isMouseDown: boolean) {
        if(tabIndex === this.selectedTabIndex) return;
        if(isMouseDown) {
            this.applyTabStyle(tabIndex, 'pressed');
        } else {
            this.applyTabStyle(tabIndex, 'hovered');
        }
    }
    public pressTab(tabIndex: number) {
        this.applyTabStyle(tabIndex, 'pressed', ['hovered']);
    }
    public selectTab(tabIndex: number) {
        this.clearContextMenu();
        if(!this.visible) {
            this.closedWithTabIndex = tabIndex;
            return;
        }
        if(tabIndex === this.selectedTabIndex && this.tabLabels[tabIndex] === this.selectedTab) {
            return;
        }
        this.hoveredSlotIndex = -1;
        this.applyTabStyle(tabIndex, 'selected', ['pressed', 'hovered']);
        this.pressedTab = null;
        if(this.hoveredTab === this.selectedTab) {
            this.hoveredTab = null;
        }
        this._selectedSlotIndex = this.selectedItemIndexByCategory[this.selectedTab.category];
        this.emit('selected-tab', this.selectedTab.category)
        this._selectedTabListeners.forEach(l => {
            l(this.selectedTab.category);
        })
    };

    public swapSlots(slotIndex1, slotIndex2) {
        const item1 = this.currentFocusedItemsData[slotIndex1];
        const item2 = this.currentFocusedItemsData[slotIndex2];
        if(item1 === item2) return;

        const { rowIndex : rowIndexItem1, slotIndex : rowSlotIndexItem1 } = this.relativeRowIndexesForSlotIndex(slotIndex1);
        const { rowIndex : rowIndexItem2, slotIndex : rowSlotIndexItem2 } = this.relativeRowIndexesForSlotIndex(slotIndex2);

        this.currentFocusedItemsData[slotIndex1] = item2;
        this.currentFocusedItemsData[slotIndex2] = item1;

        if(slotIndex1 === this._selectedSlotIndex) {
            this._selectedSlotIndex = slotIndex2;
            if(this.usingCategoryTabs) {
                this.selectedItemIndexByCategory[this.selectedTab.category] = slotIndex2;
            }
        }
        this.rows[rowIndexItem1].updateSlotData(rowSlotIndexItem1, item2);
        this.rows[rowIndexItem2].updateSlotData(rowSlotIndexItem2, item1);
        this.emit('swap-slots', { slot1: item1, slot2: item2, slot1Index: slotIndex2, slot2Index: slotIndex1 });
        this._swappedSlotListeners.forEach(l => l(item1, item2, slotIndex2, slotIndex1))
    }

    get selectedSlotItem() : any {return this.currentFocusedItemsData[this._selectedSlotIndex]}
    set selectedSlotIndex(value: number) {this.selectItem(value);}
    get selectedSlotIndex() : number {return this._selectedSlotIndex;}
    public selectItem(slotIndex) {
        this.clearContextMenu();
        const prevItem = this.selectedSlotItem;
        const prevItemSlotIndex = this._selectedSlotIndex;
        if(slotIndex != this._selectedSlotIndex) {
            this._selectedSlotIndex = slotIndex;
        }
        if(this.usingCategoryTabs) {
            this.selectedItemIndexByCategory[this.selectedTab.category] = slotIndex;
        }

        // refresh the styles for the previously selected and newly selected items.
        if(prevItemSlotIndex > -1) {
            const { rowIndex: prevRowIndex, slotIndex : prevRelativeRowSlotIndex } = this.relativeRowIndexesForSlotIndex(prevItemSlotIndex);
            const prevRow = this.rows[prevRowIndex];
            prevRow.updateSlotSprite(prevRelativeRowSlotIndex, prevItemSlotIndex);
        }
        if(slotIndex > -1) {
            if(this.hoveredSlotIndex === slotIndex) {
                this.hoveredSlotIndex = -1;
            }
            const { rowIndex, slotIndex : relativeRowSlotIndex } = this.relativeRowIndexesForSlotIndex(slotIndex);
            const row = this.rows[rowIndex];
            row.updateSlotSprite(relativeRowSlotIndex, slotIndex);
        }
        const current = this.getSlotItemCallbackParams(slotIndex);
        const previous = prevItemSlotIndex > -1 ? this.getSlotItemCallbackParams(prevItemSlotIndex) : null;
        this.emit('selected-item', {current,previous});
        this._selectedItemListeners.forEach(l => l({ current, previous }))
    }
    public equipItem(slotIndex){
        if(!this.hasItemAtIndex(slotIndex)) return;
        const item = this.currentFocusedItemsData[slotIndex];
        const params = this.getSlotItemCallbackParams(slotIndex);
        this.emit('equipped-item', params);
        this._equippedItemListeners.forEach(l => l(params))
    }
    private hasItemAtIndex(slotIndex: number) : boolean {
        const item = this.currentFocusedItemsData[slotIndex];
        return item !== null && item !== undefined;
    }

    public onTabSelected(cb: any) { this._selectedTabListeners.push(cb); }
    public offTabSelected(cb: any) {
        const idx = this._selectedTabListeners.indexOf(cb);
        if(idx > -1) this._selectedTabListeners.splice(idx, 1);
    }

    public onItemSelected(cb: SelectedItemCallback) { this._selectedItemListeners.push(cb); }
    public offItemSelected(cb: SelectedItemCallback) {
        const idx = this._selectedItemListeners.indexOf(cb);
        if(idx > -1) this._selectedItemListeners.splice(idx, 1);
    }
    public onAddedItem(cb: ItemCallback) { this._itemAddedListeners.push(cb); }
    public offAddedItem(cb: ItemCallback) {
        const idx = this._itemAddedListeners.indexOf(cb);
        if(idx > -1) this._itemAddedListeners.splice(idx, 1);
    }
    public onRemovedItem(cb: ItemCallback) { this._itemRemovedListeners.push(cb); }
    public offRemovedITem(cb: ItemCallback) {
        const idx = this._itemRemovedListeners.indexOf(cb);
        if(idx > -1) this._itemRemovedListeners.splice(idx, 1);
    }

    public onOpened(cb: any) {this._openedInventoryListeners.push(cb);}
    public offOpened(cb: any) {
        const idx = this._openedInventoryListeners.indexOf(cb);
        if(idx > -1) this._openedInventoryListeners.splice(idx, 1);
    }
    public onClosed(cb: any) {this._closedInventoryListeners.push(cb);}
    public offClosed(cb: any) {
        const idx = this._closedInventoryListeners.indexOf(cb);
        if(idx > -1) this._closedInventoryListeners.splice(idx, 1);
    }
    public onDragItemStart(cb: ItemCallback) { this._dragStartHandlers.push(cb); }
    public offDragItemStart(cb: ItemCallback) {
        const idx = this._dragStartHandlers.indexOf(cb);
        if(idx > -1) this._dragStartHandlers.splice(idx, 1);
    }

    public onDragItemEnd(cb: ItemDragEndCallback) { this._dragEndHandlers.push(cb); }
    public offDragItemEnd(cb: ItemDragEndCallback) {
        const idx = this._dragEndHandlers.indexOf(cb);
        if(idx > -1) this._dragEndHandlers.splice(idx, 1);
    }


    public onDragItemMove(cb: ItemDragMoveCallback) { this.__dragMoveHandlers.push(cb); }
    public offDragItemMove(cb: ItemDragMoveCallback) {
        const idx = this.__dragMoveHandlers.indexOf(cb);
        if(idx > -1) this.__dragMoveHandlers.splice(idx, 1);
    }

    public onItemEquipped(cb: ItemCallback) { this._equippedItemListeners.push(cb); }
    public offItemEquipped(cb: any) {
        const idx = this._equippedItemListeners.indexOf(cb);
        if(idx > -1) this._equippedItemListeners.splice(idx, 1);
    }
    public onItemOptionsOpen(cb: ItemCallback) {}
    public onItemOptionsClose(cb: ItemCallback) {}
    public onItemPreviewChange(cb: ItemCallback) {}
    public onItemSlotClick(cb : ItemCallback) {}

    public onSwapSlots(cb: (item1: any, item2: any, item1NewSlotIndex: number, item2NewSlotIndex: number) => void)  { this._swappedSlotListeners.push(cb); }
    public offSwapSlots(cb: (item1: any, item2: any, item1NewSlotIndex: number, item2NewSlotIndex: number) => void) {
        const idx = this._swappedSlotListeners.indexOf(cb);
        if(idx > -1) this._swappedSlotListeners.splice(idx, 1);
    }

    public calculateSlotRowPosition(relativeRowSlotIndex: number) : number {
        if(relativeRowSlotIndex in this.cachedRowSlotCalculations) return this.cachedRowSlotCalculations[relativeRowSlotIndex]
        const maxWidthPer = Math.floor(this.styleOpts.width / this.itemsPerRow);
        this.cachedRowSlotCalculations[relativeRowSlotIndex] = Math.floor((maxWidthPer * relativeRowSlotIndex) + this.styleOpts.itemPadding);
        return this.cachedRowSlotCalculations[relativeRowSlotIndex];
    }

    private applyInputSystemOnTab(tabElement: PixiElement, tabIndex: number) {
        this.inputSystems.forEach((s) => {
            s.registerTabElementEvents(tabElement, tabIndex);
        })
    }

    private applyInputOpts() {
        this.inputSystems.length = 0;
        const TypeToContructor = { mouse: MouseInputSystem, keyboard: KeyboardInputSystem, controller: ControllerInputSystem, touch: TouchInputSystem };
        Object.keys(TypeToContructor).forEach(k => {
            if(this.inputOpts[k]) {
                const sys = new TypeToContructor[k](this)
                sys.registerEvents();
                this.inputSystems.push(sys);
            }
        });
    }
    private removeInputOpts() {
        this.inputSystems.forEach(sys => sys.unregisterEvents());
    }
    private makeNeededRows() {
        if(this.rows) throw new Error(`Should be initializing an empty array.`)
        const needed = Math.ceil(this.maxSlots/this.styleOpts.itemsPerRow );
        this.rows = new Array(needed);
        for(let i = 0; i < needed; i++) {
            this.rows[i] = new InventoryRow(this, i);
        }
    }
    get draggingItem() : PixiElement {
        if(this.draggingIndex < 0) return null;
        const item = this.relativeRowIndexesForSlotIndex(this.draggingIndex);
        return this.rows[item.rowIndex].slotElements[item.slotIndex];
    }
    public startDragging(slotIndex: number) {
        if(!this.hasItemAtIndex(slotIndex)) return;
        this.draggingIndex = slotIndex;
        if(this.hoveredSlotIndex > -1) {
            const oldHovered = this.hoveredSlotIndex;
            this.hoveredSlotIndex = -1;
            const item = this.relativeRowIndexesForSlotIndex(oldHovered);
            this.rows[item.rowIndex].updateSlotSprite(item.slotIndex, oldHovered);
        }
        if(this.draggingItem) {
            let addY = 0;
            let addX = 0;

            const params = this.getSlotItemCallbackParams(slotIndex)

            if(this.draggingItem.parent) {
                addY += (this.draggingItem.parent.getGlobalPosition().y - (this.y));
                addX += (this.draggingItem.parent.getGlobalPosition().x - (this.x));
                this.draggingItem['_previousParent'] = this.draggingItem.parent;
                this.draggingItem.parent.removeChild(this.draggingItem);
            }
            this.draggingItem.y = addY;
            this.draggingItem.x += addX;
      //      this.draggingItem.interactive = false;
      //      this.draggingItem.interactiveChildren = false;
            this.addChild(this.draggingItem);
            this.emit('drag-item-start', params)
            this._dragStartHandlers.forEach(l => l(params))
        }
    }

    private getSlotSprite(globalSlotIndex: number) : PIXI.Container | PIXI.Sprite {
        if(globalSlotIndex < 0) return null;
        const { rowIndex, slotIndex } = this.relativeRowIndexesForSlotIndex(globalSlotIndex);
        // @ts-ignore
        return this.rows[rowIndex].slotElements[slotIndex].children[0];
    }
    private getSlotItemCallbackParams(globalIndex: number) : ItemCallbackParams {
        if(globalIndex < 0) return null;
        const { rowIndex, slotIndex } = this.relativeRowIndexesForSlotIndex(globalIndex);
        let slotSprite = null;
        if(this.rows && this.rows[rowIndex]?.slotElements && this.rows[rowIndex].slotElements[slotIndex]) {
            // the slotSprite is the sprite the user created ( so child of the PixiElement we track inside slotElements array )
            slotSprite = this.rows[rowIndex].slotElements[slotIndex].children[0];
        }
        const isSelected = this.selectedSlotIndex === globalIndex;
        return { slotIndex: globalIndex, item: this.currentFocusedItemsData[globalIndex], slotSprite, isSelected, category: this.lastUsedCategoryName, inventory: this };
    }

    public endDragging(fromClose=false) {
        const draggingIndex = this.draggingIndex;
        const draggingToIndex = this.draggingToIndex;

        this.draggingToIndex = -1;
        this.draggingIndex = -1;

        if(fromClose) {
            if(draggingIndex > -1) {
                const params = {
                    ...this.getSlotItemCallbackParams(draggingIndex),
                    result: 'close'
                }
                this.emit('drag-item-end', params);
                this._dragEndHandlers.forEach(l => l(params))
            }
            return;
        }

        let params;
        let redraw = false;
        if(draggingIndex !== draggingToIndex && draggingIndex > -1 && draggingToIndex > -1) {
            this.swapSlots(draggingIndex, draggingToIndex);
            params = {
                ...this.getSlotItemCallbackParams(draggingToIndex),
                result: 'swap'
            }
        } else if (draggingIndex > -1) {
            params = {
                ...this.getSlotItemCallbackParams(draggingIndex),
                result: 'outside'
            }
            redraw = true;
        }
        if(params) {
            this.emit('drag-item-end', params);
            this._dragEndHandlers.forEach(l => l(params))
            if(redraw) {
                this.updateSlotStyle(draggingIndex);
            }
        }
    }
    public moveDragging(mouseX, mouseY, movementX: number, movementY: number) {
        if(this.draggingItem) {
            this.draggingItem.x += movementX;
            this.draggingItem.y += movementY;
        }
        const slotIndex = this.getGlobalSlotIndexFromPosition(mouseX, mouseY);
        this.draggingToIndex = slotIndex;
        if(this.draggingItem) {
            const dragging = this.getSlotItemCallbackParams(this.draggingIndex);
            const dragTo = slotIndex > -1 ? this.getSlotItemCallbackParams(slotIndex) : null;
            this.emit('drag-item-move', { dragging, dragTo })
            this.__dragMoveHandlers.forEach(l => l({ dragging, dragTo, mouseX, mouseY, movementX, movementY }));
        }
    }

    private getGlobalSlotIndexFromPosition(x, y) : number {
        for(let i = 0; i < this.rows.length; i++) {
            if(!this.rows[i].isVisible) continue;
            const final = this.rows[i].getSlotIndexFromPoint({ x, y });
            if(final > -1) {
                return final;
            }
        }
        return -1;
    }

    get usingCategoryTabs() : boolean {
        return !!this.layoutOpts.tabs.length
    }

    private initializeCategories() {
        if(this.usingCategoryTabs) {
            this.layoutOpts.tabs?.forEach((t, i) => {
                const c = t.tabLabelContainer.default();
                const el = new TabLabel(t.name, t.tabLabelContainer) as PixiElement;
                el.addChild(c);
                el.x = this.tabContainer.width;
                this.tabContainer.addChild(el);
                this.applyInputSystemOnTab(el, i);
                // @ts-ignore
                this.tabLabels.push(el);
            });
        }
    }

    private relativeRowIndexesForSlotIndex(slotIndex: number) : { rowIndex: number, slotIndex: number } {
        return {
            rowIndex: Math.floor(slotIndex / this.itemsPerRow),
            slotIndex: slotIndex % this.itemsPerRow
        }
    }
}