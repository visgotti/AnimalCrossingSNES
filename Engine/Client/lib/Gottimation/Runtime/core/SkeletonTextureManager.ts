import {RectData, SkeletonSheetData} from "../../types";
import {SheetAtlas} from "./SheetAtlas";
import {SheetSlot} from "./SheetSlot";

class DynamicAtlas {
    private renderQueue: Array<number>;
    private finishListeners: {[sheetId: string]: Array<string> }
    private textures: Array<PIXI.Texture>;
    private slotData: {[slotId: string]: RectData };
    private atlasListeners: {[sheetId: string]: {[slotId: string]: Array<(texture: PIXI.Texture) => void> }};
    private sheetListeners: {[sheetId: string]: () => void };
    constructor() {
    }
    private getRect(width: number, height: number) : RectData {
        return { x: 0, y: 0, w: width, h: height };
    }
    public addSlotTexture(sheetId: string, slotId: number, texture: PIXI.Texture) {
        const rect = this.getRect(texture.width, texture.height);
    }
    public removeSlotTexture(slotId: number) {
    }
    public initSheet(sheetData: SheetAtlas, texture: PIXI.Texture) {
    }
    public onAtlassedSlot(sheetId: string, slotId: number, callback: (texture: PIXI.Texture) => void) {
        if(!this.atlasListeners[sheetId]) {

        }
    }
    private renderSheet(sheetId: string) {
        this.sheetListeners[sheetId] && this.sheetListeners[sheetId]();
        delete this.sheetListeners[sheetId];
    }
    public onAtlassedSheet(sheetId: string, callback: () => void)  {
        this.sheetListeners[sheetId] = callback;
    }
    public getSlotTexture(sheetId: string, slotId: number) : PIXI.Texture {
        return null;
    }
}

export class SkeletonTextureManager {
    private dynamicAtlas: DynamicAtlas;
    private nonInitSheets: {[sheetId: string]: PIXI.BaseTexture } = {};
    private sheetInitQueue: Array<{ sheetData: SkeletonSheetData, texture: PIXI.Texture }>;
    private textureAtlasses: Array<PIXI.Texture> = [];
    private sheets: {[sheetId: string]: PIXI.Texture } = {};
    readonly tempTextureCache: {[sheetId: number]: {[ slotId: number]: { texture: PIXI.Texture }}} = {};
    readonly sheetSlotTextureCache: {[sheetId: number]: {[ slotId: number]: { texture: PIXI.Texture, lastUsed: number }}} = {};
    constructor() {
        this.dynamicAtlas = new DynamicAtlas();
    }
    public async addSheet(sheetType: string, sheetId: string) {
        this.sheetSlotTextureCache[sheetId] = {};
    }

    public addTextureToSlot(slot: SheetSlot) {
        const { sheetId, id } = slot;
        if(this.sheetSlotTextureCache[sheetId][id]) {
            this.sheetSlotTextureCache[sheetId][id].lastUsed = Date.now();
            return this.sheetSlotTextureCache[sheetId][id].texture;
        } else if(this.nonInitSheets[slot.sheetId]) {
            const _sheetId = slot.sheetId;
            // make temp sheet not from the texture atlas.
            let tempTexture;
            if(this.tempTextureCache[sheetId][id]) {
                tempTexture = this.tempTextureCache[sheetId][id];
            } else {
                tempTexture = new PIXI.Texture(this.nonInitSheets[sheetId], new PIXI.Rectangle(0, 0, 100, 100));
                this.tempTextureCache[sheetId][id] = tempTexture;
            }
            this.dynamicAtlas.onAtlassedSlot(sheetId, id, (texture) => {
                if (slot.skeleton && slot.sheetId === _sheetId) {
                    const oldText = slot.texture;
                    oldText.destroy();
                    slot.texture = texture;
                }
                this.sheetSlotTextureCache[sheetId][id] = texture;
                // listen for when sheet is initialized then replace it on the slot.
            })
        } else {
            const t = this.dynamicAtlas.getSlotTexture(sheetId, id);
            slot.texture = t;
        }
    }

    private async initSheet(sheetData: SkeletonSheetData, texture: PIXI.Texture) {
        if(this.sheetInitQueue.length) {
            this.sheetInitQueue.push({ sheetData, texture });
          //  this.nonInitSheets[sheetData]
        }
       // const sheetAtlas = new SheetAtlas(sheetData, texture);
    }

    public bakeRotations

}