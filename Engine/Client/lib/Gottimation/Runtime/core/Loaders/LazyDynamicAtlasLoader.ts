import {IAtlasLoader} from "./IAtlasLoader";
import { Loader } from '../../../lib/Loader';
import {AtlasData, SlotColliderData} from "../../types";
import {WebGlGameObjectAtlas} from "../TextureAtlases/WebGLGameObjectAtlas";
import {BaseGameObjectAtlas} from "../TextureAtlases/BaseGameObjectAtlas";
import {CanvasGameObjectAtlas} from "../TextureAtlases/CanvasGameObjectAtlas";
import {getTextureFromBlob, httpGetAsync} from "../../../utils";
import {ShapeData} from "../../../types";
import {DEFAULT_SKIN_ID} from "../../Gottimation";
export class LazyDynamicAtlasLoader implements IAtlasLoader {
    readonly slotIdToRectLookup: {[slotId: number]: { x: number, y: number, w: number, h: number }} = {};
    readonly slotIdToColliderLookup: {[slotId: number]: Array<SlotColliderData>} = {};
    readonly slotIdToTagLookup: {[slotId: number]: Array<string>} = {};
    readonly atlasNameToSkinNameToSlotTextures: {[atlasName: string]: {[skinName: string]: {[slotId: number]: PIXI.Texture} }} = {};
    readonly atlasNameToSlots: {[sheetId: number]: Array<number> } = {};
    readonly loader: Loader
    readonly projectPath: string;
    readonly loadedSkins = {};
    readonly textureAtlas : BaseGameObjectAtlas;
    readonly updateEmitter: any;
    constructor(atlases: Array<AtlasData>, indexedDbLoader: Loader, projectPath: string, renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer, preloadedSkins?: Array<{ atlasName: string, skinId: string, texture: PIXI.Texture }>) {
        this.loader = indexedDbLoader;
        this.projectPath = projectPath;
        if(renderer.type == 1) {
            this.textureAtlas = new WebGlGameObjectAtlas(renderer as PIXI.WebGLRenderer)
        } else {
            this.textureAtlas = new CanvasGameObjectAtlas(renderer as PIXI.CanvasRenderer)
        }

        // used so if we have a bunch of slots with the same tags we can reuse the same array ref.
        const tagArraysAddedSoFar : Array<{ hash: string, array: Array<string> }> = [];

        atlases.forEach(a => {
            this.atlasNameToSkinNameToSlotTextures[a.name] = {};
            this.atlasNameToSlots[a.name] = Object.keys(a.slots).map(s => {
                return isNaN(parseInt(s)) ? s : parseInt(s);
            });
            for(let slotId in a.slots) {
                if(a.slots[slotId].cuids) {
                    this.slotIdToColliderLookup[slotId] = a.slots[slotId].cuids.map(cuid => {
                        return a.colliders[cuid]
                    });
                }
                this.slotIdToRectLookup[slotId] = a.slots[slotId].rect
                if(a.slots[slotId].tags) {
                    const arrayHash = a.slots[slotId].tags.sort().join(',');
                    const found = tagArraysAddedSoFar.find(a => a.hash == arrayHash);
                    if(found) {
                        this.slotIdToTagLookup[slotId] = found.array;
                    } else {
                        const array = [...a.slots[slotId].tags];
                        tagArraysAddedSoFar.push({ hash: arrayHash, array  });
                        this.slotIdToTagLookup[slotId] =array;
                    }
                }
            }
        });
        if(preloadedSkins) {
            preloadedSkins.forEach(({ atlasName, texture, skinId }) => {
                this._getSkinFromTexture(atlasName, texture, skinId)
            })
        }
    }

    public updateAtlas(atlasData: AtlasData) {
    }
    public removeAtlas(atlasData: AtlasData) {
    }
    public removeSkin(atlasName: string, skinName: string) {
    }

    loadSkin: (skinId: number) => Promise<PIXI.Texture>;
    loadSheet(sheetId: number): Promise<any> {
        return Promise.resolve(undefined);
    }
    private async loadSkinTexture(url: string) : Promise<PIXI.Texture> {
        let data : Blob = await this.loader.loadImageData(url) as Blob;
       // console.log('finna get:', data);
        if(!data) {
            data = await httpGetAsync(url, false) as Blob;
            if(data) {
                this.loader.saveImageData(url, data);
            }
        }
        const finalTexture = data ? await getTextureFromBlob(data) : null;
        return finalTexture;
    }
    private addToAtlas(texture: PIXI.Texture) : PIXI.Texture {
        return texture;
    }

    private getOpenBaseTexture() : { baseTexture: PIXI.BaseTexture, x: number, y: number } {
        return { baseTexture: null, x: 0, y: 0 }
    }

    private splitTextureAndAddToMap(atlasName: string, skinId: number | string, texture: PIXI.Texture)  :  {[slotId: number]: PIXI.Texture } {
        const { texture : atlasedTexture, rect } = this.textureAtlas.addTexture(`${atlasName}_${skinId}`, texture, null, true);
        const atlasSkinLookup = this.atlasNameToSkinNameToSlotTextures[atlasName];
        for(let i = 0; i < this.atlasNameToSlots[atlasName].length; i++) {
            const slotId = this.atlasNameToSlots[atlasName][i];
            const slotRect = this.slotIdToRectLookup[slotId];
            //   console.log('its going to become', rect.x + slotRect[0]-1,  rect.y + slotRect[1]-1, slotRect[2], slotRect[3])
            // console.log('slot rect:', slotRect, 'rect', rect, rect.x + slotRect[0], rect.y + slotRect[1], slotRect[2], slotRect[3]);
            // @ts-ignore
            //TODO: i had code that was subtracting 1 from slotRect[0] and slotRect[1], the bounds was out for the texture and was having an issue, have to see whats up with that. editor might be off by a pixel.
            atlasSkinLookup[skinId][slotId] = new PIXI.Texture(atlasedTexture, new PIXI.Rectangle(rect.x + slotRect[0], rect.y + slotRect[1], slotRect[2], slotRect[3]))
        }
        return atlasSkinLookup[skinId];
    }

    private _getSkinFromTexture(atlasName: string, texture: PIXI.Texture, id?: string | number) : {[slotId: number]: PIXI.Texture } {
        const atlasSkinLookup = this.atlasNameToSkinNameToSlotTextures[atlasName];
        if(id in atlasSkinLookup) { throw new Error(`Already had id ${id}`)}
        atlasSkinLookup[id] = {};
        return this.splitTextureAndAddToMap(atlasName, id, texture)
    }

    private async _getOrLoadSkinFromUrl(atlasName: string, skinUrl: string, id?: string | number) : Promise<{[slotId: number]: PIXI.Texture }> {
        const atlasSkinLookup = this.atlasNameToSkinNameToSlotTextures[atlasName];
        id = id || id === 0 || id === '0' ? id : skinUrl;
        if(id in atlasSkinLookup) {
            return atlasSkinLookup[id];
        }
        let texture = await this.loadSkinTexture(skinUrl);
        if(!texture) throw new Error(`Could not load skin from url: ${skinUrl}`)
        atlasSkinLookup[id] = {};
        return this.splitTextureAndAddToMap(atlasName, id, texture);
    }

    public getSlotsForTexture(t: PIXI.Texture | PIXI.BaseTexture, atlasName: string, tag?: string) : {[slotId: number]: PIXI.Texture} {
        const lookup = {};
        const texture = t instanceof PIXI.BaseTexture ? t : t.baseTexture;
        for(let i = 0; i < this.atlasNameToSlots[atlasName].length; i++) {
            const slotId = this.atlasNameToSlots[atlasName][i];
            if(!tag || this.slotIdToTagLookup[slotId]?.includes(tag)) {
                const slotRect = this.slotIdToRectLookup[slotId];
                lookup[slotId] = new PIXI.Texture(texture, new PIXI.Rectangle(slotRect.x, slotRect.y, slotRect.w, slotRect.h))
            }
        }
        return lookup;
    }

    public slotHasTag(slotId: number, tag: string) : boolean {
        const tags = this.slotIdToTagLookup[slotId];
        if(!tags) return false;
        return this.slotIdToTagLookup[slotId].includes(tag);
    }

    public getSkinSlots(atlasName: string, skinName: string) : {[slotId: number]: PIXI.Texture } {
        return this.atlasNameToSkinNameToSlotTextures[atlasName][skinName];
    }
    public getSkinSlot(atlasName: string, skinName: string) : {[slotId: number]: PIXI.Texture } {
        return this.atlasNameToSlots[atlasName][skinName]
    }

    async loadSkinSlots(atlasName: string, skinName: string) : Promise<{[slotId: number]: PIXI.Texture }> {
        skinName = skinName ? skinName : DEFAULT_SKIN_ID;
        if(!skinName.includes('.png')) {
            skinName = skinName + '.png';
        }
        const url = `${this.projectPath}/atlases/${atlasName}/skins/${skinName}`
        return this._getOrLoadSkinFromUrl(atlasName, url, skinName)
    }
    async loadSkinSlotsByUrl(atlasName: string, url: string) : Promise<{[slotId: number]: PIXI.Texture }> {
        return this._getOrLoadSkinFromUrl(atlasName, url)
    }

    /*
    async getOrLoadSkinSlots(sheetId: number, skinName: string) : Promise<{[slotId: number]: PIXI.Texture }> {
        if(!(skinName in this.skinIdSlotIdTextureLookup)) {
            this.skinIdSlotIdTextureLookup[skinName] = {};
            const texture = await this.loadSkinTexture(skinName);
            if(!texture) throw new Error(`Could not load skin ${skinName}`)
            const slotTextures = this.sheetIdToSlotIds[sheetId].map(slotId => {
                const slotRect = this.slotIdToRectLookup[slotId];
               // new PIXI.Texture(baseTexture, new PIXI.Rectangle(rect.x + slotRect.x, rect.y + slotRect.y, slotRect.w, slotRect.h))
            })
         //   const textures = this.addToAtlas(skinName, texture);
            texture.destroy(true);
            for(let i = 0; i < this.sheetIdToSlotIds[sheetId].length; i++) {
                const slotId = this.sheetIdToSlotIds[sheetId][i];
                const slotRect = this.slotIdToRectLookup[slotId];
           //     this.skinIdSlotIdTextureLookup[skinName][slotId]
            }
        }
        return this.skinIdSlotIdTextureLookup[skinName];
    }

     */
}