import {Loader} from "../../../lib/Loader";
import {BaseGameObjectAtlas} from "./BaseGameObjectAtlas";

export class WebGlGameObjectAtlas extends BaseGameObjectAtlas {
    readonly renderer: PIXI.WebGLRenderer;
    constructor(renderer: PIXI.WebGLRenderer) {
        super(2048, renderer);
    }
    public removeTextureFromAtlas(id: string): void {
        if(!(id in this.cachedTextureData)) {
            throw new Error(`Could not find id ${id}`)
        }
        const [x, y, w, h, atlasIndex] = this.cachedTextureData[id];

        delete this.cachedTextureData[id];
        this.renderer.bindRenderTexture(this.atlases[atlasIndex], null);
        const gl = this.renderer.gl;
        // turn on the scissor test.
        gl.enable(gl.SCISSOR_TEST);
        // set the scissor rectangle.
        gl.scissor(x, y, w, h);
        this.renderer.clear();
        // @ts-ignore
        this.renderer.bindRenderTexture();
    }
}