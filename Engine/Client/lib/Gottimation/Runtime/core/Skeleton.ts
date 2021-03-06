import {AnimationTrack, defaultPlayOptions} from "./AnimationTrack";
import {Bone} from "./Bone";

import {ShapeData} from "../../types";
import {
    AnimationLookupData,
    InitializedSkeletonData,
    PlayOptions,
    SkinParam
} from "../types";

type AttachmentCallback = (attachmentSlotName: string, attachmentName: string, track: AnimationTrack) => void

import {SheetAtlas} from "./SheetAtlas";
import {LazyDynamicAtlasLoader} from "./Loaders/LazyDynamicAtlasLoader";
import {
    TrackAnimationEventListener,
    TrackAnimationFrameEventListener, TrackAttachmentChangeEventListener,
    TrackAttachmentEventListener, TrackFrameEventData,
    TrackMixin
} from "./Mixins/TrackMixin";
import {ColliderAdjustmentHandler, IColliderManager, SkeletonCreateOptions} from "../Gottimation";


export type SkeletonColliderToEntityLookup = {
}


export type ColliderManagerLookup = {
    [colliderId: number]: Array<Bone | AnimationTrack | Skeleton>
}

export type SkeletonEntityToColliderLookup = {
    bones: {
        [boneId: number]: {
            slot: number,
            attachmentSetups: {
            },
            baseSetups: {
                base: Array<number>,
            },
        }
    },
    animations: {
        [animationId: number]: {
        }
    }
}
export enum ColliderItemType {
    FREE_COLLIDER,
    BONE_COLLIDER,
    SLOT_BONE_COLLIDER,
}

export enum SkeletonStateType {
    BASE_SETUP,
    ATTACHMENT_SETUP,
    ATTACHMENT_SLOT_SETUP,
    PASSIVE_ANIMATION,
    MAIN_ANIMATION,
}

export type ColliderLookup = {
    [colliderId: number]: {
        shapeData: ShapeData
    }
}

export type ColliderTypeLookup = {
    [ColliderItemType.FREE_COLLIDER]: ColliderLookup,
    [ColliderItemType.BONE_COLLIDER]: ColliderLookup,
    [ColliderItemType.SLOT_BONE_COLLIDER]: ColliderLookup,
}

export type ColliderInstanceDatum = { type: SkeletonStateType, typeId: number | string, item: ColliderItemType, itemId: number, direction?: string };
export type ColliderDatum = { id: number | string, itemType: ColliderItemType, itemId: number, initterType: ColliderItemType, initterId: number | string };

export class Skeleton extends PIXI.Container implements TrackMixin {
    public nonSlotColliderLookup: {[colliderId: number]: ShapeData } = {};
    public colliderManager: IColliderManager;
    // OVERRIDED
    // bound to TrackMixin prototype from TrackMixin.ApplyMixin at construction
    public removeAllAnimationListeners : () => void;
    public emitFrameEvents : (frameEventName: string, action: string, data: TrackFrameEventData, track: AnimationTrack) => void;
    public emitAnimationEvents : (arrayName: string, action: string, track: AnimationTrack)  => void;
    public emitAttachmentEvents : (arrayName: string, attachmentSlotName: string, attachmentName: string, track: AnimationTrack)  => void;
    public action : string = '';
    public onEnd : (cb: TrackAnimationEventListener) => void;
    public offEnd : (cb: TrackAnimationEventListener) => void;
    public onStart : (cb: TrackAnimationEventListener) => void;
    public offStart : (cb: TrackAnimationEventListener) => void;
    public onChangedAttachment : (cb: TrackAttachmentChangeEventListener) => void;
    public offChangedAttachment: (cb: TrackAttachmentChangeEventListener) => void;
    public removeChildPassiveTracks: (action: string) => void;
    public addNeededChildPassiveTracks: (action: string, a: Array<AnimationTrack>, playOpts: PlayOptions) => void;

    public onRemovedAttachment: (cb : TrackAttachmentEventListener) => void;
    public offRemovedAttachment: (cb : TrackAttachmentEventListener) => void;
    public onAddedAttachment: (cb : TrackAttachmentEventListener) => void;
    public offAddedAttachment: (cb : TrackAttachmentEventListener) => void;
    public offEventListener: (array: Array<TrackAttachmentEventListener> | Array<TrackAnimationEventListener>, cb) => number;
    public onRemovedFromParent: (cb : (parent: TrackMixin) => void) => void;
    public onFrameEvent : (eventName: string, cb: TrackAnimationEventListener) => void;
    public offFrameEvent : (eventName: string, cb: TrackAnimationEventListener) => void;

    //required implementations for tag mixin.
    public _onRemovedFromParentListeners: Array<(parentTrack: TrackMixin) => void>;
    public _onFrameEventListeners:{[tag:  string]: Array<TrackAnimationFrameEventListener> };
    public _onEndListeners: Array<TrackAnimationEventListener>;
    public _onStartListeners: Array<TrackAnimationEventListener>;
    public _onEventListeners: Array<TrackAnimationEventListener>;
    public _onAddededListeners: Array<TrackAttachmentEventListener>;
    public _onRemovedListeners: Array<TrackAttachmentEventListener>;
    public _onChangeAttachmentListeners: Array<TrackAttachmentChangeEventListener>;
    public childTracks: Array<AnimationTrack>;
    public activePassiveAttachmentTracks: Array<AnimationTrack>;

    private childTracksImplicitlyPlayingCurrentAnimation : Array<AnimationTrack> = [];

    public slotsByBone: { [boneIndex: number]: Array<number> } = {};
    private _direction: string;
    public attachmentTracks: Array<AnimationTrack> = [];
    private activeAttachmentTracks: Array<AnimationTrack>;
    readonly attachmentSlots: { [slot: string]: AnimationTrack } = {};
    readonly attachments: { [attachment: string]: AnimationTrack } = {};
    public baseTrack: AnimationTrack = null;
    private currentPlayOpts: PlayOptions;
    readonly bones: { [boneId: number]: Bone } = {};
    private nameToIdMaps: {
        attachmentSlots: {},
        attachments: {},
        bones: {},
        colliders: {},
        slots: {},
        atlasses: {},
    }
    public highestTrack: AnimationTrack;
    readonly allActiveColliders: {[colliderId: number]: { shapeData: ShapeData, id: number, bone?: Bone  }} = {};

    readonly colliderUpdates: Array<any> = [];
    readonly allSlotColliderLookup: {[slotId: number]: Array<{ id: number, shapeData: ShapeData, tags?: Array<string> }>} = {};

    readonly skins: { [atlasName: string]: string };
    readonly attachmentBoneLookup: {[attachmentId: number]: { boneName: string, parentBone?: string }};
    readonly attachmentSlotBoneLookup: {[attachmentId: number]: { boneName: string, parentBone?: string }}
    readonly data: InitializedSkeletonData;
    readonly atlasLoader: LazyDynamicAtlasLoader;
    readonly animationLookup: AnimationLookupData;
    readonly attachmentAnimationLookups: { [attachmentName: string]: AnimationLookupData }
    //  readonly cachedBoneCalculations: {[attachmentId: number]: }

    readonly activeSlotTextures: { [slotId: number]: PIXI.Texture } = {};

    constructor(baseSkeletonData: InitializedSkeletonData, atlasLoader: LazyDynamicAtlasLoader, activeSlotTextures?, startingDirection?: string) {
        super();
        TrackMixin.ApplyMixin(this);
        this.activeSlotTextures = activeSlotTextures || {};
        this._direction = startingDirection ? startingDirection : baseSkeletonData.directions[0];
        this.skins = {};
        this.bones = {};
        // initialize the base skeleton bones
        /*
        if (baseSkeletonData.boneIds) {
            for (let i = 0; i < baseSkeletonData.boneIds.length; i++) {
                const id = baseSkeletonData.boneIds[i]
                this.bones[id] = new Bone(id, this);
                this.addChild(this.bones[id]);
            }
        }*/
        this.data = baseSkeletonData;
        this.atlasLoader = atlasLoader;
        this.animationLookup = baseSkeletonData.animations;
        this.baseTrack = new AnimationTrack(this, 0, this.activeSlotTextures, this.bones, this.atlasLoader.slotIdToColliderLookup, this.animationLookup, this.data.setupData, false);
        // since the base track isnt going to have the changeDirection call triggered or anything we explicitly apply the current direction setup frames.
        if(this.data.setupData) {
            if(this.data.setupData.addedBoneIds) {
                for (let i = 0; i < this.data.setupData.addedBoneIds.length; i++) {
                    const id =this.data.setupData.addedBoneIds[i];
                    this.bones[id] = new Bone(id, this);
                    this.addChild(this.bones[id]);
                }
                // @ts-ignore
            }
            this.baseTrack.applySetupData(this.data.setupData, true)
        }
        this.highestTrack = this.baseTrack;
        this.attachmentAnimationLookups = baseSkeletonData.attachmentAnimations
    }

    // overridden by Gottimation.ts on its construction.
    public static create: (name: string, opts: SkeletonCreateOptions) => Skeleton;
    public static createWithAsyncOptions: (name: string, opts: SkeletonCreateOptions) => Skeleton;

    public clone() : Skeleton {
        return new Skeleton(this.data, this.atlasLoader, { ...this.activeSlotTextures })
    }

    public getAllSlotCollidersWithTag(tag: string) : Array<{ id: number, shapeData: ShapeData, tags?: Array<string> }> {
        const array = [];
        for(let bone in this.bones) {
            const boneSlotColliders = this.bones[bone].slotColliderDatas;
            if(boneSlotColliders) {
                array.push(...boneSlotColliders.filter(c => c.tags?.includes(tag)));
            }
        }
        return array;
    }
    public getFirstSlotColliderWithTag(tag: string) : { id: number, shapeData: ShapeData, tags?: Array<string> } {
        for(let bone in this.bones) {
            const found = this.bones[bone].slotColliderDatas?.find(b => b.tags?.includes(tag));
            if (found) {
                const newShapeData = this.bones[bone].applyTransformToCollider(found.shapeData);
                return {...found, shapeData: newShapeData}
            }
        }
        return null;
    }

    public stop() {
        this.baseTrack.stop();
        if(this.data.setupData) {
            this.baseTrack.applySetupData(this.data.setupData, true)
        }
    }

    public play(actionName: string, direction?: string, playOptions?: PlayOptions) {
        playOptions = playOptions || defaultPlayOptions;
        if(direction && direction !== this._direction) {
            this.direction = direction;
        }
        this.currentPlayOpts = playOptions;

        if(this.action) {
            this.removeChildPassiveTracks(this.action)
        }
        this.action = actionName;
        this.baseTrack.play(actionName, playOptions);
        this.addNeededChildPassiveTracks(actionName, this.activeAttachmentTracks, playOptions)
    }

    public updateHighestTrack() {
        let highest = this.baseTrack;
        if(this.activeAttachmentTracks) {
            this.activeAttachmentTracks.forEach(t => {
                if(t.level > highest.level) {
                    highest = t;
                }
            })
        }
        if(highest !== this.highestTrack) {
            this.highestTrack = highest;
            highest.applyLastBoneOrder();
        }
    }

    public update(delta: number) {
        this.colliderUpdates.length = 0;

        this.baseTrack.update(delta);
        if(this.activeAttachmentTracks) {
            for(let i = 0; i < this.activeAttachmentTracks.length; i++) {
                this.activeAttachmentTracks[i].update(delta);
            }
        }
        this.colliderUpdates.forEach(u => {
        });
    }

    public getCollider(id: string | number) : ShapeData {
        return null;
    }

    public async setSkin(skin: SkinParam, updateBones=true) {
        let slots;
        if(skin.skinTexture) {
            slots = this.atlasLoader.getSlotsForTexture(skin.skinTexture, skin.atlasName);
        } else {
            slots = skin.skinUrl ?
                await this.atlasLoader.loadSkinSlotsByUrl(skin.atlasName, skin.skinUrl) :
                await this.atlasLoader.loadSkinSlots(skin.atlasName, skin.skinName)
        }

        this.skins[skin.atlasName] = skin.skinName ? skin.skinName : skin.skinUrl;

        for(let slot in slots) {
            this.activeSlotTextures[slot] = slots[slot];
        }

        //TODO: should only call update if the track utilizes bones that utilize the updated atlas name.
        let canSkipBonesAllTracks = {};
        if(updateBones) {
            for(let bone in this.bones) {
                this.bones[bone].determineNewTrackOverride();
            }
            /*
            console.error('UPDATING BONES!!!!!!!!!!!!');
            const walkFrameBones = (curFrameSkipMap, currentTrack, frameIndex) => {
                const frameDatum = currentTrack.currentAnimation.frameData[frameIndex];
                if(!frameDatum.bones) return;
                for (let j = 0; j < frameDatum.bones.length; j++) {
                    const b = frameDatum.bones[j]
                    if(canSkipBonesAllTracks[b.id] || curFrameSkipMap[b.id]) continue;
                    if(this.bones[b.id].curTrackOverride !== currentTrack) {
                        curFrameSkipMap[b.id] = true;
                    }
                    if (b.slotId) {
                        this.bones[b.id].texture = this.activeSlotTextures[b.slotId];
                        canSkipBonesAllTracks[b.id] = true;
                    }
                }
            }
            const walkTrackFrames = (t: AnimationTrack) => {
                const skipBonesForCurrentTrack = {};
                let i = t.currentFrame;
                if(t.isReverse) {
                    while(i < t.currentAnimation.frameData.length) {
                        walkFrameBones(skipBonesForCurrentTrack, t, i)
                        i++;
                    }
                } else {
                    while(i >= 0) {
                        walkFrameBones(skipBonesForCurrentTrack, t, i)
                        i--;
                    }
                }
            }
            walkTrackFrames(this.baseTrack);
            this.activeAttachmentTracks.forEach(walkTrackFrames);

             */
        }
    }

    public async setSkins(skins: Array<SkinParam>) {
        for(let i = 0; i < skins.length; i++) {
            const param = skins[i];
            if(!param.atlasName) continue;
            await this.setSkin(param, false);
        }
        //TODO: should probably be smarter about needing to call this.
        for(let bone in this.bones) {
            this.bones[bone].determineNewTrackOverride();
        }
    }

    public unmountAttachment(attachmentSlotName: string) {
        const curActive = this.attachmentSlots[attachmentSlotName];
        if(!curActive) throw new Error(`Skeleton did not have any attachment in the slot: ${attachmentSlotName} mounted.`);
        if(curActive !== this.attachments[curActive.attachment]) throw new Error(`Found mis match of expected attachment slot: ${attachmentSlotName} and attachment ${curActive.attachment}`)
        curActive.unmount();
        if(curActive === this.highestTrack) {
            this.updateHighestTrack();
        }
    }

    public _removeAttachmentFromLookups(attachmentSlotName, attachmentName) {
        const curActive = this.attachmentSlots[attachmentSlotName];
        if(!curActive) throw new Error(`Skeleton did not have any attachment in the slot: ${attachmentSlotName} mounted.`);
        delete this.attachmentSlots[attachmentSlotName];
        if(curActive !== this.attachments[attachmentName]) throw new Error(`Found mis match of expected attachment slot: ${attachmentSlotName} and attachment ${curActive.attachment}`)
        delete this.attachments[attachmentName];
        for(let i = 0; i< this.activeAttachmentTracks.length; i++) {
            if(this.activeAttachmentTracks[i] === curActive) {
                this.activeAttachmentTracks.splice(i, 1);
                break;
            }
        }
        if(curActive === this.highestTrack) {
            this.updateHighestTrack();
        }
    }

    /*
    public _resetBones(boneIds?: Array<number>) {
        if(boneIds) {

        } else {
            // children should always be bones.
            for(let i = 0; i < this.children.length; i++) {
                this.children[i].setTransform(0, 0, 1, 1, 0);
            }
            this.baseTrack._reapplyFramesToCurrent();
            for(let i = 0; i < this.activeAttachmentTracks.length; i++) {
                //TODO: can probably determine if the attachment is effected by whatever caused the reset and if so then only reapply the frames.
                this.activeAttachmentTracks[i]._reapplyFramesToCurrent();
            }
        }
    }

     */

    public logBoneOrder() {
        // @ts-ignore
        console.error('child:', Array.from(this.children).map(c => c.id));
    }

    public mountAttachment(attachmentSlotName: string, attachmentName: string, action?: string, playOptions?: PlayOptions) : AnimationTrack {
        const LOG = true;
        LOG && console.time(`mount ${attachmentSlotName}`)
        const attachmentSlotData = this.data.attachmentSlotData[attachmentSlotName];
        if(!(attachmentSlotData))
            throw new Error(`No slot with the name ${attachmentSlotName}`)

        const { level, attachmentData, parentAttachmentName } = attachmentSlotData;
        const nextAttachmentData = attachmentData[attachmentName]
        if(!(nextAttachmentData))
            throw new Error(`Attachment: ${attachmentName} is not a valid attachment for the slot ${attachmentSlotName}`);

        let parentTrack : TrackMixin;

        // if the attachment slot we're trying to add has a parent attachment, we need to confirm that the attachment is currently active.
        if(parentAttachmentName) {
            parentTrack = this.attachments[parentAttachmentName];
            if(!parentTrack)
                throw new Error(`Can not fill the attachment slot ${attachmentSlotName} because it requires the attachment: ${parentAttachmentName} be activated.`);
        } else {
            parentTrack = this;
        }

        // the current slot is already mounted, so we can call the unmount function with the param true to prevent frame data cascading away any attachment slot setupData.
        const persistedTrack = this.attachmentSlots[attachmentSlotName];
        persistedTrack?.unmount(true);

        const newTrack = persistedTrack ? persistedTrack : new AnimationTrack(this, level, this.activeSlotTextures, this.bones, this.atlasLoader.slotIdToColliderLookup);

        newTrack._updateAttachmentData(this.attachmentAnimationLookups[attachmentName], nextAttachmentData, attachmentSlotData);

        if(!this.activeAttachmentTracks) {
            this.activeAttachmentTracks = [newTrack];
            this.highestTrack = newTrack;
        } else {
            this.activeAttachmentTracks.push(newTrack);
            if(newTrack.level > this.highestTrack.level) {
                this.highestTrack = newTrack;
            }
        }
        this.attachments[attachmentName] = newTrack;
        this.attachmentSlots[attachmentSlotName] = newTrack;

        // only need to remount if the newTrack was not the persisted track.
        (newTrack !== persistedTrack) && newTrack._mountToParent(parentTrack);

        if(action) {
            newTrack.play(action, playOptions);
        }
        LOG && console.timeEnd(`mount ${attachmentSlotName}`)

        this.action && this.addNeededChildPassiveTracks(this.action, [newTrack], this.currentPlayOpts);

        return newTrack;
    }

    public reapplyBoneSortSetups(v: string) {
        const a1 = this.activeAttachmentTracks ? [...this.activeAttachmentTracks] : []
        const trackArray = [this.baseTrack, ...a1.sort((t, t2) => t.level - t2.level)]
        trackArray.forEach(a => {
            // @ts-ignore
            a.setupData?.attachmentSlot?.boneOrder && a.applyBoneSort(a.setupData.attachmentSlot.boneOrder, Array.from(this.children));
            // @ts-ignore
            const frames = a.setupData?.attachmentSlot?.frames;
            // @ts-ignore
            frames && frames[v] && frames[v].boneOrder && a.applyBoneSort(frames[v].boneOrder, Array.from(this.children))
            // @ts-ignore
            a.setupData?.attachment?.boneOrder && a.applyBoneSort(a.setupData.attachment.boneOrder, Array.from(this.children));
            // @ts-ignore
            const frames2= a.setupData?.attachment?.frames;
            // @ts-ignore
            frames2 && frames2[v] && frames2[v].boneOrder && a.applyBoneSort(frames2[v].boneOrder, Array.from(this.children));
        });
    }
    set direction(v: string) {
        if(v != this._direction) {
            this._direction = v;
            this.baseTrack.changeDirection(v);
            if(this.activeAttachmentTracks) {
                for(let i = 0; i < this.activeAttachmentTracks.length; i++) {
                    this.activeAttachmentTracks[i].changeDirection(v);
                }
            }
            this.reapplyBoneSortSetups(v);
        }
        // @ts-ignore
    }
    get direction() {return this._direction}
}