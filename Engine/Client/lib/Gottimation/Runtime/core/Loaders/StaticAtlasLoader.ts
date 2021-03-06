import {IAtlasLoader} from "./IAtlasLoader";
import { Loader } from '../../../lib/Loader';
export class StaticAtlasLoader implements IAtlasLoader {
    readonly projectPath: string;
    readonly loader: Loader

    constructor(projectPath: string) {
        this.projectPath = projectPath;
    }
    loadSkin: (skinId: number) => Promise<PIXI.Texture>;
    getSlotTexture(slotId: number, skinId: number): PIXI.Texture {
        return null;
      //  return this.skinIdSlotIdTextureLookup[skinId][slotId];
    }
    loadSheet(sheetId: number): Promise<any> {
        return Promise.resolve(undefined);
    }

    loadedSkins: { [p: number]: boolean };
}