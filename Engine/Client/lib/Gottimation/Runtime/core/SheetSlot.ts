import {RectData} from "../../types";
import {Skeleton} from "./Skeleton";

export class SheetSlot extends PIXI.Sprite {
    public sheetId: string;
    public id: number
    private rect: RectData;
    public skeleton: Skeleton;
    constructor(texture?: PIXI.Texture) {
        super(texture);
    }
}