import {Skeleton} from "./Skeleton";
import {SheetSlot} from "./SheetSlot";
import {Bone, BoneFrameData} from "./Bone";
import {
    AnimationLookupData,
    AnimationData,
    InitializedAnimationData,
    AttachmentAnimationData,
    InitializedAttachmentData,
    InitializedAttachmentSlotData,
    PlayOptions,
    SlotColliderData,
    AnimationFrameData,
    ImplicitPlayOptions,
    InitializedSetupData,
    ColliderSetupData, ColliderAdjustedData, SetupFrameData, InitializedSetupFrameData
} from "../types";

import {
    TrackAnimationEventListener, TrackAnimationFrameEventListener, TrackAttachmentChangeEventListener,
    TrackAttachmentEventListener,
    TrackFrameEventData,
    TrackMixin
} from "./Mixins/TrackMixin";
import set = Reflect.set;
import {ColliderAdjustmentHandler, IColliderManager} from "../Gottimation";
import inv = PIXI.GroupD8.inv;
import {ShapeData} from "../../types";
export type EventData = {}
export type EventQueue = Array<(event: EventData) => void>

type IAttachmentTrackMixin = {
    onStart: (action: string, track: AnimationTrack) => void,
    onEnd: (action: string, track: AnimationTrack) => void,
    onEvent(eventName: string, payload?: {[prop: string]: string | number | boolean})
}


export const defaultPlayOptions = {
    loop: false,
    timeScale: 1,
    resetTimeOnDirectionChange: false,
    pausedPassiveTracks: false,
}

export type ImplicitTrackStateData = {
    isReverse: number,
    fromTrack: AnimationTrack,
    action: string,
    level: number,
    timeScale: number,
    frameSynced: boolean,
    timeSynced: boolean,
    elapsedTime: number,
    nextFrameTime: number,
    //   track: AnimationTrack,
    animations: {[direction: string]: InitializedAnimationData},
    loop: boolean,
}

type ColliderActionLookup = {
    added?:Array<ColliderSetupData>,
    adjusted?:Array<ColliderAdjustedData>
}

type TrackColliderSetupLookup = {
    attachment: ColliderActionLookup
    attachmentSlot: ColliderActionLookup
}


type BoneParam = BoneObjectParam | number | string;
type BoneObjectParam = { id: number, parentBoneId?: number }
export class AnimationTrack implements TrackMixin {
    // OVERRIDED
    // bound to TrackMixin prototype from TrackMixin.ApplyMixin at construction
    public removeAllAnimationListeners : () => void;
    public emitFrameEvents : (frameEventName: string, action: string, data: TrackFrameEventData, track: AnimationTrack) => void;
    public emitAnimationEvents : (arrayName: string, action: string, track: AnimationTrack)  => void;
    public emitAttachmentEvents : (arrayName: string, attachmentSlotName: string, attachmentName: string, track: AnimationTrack)  => void;

    public onEnd : (cb: TrackAnimationEventListener) => void;
    public offEnd : (cb: TrackAnimationEventListener) => void;
    public onStart : (cb: TrackAnimationEventListener) => void;
    public offStart : (cb: TrackAnimationEventListener) => void;
    public onChangedAttachment : (cb: TrackAttachmentChangeEventListener) => void;
    public offChangedAttachment: (cb: TrackAttachmentChangeEventListener) => void;
    private displayedBoneOrders: Array<string> = [];
    public onRemovedAttachment: (cb : TrackAttachmentEventListener) => void;
    public offRemovedAttachment: (cb : TrackAttachmentEventListener) => void;
    public onAddedAttachment: (cb : TrackAttachmentEventListener) => void;
    public offAddedAttachment: (cb : TrackAttachmentEventListener) => void;
    public offEventListener: (array: Array<TrackAttachmentEventListener> | Array<TrackAnimationEventListener>, cb) => number;
    public onRemovedFromParent: (cb : (parent: TrackMixin) => void) => void;
    public onFrameEvent : (eventName: string, cb: TrackAnimationEventListener) => void;
    public offFrameEvent : (eventName: string, cb: TrackAnimationEventListener) => void;
    private managingChildImplicitTracks : Array<AnimationTrack> = [];

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
    public parentTrack?: TrackMixin;
    public activePassiveAttachmentTracks: Array<AnimationTrack>;
    public removeChildPassiveTracks: (action: string) => void;
    public addNeededChildPassiveTracks: (action: string, a: Array<AnimationTrack>, playOpts: PlayOptions) => void;

    elapsedTime: number = 0;
    private nextFinished: number = 0;
    currentFrame: number;
    // private bones: Array<BoneData>;
    public currentFrameData: AnimationFrameData;
    public animationLookup: AnimationLookupData;
    private defaultAnimationLookup: AnimationLookupData;

    private passiveTracks: Array<AnimationTrack>;
    private pausedPassiveTracks: boolean = false;
    private didResetFrameDataOnPause: boolean = false;
    private explicitPausedPassiveActions: Array<string>;
    private _timeScale: number = 0;
    isReverse: boolean = false;

    public colliderManager?: IColliderManager;

    private activeAnimationStates: Array<PlayOptions & { elapsedTime: number, nextTime: number }> = [];

    private timeStepBeforePaused: number;
    private loop: boolean;
    private resetTimeOnDirectionChange: boolean;
    private direction: string;
    currentAction: string;
    private usingImplicit: boolean;

    public addedSlotBones: Array<Bone> = [];
    public addedAttachmentBones: Array<Bone> = [];

    private selfManagedImplicitTracks: Array<AnimationTrack> = [];
    private outerManagedImplicitActions: {[action: string]: AnimationTrack } = {};

    private overridedBoneParents: {[boneId: number]: number | string } ={};

    public lastAppliedBoneOrder: Array<number> = [];
    private currentImplicitAnimationIndex: number = -1;

    currentAnimation : InitializedAnimationData;

    private boneOrderWhenMounted : Array<number>;

    private actionToSlot: {[actionName: string]: string };
    readonly activeSlotTextures: {[slotId: number]: PIXI.Texture } = {};

    private eventQueue: {[eventName: string]:EventQueue } = {};

    readonly addedColliders: {[colliderId: number]: ShapeData} = {};

    readonly level: number;
    readonly alwaysSingleSlot: boolean;
    readonly bones: {[boneId: number]: Bone };
    readonly slotColliderLookup: {[slotId: number]: Array<SlotColliderData> } = {};
    readonly skeleton : Skeleton;
    public attachment: string;
    public attachmentSlot: string;
    public stopped: boolean;
    readonly id: number | string;
    readonly passive: boolean;
    public setupData: {
        attachment: InitializedSetupData,
        attachmentSlot: InitializedSetupData,
    } = { attachment: null, attachmentSlot: null }
    public handleColliderAdjustment : ColliderAdjustmentHandler;

    private colliderParentObjectParam;
    private passiveManager : AnimationTrack;

    constructor(skeleton: Skeleton, level: number, activeSlotTextures:  {[slotId: number]: PIXI.Texture } = {}, bones: {[boneId: number]: Bone}, slotColliderLookup: {[slotId: number] : Array<SlotColliderData> }, animationLookup?: AnimationLookupData, setupData?: InitializedSetupData, passive: boolean = false, id?: number, passiveManager?: AnimationTrack) {
        TrackMixin.ApplyMixin(this);
        if(setupData) {
            this.setupData.attachmentSlot = setupData;
        }
        this.id = id;
        this.passiveManager = passiveManager;
        this.passive = passive;
        this.stopped = false;
        this._timeScale = 0;
        this.isReverse = false;
        this.elapsedTime = -1;
        this.nextFinished = 0;
        this.animationLookup = animationLookup;
        this.direction = skeleton.direction;
        this.slotColliderLookup = slotColliderLookup;
        this.skeleton = skeleton;
        this.activeSlotTextures = activeSlotTextures;
        this.level = level;
        this.bones = bones;
        if(this.handleColliderAdjustment) {
            this.colliderParentObjectParam = { track: this, skeleton }
        }
        //    this.childTrack = new AnimationTrack();
        // this.bones = this.animationData.boneData;
    }


    set timeScale(v: number) {
        this._timeScale = v;
        const oldReverse = this.isReverse;
        this.isReverse = v < 0;
        if(this.isReverse !== oldReverse) {
            if(this.isReverse) {
                this.nextFinished = this.currentFrameData.time;
                if(this.nextFinished === this.elapsedTime) {
                    if(!this.currentFrame) {
                        // was on first frame so set elapsed time and frame to last frame
                        this.currentFrame = this.currentAnimation.frameData.length-1;
                        this.currentFrameData = this.currentAnimation.frameData[this.currentFrame];
                        this.elapsedTime = this.currentAnimation.endTime;
                    } else {
                        // want to go back 1.
                        this.currentFrame--;
                        this.currentFrameData = this.currentAnimation.frameData[this.currentFrame];
                    }
                    this.nextFinished = this.currentFrameData.time;
                }
            } else {
                if(this.currentFrame === this.currentAnimation.frameData.length - 1) {
                    this.nextFinished = this.currentAnimation.endTime;
                    if(this.elapsedTime === this.nextFinished) {
                        this.elapsedTime = 0;
                        this.currentFrame = 0;
                        this.currentFrameData = this.currentAnimation.frameData[0];
                        this.nextFinished =this.currentAnimation.frameData[1]?.time || this.currentAnimation.endTime;
                    }
                } else {
                    this.nextFinished = this.currentAnimation.frameData[this.currentFrame+1].time;
                    if(this.elapsedTime === this.nextFinished) {
                        if(this.elapsedTime === this.currentAnimation.endTime) {
                            this.elapsedTime = 0;
                            this.currentFrame = 0;
                            this.currentFrameData = this.currentAnimation.frameData[0];
                            this.nextFinished = this.currentAnimation.frameData[1].time;
                        } else {
                            this.currentFrame++
                            this.currentFrameData = this.currentAnimation.frameData[this.currentFrame];
                            this.nextFinished = this.currentAnimation.frameData[this.currentFrame + 1]?.time || this.currentAnimation.endTime;
                        }
                    }
                }
            }
        }
    }
    get timeScale() { return this._timeScale }
    public getCollider(id: string | number) : ShapeData {
        return null;
    }
    public _mountToParent(parentTrack: TrackMixin) {
        if(this.parentTrack) throw new Error('Expected no parent.')
        this.parentTrack = parentTrack;
        if(parentTrack.childTracks) {
            parentTrack.childTracks.push(this)
        } else {
            parentTrack.childTracks = [this];
        }
        while(parentTrack) {
            parentTrack.emitAttachmentEvents('_onAddededListeners', this.attachmentSlot, this.attachment, this);
            parentTrack = parentTrack.parentTrack;
        }
    }

    public setAttachment(attachmentName: string) {
        this.skeleton.mountAttachment(this.attachmentSlot, attachmentName)
    }

    public applyLastBoneOrder() {
        // @ts-ignore
        this.applyBoneSort(this.lastAppliedBoneOrder, Array.from(this.skeleton.children));
    }

    public applySetupData(setupData: InitializedSetupData, added: boolean) {
        const { bones, boneParentChanges, overriddenBones, frames, boneOrder } = setupData;

        this.toggleBoneSlotOverrides(overriddenBones, added, true);
        const addChild = (id, pid) => {
            let removeFrom : Bone;
            let addTo : Bone;
            const bone = this.bones[id];
            if(!added) {
                removeFrom = this.bones[pid];
                const oldBoneParentId = this.overridedBoneParents[id];
                if(oldBoneParentId) {
                    addTo = this.bones[oldBoneParentId];
                }
                delete this.overridedBoneParents[id];
            } else if(bone.parentBone?.id !== pid) {
                removeFrom = bone.parentBone;
                addTo = this.bones[pid];
                if(removeFrom) {
                    this.overridedBoneParents[id] = bone.parentBone.id;
                }
            }
            removeFrom?._removeChildBone(bone);
            addTo?._addChildBone(bone);
        }
        if(bones) {
            for(let i = 0; i < bones.length; i++) {
                const { parentBoneId, id } = bones[i];
                if(parentBoneId) {
                    addChild(id, parentBoneId);
                }
            }
        }
        if(boneParentChanges) {
            for(let i = 0; i < boneParentChanges.length; i+=2) {
                addChild(boneParentChanges[i], boneParentChanges[i+1]);
            }
        }
        if(added) {
            if(boneOrder) {
                this.lastAppliedBoneOrder = boneOrder;
                // @ts-ignore
                this.applyBoneSort(boneOrder, Array.from(this.skeleton.children));
                // this.applyLastBoneOrder();
            }
        }


        if(this.colliderManager) {
            if(!added) {
                // if we're removing setup data and the collider manager was present, we want to reapply the adjustments first from the current direction
                if(frames) {
                    this.applyDirectionalSetupFrame(added, frames[this.direction]);
                }
                this.applyAddedColliders(setupData, true);
            } else {
                // otherwise we want to make sure the colliders are added first.
                this.applyAddedColliders(setupData, false);
                if(setupData.frames) {
                    this.applyDirectionalSetupFrame(added, frames[this.direction]);
                }
            }
        } else {
            if(frames) {
                this.applyDirectionalSetupFrame(added, frames[this.direction]);
            }
        }
    }

    public _updateAttachmentData(animationLookup: AnimationLookupData, attachmentData: InitializedAttachmentData, attachmentSlotData: InitializedAttachmentSlotData) {
        const oldAttachmentName = this.attachment;
        //   console.log('attachment setup data:', attachmentSetupData)
        this.setupData.attachment = attachmentData?.setupData
        this.attachment = attachmentData?.name;
        this.animationLookup = animationLookup;

        // @ts-ignore
        this.boneOrderWhenMounted = this.skeleton.children.map(c => c.id);

        const initAttachmentAddedBones = (arrayFrom: Array<number | string>, arrayTo: Array<Bone>) => {
            if(arrayFrom) {
                for(let i = 0; i < arrayFrom.length; i++) {
                    const boneId = arrayFrom[i];
                    if(this.bones[boneId]) continue;
                    const bone = new Bone(boneId, this.skeleton);
                    this.bones[boneId] = bone;
                    this.skeleton.addChild(bone);
                    arrayTo.push(bone);
                }
            }
        }
        // changing attachment slot or didnt have an attachment slot already, initialize everything.
        if(this.attachmentSlot !== attachmentSlotData.name) {
            this.attachmentSlot = attachmentSlotData.name;
            //todo: make applySetupData take optional attachment, and optional sub attachment and remove this ugly stuff.
            initAttachmentAddedBones(attachmentSlotData.setupData?.addedBoneIds, this.addedSlotBones);
            initAttachmentAddedBones(attachmentData.setupData?.addedBoneIds, this.addedAttachmentBones);
            let parentTrack = this.parentTrack;
            while(parentTrack) {
                parentTrack.emitAttachmentEvents('_onAddededListeners', this.attachmentSlot, this.attachment, this);
                parentTrack = parentTrack.parentTrack;
            }
            if(attachmentSlotData.setupData) {
                this.setupData.attachmentSlot = attachmentSlotData.setupData;
                this.applySetupData(attachmentSlotData.setupData, true);
            } else {
                delete this.setupData.attachmentSlot;
            }
            // otherwise we only need to initialize the newly added attachment data.
        } else {
            initAttachmentAddedBones(attachmentData.setupData?.addedBoneIds, this.addedAttachmentBones);

            if(this._onChangeAttachmentListeners) {
                for(let i = 0; i < this._onChangeAttachmentListeners.length; i++) {
                    this._onChangeAttachmentListeners[i](this, this.attachment, oldAttachmentName);
                }
            }
            let parentTrack = this.parentTrack;

            //todo: need to organize this emition logic and for bubbling shit give the option to stop propagation/bubbling.
            while(parentTrack) {
                if(parentTrack['_onChangeAttachmentListeners']) {
                    for(let i = 0; i < parentTrack['_onChangeAttachmentListeners'].length; i++) {
                        parentTrack['_onChangeAttachmentListeners'][i](this, this.attachment, oldAttachmentName);
                    }
                }
                parentTrack = parentTrack.parentTrack;
            }
        }
        this.setupData.attachment && this.applySetupData(this.setupData.attachment, true);
    }

    private applySetupTextures() {
        if(this.setupData) {
            const { attachmentSlot, attachment } = this.setupData;
            if(attachmentSlot) {
                const { frames } = attachmentSlot;
                if(frames && frames[this.direction]) {
                    frames[this.direction].bones.forEach(b => {
                        if(b.slotId && this.bones[b.id]?.curTrackOverride === this) {
                            this.bones[b.id].changeSlot(b.slotId);
                        }
                    })
                }
            }
            if(attachment) {
                const { frames } = attachment;
                if(frames && frames[this.direction]) {
                    frames[this.direction].bones.forEach(b => {
                        if(b.slotId && this.bones[b.id]?.curTrackOverride === this) {
                            this.bones[b.id].changeSlot(b.slotId);
                        }
                    })
                }
            }
        }
    }

    public applyDirectionalSetupFrame(added: boolean, setupData: InitializedSetupFrameData & { overriddenBones?: Array<number | string>, }) {
        //    console.log('setup data:', setupData);
        if(setupData) {
            this.toggleBoneSlotOverrides(setupData.overriddenBones, added, true);
            this.applyFrame(setupData, !added);
        }
    }

    public toggleBoneSlotOverrides(boneIds: Array<number | string>, add: boolean, isSetupOverride: boolean) {
        if(!boneIds) return;
        if(add) {
            for(let i = 0; i < boneIds.length; i++) {
                this.bones[boneIds[i]]?.addSlotOverrideLevel(this, isSetupOverride)
            }
        } else {
            for(let i = 0; i < boneIds.length; i++) {
                this.bones[boneIds[i]]?.removeSlotOverrideLevel(this, isSetupOverride)
            }
        }
    }

    public mountAttachment(attachmentSlotName: string, attachmentName: string, action?: string, playOptions?: PlayOptions) : AnimationTrack {
        const expectedParent = this.skeleton.data.attachmentSlotData[attachmentSlotName].parentAttachmentName;
        if(expectedParent !== this.attachment) throw new Error(`Trying to mount an attachment slot: ${attachmentSlotName} and attachment: ${attachmentName} on a track that was expected to have its current attachment be ${expectedParent}. But the tracks current attachment is ${this.attachment}`);
        return this.skeleton.mountAttachment(attachmentSlotName, attachmentName, action, playOptions);
    }

    public unmountAttachment(attachmentSlotName: string) {
        const found = this.childTracks?.find(c => c.attachmentSlot === attachmentSlotName);
        if(!found) throw new Error(`Could not find attachment: ${attachmentSlotName} in the current tracks for the attachment ${this.attachment}`)
        if(found.parentTrack !== this) throw new Error(`Expected the parent track to be the current attachment trying to unmount it.`);
        found.unmount();
    }

    private clearPassiveTracks() {
        for(let i = 0; i < this.passiveTracks.length; i++) {
            const passiveTrack = this.passiveTracks[i];
            if(!passiveTrack.stopped && passiveTrack.currentAnimation) {
                passiveTrack.reapplyPreviousFrameDeltas(true);
                //TODO can optimize this by seeing if the bone is going to be deleted, no need to remove slot overrides if thats the case.
                const passiveOverriddenBones = passiveTrack.currentAnimation.overriddenBones;
                if(passiveOverriddenBones) {
                    for(let j = 0; j < passiveOverriddenBones.length; j++) {
                        this.bones[passiveOverriddenBones[j]].removeSlotOverrideLevel(passiveTrack, false)
                    }
                }
            }
        }
        // so we dont need to pollute the events, we have the track check to see if it's in the array of the skeleton's active passive tracks and removes itself.
        const skelsPassiveTracks =this.skeleton.activePassiveAttachmentTracks
        if(skelsPassiveTracks) {
            for(let i = 0; i < skelsPassiveTracks.length; i++) {
                if(skelsPassiveTracks[i] === this) {
                    skelsPassiveTracks.splice(i, 1);
                    if(!skelsPassiveTracks.length) {
                        delete this.skeleton.activePassiveAttachmentTracks;
                    }
                    break;
                }
            }
        }

        //TODO yikes cuz we gotta do n ancestors on passive tracks, this prob needs a new data struct

        // so we dont need to polute the events, we have the track check to see if it's in the array of its parent's active passive tracks and removes itself.
        const parentsPassiveTracks = this.parentTrack?.activePassiveAttachmentTracks
        if(parentsPassiveTracks) {
            for(let i = 0; i < parentsPassiveTracks.length; i++) {
                if(parentsPassiveTracks[i] === this) {
                    parentsPassiveTracks.splice(i, 1);
                    if(!parentsPassiveTracks.length) {
                        delete this.parentTrack.activePassiveAttachmentTracks;
                    }
                    break;
                }
            }
        }
        delete this.passiveTracks;
    }

    public unmount(keepSlot=false) {
        if(this.passive) throw new Error(`Passive animation tracks should never have unmounted called.`)
        this.reapplyPreviousFrameDeltas(true);
        this.passiveTracks && this.clearPassiveTracks();

        if(this.setupData.attachment) {
            this.applySetupData(this.setupData.attachment, false);
            this.setupData.attachment = null;
        }

        //todo: remove this.
        const LOG = false;
        LOG && console.time(`unmount ${this.attachmentSlot}`)
        //  console.log('unmounting... parentTrack:', !!this.parentTrack, 'c name:', this.attachmentSlot, this.attachment);
        if(!this.parentTrack && !this.passive) throw new Error(`Expected parent track.`);
        // keep ref since we might need to use it after we do the delete logic.

        let parentTrack = this.parentTrack;
        if(this.childTracks) {
            const childTracks = [...this.childTracks];
            delete this.childTracks;
            for(let i = 0; i < childTracks.length; i++) {
                const curChild = childTracks[i];
                curChild.unmount(false);
                //   this.emitAttachmentEvents('_onRemovedListeners', curChild.attachmentSlot, curChild.attachment, curChild);
                //   this.parentTrack.emitAttachmentEvents('_onRemovedListeners', curChild.attachmentSlot, curChild.attachment, curChild)
            }
        }

        const removeAttachmentAddedBones = (array: Array<Bone>) => {
            for(let i = 0; i < array.length; i++) {
                const bone = array[i];
                delete this.bones[bone.id];
                this.skeleton.removeChild(bone);
                bone.destroy(false);
            }
            array.length = 0;
        }

        // attachment slots can stay equipped while switching the attachment, this param will be false in that case and we wind up emitting a change event vs a remove event.
        if(!keepSlot) {
            //TODO: right now were not going to use this... i need to update the bone to have better extendability with deciding
            // which slot its supposed to use, it doesnt account for the same track having multiple setups
            // but i think it will actually work out because i make sure the order always applies the attachment setup AFTER the slot setup
            // so even if the attachment SLOT setup overrides the texture, the attachment will override it after if needed.
            // remove all bones that this track's attachment SLOT added.
            if(this.setupData.attachmentSlot) {
                this.applySetupData(this.setupData.attachmentSlot, false);
                this.setupData.attachmentSlot = null;
            }

            // removes both attachment slot and attachment reference from the skeleton.
            this.skeleton._removeAttachmentFromLookups(this.attachmentSlot, this.attachment);
            removeAttachmentAddedBones(this.addedSlotBones);

            const childTracks = this.parentTrack.childTracks;
            if(childTracks) {
                for(let i = 0; i < childTracks.length; i++) {
                    if(childTracks[i] !== this) continue;
                    childTracks.splice(i, 1);
                    if(!childTracks.length) delete this.parentTrack.childTracks;
                    break;
                }
            }
            delete this.parentTrack;

            if(this._onRemovedFromParentListeners) {
                for(let i = 0; i < this._onRemovedFromParentListeners.length; i++) {
                    this._onRemovedFromParentListeners[i](parentTrack);
                }
            }

            while(parentTrack) {
                parentTrack.emitAttachmentEvents('_onRemovedListeners', this.attachmentSlot, this.attachment, this);
                parentTrack = parentTrack.parentTrack;
            }
        } else {
            // only removing the attachment reference.
            delete this.skeleton.attachments[this.attachment];
            if(this.setupData.attachmentSlot) {
                this.setupData.attachmentSlot.overriddenBones?.forEach(b => {
                    this.skeleton.bones[b].determineNewTrackOverride()
                });
                const frames = this.setupData.attachmentSlot.frames;
                frames[this.direction]?.overriddenBones?.forEach(b => {
                    this.skeleton.bones[b].determineNewTrackOverride()
                })
            }
        }

        // remove all bones that this track's attachment animation track added.
        removeAttachmentAddedBones(this.addedAttachmentBones);
        this.toggleBoneSlotOverrides(this.currentAnimation?.overriddenBones, false, false);
        this.currentAction = '';
        this.currentAnimation = null;
        this._timeScale = 0;
        this.isReverse = false;
        this.elapsedTime = -1;
        this.nextFinished = 0;
        if(this.childTracks) throw new Error(`Expected child tracks to get deleted if we had them by the end of unmount.`)
        LOG && console.timeEnd(`unmount ${this.attachmentSlot}`)
        if(this.boneOrderWhenMounted) {
            // @ts-ignore
            this.applyBoneSort(this.boneOrderWhenMounted, Array.from(this.skeleton.children));
            this.boneOrderWhenMounted = null;
        }
    }

    public computeCurrentSlotForBone(boneId, fromSetup?: boolean) : number | string {
        const attachmentSetupFrame = this.setupData.attachment?.frames ? this.setupData.attachment.frames[this.direction] : null;
        const attachmentSlotSetupFrame = this.setupData.attachmentSlot?.frames ? this.setupData.attachmentSlot.frames[this.direction] : null;

        //TODO: can probably optimize this by keeping the setup slotId : boneId in a lookup when changing direction.
        const setupCheck = () => {
            if(attachmentSetupFrame && attachmentSetupFrame.bones) {
                for(let i = 0; i < attachmentSetupFrame.bones.length; i++) {
                    const { id, slotId, hide } = attachmentSetupFrame.bones[i];
                    if(id == boneId) {
                        if(hide) {
                            return -1;
                        } else if(slotId) {
                            return slotId;
                        }
                    }
                }
            }
            if(attachmentSlotSetupFrame && attachmentSlotSetupFrame.bones) {
                for(let i = 0; i < attachmentSlotSetupFrame.bones.length; i++) {
                    const { id, slotId, hide } = attachmentSlotSetupFrame.bones[i];
                    if(id == boneId) {
                        if(hide) {
                            return -1;
                        } else if(slotId) {
                            return slotId;
                        }
                    }
                }
            }
            return null;
        }

        if(fromSetup) {
            const slotId = setupCheck();
            if(slotId) {
                return slotId;
            }
        }
        if(!this.currentAnimation) {
            return -1;
        }

        let i = this.currentFrame;

        if(this.isReverse) {
            while(i < this.currentAnimation.frameData.length) {
                const curFrame = this.currentAnimation.frameData[i];
                for(let j = 0; j < curFrame.bones.length; j++) {
                    const bone = curFrame.bones[j];
                    if(bone.id == boneId) {
                        if(bone.slotId) {
                            return bone.slotId;
                        } else if(bone.hide) {
                            return -1;
                        }
                    }
                }
                i++;
            }
        } else {
            while(i >= 0) {
                const curFrame = this.currentAnimation.frameData[i];
                for(let j = 0; j < curFrame.bones.length; j++) {
                    const bone = curFrame.bones[j];
                    if(bone.id == boneId) {
                        if(bone.slotId) {
                            return bone.slotId;
                        } else if(bone.hide) {
                            return -1;
                        }
                    }
                }
                i--;
            }
        }
        // still didnt find a slotId for the bone, check to see if any of the setups have a slotId.
        if(!fromSetup) {
            const slotId = setupCheck();
            if(slotId) {
                return slotId;
            }
        }
        return -1;
    }

    public applyCurrentFrameSlotTextures() {
        const bones = this.currentFrameData.bones;
        if(bones) {
            for(let i = 0; i < bones.length; i++) {
                const bone = this.bones[bones[i].id];
                if(bone.curTrackOverride === this) {
                    if(bones[i].slotId) {
                        bone.changeSlot(bones[i].slotId);
                    } else if (bones[i].hide) {
                        bone.changeSlot(-1);
                    }
                }
            }
        }
    }
    public setTimeScale(action: string, newTimeScale: number) {
    }

    //TODO: this needs tests.
    public setElapsedTime(newTime: number) {
        if(newTime > this.currentAnimation.endTime) {
            newTime = this.currentAnimation.endTime;
        }

        if(this.isReverse) {
            throw new Error(`Unimplmented`)
        } else {
            // trying to go back.. so reset animation and then apply accordingly.
            if(newTime < this.nextFinished) {
                this.reapplyPreviousFrameDeltas(true);
                this.resetCurrentAnimationState();
            }
            if(newTime > this.nextFinished) {
                let delta = newTime;
                while(delta > 0) {
                    let neededDiff = this.nextFinished-this.elapsedTime;
                    delta -= neededDiff;
                    if(delta < 0) {
                        neededDiff= Math.max(0, neededDiff-Math.abs(delta));
                    }
                    this.update(neededDiff);
                }
            } else {
                this.update(newTime - this.elapsedTime)
            }
        }
    }

    public reapplyPreviousFrameDeltas(inverse?: boolean) {
        if(this.didResetFrameDataOnPause) return;
        if(this.isReverse) {
            for(let i = 0; i <= this.currentFrame; i++) {
                this.applyFrame(this.currentAnimation.frameData[i], inverse);
            }
        } else {
            if(inverse) {
                for(let i = this.currentFrame; i >= 0; i--) {
                    this.applyFrame(this.currentAnimation.frameData[i], inverse);
                }
            } else {
                for(let i = 0; i <= this.currentFrame; i++) {
                    this.applyFrame(this.currentAnimation.frameData[i], inverse);
                }
            }
        }
    }


    public changeDirection(d: string) {
        if(!this.passive) {
            const { attachment, attachmentSlot } = this.setupData;
            if(attachment && attachment.frames) {
                this.applyDirectionalSetupFrame(false, attachment.frames[this.direction]);
                if(attachmentSlot && attachmentSlot.frames) {
                    this.applyDirectionalSetupFrame(false, attachmentSlot.frames[this.direction]);
                    this.applyDirectionalSetupFrame(true, attachmentSlot.frames[d])
                }
                this.applyDirectionalSetupFrame(true, attachment.frames[d]);
            } else if (attachmentSlot && attachmentSlot.frames) {
                this.applyDirectionalSetupFrame(false, attachmentSlot && attachmentSlot.frames[this.direction]);
                this.applyDirectionalSetupFrame(true, attachmentSlot && attachmentSlot.frames[d])
            }
        }
        this.direction = d;
        if(this.currentAction) {
            const previousAnimation = this.currentAnimation;
            previousAnimation && this.reapplyPreviousFrameDeltas(true);
            this.currentAnimation = this.animationLookup[this.currentAction][d];
            if(this.currentAnimation) {
                const frameLen = this.currentAnimation.frameData.length;
                if(this.elapsedTime >= this.currentAnimation.endTime) {
                    this.currentFrame = 0;
                    this.elapsedTime = 0;
                } else {
                    for(let i = 0; i < frameLen; i++) {
                        const curFrame = this.currentAnimation.frameData[i];
                        const nextFrame = this.currentAnimation.frameData[i+1];
                        if(this.elapsedTime >= curFrame.time && (!nextFrame || nextFrame.time > this.elapsedTime)) {
                            this.currentFrame = i;
                            this.currentFrameData = curFrame;
                            break;
                        }
                    }
                }
                this.updateAnimationBoneOverrides(previousAnimation);
                if(!previousAnimation) {
                    this.currentFrame = 0;
                    this.elapsedTime = 0;
                    this.nextFinished = this.currentAnimation.frameData[0].time;
                } else {
                    this.nextFinished = this.currentFrame === frameLen - 1 ? this.currentAnimation.endTime : this.currentAnimation.frameData[this.currentFrame+1].time;
                }
                this.currentFrameData = this.currentAnimation.frameData[this.currentFrame];
                this.reapplyPreviousFrameDeltas();
            } else {
                this.updateAnimationBoneOverrides(previousAnimation);
            }
        }
        if(this.passiveTracks) {
            for(let i = 0; i < this.passiveTracks.length; i++) {
                this.passiveTracks[i].changeDirection(d);
            }
        }
    }

    public addPassiveTrack(action: string, playOpts: PlayOptions)  {
        if(this.animationLookup[action]) {
            const track = new AnimationTrack(this.skeleton, this.level, this.activeSlotTextures, this.bones, this.slotColliderLookup, this.animationLookup, null,true, null, this);
            if(!this.passiveTracks) {
                this.passiveTracks = [track]
            } else {
                this.passiveTracks.push(track);
            }
            track.attachmentSlot = this.attachmentSlot;
            track.attachment = this.attachment;
            track.play(action, playOpts);
            if(this.pausedPassiveTracks && (!this.explicitPausedPassiveActions || this.explicitPausedPassiveActions.includes(action))) {
                track.pause(true);
            }
            if(!playOpts.loop) {
                track.onEnd(() => {
                });
            }
            return true;
        }
        return false;
    }

    public removePassiveTrack(action: string) {
        for(let i = 0; i < this.passiveTracks.length; i++) {
            if(this.passiveTracks[i].currentAction === action) {
                if(!this.passiveTracks[i].didResetFrameDataOnPause) {
                    const prevAni = this.passiveTracks[i].currentAnimation;
                    if(prevAni) {
                        this.passiveTracks[i].reapplyPreviousFrameDeltas(true);
                        this.passiveTracks[i].currentAnimation = null;
                        this.passiveTracks[i].updateAnimationBoneOverrides(prevAni);
                    }
                }
                this.passiveTracks.splice(i, 1);
                if(!this.passiveTracks.length) {
                    delete this.passiveTracks;
                }
                return true;
            }
        }
        return false;
    }

    private resetCurrentAnimationState() {
        if(this.isReverse) {
            this.currentFrame = this.currentAnimation.frameData.length - 1;
            this.currentFrameData = this.currentAnimation.frameData[this.currentFrame];
            this.elapsedTime = this.currentAnimation.endTime;
            this.nextFinished = this.currentAnimation.frameData[this.currentFrame].time || 0;
            // will catch it up to the last frame.
            this.reapplyPreviousFrameDeltas()
        } else {
            // dont need to reapply since by default we reset the frame deltas this.reapplyPreviousFrameDeltas(true);
            this.currentFrame = 0;
            this.currentFrameData = this.currentAnimation.frameData[this.currentFrame];
            this.elapsedTime = 0;
            this.nextFinished = this.currentAnimation.frameData[1]?.time || this.currentAnimation.endTime;
            !this.didResetFrameDataOnPause && this.applyFrame(this.currentFrameData);
        }
    }

    public play(action: string, playOptions: PlayOptions) {
        this.stopped = false;
        //      console.log('playing action', action, 'opts:', playOptions)
        playOptions = playOptions ? playOptions : defaultPlayOptions
        if(!(action in this.animationLookup) && !this.passive) {
            throw new Error(`Invalid action: ${action} being played on animation track. The only valid animations for this track are ${Object.keys(this.animationLookup).join(', ')}`)
        }
        const previousAnimation = this.currentAnimation;
        previousAnimation && this.reapplyPreviousFrameDeltas(true);

        this.currentAnimation = this.animationLookup[action][this.direction];
        if(!this.currentAnimation && !this.passive) {
            throw new Error(`Missing direction: ${this.direction} for animation ${action} on animation track: ${this.attachment} : ${this.attachmentSlot}`)
        }
        if(!this.passive) {
            //    console.log('yo played somethin')
            if(playOptions.stopPassiveActions) {
                // the playOptions.stopPassiveActions was a boolean so we dont have any explicit paused passive actions and will pause all.
                if(playOptions.stopPassiveActions === true) {
                    delete this.explicitPausedPassiveActions;
                    if(this.passiveTracks) {
                        for(let i = 0; i < this.passiveTracks.length; i++) {
                            //      console.log('PAWSING')
                            this.passiveTracks[i].pause(true);
                        }
                    }
                } else { // the playOptions.stopPassiveActions was an array of strings, so we only want to pause passive tracks that are handling those actions.
                    this.explicitPausedPassiveActions = [...(<Array<string>>playOptions.stopPassiveActions)];

                    //TODO: might be worth it to keep an array of paused tracks. but an extra few iterations probabyl wont make any difference and resume function just flips the stop flag.
                    if(this.passiveTracks) {
                        for(let i = 0; i < this.passiveTracks.length; i++) {
                            this.passiveTracks[i].resume();
                        }
                        for(let i = 0; i < this.explicitPausedPassiveActions.length; i++) {
                            for(let j = 0; j < this.passiveTracks.length; j++) {
                                if(this.passiveTracks[j].currentAction === playOptions.stopPassiveActions[i]) {
                                    this.passiveTracks[j].pause(true);
                                    break;
                                }
                            }
                        }
                    }
                }
            } else if(this.pausedPassiveTracks) {
                delete this.explicitPausedPassiveActions;
                if(this.passiveTracks) {
                    for(let i = 0; i < this.passiveTracks.length; i++) {
                        this.passiveTracks[i].resume();
                    }
                }
            }
        }
        this.pausedPassiveTracks = !!playOptions.stopPassiveActions;
        this.usingImplicit = false;
        this.loop = playOptions.loop;
        this.resetTimeOnDirectionChange = playOptions.resetTimeOnDirectionChange;
        this._timeScale = playOptions?.timeScale || this._timeScale || 1;
        this.isReverse = this._timeScale < 0;
        const prevAction = this.currentAction;
        this.currentAction = action;
        this.currentAnimation && this.resetCurrentAnimationState();
        this.updateAnimationBoneOverrides(previousAnimation);
        this.emitAnimationEvents('_onStartListeners', action, this);
        this.skeleton.emitAnimationEvents('_onStartListeners', action, this);
        this.removeChildPassiveTracks(prevAction)
        if(this.childTracks) {
            this.addNeededChildPassiveTracks(action, this.childTracks, playOptions)
        }
        this.skeleton.reapplyBoneSortSetups(this.direction);
        if(playOptions.startTime) {
            this.setElapsedTime(playOptions.startTime);
        }
    }

    private updateAnimationBoneOverrides(previousAnimation) {
        // if this flag is set then we dont need to worry about updating the bone overrides now, it will be fixed when/if we resume the attachment track
        if(this.didResetFrameDataOnPause) return;
        //TODO: no need to update bone overrides if the track level is 0, since bones by default utilize a 0 level. figure out if its worth it to just return early
        //if(!this.level) return;
        //   console.log('prev:', previousAnimation)
        if(this.currentAnimation?.overriddenBones) {
            if(!previousAnimation?.overriddenBones) {
                for(let i = 0; i < this.currentAnimation.overriddenBones.length; i++) {
                    //   console.log('ADDING BONE OVERRIDE',this.currentAnimation.overriddenBones[i] )
                    this.bones[this.currentAnimation.overriddenBones[i]].addSlotOverrideLevel(this, false);
                }
            } else if(previousAnimation.overriddenBones !== this.currentAnimation.overriddenBones) {
                for(let i = 0; i < previousAnimation.overriddenBones.length; i++) {
                    //   console.log('2REMOVING BONE OVERRIDE',previousAnimation.overriddenBones[i] )
                    this.bones[previousAnimation.overriddenBones[i]].removeSlotOverrideLevel(this, false);
                }
                for(let i = 0; i < this.currentAnimation.overriddenBones.length; i++) {
                    //     console.log('2ADDING BONE OVERRIDE',this.currentAnimation.overriddenBones[i] )
                    this.bones[this.currentAnimation.overriddenBones[i]].addSlotOverrideLevel(this, false);
                }
            }
        } else if (previousAnimation?.overriddenBones) {
            for(let i = 0; i < previousAnimation.overriddenBones.length; i++) {
                //     console.log('3REMOVING BONE OVERRIDE',previousAnimation.overriddenBones[i] )
                this.bones[previousAnimation.overriddenBones[i]].removeSlotOverrideLevel(this, false);
            }
        }
    }

    private _playNextImplicit() {
        this.usingImplicit = true;
        let action, playOptions;
        for(let i = this.level; i >= 0; --i) {
            //({ action, playOptions } = this.implicitAnimationActionStack[i]);
            if(this.animationLookup[action]) {
                this.resetTimeOnDirectionChange = playOptions.resetTimeOnDirectionChange;
                this.loop = playOptions.loop;
                this.currentImplicitAnimationIndex = i;
                break;
            }
        }
        if(action) {
            this.currentAction = action;
            this.currentAnimation = this.animationLookup[action][this.direction];
        } else {
            //  this.currentAnimation = this.animations.default[this.skeleton.direction];
            throw new Error(`No implicit`)
        }
        this.elapsedTime = 0;
        this.nextFinished = 0;
        this.currentFrame = 0;
        this.currentFrameData = this.currentAnimation.frameData[0];
        this.applyFrame(this.currentFrameData);
    }

    public pause(resetFrames=false) {
        this.stopped = true;
        // if we want to reset and havent already pausedAtFrame we need to reapply all the previous frame deltas before pausing.
        if(resetFrames && !this.didResetFrameDataOnPause) {
            this.reapplyPreviousFrameDeltas(true);
            if(this.currentAnimation?.overriddenBones) {
                for(let i = 0; i < this.currentAnimation.overriddenBones.length; i++) {
                    this.bones[this.currentAnimation.overriddenBones[i]].removeSlotOverrideLevel(this, false)
                }
            }
        }
        // dont want to change this flag if we were either already reset on pause,
        // if we werent then we want to set it to what the resetFrames value was.
        this.didResetFrameDataOnPause = this.didResetFrameDataOnPause || resetFrames;
    }
    public resume() {
        this.stopped = false;
        if(this.didResetFrameDataOnPause) {
            this.didResetFrameDataOnPause = false;
            this.reapplyPreviousFrameDeltas(false);
            if(this.currentAnimation?.overriddenBones) {
                for(let i = 0; i < this.currentAnimation.overriddenBones.length; i++) {
                    this.bones[this.currentAnimation.overriddenBones[i]].addSlotOverrideLevel(this, false)
                }
            }
        }
        this.didResetFrameDataOnPause = false;
    }

    public stop() {
        this.stopped = true;
        if(this.currentAnimation) {
            this.reapplyPreviousFrameDeltas(true);
            this.resetCurrentAnimationState();
        }
    }

    public start() {
        this.stopped = false;
    }

    private applyBones() {
        const bones = this.currentFrameData.bones;
        for(let i = 0; i < bones.length; i++) {
            const boneId = bones[i].id;
            // const slotsToApplyTo = this.bones[boneId];
            //    for(let j = 0; j < this.slotsByBone[boneId].length; j++) {
            //  }
        }
    }

    /*
    private getCascadedBoneFrameData(boneId: number) : { x: number, y: number, scaleX: number, scaleY: number, rotation: number } {
        const defaultFrameData = { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 };

        if(this.managedBones[boneId]) {
            this.currentFrameData.bones.find(b => boneId == b.id);
        }

        if(this.parentTrack) {
            const d = this.parentTrack.getCascadedBoneFrameData()
        }
    }

     */

    public applyAddedColliders(data: InitializedSetupData, inverse?: boolean) {
        if (data.addedColliders) {
            if (inverse) {
                for (let i = 0; i < data.addedColliders.length; i++) {
                    const { boneId, id } = data.addedColliders[i];
                    this.colliderManager.onRemoved(this.colliderParentObjectParam, id);
                    delete this.skeleton.nonSlotColliderLookup[id];
                    if(boneId) {
                        this.skeleton.bones[boneId].removeColliderId(id);
                    }
                }
            } else {
                for (let i = 0; i < data.addedColliders.length; i++) {
                    const c = data.addedColliders[i] as ColliderSetupData;
                    this.colliderManager.onAdded(this.colliderParentObjectParam, c);
                    this.skeleton.nonSlotColliderLookup[c.id] = c.shapeData;
                    if(c.boneId) {
                        this.skeleton.bones[c.boneId].addColliderId(c.id);
                    }
                }
            }
        }
    }


    public applyFrame(data: InitializedSetupFrameData, inverse?: boolean) {
        if(data.adjustedColliders) {
            for(let i = 0; i < data.adjustedColliders.length; i++) {
                const cur = data.adjustedColliders[i];
                this.skeleton.nonSlotColliderLookup[cur.id] = cur.shapeData;
                this.colliderManager.onAdjusted(this.colliderParentObjectParam, cur, inverse);
            }
        }
        if(data.bones) {
            for(let i = 0; i < data.bones.length; i++) {
                const boneData = data.bones[i];
                const bone: Bone = this.bones[boneData.id];
                if(!bone) continue;
                // @ts-ignore
                if(this.skeleton.children[i]?.id != boneData.id) {
                    //this.skeleton.setChildIndex(bone, i);
                }
                if(bone.curTrackOverride === this) {
                    if(boneData.slotId) {
                        bone.changeSlot(boneData.slotId);
                        const slotColliders = this.slotColliderLookup[boneData.slotId];
                        if(slotColliders) {
                            for(let i = 0; i < slotColliders.length; i++) {
                                // bone.updateCollider(slotColliders[i])
                            }
                        }
                    } else if(boneData.hide) {
                        this.bones[boneData.id].visible = false;
                    }
                }
                bone.applyTrackTransform(boneData, inverse);
                //TODO: need to implement boneOrder param so we only do this logic when we need to.
            }
        }
        if(data.boneOrder) {
            // @ts-ignore
            this.applyBoneSort(data.boneOrder, Array.from(this.skeleton.children));
        }
        // @ts-ignore
        this.lastAppliedBoneOrder = Array.from(this.skeleton.children).map(c => c.id)

        /*}
            return;
            // @ts-ignore
            data.boneOrder = data.boneOrder.map(b => parseInt(b));
            this.skeleton.children.sort((a, b) => {
                // @ts-ignore
                return data.boneOrder.indexOf(parseInt(a.id)) - data.boneOrder.indexOf(parseInt(b.id));
            });
            // @ts-ignore
            const curOrderedBoneOrder2 = this.skeleton.children.filter(c => data.boneOrder.find(o => o == c.id));
            for(let i = 0; i < data.boneOrder.length; i++) {
                // @ts-ignore
                if(curOrderedBoneOrder2[i].id != data.boneOrder[i]) {
                    throw new Error(`Incorrect.`)
                }
            }
        }

         */

        /*
            const curOrderedBoneOrder = this.skeleton.children.filter(c => data.boneOrder.find(o => o == c.id));
            for(let i = 0; i < data.boneOrder.length; i++) {
                // @ts-ignore
                if(curOrderedBoneOrder[i].id != data.boneOrder[i]) {
                    const expectedIndex = this.skeleton.children.indexOf(curOrderedBoneOrder[i]);
                    const bone = this.bones[data.boneOrder[i]];
                    console.error('MOVING TO EXPECTED INDEX', expectedIndex);
                    console.error('this index WAS', this.skeleton.children.indexOf(bone));
                    this.skeleton.setChildIndex(bone, Math.max(expectedIndex, 0));
                }
            }

        }
         */



        /*
        if(this.colliderManager && data.adjustedColliders) {
            for(let i = 0; i < data.adjustedColliders.length; i++) {
                const cur = data.adjustedColliders[i];
                this.colliderManager.onAdjusted(this.colliderParentObjectParam, cur.id as number, cur.shapeData, cur.rotation, cur.scaleX, cur.scaleY, cur.add, cur.remove);
            }
        }

         */
    }

    public applyBoneSort(appliedBoneOrder: Array<number>, arrayToSort: Array<Bone>) {
        const before = arrayToSort.map(a => a.id);

        appliedBoneOrder = appliedBoneOrder.filter(b => {
            return this.skeleton.bones[b];
        });
        const logBeforeAndAfter = () => {
            console.error('applied bone sort', appliedBoneOrder);
            // @ts-ignore
            const after = Array.from(this.skeleton.children).map(a => a.id);
            console.log('before:', before);
            console.log('after:', after);
        }

        if(appliedBoneOrder.length === 1) {
            const c = arrayToSort.find(c => c.id == appliedBoneOrder[0]);
            this.skeleton.removeChild(c);
            this.skeleton.addChildAt(c, 0);
            // logBeforeAndAfter();
            return
        };


        // map the bones that apply for this sort.
        const newOrderArray : Array<Bone> = appliedBoneOrder.map(b => {
            const bone : Bone = arrayToSort.find(b2=>b2.id==b);
            if(!bone) {
                console.error(b, bone, appliedBoneOrder, b);
                throw new Error(`wtf`);
            }
            return bone;
        });
        const sortedLen = newOrderArray.length;

        arrayToSort.forEach((bone, i) => {
            if(!newOrderArray.includes(bone)) {
                const idxAt = i<=sortedLen?i:i-1;
                newOrderArray.splice(idxAt, 0, bone);
            }
        });
        this.assertBoneArraysContainSameBones(this.skeleton.children, newOrderArray);
        this.skeleton.removeChildren();
        newOrderArray.forEach(a => this.skeleton.addChild(a))
            //   logBeforeAndAfter();
    }

    //todo: remove
    private assertBoneArraysContainSameBones(a1, a2) {
        if(!(a1.every(b1 => a2.includes(b1)))) {
            throw new Error(`not same.`)
        }
    }

    private handleLoopedAnimationFinished(leftOverDelta: number) {
        if(this.isReverse) {
            let nextCurFrame = this.currentAnimation.frameData.length-1;
            for(let i = 1; i <= nextCurFrame; i++) {
                // reset the animation back to first frame.
                this.applyFrame(this.currentAnimation.frameData[i], false);
            }
            this.currentFrame = nextCurFrame;
            this.currentFrameData = this.currentAnimation.frameData[this.currentFrame];
            this.elapsedTime = this.currentAnimation.endTime + leftOverDelta;
            this.nextFinished = this.currentFrameData.time;
            //todo: for now im just going to reset overflows
            if(this.elapsedTime <= this.nextFinished) {
                this.elapsedTime = this.currentAnimation.endTime
            }
        } else {// if it gets here currentFrame was the length of frame data so subtract 1 so reapply works correctly.
            this.currentFrame--;
            for(let i = this.currentFrame; i >= 1; i--) {
                // reset the animation back to first frame.
                this.applyFrame(this.currentAnimation.frameData[i], true);
            }
            this.applySetupTextures();
            this.currentFrame = 0;
            this.currentFrameData = this.currentAnimation.frameData[0];
            this.elapsedTime = this.currentFrameData.time + leftOverDelta;
            this.nextFinished = this.currentAnimation.frameData[1]?.time || this.currentAnimation.endTime;
            //todo: for now im just going to reset overflows
            if(this.elapsedTime >= this.nextFinished) {
                this.elapsedTime = this.currentFrameData.time;
            }
        }
        this.applyCurrentFrameSlotTextures();
    }

    public playDefault() {
    }

    private handleUnloopedExplicitAnimationFinished(leftOverDelta: number) {
        /*
        this.currentImplicitAnimationIndex = this.implicitAnimationActionStack.length - 1;
        if(this.currentImplicitAnimationIndex > -1) {
            const nextAction = this.implicitAnimationActionStack[this.currentImplicitAnimationIndex].action;
            this.currentAnimation = this.animationLookup[nextAction][this.direction];
        } else {
            this.stopped = true;
        }

         */
    }

    private handleUnloopedImplicitAnimationFinished(leftOverDelta: number) {
        const nextAnimationIndex = --this.currentImplicitAnimationIndex;
        if(nextAnimationIndex > -1) {
            this._playNextImplicit();
        }
    }

    private handleAnimationFinish(leftOverDelta=0) {
        if (this.loop) {
            const action = this.currentAction;
            this.handleLoopedAnimationFinished(leftOverDelta);
            this.emitAnimationEvents('_onEndListeners', action, this);
            //todo: make skeleton onEnd be different for attachemnts
            this.skeleton.emitAnimationEvents('_onEndListeners', action, this);
            this.emitAnimationEvents('_onStartListeners', action, this);
            this.skeleton.emitAnimationEvents('_onStartListeners', action, this);
            // animation ended and it was not the implicit animation
        } else {
            if(this.isReverse) {
                this.reapplyPreviousFrameDeltas(true);
            } else {
                for(let i = 0; i < this.currentAnimation.frameData.length; i++) {
                    this.applyFrame(this.currentAnimation.frameData[i], true);
                }
            }
            this.currentFrame = -1;
            const prev = this.currentAnimation;
            this.currentAnimation = null;
            this.updateAnimationBoneOverrides(prev);
            if(this.pausedPassiveTracks && this.passiveTracks) {
                for(let i = 0; i < this.passiveTracks.length; i++) {
                    this.passiveTracks[i].resume();
                }
            }
            this.pausedPassiveTracks = false;
            delete this.explicitPausedPassiveActions;

            this.stopped = true
            this.elapsedTime = 0;
            this.nextFinished = 0;
            const action = this.currentAction;
            this.currentAction = '';
            this.skeleton.baseTrack.applyLastBoneOrder();
            this.skeleton.reapplyBoneSortSetups(this.direction);
            this.emitAnimationEvents('_onEndListeners', action, this);
            this.skeleton.emitAnimationEvents('_onEndListeners', action, this);
        }
    }

    private resumePassiveTracks() {

        for(let i = 0; i < this.passiveTracks.length; i++) {
            this.passiveTracks[i].resume();
        }
        this.pausedPassiveTracks = false;
    }
    public update(delta) {
        if(this.passiveTracks) {
            for(let i = 0; i < this.passiveTracks.length; i++) {
                this.passiveTracks[i].update(delta);
            }
        }
        if(this.stopped || !this.currentAnimation) return;

        this.elapsedTime += delta * this._timeScale;
        if(this.selfManagedImplicitTracks) {
            for(let i = 0; i < this.selfManagedImplicitTracks.length; i++) {
                this.selfManagedImplicitTracks[i].update(delta)
            }
        }
        if(this.isReverse) {
            if(this.elapsedTime <= this.nextFinished) {
                const leftOverDelta = this.elapsedTime-this.nextFinished;
                this.currentFrame--;
                if(this.currentFrame < 0) {
                    this.handleAnimationFinish(leftOverDelta);
                } else {
                    this.applyFrame(this.currentFrameData, true);
                    this.currentFrameData = this.currentAnimation.frameData[this.currentFrame];
                    this.applyCurrentFrameSlotTextures();
                    this.nextFinished = this.currentFrameData.time;
                    if(this.elapsedTime <= this.nextFinished) {
                        //TODO: need to see if we skipped any frames.
                        // if were on the last frame we use the animation time as the next finished.
                        // for now we just subtract elapsed to make it the expected current frame.
                        this.elapsedTime = this.nextFinished+1;
                    }
                }
            }
        } else if(this.elapsedTime >= this.nextFinished) {
            const leftOverDelta = this.elapsedTime-this.nextFinished;
            this.currentFrame++;
            if(this.currentFrame >= this.currentAnimation.frameData.length) {
                this.handleAnimationFinish(leftOverDelta);
            } else {
                this.currentFrameData = this.currentAnimation.frameData[this.currentFrame];
                //TODO: need to see if we skipped any frames.
                // if were on the last frame we use the animation time as the next finished.
                // for now we just subtract elapsed to make it the expected current frame.
                this.nextFinished = this.currentFrame === this.currentAnimation.frameData.length - 1 ? this.currentAnimation.endTime : this.currentAnimation.frameData[this.currentFrame+1].time;
                if(this.elapsedTime > this.nextFinished) {
                    this.elapsedTime = this.nextFinished - 1;
                }
                this.applyFrame(this.currentFrameData);
            }
        }
    }
}