import {
    AnimationData, AnimationLookupData,
    AttachmentData,
    AttachmentSlotData,
    BoneFrameData,
    ColliderAdjustedData,
    ColliderSetupData,
    GlobalRuntimeProjectData,
    InitializedAnimationData,
    InitializedAttachmentData,
    InitializedAttachmentSlotData, InitializedSetupData,
    InitializedSkeletonData, RawSetupData
} from "./types";
import {deg2rad} from "../utils";

const possibleIntParse = (id: string | number) : number => {
    const parsed = parseInt(`${id}`);
    if(isNaN(parsed)) {
        return <number>id;
    }
    return parsed;
}

export const formatSkeletonData = (globalData: GlobalRuntimeProjectData) : {[skeletonName: string]: InitializedSkeletonData } => {
    const obj : {[skeletonId: string] : InitializedSkeletonData } = {};
    let allActionData = {};
    globalData.skeletons.forEach(s => {
        allActionData = {
            ...allActionData,
            ...s.actions
        }
    })
    const formattedAttachmentData = formatAttachmentSlotData(globalData.attachmentSlots, globalData.attachments, globalData.animations, allActionData)
    globalData.skeletons.forEach(s => {
        const baseBoneLookup = {};
        let globalBoneLookup : {[boneId: number]: string} = {};
        const animationLookup = formatAnimationLookup(s.animationIds, globalData.animations, s.actions);
        const attachmentSlotData : {[name: string]: InitializedAttachmentSlotData } = {};
        const attachmentAnimationLookup: {[name: string]: AnimationLookupData } = {};
        s.attachmentSlotIds.forEach(attachmentSlotId => {
            const { name: slotName, boneNames: slotBones } = globalData.attachmentSlots.find(s => s.id == attachmentSlotId);

            const formattedAttachmentSlotData = formattedAttachmentData[slotName];
            if(slotBones) {
                globalBoneLookup = {
                    ...globalBoneLookup,
                    ...slotBones
                }
            }
            attachmentSlotData[formattedAttachmentSlotData.name] = formattedAttachmentSlotData;
            for(let attachmentName in formattedAttachmentSlotData.attachmentData) {
                attachmentAnimationLookup[attachmentName] = formattedAttachmentSlotData.attachmentData[attachmentName].animations
                const foundAttachment = globalData.attachments.find(a => a.name == attachmentName);
                if(foundAttachment.boneNames) {
                    globalBoneLookup = {
                        ...globalBoneLookup,
                        ...foundAttachment.boneNames
                    }
                }
            }
        });
        obj[s.name] = {
            directions: s.directions,
            animations: animationLookup,
            attachmentAnimations: attachmentAnimationLookup,
            id: s.id,
            name: s.name,
            attachmentSlotData,
        }
        if(s.boneNames) {
            globalBoneLookup = {
                ...globalBoneLookup,
                ...s.boneNames,
            }
        }

        if(globalBoneLookup && Object.keys(globalBoneLookup).length) {
            obj[s.name].boneNameLookup = globalBoneLookup;
        }

        if(s.setupData) {
            obj[s.name].setupData = formatSetupFrameData(s.setupData)
        }
    });
    return obj;
}


function sortBoneHierarchy(arr: Array<string | number>, lookup: {[boneId: string]: { parentBoneId?: string | number, level?: number }}) : Array<number | string> {
    return arr.map(a => {
        if('level' in lookup[a]) {
            return { id: a, level: lookup[a].level }
        } else if (!lookup[a].parentBoneId) {
            lookup[a].level = 0;
            return {id: a, level: 0}
        } else {
            let level = 0;
            let nextA = a;
            while(lookup[nextA].parentBoneId) {
                nextA = lookup[nextA].parentBoneId
                level++;
                if('level' in lookup[nextA]) {
                    level += lookup[nextA].level
                    break;
                }
            }
            lookup[a].level = level;
            return {id: a, level }
        }
    }).sort((a, b) => {
        return a.level - b.level
    }).map(a => a.id);
}

export const formatAnimationData = (data: AnimationData) : InitializedAnimationData => {
    const overriddenBoneSlotsByFrame = [];
    const overriddenBones = [];
    let curArray = null;
  //  console.log('formatting:', data.frameData);
    for(let i = 0; i < data.frameData.length; i++) {
        const frame = data.frameData[i];
        if(frame.bones) {
            // keep ref to previous array, we'll use it if the array winds up being the same value
            const previousArray = curArray;

            // make copy of array if it exists regardless, if nothing winds up differing we will set the curArray back to previousArray
            curArray = curArray ? [...curArray] : [];
            let differencesInFrame = 0;
            let bonesWithSlotId = 0;
            for(let j = 0; j < frame.bones.length; j++) {
                const curBone = frame.bones[j];
                if(curBone.rotation) {
                    curBone.rotation = deg2rad(curBone.rotation);
                }
               // console.log('cur bone:', curBone.slotId);
                if(curBone.slotId || curBone.hide) {
                    if(!(overriddenBones.includes(curBone.id))) {
                        overriddenBones.push(curBone.id);
                    }
                    bonesWithSlotId++;
                    let foundBoneAtIndex = -1;

                    // see if the bone is already in our array
                    for(let k = 0; k < curArray.length; k+=2) {
                        if(curArray[k] == curBone.id) {
                            foundBoneAtIndex = k;
                        }
                    }
                    if(foundBoneAtIndex > -1) {
                        // bone was in the array, confirm the new slot id is different than the slot override we have in the array
                        if(curArray[foundBoneAtIndex+1] != curBone.slotId) {
                            differencesInFrame++;
                            // if it is we will change it.
                            curArray[foundBoneAtIndex+1] = curBone.slotId;
                        }
                    } else {
                        differencesInFrame++;
                        curArray.push(curBone.id, curBone.slotId)
                    }
                }
            }
            if(!differencesInFrame) {
                curArray = previousArray;
            }
        }
        overriddenBoneSlotsByFrame.push(curArray);
    }

    if(overriddenBones.length) {
       // console.log('ADDING ', overriddenBones, 'TO DATA');
        data['overriddenBones'] = overriddenBones;
        data['overriddenBoneSlotsByFrame'] = overriddenBoneSlotsByFrame;
    }
    return data
}

const formatAttachmentSlotData = ( attachmentSlots: Array<AttachmentSlotData>, attachments: Array<AttachmentData>, animations: Array<AnimationData>, actions: {[actionId: string]: string}) :  {[attachmentSlotId: string]: InitializedAttachmentSlotData } => {
    const obj : {[attachmentSlotName: string]: InitializedAttachmentSlotData } = {};

    attachmentSlots.forEach(attachmentSlot => {
        const level = getAttachmentSlotLevel(attachmentSlot, attachmentSlots, attachments)
        const { attachmentIds, id, name, boneNames, setupData } = attachmentSlot;
        const parentAttachmentName = attachments.find(a => a.attachmentSlotIds?.includes(id))?.name;
        let addedBoneIds;
        if(boneNames) {
            addedBoneIds = Object.keys(boneNames).map(possibleIntParse);
        }
        const initializedSlotSetupData = setupData ? formatSetupFrameData(setupData) : null;
        const attachmentDataLookup = {};
        attachmentIds.forEach(aId => {
            const found = attachments.find(a => a.id == aId);
            attachmentDataLookup[found.name] = formatAttachmentData(found, animations, actions, initializedSlotSetupData)
        });

        obj[name] = {
            id,
            name,
            level,
            attachmentData: attachmentDataLookup
        }
        if(initializedSlotSetupData) {
            obj[name].setupData = initializedSlotSetupData;
        }
        if(addedBoneIds && addedBoneIds.length) {
            if(obj[name].setupData) {
                obj[name].setupData.addedBoneIds = addedBoneIds;
            } else {
                obj[name].setupData = { addedBoneIds }
            }
        }
        if(parentAttachmentName) {
            obj[name].parentAttachmentName = parentAttachmentName;
        }
    });
    return obj;
}
const formatAnimationLookup = (animationIds: Array<string | number>, animations: Array<AnimationData>, actionIdToNameLookup: {[actionId: string]: string }) : AnimationLookupData  =>  {
    const animationLookup = {};
    animationIds.forEach(aniId => {
        const found = animations.find(a => a.id == aniId);
        const actionName = actionIdToNameLookup[found.actionId];
        if(!(actionName in animationLookup)) {
            animationLookup[actionName] = {};
        }
        animationLookup[actionName][found.direction] = formatAnimationData(found);
    })
    return animationLookup
}


//TODO: need to refactor exported version to include the addedBoneIds in the raw setup data, since it doesnt
// we populate that property AFTER calling formatSetupFrameData.
export const formatSetupFrameData = (data: RawSetupData, parentSetup?: InitializedSetupData) : InitializedSetupData => {
    if(!data) return null;

    const addedBoneIds = data.bones ? data.bones.map(b => b.id).map(possibleIntParse) : null;
    const directionalOverrideLookups = {
        slots: {},
        parentBones: {},
    }

    const uniqueBoneIds = {};

    const frames = data?.frames;
    const directions = frames? Object.keys(data.frames) : [];

    const finalObj : { frames?: any, bones?: Array<BoneFrameData>, boneOrder?: Array<number>, overriddenBones?: Array<number | string>, boneParentChanges?: Array<number | string>, addedBoneIds?: Array<number | string>, addedColliders?: Array<ColliderSetupData>, adjustedColliders?: Array<ColliderAdjustedData> } = {};
    if(data.addedColliders) finalObj.addedColliders = data.addedColliders;
    if(data.adjustedColliders) finalObj.adjustedColliders = data.adjustedColliders;
    if(data.bones) finalObj.bones = data.bones;
    if(data.boneOrder) finalObj.boneOrder = data.boneOrder as Array<number>;
    if(data.boneParentChanges) finalObj.boneParentChanges = data.boneParentChanges as unknown as Array<number | string>;
    if(addedBoneIds && addedBoneIds.length) {
        finalObj.addedBoneIds = addedBoneIds
    }
    if(frames) finalObj.frames = {};

    for(let j = 0; j < directions.length; j++) {
        const direction = directions[j];

        directionalOverrideLookups.slots[direction] = {};
        directionalOverrideLookups.parentBones[direction] = {};

        finalObj.frames[direction] = frames[direction];
        if(frames[direction].bones) {
            for(let i = 0; i < frames[direction].bones.length; i++) {
                const { id, slotId, hide, parentBoneId } =  frames[direction].bones[i];
                if((slotId && slotId !== null && slotId !== undefined) || hide) {
                    directionalOverrideLookups.slots[direction][id] = true;
                }
                uniqueBoneIds[id] = true;
                if(frames[direction].bones[i].rotation) {
                    frames[direction].bones[i].rotation = deg2rad(frames[direction].bones[i].rotation);
                }
                if(parentBoneId) {
                    directionalOverrideLookups.parentBones[direction][id] = parentBoneId
                }
            }
        }
    }

    const allBoneIds = Object.keys(uniqueBoneIds);
    for(let j = 0; j < allBoneIds.length; j++) {
        const tempDirectionalOverrideLookups : {slotOverrides: Array<string>, parentBoneOverrides: Array<{ direction: string, parentBoneId: number | string | string}> } = { slotOverrides: [], parentBoneOverrides: [] };
        const { slotOverrides, parentBoneOverrides } = tempDirectionalOverrideLookups;

        const curBoneId = allBoneIds[j];
        for (let i = 0; i < directions.length; i++) {
            if (directionalOverrideLookups.slots[directions[i]][curBoneId]) {
                slotOverrides.push(directions[i])
            }

            const parentBoneForDirection = directionalOverrideLookups.parentBones[directions[i]][curBoneId];
            if (parentBoneForDirection) {
                parentBoneOverrides.push({ direction: directions[i], parentBoneId: parentBoneForDirection })
            }
        }
        if(slotOverrides.length === directions.length) {
            if(!finalObj.overriddenBones) {
                finalObj.overriddenBones = [curBoneId];
            } else {
                finalObj.overriddenBones.push(curBoneId)
            }
        } else {
            for(let i = 0; i < slotOverrides.length; i++) {
                if(finalObj.frames[slotOverrides[i]].overriddenBones) {
                    finalObj.frames[slotOverrides[i]].overriddenBones.push(curBoneId)
                } else {
                    finalObj.frames[slotOverrides[i]].overriddenBones = [curBoneId];
                }
            }
        }

        if(parentBoneOverrides.length) {
            let allAreSameParent = true;
            if(parentBoneOverrides.length === directions.length) {
                const parentBoneId = parentBoneOverrides[0].parentBoneId;
                for(let i = 1; i < parentBoneOverrides.length; i++) {
                    if(parentBoneOverrides[i].parentBoneId != parentBoneId) {
                        allAreSameParent = false;
                        break;
                    }
                }
            } else {
                allAreSameParent = false;
            }
            if(allAreSameParent) {
                const boneFrameDatum = { id: curBoneId, parentBoneId: parentBoneOverrides[0].parentBoneId };
                if(!finalObj.bones) {
                    finalObj.bones = [boneFrameDatum];
                } else {
                    finalObj.bones.push(boneFrameDatum)
                }
                directions.forEach(d => {
                    finalObj.frames[d].bones = finalObj.frames[d].bones.filter(b => {
                        return b.id != boneFrameDatum.id && b.parentBoneId != boneFrameDatum.parentBoneId
                    })
                })
            }
        }
    }

    // if the parent setup has the same overrides/parentBoneIds as the child then we can remove it from the child.
    if(parentSetup) {
        if(finalObj.overriddenBones && parentSetup?.overriddenBones) {
            finalObj.overriddenBones = finalObj.overriddenBones.filter(b => {
                return !parentSetup.overriddenBones.find(b2 => b2 == b);
            })
            if(!finalObj.overriddenBones.length) {
                delete finalObj.overriddenBones;
            }
        }

        if(finalObj.bones && parentSetup.bones) {
            finalObj.bones = finalObj.bones.filter(b => {
                return !parentSetup.bones.find(b2 => b2.parentBoneId == b.parentBoneId && b.id == b2.id);
            })
        }

        const doCheck = (direction: string, prop: string, filterBy: (b: any, parentArray: Array<any>) => boolean) => {
            if(finalObj.frames[direction][prop]) {
                // if the parent setup has overriddenBones, we dont need to worry about the directional ones on the child.
                if (parentSetup && parentSetup[prop]) {
                    finalObj.frames[direction][prop] = finalObj.frames[direction][prop].filter(b => {
                        return filterBy(b, parentSetup[prop])
                    })
                }
                if(!finalObj.frames[direction][prop].length) {
                    delete finalObj.frames[direction][prop]
                } else if(parentSetup?.frames && parentSetup.frames[direction] && parentSetup.frames[direction][prop]) {
                    // if we still have overriddenBones left we want to check the parent doesnt initialize them again.
                    finalObj.frames[direction][prop] = finalObj.frames[direction][prop].filter(b => {
                        return filterBy(b, parentSetup.frames[direction][prop])
                    });
                    if(!finalObj.frames[direction][prop].length) {
                        delete finalObj.frames[direction][prop]
                    }
                }
            }
        }

        const doOverridenSlotBoneCheck = (direction) => {
            doCheck(direction, 'overriddenBones', (b, parentArray) => {
                return !parentArray.find(b2 => b2 == b);
            })
            /*
            if(finalObj.frames[direction].overriddenBones) {
                // if the parent setup has overriddenBones, we dont need to worry about the directional ones on the child.
                if(parentSetup?.overriddenBones) {
                    finalObj.frames[direction].overriddenBones = finalObj.frames[direction].overriddenBones.filter(b => {
                        return !parentSetup.overriddenBones.find(b2 => b2 == b);
                    })
                }
                if(!finalObj.frames[direction].overriddenBones.length) {
                    delete finalObj.frames[direction].overriddenBones
                } else if(parentSetup.frames[direction]?.overriddenBones) {
                    // if we still have overriddenBones left we want to check the parent doesnt initialize them again.
                    finalObj.frames[direction].overriddenBones = finalObj.frames[direction].overriddenBones.filter(b => {
                        return !parentSetup.frames[direction].overriddenBones.find(b2 => b2 == b);
                    })
                    if(!finalObj.frames[direction].overriddenBones.length) {
                        delete finalObj.frames[direction].overriddenBones
                    }
                }
            }

             */
        }
        const doOverriddenParentBoneCheck = (direction) => {
            doCheck(direction, 'bones', (b: {parentBoneId: number | string, id: number | string}, parentArray : Array<{ parentBoneId: number | string, id: number | string }>) => {
                return !parentArray.find(b2 => b2.parentBoneId == b.parentBoneId && b.id == b2.id);
            })
            /*
            if(finalObj.frames[direction].bones) {
                // check parentSetup global bone setup for duplicates/redundancies first.
                if(parentSetup?.bones) {
                    finalObj.frames[direction].bones = finalObj.frames[direction].bones.filter(b => {
                        return !parentSetup.bones.find(b2 => b2.parentBoneId == b.parentBoneId);
                    })
                }
                if(!finalObj.frames[direction].bones.length) {
                    delete finalObj.frames[direction].bones
                } else if(parentSetup.frames[direction]?.bones) {
                    // then check parentSetup directional bone setup for duplicates if we still have them.
                    finalObj.frames[direction].bones = finalObj.frames[direction].bones.filter(b => {
                        return !parentSetup.frames[direction].bones.find(b2 => b2.parentBoneId == b.parentBoneId);
                    })
                    if(!finalObj.frames[direction].bones.length) {
                        delete finalObj.frames[direction].bones
                    }
                }
            }

             */
        }

        for(let dir in finalObj.frames) {
            doOverridenSlotBoneCheck(dir);
            doOverriddenParentBoneCheck(dir);
        }
    }

    // now remove empty objects or arrays
    if(finalObj.frames) {
        const arrayNamesToCheck = ['overriddenBones', 'bones'];
        directions.forEach(d => {
            const dirFrame = finalObj.frames[d];
            if(dirFrame) {
                arrayNamesToCheck.forEach(a => {
                    if(finalObj.frames[d] && finalObj.frames[d][a]?.length === 0) {
                        delete finalObj.frames[d][a];
                    }
                });
                if(!Object.keys(finalObj.frames[d]).length) {
                    delete finalObj.frames[d];
                }
            }
        })
        if(!Object.keys(finalObj.frames).length) {
            delete finalObj.frames
        }
    }

    if(!Object.keys(finalObj).length) {
        return null;
    }
    //    finalObj.overriddenBones = sortBoneHierarchy(finalObj.overriddenBones, boneObjLookup);
    return finalObj;
}

export const formatAttachmentData = (attachmentData: AttachmentData, animations: Array<AnimationData>, actions: {[actionId: string]: string}, initializedSlotSetupData?: InitializedSetupData) : InitializedAttachmentData => {
    /*
    const atlasLookup = {};
    attachmentData.atlasIds.forEach(aId => {
        const found = atlases.find(a => a.id == aId);
        atlasLookup[found.name] = found;
    });

     */

    const addedBoneIds = [];
    for(let boneId in attachmentData.boneNames) {
        addedBoneIds.push(boneId);
    }
    const animationLookup = formatAnimationLookup(attachmentData.animationIds, animations, actions);

    const obj : InitializedAttachmentData = {
        id: attachmentData.id,
        name: attachmentData.name,
        atlasIds: attachmentData.atlasIds,
        animations: animationLookup
    }
    if(attachmentData.setupData) {
        obj.setupData = formatSetupFrameData(attachmentData.setupData, initializedSlotSetupData);
    }
    return obj;
}

const getAttachmentSlotLevel = (attachmentSlotData: AttachmentSlotData, attachmentSlots: Array<AttachmentSlotData>, attachments: Array<AttachmentData>) : number => {
    let level = 1;
    let parentAttachment = attachments.find(a => a.attachmentSlotIds?.includes(attachmentSlotData.id));
    while(parentAttachment) {
        level++;
        attachmentSlotData = attachmentSlots.find(s => s.attachmentIds.includes(parentAttachment.id));
        parentAttachment = attachments.find(a => a.attachmentSlotIds?.includes(attachmentSlotData.id));
    }
    return level;
}