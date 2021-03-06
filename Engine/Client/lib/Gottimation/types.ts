import {
    AnimationFrameData,
    RawSetupData, BoneSetupFrameData
} from "./Runtime/types";

export type DirectionAnimationLookup = {
    [directionName: string]: {
        baseAnimations: Array<AnimationData>,
        customAnimations: Array<AnimationData>,
        inheritedAnimations: Array<InheritedAnimationData>
    }
}

export type AttachmentMetaData = {
    setupData: RawSetupData,
    id: number,
    name: string,
    parentSubAttachmentId?: number,
    subAttachmentIds: Array<number>,
    level?: number,
}

export type AnimationActionData = {
    id: number,
    name: string,
    subAttachmentId?: number,
}

export type SubAttachmentMetaData = {
    setupData: RawSetupData,
    level?: number,
    id: number,
    name: string,
    parentAttachmentId: number,
    attachmentIds: Array<number>,
    customActionIds: Array<number>,
    animationIds: Array<number>,
}

export type SkeletonAttachmentData = AttachmentMetaData & {
    overrideAttachments?: Array<string>,
    subAttachments?: SkeletonSubAttachmentLookup,
}
export type SkeletonAttachmentLookup = {
    [attachmentId: number]: SkeletonAttachmentData
}
export type SkeletonSubAttachmentLookup = {
    [subAttachmentId: number]: SkeletonSubAttachmentData
}

export type SkeletonSubAttachmentData = SubAttachmentMetaData & {
    customAnimations: {
        [actionId: number]: {
            [direction: string]: AnimationData
        },
    },
    baseAnimations: {
        [actionId: number]: {
            [direction: string]: AnimationData
        },
    },
    inheritedAnimations: {
        [subAttachmentId: number]: {
            [actionId: number]: {
                [direction: string]: AnimationData,
            }
        }
    }
    attachments?: SkeletonAttachmentLookup,
}

export type SkeletonAnimationDataV2 = {
    name: string,
    actions: Array<{ id: number, name: string, subAttachmentId?: number }>,
    allAnimations: {
        [animationId: number]: AnimationData
    }
    directions: Array<string>,
    attachments: SkeletonAttachmentLookup,
    bones: Array<BoneSetupFrameData>,
}


export type SkeletonAnimationData = {
    [actionName: string]: {
        [direction: string] : AnimationData
    },
}

export enum AttachAniRelationship {
    BASE,
    INHERITED,
    CUSTOM,
}

export type InheritedAnimationData = AnimationData & {
    inheritedFromSubAttachmentId: number,
}

export type AnimationBoneData = {
    id: number,
    colliderIds: Array<number>,
    usedSlotIds: Array<number>,
}

export type ItemColliderData<T> = {
    id: number,
    shapeData: T,
    tags: Array<string>,
    groupId?: number,
}

export type ComputedColliderFrameData<T> = {
    id: number,
    shapeData: T,
    add?: Array<string>,
    remove?: Array<string>,
}

export type ColliderFrameData<T> = TransformativeFrameDataItem & {
    id: number | string,
    shapeData: T,
    tags?: Array<string>,
    add?: Array<string>,
    remove?: Array<string>,
    groupId: number,
}

const defaultRuntimeExportSettings : RuntimeExportSettings = {
    jsonSpaces: 4,
}

export type RuntimeExportSettings = {
    jsonSpaces?: number,
}
export type BackupExportSettings = {
}

export type GlobalProjectData = {
    soundSlotIds?: Array<{ id: number, name: string }>,
    nextSoundSlotId?: number,
    sounds?: Array<{ id: number, soundSlotId: number, name: string }>,
    nextSoundId?: number,
    allColliders: Array<ItemColliderData<ShapeData>>,
    actions: {[actionId: number]: {  name: string, subAttachmentId?: number }},
    nextColliderId: number,
    nextColliderGroupId: 1,
    nextAttachmentId: number,
    nextActionId: number,
    nextAnimationId: number,
    name: string,
    id: number,
    skeletonNames: Array<string>,
    sheets: Array<{ id: number, name: string, slots: Array<number>, images: Array<{ id: number, name: string, x: number, y: number }> }>,
    //slotGroups: Array<{ slotIds: Array<number>, groupId: number, groupName: string }>
    lastEdit?: number,
    slotGroups: Array<{ id: number, name: string }>,
    colliderGroups: Array<{ id: number, name: string }>
}

export type AttachmentBoneData = SkeletonBoneData & TransformativeFrameDataItem;

export type SkeletonBoneData = {
    parentAttachmentId?: number,
    parentSubAttachmentId?: number,
    id: number | string,
    name: string,
    slotIds: Array<number | string>,
    colliderIds: Array<number | string>,
    parentBoneId?: number | string,
}
export type OptionalBoneFrameData = {
    id: number | string,
    slotId?: number | string,
    colliderIds?: Array<number>,
    scaleX?: number,
    scaleY?: number,
    visible?: boolean,
    hide?: boolean,
    x?: number,
    y?: number,
    rotation?: number,
}

/*
export type BoneFrameData = TransformativeFrameDataItem & {
    id: number,
    name?: string,
    colliderIds: Array<number>,
    slotId: number,
    slotName?: string,
    direction?: string,
}
*/
export type ImplementedInheritedAnimationData = {
    sync?: boolean,
}

export type AnimationData = {
    lockedFrames?: Boolean,
    lockedBones?: Array<TransformativeFrameDataItem & { slotId?: number }>,
    inheritedData?: ImplementedInheritedAnimationData,
    usedSlotIds: Array<number>,
    time: number,
    originPoint: { x: number, y: number },
    overriddenBoneSlots?: Array<number>,
    data: Array<AnimationFrameData>,
    colliderData: Array<ColliderFrameData<ShapeData>>,
    action: string,
    actionId: number,
    direction: string,
    id?: number,
    subAttachmentId?: number,
    level?: number,
    boneIdOrder?: Array<number>
}

export type TransformativeFrameDataItem = TransformativeData & {
    x?: number,
    y?: number,
    visible?: boolean,
}

export type TransformativeData = {
    rotation?: number,
    scaleX?: number,
    scaleY?: number,
}

export type SheetSlotData = {
    sheetId: number;
    rect: RectData;
    id: number;
    colliders: Array<ItemColliderData<ShapeData>>;
    groupId?: number,
    boneIds?: number,
    alias?: string;
    name?: string;
    previewSrc?: string
}

export type SlotFrameData = TransformativeFrameDataItem & {
    boneId?: number,
    id: number,
    seq?: number,
    texture?: PIXI.Texture,
}

export type RandomNumberParams = {
    min: number,
    max: number,
    minInclusive?: boolean,
    maxInclusive?: boolean,
}

export type EventParamData = {
    id: number,
    name: string,
    type: string,
}

export type SpecialEventParamData = {
    id: number,
    name: string,
    type: 'random_number' | 'alternating boolean'
    randomNumberParams?: RandomNumberParams,
}

export type EventData = {
    id: number,
    name: string,
    params: Array<EventParamData>
}

export type EventFrameData = {
    id: number,
}

export type SoundFrameData = {
    id: number,
}

export type OptionalAnimationFrameData = {
    id?: number | string,
    bones?: Array<OptionalBoneFrameData>,
    boneOrder?: Array<number>
    time: number,
    events?: Array<{ eventId: number, data: {[eventPropId: number]: number | string }}> | Array<any>
    //   slots: Array<SlotFrameData>,
    colliders?: Array<ColliderFrameData<ShapeData>>,
    soundSlots?: Array<number>
    // for .6 seconds, display slot 12 with the bounding box of x:0, y:0, w: 12, h: 12 from the sheet, and the rotation of 15 degree
    // [.6, 12, 0, 0, 12, 12, 15,]
}

export type BoneParentData = {
    id: number | string,
    pid: number | string
}

export type Bone = {
}

export type Rect = {
    x: number,
    y: number,
    width: number,
    height: number,
}

export type SubAttachmentData = {
    parentId: number,
    id: number,
}

export type SkeletonMetaData = {
    usedSlots: Array<number>,
    animations: Array<number>,
    actions: Array<{ id: number, name: string, subAttachmentId?: number }>,
    directions: Array<string>,
    setupData: RawSetupData,
    events?: Array<EventData>,
    attachments?: Array<AttachmentMetaData>,
    subAttachments?: Array<SubAttachmentMetaData>,
}

export type TempSheetLayout = {
    texture: PIXI.Texture, name: string, x: number, y: number, width?: number, height?: number, id: number
}

export type SheetImageData = {
    id: number, texture: PIXI.Texture, name: string, x: number, y: number, width?: number, height?: number
}

export type SkeletonSheetData = {
    id: number,
    name: string,
    baseTexture?: PIXI.Texture
    nonRasterizedTextures: Array<TempSheetLayout>
}

export type ProjectSheetData = {
    id: number,
    name: string,
    baseTexture?: PIXI.Texture,
    lastImageUpdate?: number,
    images: Array<SheetImageData>,
    slotData: Array<SheetSlotData>,
    renderedTexture?: {
        texture: PIXI.Texture,
        ts: number,
    }
}

export type SkeletonData = {
    animations: Array<AnimationData>,
    sheets: Array<String>,
    externalSheets: Array<string>,
    externalSlots: Array<string>,
}

export type BranchedSkeletonData = {
    animations: Array<AnimationData>,
}

export type SkeletonAnimationSheetData = {
    name: string,
    width: number,
    height: number,
    slots: Array<SkeletonSheetSlotData>
    bakedSlots: Array<BakedSkeletonSheetSlotData>
}

export type SkeletonSheetSlotData = {
    name: String,
    index: number,
    w: number,
    h: number,
    x: number,
    y: number,
}

export type BakedSkeletonSheetSlotData = {
    fromIndex: number,
    index: number,
    rotation: number,
    crop?: { x: number, y: number, w: number, h: number }
}

export type RectData = {
    x: number,
    y: number,
    w: number,
    h: number,
}

export type PointData = { x: number, y: number }
export type PolygonData = Array<PointData>
export type CircleData = { cx: number, cy: number, r: number }
export type ShapeData = PointData | PolygonData | RectData | CircleData;