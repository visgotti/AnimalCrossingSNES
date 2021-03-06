export type SlotData = {
    itemEntity?: any,
    quantity: number,
}

export type SlotTextures = {
    empty: PIXI.Texture,
    selected: PIXI.Texture,
}

export class ItemSlot {
    public data?: SlotData = null;
    private onMouseDown: Function;
    private onMouseUp: Function;

    private onMouseMove: Function;

    private onSlotDragStart: Function;
    private onSlotDragEnd: Function;

    public sprite: PIXI.Sprite;
    private itemSprite: PIXI.Sprite;
    public index: number;

    private mouseIsDown: boolean = false;
    private mouseUpAfterClicked = false;

    private slotTextures: SlotTextures;

    private _x: number;
    private _y: number;

    private isDragging: boolean;

    constructor(slotTextures: SlotTextures, index, slotMouseDownHandler, slotDragMoveHandler, slotDragStartHandler, slotDragEndHandler) {
        this.slotTextures = slotTextures;
        this.index = index;
        this.sprite = new PIXI.Sprite(slotTextures.empty);
    }

    set x (val) {
        this.sprite.position.x = val;
        if(this.itemSprite) {
            this.itemSprite.x = val;
        }
        this._x = val;
    }

    public addQuantity(number) {
        if(this.data) {
            this.data.quantity += number;
        }
    }

    set y (val) {
        this.sprite.position.y = val;
        if(this.itemSprite) {
            this.itemSprite.y = val;
        }
        this._y = val;
    }

    /**
     * Returns data of what was removed
     * pass in -1 to return all
     */
    public removeSlotItem(quantity=1) {
        if(this.itemSprite && this.data) {
            let difference = this.data.quantity - quantity;
            if(quantity === -1) {
                difference = 0;
            }
            if(difference <= 0) {
                this.itemSprite.parent.removeChild(this.itemSprite);
                this.itemSprite.destroy({ children: true, texture: false, baseTexture: false });
                this.itemSprite = null;
                let removedData = this.data;
                this.data = null;
                return removedData;
            } else {
                this.data.quantity = difference;
                // removed quantity of what was passed in
                return {
                    ...this.data,
                    quantity,
                }
            }
        }
        return this.data
    }

    /**
     * adds item to slot if the slot wasnt already holding an item
     * @param texture
     * @param data
     * returns boolean
     */
    public addSlotItem(texture: PIXI.Texture, data: SlotData) : boolean {
        if(this.data) {
            return false;
        }
        this.data = data;
        if(this.sprite && this.sprite.parent) {
            this.itemSprite = new PIXI.Sprite(texture);

            this.itemSprite.buttonMode = true;
            this.itemSprite.interactive = true;

            this.itemSprite.on('mouseup', this.onMouseUp as any);
            this.itemSprite.on('touchend', this.onMouseUp as any);

            this.itemSprite.on('mousemove', this.onMouseMove as any);
            this.itemSprite.on('touchmove', this.onMouseMove as any);

            this.itemSprite.on('mousedown', this.onMouseDown as any);
            this.itemSprite.on('touchstart', this.onMouseDown as any);

            this.sprite.parent.addChild(this.itemSprite);
            this.itemSprite.x = this.sprite.x;
            this.itemSprite.y = this.sprite.y;
        }
        return true;
    }

    public reposition(x, y) {
        if(this.sprite) {
            this.sprite.x = x;
            this.sprite.y = y;
        }
        if(this.itemSprite) {
            this.itemSprite.x = x;
            this.itemSprite.y = y;
        }
    }

    public hide() {
        if(this.sprite) {
            this.sprite.visible = false;
        }
        if(this.itemSprite) {
            this.itemSprite.visible = false;
        }
    }

    public show() {
        if(this.sprite) {
            this.sprite.visible = true;
        }
        if(this.itemSprite) {
            this.itemSprite.visible = true;
        }
    }

    public deselected() {
        this.sprite.texture = this.slotTextures.empty;
    }

    public selected() {
        this.sprite.texture = this.slotTextures.selected;
        const parent = this.sprite.parent;
        if(parent) {
            parent.removeChild(this.sprite);
            parent.addChild(this.sprite);
        }
    }
}