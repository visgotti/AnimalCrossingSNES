import {AnimationFrameTransformData, SlotColliderData} from "../types";
import {ShapeData} from "../../types";
import {AnimationTrack} from "./AnimationTrack";

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
    private slotId: number;

    private curFrameX: number = 0;
    private curFrameY: number = 0;
    private curFrameScaleX: number = 1;
    private curFrameScaleY: number = 1;
    private curFrameRotation: number = 0;
    public parentBone: Bone;
    public childBones: Array<Bone>;
    private colliderLookup: {[id: number] : any } = {};
    private colliders: Array<any> = [];
    private trackOverridesByLevel : Array<AnimationTrack> = [];
    public curTrackOverride: AnimationTrack;

    constructor(id: number | string) {
        super();
        this.id = id;
    }

    public removeSlotOverrideLevel(track: AnimationTrack) {
        if(track === this.curTrackOverride) {
            this.trackOverridesByLevel.pop();
            //  this.texture = PIXI.Texture.EMPTY;
            this.curTrackOverride = this.trackOverridesByLevel[this.trackOverridesByLevel.length-1];
            if(this.trackOverridesByLevel.length) {
                //   console.warn('need to implement logic to reupade the bones texture.')
            }
        } else {
            for(let i = 0; i < this.trackOverridesByLevel.length; i++) {
                if(this.trackOverridesByLevel[i] === track) {
                    this.trackOverridesByLevel.splice(i, 1);
                    return;
                }
            }
        }
    }

    public addSlotOverrideLevel(track: AnimationTrack) {
        this.trackOverridesByLevel.push(track)
        if(track.level > this.curTrackOverride.level || (track.level === this.curTrackOverride.level && (!track.passive || this.curTrackOverride.passive))) {
            this.curTrackOverride = track;
        } else {
            this.trackOverridesByLevel.sort((a, b) => a.level - b.level);
        }
    }

    public updateColliderData() {
    }

    public _addChildBones(bones: Array<Bone>) {
        if(!this.childBones){
            this.childBones = new Array(bones.length);
            for(let i = 0; i < bones.length; i++) {
                if(bones[i].parentBone) { throw new Error(`A bone should not have already had a parent when being added to a bone.`)}
                bones[i].parentBone = this;
                this.childBones[i] = bones[i];
            }
        } else {
            for(let i = 0; i < bones.length; i++) {
                if(bones[i].parentBone) { throw new Error(`A bone should not have already had a parent when being added to a bone.`)}
                bones[i].parentBone = this;
                this.childBones.push(bones[i])
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
        console.log('the curframe x became', this.curFrameX);
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