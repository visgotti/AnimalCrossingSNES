import {AnimationFrameTransformData, SlotColliderData} from "../types";
import {ShapeData} from "../../types";
import {AnimationTrack} from "./AnimationTrack";
import {Skeleton} from "./Skeleton";
import {IColliderManager} from "../Gottimation";

export type BoneFrameData = {
    texture: PIXI.Texture,
    rotation: number,
    x: number,
    y: number,
    scaleX: number,
    scaleY: number,
    colliders: Array<number>
}

export type ColliderData = {
    shapeData: any,
    rotation?: number,
    scaleX?: number,
    scaleY?: number,
}

export type SkeletonCollider = {
    original: ColliderData,
    transformed: ColliderData,
    id: number,
}

export class Bone extends PIXI.Sprite {
    public id: string | number;
    public level: number;
    private curFrameX: number = 0;
    private curFrameY: number = 0;
    private curFrameScaleX: number = 1;
    private curFrameScaleY: number = 1;
    private curFrameRotation: number = 0;
    public parentBone: Bone;
    public childBones: Array<Bone>;
    private originalColliderLookup: {[id: number] : any } = {};
    private colliderLookup: {[id: number] : any } = {};
    private colliders: Array<any> = [];
    private slotId: number | string;
    private animationTrackOverridesByLevel : Array<AnimationTrack> = [];
    private setupTrackOverridesByLevel : Array<AnimationTrack> = [];
    public curTrackOverride: AnimationTrack;

    public curAnimationOverrideTrack : AnimationTrack;
    public curSetupOverrideTrack : AnimationTrack;

    readonly skeleton : Skeleton;

    private colliderManager: IColliderManager;

    constructor(id: number | string, skeleton?: Skeleton) {
        super();
        this.skeleton = skeleton;
        this.id = id;
    }

    public determineNewTrackOverride() {
        if(this.curAnimationOverrideTrack) {
            if(this.curSetupOverrideTrack) {
                if(this.curSetupOverrideTrack.level > this.curAnimationOverrideTrack.level) {
                    this.curTrackOverride = this.curSetupOverrideTrack;
                } else {
                    this.curTrackOverride = this.curAnimationOverrideTrack;
                }
            } else {
                this.curTrackOverride = this.curAnimationOverrideTrack;
            }
        } else {
            this.curTrackOverride = this.curSetupOverrideTrack;
        }
        if(this.curTrackOverride) {
            //    console.error('COMPUTING TEXTURE FOR BONE ID', this.id, 'CUR TRACK OVERRIDE:', this.curTrackOverride);
            this.slotId = this.curTrackOverride.computeCurrentSlotForBone(this.id, this.curTrackOverride !== this.curAnimationOverrideTrack);
            this.handleSlotChange();
            //  console.log('it became', this.texture);
        } else {
            //   console.log('NO TRACK OVERRIDE TIS EMPTY.')
            this.slotId = null;
        }
    }

    private handleSlotChange() {
    }

    public removeSlotOverrideLevel(track: AnimationTrack, fromSetup: boolean) {
        if(fromSetup) {
            if(track === this.curSetupOverrideTrack) {
                this.setupTrackOverridesByLevel.pop();
                this.curSetupOverrideTrack = this.setupTrackOverridesByLevel[this.setupTrackOverridesByLevel.length-1];
                if(track === this.curTrackOverride) {
                    this.determineNewTrackOverride();
                }
            } else {
                for(let i = 0; i < this.setupTrackOverridesByLevel.length; i++) {
                    if(this.setupTrackOverridesByLevel[i] === track) {
                        this.setupTrackOverridesByLevel.splice(i, 1);
                        return;
                    }
                }
            }
        } else {
            if(track === this.curAnimationOverrideTrack) {
                this.animationTrackOverridesByLevel.pop();
                this.curAnimationOverrideTrack = this.animationTrackOverridesByLevel[this.animationTrackOverridesByLevel.length-1];
                if(track === this.curTrackOverride) {
                    this.determineNewTrackOverride();
                }
            } else {
                for(let i = 0; i < this.animationTrackOverridesByLevel.length; i++) {
                    if(this.animationTrackOverridesByLevel[i] === track) {
                        this.animationTrackOverridesByLevel.splice(i, 1);
                        return;
                    }
                }
            }
        }
    }

    // this isnt the most elegant code, but basically animation tracks can add slot overrides to bones,
    // the hierarchical order goes

    // ovverrides from an non passive animation > overrides from a passive animation > overrides from a non passive setup > order added
    // we seperate into two seperate arrays because the same track might override it for a non passive animation AND a non passive setup.
    public addSlotOverrideLevel(track: AnimationTrack, fromSetup: boolean) {
        if(fromSetup) {
            this.setupTrackOverridesByLevel.push(track);
            if(!this.curTrackOverride) {
                this.curSetupOverrideTrack = track;
                this.curTrackOverride = track;
                this.slotId = track.computeCurrentSlotForBone(this.id, true)
                this.handleSlotChange();
                return;
            } else if (!this.curSetupOverrideTrack || track.level > this.curSetupOverrideTrack.level) {
                this.curSetupOverrideTrack = track;
                if(this.curTrackOverride.level < track.level) {
                    this.curTrackOverride = track;
                    this.slotId = track.computeCurrentSlotForBone(this.id, true);
                    this.handleSlotChange();
                }
                return;
            } else {
                this.setupTrackOverridesByLevel.sort((a, b) => a.level - b.level);
            }
        } else {
            this.animationTrackOverridesByLevel.push(track);
            if(!this.curTrackOverride) {
                this.curAnimationOverrideTrack = track;
                this.curTrackOverride = track;
                this.slotId = track.computeCurrentSlotForBone(this.id)
                return;
            } else if (!this.curAnimationOverrideTrack || (track.level > this.curAnimationOverrideTrack.level) || (this.curAnimationOverrideTrack.passive && track.level === this.curAnimationOverrideTrack.level)) {
                this.curAnimationOverrideTrack = track;
                if(this.curTrackOverride.level <= track.level) {
                    this.curTrackOverride = track;
                    this.slotId = track.computeCurrentSlotForBone(this.id);
                    this.handleSlotChange();
                }
                return;
            } else {
                this.animationTrackOverridesByLevel.sort((a, b) => {
                    if(a.level === b.level) {
                        if(a.passive) {
                            return b.passive ? 0 : -1;
                        } else if (b.passive) {
                            return 1;
                        }
                        return 0;
                    } else {
                        return a.level - b.level;
                    }
                });
            }
        }
    }

    public updateColliderData() {
    }

    public _addChildBones(bones: Array<Bone>) {
        const transformDelta = { x: this.curFrameX, y: this.curFrameY, rotation: this.curFrameRotation, scaleX: 1-(this.curFrameScaleX), scaleY: 1-(this.curFrameScaleY)};
        if(!this.childBones){
            this.childBones = new Array(bones.length);
            for(let i = 0; i < bones.length; i++) {
                if(bones[i].parentBone) { throw new Error(`A bone should not have already had a parent when being added to a bone.`)}
                bones[i].parentBone = this;
                this.childBones[i] = bones[i];
                bones[i].applyTrackTransform(transformDelta)
            }
        } else {
            for(let i = 0; i < bones.length; i++) {
                if(bones[i].parentBone) { throw new Error(`A bone should not have already had a parent when being added to a bone.`)}
                bones[i].parentBone = this;
                this.childBones.push(bones[i])
                bones[i].applyTrackTransform(transformDelta)
            }
        }
    }
    public _addChildBone(bone: Bone) {
        bone.parentBone = this;
        if(this.childBones) {
            this.childBones.push(bone)
        } else {
            this.childBones = [bone];
        }
        bone.applyTrackTransform({ x: this.curFrameX, y: this.curFrameY, rotation: this.curFrameRotation, scaleX: 1-(this.curFrameScaleX), scaleY: 1-(this.curFrameScaleY)})
    }

    public updateCollider(id: number, shapeData: ShapeData) {
        this.colliderLookup[id].original.shapeData = shapeData;
        this.reapplyColliderTransforms();
    }
    public reapplyColliderTransforms() {
    }
    public transformColliderData(collider: SkeletonCollider) {
        if(this.rotation) {
            //  shapeData = applyRotation(collider.originalShapeData);
        }
        if(this.scale.x || this.scale.y) {
            // shapeData = applyScale()
        }
    }

    readonly slotColliders: {
        [cid: number]: {
            shapeData: any,
            tags: Array<string>,
        }
    } = {}
    readonly frameColliders: {
        [uid: number]: {
            shapeData: any,
            tags: Array<string>
        }
    } = {}

    readonly activeSlotColliders: {
        [cid: number]: {
            shapeData: any,
            tags: Array<string>
        }
    } = {}

    private frameTransformsDeltas: Array<AnimationFrameTransformData> = [];

    private frameIndex: number = 0;

    public _removeChildBone(bone: Bone) {
        for(let i = 0; i < this.childBones.length; i++) {
            if(this.childBones[i] === bone) {
                delete bone.parentBone;
                this.childBones.splice(i, 1);
                if(!this.childBones.length) delete this.childBones
                return;
            }
        }
    }

    //todo: profile.
    public _removeChildBones(bonesToRemove: Array<Bone>) {
        const len = this.childBones.length;
        // removing ALL child bones.
        if(bonesToRemove.length === len) {
            delete this.childBones;
            for(let i = 0; i < bonesToRemove.length; i++) {
                delete bonesToRemove[i].parentBone;
            }
        } else {
            let leftToRemove = bonesToRemove.length;
            const newBonesArray = new Array(this.childBones.length-leftToRemove);
            let nextBoneToRemove = bonesToRemove.pop();
            delete nextBoneToRemove.parentBone;
            for(let i = len-1; i >= 0; --i) {
                if(!nextBoneToRemove || this.childBones[i] !== nextBoneToRemove) {
                    newBonesArray[i-leftToRemove] = this.childBones[i];
                } else {
                    nextBoneToRemove = bonesToRemove.pop();
                    leftToRemove--;
                    if(nextBoneToRemove) {
                        delete nextBoneToRemove.parentBone;
                    }
                }
            }
            this.childBones = newBonesArray;
            if(bonesToRemove.length) {
                throw new Error('Should have had no bones left in this array to remove. Make sure you pass in the bonesToRemove array in the same order as it was added.')
            }
        }
    }

    public recalculateFrameTransform() {
        /*
        if(this.parentBone) {
            this.curFrameX = this.parentBone.x;
            this.curFrameY = this.parentBone.y;
            this.curFrameScaleX = this.parentBone.scale.x;
            this.curFrameScaleY = this.parentBone.scale.y;
            this.curFrameRotation = this.parentBone.rotation;
        } else {
            this.curFrameX = 0;
            this.curFrameY = 0;
            this.curFrameScaleX = 1;
            this.curFrameScaleY = 1;
            this.curFrameRotation = 0;
        }

         */
        for(let i = 0; i < this.frameTransformsDeltas.length; i++) {
            const f = this.frameTransformsDeltas[i]
            if(!f) continue;
            this.curFrameX += f.x || 0;
            this.curFrameY += f.y || 0;
            this.curFrameScaleX += f.scaleX || 0;
            this.curFrameScaleY += f.scaleY || 0;
            this.curFrameRotation += f.rotation || 0;
        }
        if(this.childBones) {
            for(let i = 0; i < this.childBones.length; i++) {
                this.childBones[i].recalculateFrameTransform();
            }
        }
        //   console.log('scale becae', this.currentFrameDataTransform.scaleX)
    }

    public applyTrackTransform(f: AnimationFrameTransformData, inverse?: boolean) {
        if(inverse) {
            this.curFrameX -= f.x || 0;
            this.curFrameY -= f.y || 0;
            this.curFrameScaleX -= f.scaleX || 0;
            this.curFrameScaleY -= f.scaleY || 0;
            this.curFrameRotation -= f.rotation || 0;
            this.setTransform(this.curFrameX, this.curFrameY, this.curFrameScaleX, this.curFrameScaleY, this.curFrameRotation);
        }  else {
            this.curFrameX += f.x || 0;
            this.curFrameY += f.y || 0;
            this.curFrameScaleX += f.scaleX || 0;
            this.curFrameScaleY += f.scaleY || 0;
            this.curFrameRotation += f.rotation || 0;
            this.setTransform(this.curFrameX, this.curFrameY, this.curFrameScaleX, this.curFrameScaleY, this.curFrameRotation);
        }

        // this.recalculateFrameTransform();
        if(this.childBones) {
            for(let i = 0; i < this.childBones.length; i++) {
                this.childBones[i].applyTrackTransform(f, inverse);
            }
        }
    }
    public nextFrame() {
    }
}