import {MaxRectsPacker} from "maxrects-packer";
import {BaseTexture} from "pixi.js";


export abstract class BaseGameObjectAtlas {
    private loadedSheetName: string;
    readonly maxTextureSize;
    readonly renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer;
    readonly nextOpenPositions: Array<Array<number>> =[];
    readonly atlases: Array<PIXI.RenderTexture> = [];
    private packer: MaxRectsPacker;
    readonly cachedTextureData: {[name: string]: Array<number> } = {};
    constructor(maxTextureSize: number, renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer) {
        if(maxTextureSize >= 4096) {
            this.maxTextureSize =   maxTextureSize - (maxTextureSize%4096);
        }  else if(maxTextureSize >= 2048) {
            this.maxTextureSize =   maxTextureSize - (maxTextureSize%2048);
        } else if (maxTextureSize >= 1024) {
            this.maxTextureSize =   maxTextureSize - (maxTextureSize%1024);
        } else if (maxTextureSize >= 512) {
            this.maxTextureSize =   maxTextureSize - (maxTextureSize%512);
        } else {
            this.maxTextureSize = 256;
        }
        this.renderer = renderer;
        this.packer = new MaxRectsPacker(this.maxTextureSize, this.maxTextureSize, 0, {
            smart: true,
            pot: true,
            allowRotation: false,
            tag: true,
        })
    }

    public addTexture(id: string | number, texture: PIXI.Texture, tag?: string, destroyAfter = false) : { texture: PIXI.BaseTexture; rect: { x: number; y: number; width: number; height: number } } {
        const opts : any = { id, width: texture.width, height: texture.height };
        if(tag) {
            opts.tag = tag;
        }
        const rect = this.packer.add(opts);
        let aIdx = -1;
        //TODO: edit packer code to return the bindex;
        for(let i = 0; i < this.packer.bins.length; i++) {
            for(let j = 0; j < this.packer.bins[i].rects.length; j++) {
                // @ts-ignore
                if(this.packer.bins[i].rects[j].id === id) {
                    aIdx = i;
                    break;
                }
            }
            if(aIdx > -1) break;
        }
        if(aIdx < 0) throw new Error(`No atlas index found for image after adding texture ${id}`);
        if(!this.atlases[aIdx]) {
            this.atlases.push(PIXI.RenderTexture.create(this.maxTextureSize, this.maxTextureSize));
        }
        const rT = this.atlases[aIdx];
        if(!rT) throw new Error(`Should have texture atlas at this point`);
        const sprite = new PIXI.Sprite(texture);
        sprite.setTransform(rect.x, rect.y);
        this.renderer.render(sprite, rT, false);
        this.cachedTextureData[id] = [rect.x, rect.y, rect.width, rect.height, aIdx]
        if(destroyAfter) {
       //     sprite.destroy({ texture: true, baseTexture: true })
        }
      //  console.log('made base texture:', rT.baseTexture, 'rect:', rect);
        return { texture: rT.baseTexture, rect };
    }
}