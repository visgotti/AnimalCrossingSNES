import {BaseGameObjectAtlas} from "./BaseGameObjectAtlas";
import {WebGlGameObjectAtlas} from "./WebGLGameObjectAtlas";
import {Loader} from "../../../lib/Loader";

export const AtlasFactory = (renderer: PIXI.CanvasRenderer | PIXI.WebGLRenderer, loader?: Loader) : BaseGameObjectAtlas => {
    if(renderer.type == 1) {
        return new WebGlGameObjectAtlas(renderer as PIXI.WebGLRenderer);
    } else {
        return new WebGlGameObjectAtlas(renderer as PIXI.WebGLRenderer);
    }
}