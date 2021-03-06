import {AnimationFrameTransformData, SlotColliderData} from "../types";
import {PointData, PolygonData, ShapeData} from "../../types";
import {AnimationTrack} from "./AnimationTrack";
import {Skeleton} from "./Skeleton";
import {IColliderManager} from "../Gottimation";
import add = PIXI.GroupD8.add;
import inv = PIXI.GroupD8.inv;
import {resolveColliderType} from "../../utils";

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
    public paramsObj: { skeleton: Skeleton, bone: Bone, track: AnimationTrack };

    public currentColliders: {[colliderId: number]: ShapeData } = {};
    public id: string | number;
    public level: number;
    private curFrameX: number = 0;
    private curFrameY: number = 0;
    private curFrameScaleX: number = 1;
    private curFrameScaleY: number = 1;
    private curFrameRotation: number = 0;
    public parentBone: Bone;
    public childBones: Array<Bone>;
    private colliderIds: Array<number | string>;
    public slotId: number | string;
    private animationTrackOverridesByLevel : Array<AnimationTrack> = [];
    private setupTrackOverridesByLevel : Array<AnimationTrack> = [];
    public curTrackOverride: AnimationTrack;

    public curAnimationOverrideTrack : AnimationTrack;
    public curSetupOverrideTrack : AnimationTrack;
    readonly skeleton : Skeleton;
    public colliderManager: IColliderManager;
    private slotColliders: Array<number>;
    public slotColliderDatas: Array<{ id: number, shapeData: ShapeData, tags?: Array<string> }> = [];
    readonly slotIdToColliderLookup: {[slotId: number]: Array<SlotColliderData>};

    constructor(id: number | string, skeleton: Skeleton) {
        super();
        this.skeleton = skeleton;
        this.slotIdToColliderLookup = skeleton?.atlasLoader?.slotIdToColliderLookup || {};
        this.id = id;
        this.paramsObj = { bone: this, skeleton: this.skeleton, track: null }
    }

    public addColliderId(colliderId: number | string) {
        if(!this.colliderIds) {
            this.colliderIds = [colliderId]
        } else {
            if(this.colliderIds.indexOf(colliderId) > -1) {
                throw new Error(`Trying to add duplicate collider`)
            }
            this.colliderIds.push(colliderId);
        }
    }
    public removeColliderId(colliderId: number | string) {
        for(let i = 0; i < this.colliderIds.length; i++) {
            if(this.colliderIds[i] == colliderId) {
                this.colliderIds.splice(i, 1);
                if(!this.colliderIds.length) {
                    delete this.colliderIds;
                }
                return;
            }
        }
        throw new Error(`Did not find collider id ${colliderId} on bone`);
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
            this.changeSlot(this.curTrackOverride.computeCurrentSlotForBone(this.id, this.curTrackOverride !== this.curAnimationOverrideTrack));
          //  console.log('it became', this.texture);
        } else {
         //   console.log('NO TRACK OVERRIDE TIS EMPTY.')
            this.changeSlot(-1)
        }
    }

    private applyTransformToShapeData(shapeData: ShapeData, shapeType?: string) : ShapeData {
        shapeType = shapeType || resolveColliderType(shapeData);
        return shapeData;
    }

    public changeSlot(slotId: number | string) {
       // const log = this.id == 4;
        const log = false;
        this.slotColliderDatas = this.slotIdToColliderLookup[slotId];
        const previousColliderArray = this.slotColliders ? [...this.slotColliders] : null;
        delete this.slotColliders;
        this.visible = true;
        if(slotId) {
            if(slotId === -1) {
                log && console.log('SETTING EMPTY!')
                this.visible = false;
                this.texture = PIXI.Texture.EMPTY;
            } else {
                log && console.log('SETTING TEXTURE TO', slotId)
                this.texture = this.skeleton.activeSlotTextures[slotId];
            }
        }
        if(this.slotId !== slotId) {
            const currentColliderIdMap = {};
            let addedColliderArray;
            if(slotId > 0) {
                addedColliderArray = this.skeleton.allSlotColliderLookup[slotId];
                if(addedColliderArray) {
                    for(let i = 0; i < addedColliderArray.length; i++) {
                        const { id, shapeData } = addedColliderArray[i];
                        if(!this.slotColliders) {
                            this.slotColliders = [id];
                        } else {
                            this.slotColliders.push(id);
                        }
                        const transformedShapeData = this.applyTransformToShapeData(shapeData);
                        if(previousColliderArray) {
                            const oldIndex = previousColliderArray.indexOf(id);
                            if(oldIndex > -1) {
                                previousColliderArray.splice(oldIndex, 1);
                                this.colliderManager.onAdjusted(this.paramsObj, { id, shapeData: transformedShapeData }, false);
                            } else {
                                this.colliderManager.onAdded(this.paramsObj, { id, shapeData: transformedShapeData })
                            }
                        }
                    }
                }
            }
            // there was a previous slotId, see if theres old active colliders and remove them if so.
            this.slotId = slotId;
        }
        if(previousColliderArray) {
            for(let i = 0; i < previousColliderArray.length; i++) {
                this.colliderManager.onRemoved(this.paramsObj, previousColliderArray[i]);
            }
        }
        log && console.log('THE SLOT ID BECAME', this.slotId, 'THE TEXTURE BECAME', this.texture)
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
                return this.changeSlot(track.computeCurrentSlotForBone(this.id, true));
            } else if (!this.curSetupOverrideTrack || track.level > this.curSetupOverrideTrack.level) {
                this.curSetupOverrideTrack = track;
                if(this.curTrackOverride.level < track.level) {
                    this.curTrackOverride = track;
                    return this.changeSlot(track.computeCurrentSlotForBone(this.id, true));
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
                this.changeSlot(track.computeCurrentSlotForBone(this.id));
                return;
            } else if (!this.curAnimationOverrideTrack || (track.level > this.curAnimationOverrideTrack.level) || (this.curAnimationOverrideTrack.passive && track.level === this.curAnimationOverrideTrack.level)) {
                this.curAnimationOverrideTrack = track;
                if(this.curTrackOverride.level <= track.level) {
                    this.curTrackOverride = track;
                    this.changeSlot(track.computeCurrentSlotForBone(this.id));
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

    public transformColliderData(collider: SkeletonCollider) {
        if(this.rotation) {
            //  shapeData = applyRotation(collider.originalShapeData);
        }
        if(this.scale.x || this.scale.y) {
            // shapeData = applyScale()
        }
    }

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

    public applyTransformToCollider(shapeData: ShapeData, shapeType?: "polygon" | "circle" | "rect" | "point") : ShapeData {
        //TODO: for now this only works with the x and y transforms and not rotation or scales.
        shapeType = shapeType || resolveColliderType(shapeData);
        if(shapeType === 'polygon') {
            return (<PolygonData>shapeData).map(p => {
                return {
                    x: p.x + this.curFrameX + this.skeleton.x,
                    y: p.y + this.curFrameY + this.skeleton.y,
                }
            })
        } else {
            return {
                ...shapeData,
                x: ((<PointData>shapeData).x * this.curFrameScaleX) + this.curFrameX + this.skeleton.x,
                y:  ((<PointData>shapeData).y * this.curFrameScaleY) + this.curFrameY + this.skeleton.y,
            }
        }
    }

    public applyTrackTransform(f: AnimationFrameTransformData, inverse?: boolean) {
    //    const log = this.id == 3 && this.skeleton?.direction === 'south';
  //      log && console.log('THE CUR FRAME Y:', this.curFrameY, 'APPLYING FRAME:', f);
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

     //   log && console.log('IT BECAME', this.curFrameY);
     //   if(log && this.curFrameY == 0) {
      //      console.log('THE SLOT WAS:', this.slotId, 'THE TEXTURE WAS', this.texture);
      //  }

        if(this.colliderManager && this.colliderIds) {
            for(let i = 0; i < this.colliderIds.length; i++) {
                const colId = this.colliderIds[i];
                const shapeData = this.applyTransformToShapeData(this.skeleton.nonSlotColliderLookup[colId]);
                this.colliderManager.onAdjusted(this.paramsObj, { id: colId, shapeData }, inverse);
            }

            if(this.slotId) {
                const slotColliders = this.skeleton.allSlotColliderLookup[this.slotId];
                if(slotColliders) {
                    for(let i = 0; i < slotColliders.length; i++)  {
                        const shapeData = this.applyTransformToShapeData(slotColliders[i]);
                        this.colliderManager.onAdjusted(this.paramsObj, { id: slotColliders[i].slotId, shapeData }, false)
                    }
                }
            }
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