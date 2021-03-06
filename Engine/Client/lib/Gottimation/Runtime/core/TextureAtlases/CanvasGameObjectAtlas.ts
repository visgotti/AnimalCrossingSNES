import {Loader} from "../../../lib/Loader";
import {BaseGameObjectAtlas} from "./BaseGameObjectAtlas";

export class CanvasGameObjectAtlas extends BaseGameObjectAtlas {
    readonly renderer: PIXI.CanvasRenderer;
    constructor(renderer: PIXI.CanvasRenderer) {
        super(2048, renderer);
    }

    public removeTextureFromAtlas(id: string, rect: { x: number, y: number, w: number, h: number }, atlasIndex: number): void {
    }
}