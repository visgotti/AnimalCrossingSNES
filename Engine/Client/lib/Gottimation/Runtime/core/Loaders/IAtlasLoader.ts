export interface IAtlasLoader {
    loadedSkins: {[skinId: number]: boolean };
    loadSheet: (sheetId: number) => Promise<any>
    loadSkin: (skinId: number) => Promise<PIXI.Texture>
}