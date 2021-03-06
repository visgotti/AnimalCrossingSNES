import {Skeleton} from "./core/Skeleton";
import {
    AtlasData,
    ColliderAdjustedData, ColliderSetupData,
    GlobalRuntimeProjectData,
    InitializedSkeletonData,
    PlayOptions,
    ProjectMetaData,
    SkinParam
} from "./types";
import {formatSkeletonData} from "./formatters";
import {AnimationTrack} from "./core/AnimationTrack";
import {LazyDynamicAtlasLoader} from "./core/Loaders/LazyDynamicAtlasLoader";
import {Loader} from "../lib/Loader";
import {getTextureFromBlob, httpGetAsync, validateSkinParam, validateSkinParams} from "../utils";
import {Bone} from "./core/Bone";

export type SkeletonCreateOptions = {
    direction?: string,
    action?: string,
    skins?: Array<SkinParam>,
    activeSlotTextures?: {[slotId: number]: PIXI.Texture },
    playOptions?: PlayOptions,
    attachmentSlots?: Array<{ attachmentSlotName: string, attachmentName: string, action?: string, playOptions?: PlayOptions }>
}

export type ColliderParentObjectParams = {
    skeleton: Skeleton,
    track: AnimationTrack,
    bone?: Bone,
    action?: string,
}

export type ColliderAdjustmentHandler = (params: ColliderParentObjectParams, data: ColliderAdjustedData, inverse: boolean) => void;
export type ColliderAddedHandler = (params: ColliderParentObjectParams,  data: ColliderSetupData) => void;
export type ColliderRemovedHandler = (params: ColliderParentObjectParams, colliderId: number | string) => void;

export const DEFAULT_SKIN_ID = 'default.png'

export type IColliderManager = {
    onAdded: ColliderAddedHandler,
    onRemoved: ColliderRemovedHandler,
    onAdjusted: ColliderAdjustmentHandler,
}

export type InitOptions = {
    colliderManager?: IColliderManager,
    renderer?: PIXI.WebGLRenderer | PIXI.CanvasRenderer;
    canvas?: HTMLCanvasElement;
    canvasId?: string;
    preloadAtlasDefaults?: boolean,
    rendererOpts?: PIXI.RendererOptions,
    metaData?: ProjectMetaData,
    lazyLoadTextures: boolean,
    adhocUpdateGetter?: (timestamp: number) => Promise<{ added: GlobalRuntimeProjectData, updated: GlobalRuntimeProjectData, deleted: { skeletons?: Array<number>, attachments?: Array<number>, attachmentSlots?: Array<number>, animations?: Array<number>, actions?: Array<number>, atlases?: Array<number> } }>
}

export type UpdateEvents = 'create' | 'update';
export type DeleteEvent = 'delete';
export type UpdatableEntities = 'skin' | 'skeleton' | 'animation' | 'attachment' | 'sub-attachment'

export type UpdateEmitter = {
    onSkin: (event: UpdateEvents, cb: (v: { id: number, name: string, url?: string, atlasName?: string }) => void) => void,
    onAtlas: (event: UpdateEvents, cb: (v: AtlasData) => void ) => void,
}

const resolveRenderer = (opts?: InitOptions) : PIXI.CanvasRenderer | PIXI.WebGLRenderer => {
    if(typeof PIXI !== 'undefined') {
        let canvas;
        let rendererOpts;
        if(!opts || !opts.rendererOpts) {
            if(opts && opts.canvas)  {
                canvas = opts.canvas;
            } else {
                if (typeof document === 'undefined') {
                    throw new Error(`No document object found on global scope.`)
                }
                let canvas;
                if (opts?.canvasId) {
                    if (typeof document !== 'undefined') {
                        canvas = document.getElementById(opts.canvasId)
                    }
                    if (!canvas) {
                        throw new Error(`Could not find a canvas reference for id: ${opts.canvasId}`)
                    }
                } else {
                    canvas = document.createElement('canvas');
                    document.body.appendChild(canvas);
                }
                if (!canvas) {
                    throw new Error(`Was not able to create a canvas and no canvas was passed in as an init prop.`)
                }
            }
            rendererOpts = { view: canvas };
        } else {
            rendererOpts = opts.rendererOpts;
        }

        if(typeof PIXI['autoDetectRenderer'] !== 'undefined') {
            return PIXI.autoDetectRenderer(rendererOpts);
        } else if(typeof PIXI.WebGLRenderer !== 'undefined') {
            try {
                return new PIXI.WebGLRenderer(rendererOpts);
            } catch(err) {
                return new PIXI.CanvasRenderer(rendererOpts)
            }
        } else if(typeof PIXI.CanvasRenderer !== 'undefined') {
            return new PIXI.CanvasRenderer(rendererOpts)
        } else {
            throw new Error(`Could not find a Renderer constructor on PIXI global object`);
        }


    } else {
        throw new Error(`No global PIXI object found.`)
    }

}

export class Gottimation {
    private atlasLoader: LazyDynamicAtlasLoader;
    readonly allSkeletons: Array<Skeleton> = [];
    readonly skeletonData: {[skeletonName: string]: InitializedSkeletonData }
    readonly updateEmitter : UpdateEmitter;
    readonly renderer : PIXI.CanvasRenderer | PIXI.WebGLRenderer;
    private colliderManager?: IColliderManager

    constructor(data: GlobalRuntimeProjectData, projectPath: string, loader: Loader, initOptions?: InitOptions, preloadedSkins?: Array<{ atlasName: string, skinId: string, texture: PIXI.Texture }>) {
        initOptions = initOptions ? initOptions : { lazyLoadTextures: true };
        this.skeletonData = formatSkeletonData(data);

        const renderer = initOptions.renderer || resolveRenderer(initOptions)
        this.renderer = renderer;
        this.atlasLoader = new LazyDynamicAtlasLoader(data.atlases, loader, projectPath, renderer, preloadedSkins);
        Skeleton.create = this.createSkeleton.bind(this);
        Skeleton.createWithAsyncOptions = this.createSkeletonWithAsyncOptions.bind(this);
        /*
        this.updateEmitter.on('create-atlas', (atlasData: AtlasData) => {
        });
        this.updateEmitter.on('update-atlas', (atlasData: AtlasData) => {
        });
        this.updateEmitter.on('delete-atlas', (atlasData: AtlasData) => {
        });
        this.updateEmitter.on('update-skin', () => {
        });
        this.updateEmitter.on('delete-skin', () => {
        })

         */
    }
    private async init(metaData: GlobalRuntimeProjectData) {
    }

    private handleUpdate(a: UpdateEvents | DeleteEvent, entity: UpdatableEntities, payload: any) {
        switch(entity) {
            case "animation":
                switch(a) {
                    case 'create':
                    case 'update':
                    case 'delete':
                }
            case "attachment":
                switch(a) {
                    case 'create':
                    case 'update':
                    case 'delete':
                }
            case "skeleton":
                switch(a) {
                    case 'create':
                    case 'update':
                    case 'delete':
                }
            case "skin":
                switch(a) {
                    case 'create':
                    case 'update':
                    case 'delete':
                }
            case "sub-attachment":
                switch(a) {
                    case 'create':
                    case 'update':
                    case 'delete':
                }
        }
    }

    public static clearColliderManager(manager: IColliderManager) {
        delete Skeleton.prototype.colliderManager;
        delete Bone.prototype.colliderManager;
        delete AnimationTrack.prototype.colliderManager;
    }

    public static useColliderManager(manager: IColliderManager) {
        if(AnimationTrack.prototype.colliderManager) {
            if(AnimationTrack.prototype.colliderManager !== manager) {
                console.warn(`Changing the collider manager after already setting it can cause undocumented behavior and issues/bugs.`)
            } else {
                console.warn('Redundantly using the same collider manager')
            }
        }
        Skeleton.prototype.colliderManager = manager;
        Bone.prototype.colliderManager = manager;
        AnimationTrack.prototype.colliderManager = manager;
    }

    public getSlotTags(slotId: number) : Array<string> {
        return this.atlasLoader.slotIdToTagLookup[slotId];
    }

    public async getSkinSlotTexturesByTag(tag: string, skin: SkinParam) : Promise<Array<{ slotId: number, texture: PIXI.Texture }>> {
        if(skin.skinTexture) {
            const slots = this.atlasLoader.getSlotsForTexture(skin.skinTexture, skin.atlasName, tag);
            return Object.keys(slots).map(key => {
                return { slotId: parseInt(key), texture: slots[key] }
            }).flat();
        } else {
            if(!(skin.atlasName in this.atlasLoader.atlasNameToSkinNameToSlotTextures)) {
                throw new Error(`Invalid atlas name ${skin.atlasName}`)
            }
            const array = [];
            const slots = skin.skinUrl ?
                await this.atlasLoader.loadSkinSlotsByUrl(skin.atlasName, skin.skinUrl) :
                await this.atlasLoader.loadSkinSlots(skin.atlasName, skin.skinName)

            for(let slotId in slots) {
                const parsedSlotId = parseInt(slotId);
                if(this.atlasLoader.slotHasTag(parsedSlotId, tag)) {
                    array.push({ slotId: parsedSlotId, texture: slots[slotId] });
                }
            }
            return array;
        }
    }

    public static async Init(projectPath: string, initOptions?: InitOptions, loader?: any) : Promise<Gottimation> {
        if(!loader) {
            loader = new Loader(projectPath);
            await loader.initialize()
        }

        if(initOptions?.colliderManager) {
            Gottimation.useColliderManager(initOptions?.colliderManager)
        }

        if(!initOptions || !initOptions.renderer) {
            console.warn('No pixi renderer was passed in to init options, this will cause problems unless you use the renderer made in the gottimation constructor for the rest of your game rendering. (Accessed through gottimation.renderer)')
        }

        let lastTimestamp = 0;
        const timestampPath = `${projectPath}/last_edit_timestamp`;
        const globalProjectDataPath =`${projectPath}/project.json`
        const metaDataPath =`${projectPath}/meta.json`
        const preloadedSkins : Array<{ atlasName: string, skinId: string, texture: PIXI.Texture }> = [];


        const getAtlasDefaults = async (requester: (_url: string, boolParam?: boolean) => Promise<Blob>, atlasArray: Array<{ name: string }>, isHttpRequest: boolean) => {
            for(let i = 0; i < atlasArray.length; i++) {
                const a = atlasArray[i];
                const url = `${projectPath}/atlases/${a.name}/${DEFAULT_SKIN_ID}`;
                const imageData = await requester(url, !isHttpRequest) as Blob;
                if(!imageData) {
                    console.warn(`Failed to load default atlas image for atlas: ${a.name}`);
                    continue;
                }
                if(isHttpRequest && loader) {
                    await loader.saveImageData(url, imageData)
                }
                const finalTexture = await getTextureFromBlob(imageData);
                preloadedSkins.push({ atlasName: a.name, skinId: DEFAULT_SKIN_ID, texture: finalTexture })
            };
        }

        const requestAndSaveGlobalData = async () : Promise<GlobalRuntimeProjectData> => {
            const _globalData : GlobalRuntimeProjectData = await httpGetAsync(globalProjectDataPath);
            if(!_globalData) {
                throw new Error(`Could not find global project data at path ${_globalData}`)
            }
            if(loader) {
                await loader.saveJson(timestampPath, Date.now());
                await loader.saveJson(globalProjectDataPath, _globalData);
            }
            if(initOptions?.preloadAtlasDefaults) {
                await getAtlasDefaults(httpGetAsync, _globalData.atlases, true);
            }

            return _globalData;
        }

        let needsHttpRequest = true;
        try {
            lastTimestamp = await loader.loadJson(timestampPath, true);
        } catch(err){}
        if(!lastTimestamp) {
            const globalData = await requestAndSaveGlobalData();
            return new Gottimation(globalData, projectPath, loader, initOptions, preloadedSkins);
        } else {
            const metaData : ProjectMetaData = initOptions?.metaData || await httpGetAsync(metaDataPath);
            if(metaData && metaData.ts < lastTimestamp) {
                needsHttpRequest = false;
            }
            if(!metaData) {
                console.warn(`Did not find any meta.json file at ${metaDataPath} Could not adhoc updates, requesting global data.`)
            }
        }


        /*
        const metaData : ProjectMetaData = initOptions?.metaData || await httpGetAsync(metaDataPath);
        const neededSkeletonUpdates = [];
        const neededAtlasUpdates = [];

        for(let i = 0; i < metaData.skeletonEdits.length; i++) {
            const skelId = metaData.skeletonEdits[i];
            const ts = metaData.skeletonEdits[i+1];
            if(ts > lastTimestamp) {
                neededSkeletonUpdates.push(skelId);
            }
        }
        for(let i = 0; i < metaData.atlasEdits.length; i++) {
            const atlasId = metaData.atlasEdits[i];
            const ts = metaData.atlasEdits[i+1];
            if(ts > lastTimestamp) {
                neededAtlasUpdates.push(atlasId);
            }
        }

         */



        let globalData;
        if(needsHttpRequest) {
            globalData = await requestAndSaveGlobalData();
            return new Gottimation(globalData, projectPath, loader, initOptions, preloadedSkins);
        } else {
            globalData = await loader?.loadJson(globalProjectDataPath);
            if(!globalData) {
                console.warn(`Initialization expected local global data to be found but it was not, making http request.`)
            } else {
                if(initOptions.preloadAtlasDefaults) {
                    await getAtlasDefaults(loader.loadImageData.bind(loader), globalData.atlases, false);
                }
            }
        }
        if(!globalData) {
            globalData = await requestAndSaveGlobalData();
            return new Gottimation(globalData, projectPath, loader, initOptions);
        }
        //todo: this will be nice eventually to have the option of a web server or file server which can tell us which new files we'll need to get.
        if(initOptions?.adhocUpdateGetter) {
            try {
                const updates = initOptions.adhocUpdateGetter(lastTimestamp);
            } catch(err) {
                console.error(err);
            }
        }
        return new Gottimation(globalData, projectPath, loader, initOptions, preloadedSkins);
    }

    private _createSkeleton(name: string, opts?: SkeletonCreateOptions) : Skeleton {
        const skeletonData = this.skeletonData[name];
        if(!skeletonData) throw new Error(`Invalid skeleton name: ${name}. Not found in the lookup.`)
        const skeleton = new Skeleton(skeletonData, this.atlasLoader, opts?.activeSlotTextures, opts?.direction);
        if(opts?.action) {
            skeleton.play(opts.action, null, opts.playOptions);
        }
        return skeleton
    }
    public createSkeleton(name: string, opts?: SkeletonCreateOptions) : Skeleton {
        const skeleton = this._createSkeleton(name, opts);
        return skeleton;
    }
    public async createSkeletonWithAsyncOptions(name: string, opts: SkeletonCreateOptions) : Promise<{ skeleton: Skeleton, tracks: Array<AnimationTrack> }> {
        const skeleton = this._createSkeleton(name, opts);

        const tracks = opts.attachmentSlots ? opts.attachmentSlots.map(s => {
            return skeleton.mountAttachment(s.attachmentSlotName, s.attachmentName, s.action, s.playOptions)
        }) : []

        if(opts.skins) {
            const notloaded = [];
            for(let i = 0; i < opts.skins.length; i++) {
                if(this.atlasLoader.loadedSkins[opts.skins[i].skinName]) {
                    notloaded.push(opts.skins[i])
                }
            }
            await skeleton.setSkins(opts.skins)
        }
        return { skeleton, tracks };
    }
    public async preloadSkins(skins: Array<SkinParam>) : Promise<any> {
        const { valid } = validateSkinParams(skins);

        return null;
    }
}