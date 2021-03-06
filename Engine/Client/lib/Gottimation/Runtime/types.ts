import {BoneParentData, ShapeData} from "../types";

export type SkinParam = {
    atlasId?: number,
    atlasName?: string,
    skinName?: string,
    skinUrl?: string,
    skinTexture?: PIXI.Texture,
}

export type SlotColliderData = { cid: number, shapeData: any, tags?: Array<string> }

export type ProjectMetaData = {
    ts: number
    //skeletonEdits: Array<number>
 //   atlasEdits: Array<number>,
}

export type MetaDatum = {
    id: string,
    name: string,
}
export type SkeletonBoneData = MetaDatum & {
    parentBoneId?: string | number
}

export type GlobalMetaAnimationData = {
    skeletonIds: Array<string>,
    attachmentIds: Array<string>,
    attachmentSlotIds: Array<string>,
    animationIds: Array<string>,
    atlasIds: Array<string>,
}

export type GlobalRuntimeProjectData = {
    skeletons: Array<SkeletonData>,
    attachments: Array<AttachmentData>,
    attachmentSlots: Array<AttachmentSlotData>,
    animations: Array<AnimationData>,
    atlases: Array<AtlasData>,
}
export type AttachmentData = {
    setupData?: RawSetupData,
    id: string | number,
    name: string,
    atlasIds: Array<string | number>,
    animationIds: Array<string | number>,
    boneNames?: {[boneId: number]: string },
    attachmentSlotIds?: Array<string | number>,
}

export type InitializedSkeletonData = {
    id: string,
    name: string,
    boneNameLookup?: { [boneId: string]: string, },
    setupData?: InitializedSetupData,
    boneIds?: Array<number | string>,
    animations: AnimationLookupData,
    attachmentAnimations: {[attachmentName: string]: AnimationLookupData }
    attachmentSlotData: {
        [name: string]: InitializedAttachmentSlotData
    },
    directions: Array<string>,
}

export type InitializedAttachmentSlotData = {
    id: string | number,
    name: string,
    level: number,
    setupData?: InitializedSetupData,
    attachmentData: {[name: string]: InitializedAttachmentData },
    parentAttachmentName?: string,
}
export type InitializedAttachmentData = {
    id: string | number,
    name: string,
    setupData?: InitializedSetupData,
    animations?: AnimationLookupData,
    atlasIds: Array<string | number>,
}
export type SkeletonData = {
    actions: {[actionId: number]: string },
    id: string,
    name: string,
    setupData?: RawSetupData,
    boneNames?: {[boneId: number]: string },
    atlasIds: Array<string> | Array<number>,
    actionIds: Array<string> | Array<number>,
    directions: Array<string>,
    animationIds: Array<string>,
    attachmentSlotIds: Array<string> | Array<number>,
}

export type AttachmentSlotData = {
    setupData?: RawSetupData,
    id: string | number,
    name: string,
    boneNames?: {[boneId: number]: string },
    attachmentIds: Array<string | number>
}

export type AnimationData = {
    id: string | number,
    actionId: string | number,
    direction: string,
    endTime: number,
    frameData: Array<AnimationFrameData>,
    //colliderBoneData?: Array<number | string>
}

export type InitializedEventData = {
    name: string,
    id: number | string,
    params?: Array<string>
}

export type InitializedAnimationData = AnimationData & {
    overriddenBoneTransforms?: Array<number>
    overriddenBones?: Array<number>
    overriddenBoneSlotsByFrame?: Array<Array<number>>
}

export type AttachmentSetupFrameData = {
    boneOrder?: Array<number>,
    bones?: Array<BoneFrameData>,
    addedColliders?: Array<ColliderSetupData>,
}

export type InitializedSetupFrameData = SetupFrameData & {
    boneParentChanges?: Array<number | string>
}

export type SetupFrameData = {
    boneParentChanges?: Array<BoneParentData>,
    level?: number,
    boneOrder?: Array<number>,
    bones?: Array<BoneFrameData>,
    colliders?: Array<ColliderSetupData | ColliderFrameData>,
    addedColliders?: Array<ColliderSetupData>,
    adjustedColliders?: Array<ColliderAdjustedData>,
}

export type RuntimeAnimationFrameData = AnimationFrameData & {
    events?: Array<number | string | boolean>,
}

export type AnimationFrameData = {
    id?: number,
    level?: number,
    boneOrder?: Array<number>,
    bones?: Array<BoneAnimationFrameData>,
    colliders?: Array<ColliderFrameData>,
    addedColliders?: Array<ColliderSetupData>,
    adjustedColliders?: Array<ColliderAdjustedData>,
    time: number,
    events?: Array<{ eventId: number, data: {[eventPropId: number]: number | string }}> | Array<any>
    soundSlots? :Array<number | string>
}

export type RawSetupData =
    {
        frames?: {[direction: string]: SetupFrameData },
        addedColliders?: Array<ColliderSetupData>,
        adjustedColliders?: Array<ColliderAdjustedData>
        bones?: Array<BoneFrameData>,
        boneParentChanges?: Array<BoneParentData>,
        boneOrder?: Array<number>,
    };

export type ColliderBaseData = { id: number | string, shapeData?: Array<number> | ShapeData, boneId?: number | string };
export type ColliderSetupData = ColliderBaseData & { shapeData: Array<number> | ShapeData, tags?: Array<string> };
export type ColliderAdjustedData = ColliderBaseData & { add?: Array<string>, remove?: Array<string> };


//todo: the bones array isnt quite a full frame setup datum so eventually i want to rename that to be boneParentChanges to be more specific of what it is setting up.
export type InitializedSetupData = {
    frames?: {[direction: string]: InitializedSetupFrameData & { overriddenBones?: Array<number | string> } },
    overriddenBones?: Array<number | string>,
    boneParentChanges?: Array<number | string>,
    bones?: Array<BoneSetupFrameData>,
    boneOrder?: Array<number>,
    addedBoneIds?: Array<string | number>,
    addedColliders?: Array<ColliderSetupData>,
    adjustedColliders?: Array<ColliderAdjustedData>,
}

export type AtlasData = {
    id: string | number,
    name: string,
    colliders?: {
        [uid: number]: {
            cid: number,
            tags?: Array<string>,
            shapeData: ShapeData,
        }
    },
    slots: {
        [slotId: string]: {
            tags?: Array<string>,
            name?: string,
            cuids?: Array<number>,
            rect: Array<number>,
        }
    },
    defaultSkinName: string,
    skins?: Array<MetaDatum>
}

export type ColliderFrameData = {
    id: string | number,
    shapeData?: any,
    rotation?: number,
    scaleX?: number,
    scaleY?: number,
    tags?: Array<string>,
    add?: Array<string>,
    remove?: Array<string>,
    groupId?: number | string,
}

export type BoneSetupFrameData = {
    id: number | string,
    parentBoneId?: number | string,
    parentAttachmentId?: number,
    parentSubAttachmentId?: number,
}

export type BoneFrameData = AnimationFrameTransformData & BoneSetupFrameData & {
    slotId?: string | number,
    slotName?: string,
    hide?: boolean,
    name?: string,
}

export type BoneAnimationFrameData = AnimationFrameTransformData & {
    id: number | string,
    slotId?: string | number,
    slotName?: string,
    hide?: boolean,
    name?: string,
    zIndex?: number,
}

export type AnimationFrameTransformData = {
    x?: number,
    y?: number,
    scaleX?: number,
    scaleY?: number,
    rotation?: number,
    visible?: boolean,
}

export type PlayOptions = {
    loop?: boolean,
    timeScale?: number,
    resetTimeOnDirectionChange?: boolean,
    startTime?: number,
    stopPassiveActions?: boolean | Array<string>,
    persistElapsedTime?: boolean,
    allowedAttachmentOverrides?: {
        slotId?: boolean,
        position?: boolean,
        rotation?: boolean,
        visibility?: boolean,
        scale?: boolean,
    },
}
export type ImplicitPlayOptions = {
    syncTime?: boolean,
    syncFrames?: boolean
}
export type AttachmentAnimationData = {
    animations: AnimationLookupData,
    boneIds: Array<string>,
}
export type AnimationLookupData = {
    [action: string]: {
        [direction: string]: InitializedAnimationData
    }
}

export type SkeletonAnimationLookupData = {
    base: AnimationLookupData
    attachments: {
        [attachmentName: string]: AttachmentAnimationData
    }
}