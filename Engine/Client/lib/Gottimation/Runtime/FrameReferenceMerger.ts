import {AnimationLookupData} from "./types";

export class Merger {
    private overriddenBonesArrays = [];
    private overriddenBonesArraysStringified = [];
    private overriddenFrameBonesArrays : Array<Array<Array<number>>> = [];
    private overriddenBoneSingleFrameArrays : Array<Array<number>> = [];
    constructor() {}

    public addLookup(animationLookup: AnimationLookupData) {
        for(let actionName in animationLookup) {
            for(let direction in animationLookup[actionName]) {
                if(animationLookup[actionName][direction].overriddenBones) {
                    animationLookup[actionName][direction].overriddenBones.sort();
                    const stringified = JSON.stringify(animationLookup[actionName][direction].overriddenBones);
                    const index = this.overriddenBonesArrays.indexOf(stringified);
                    if(index > -1) {
                        animationLookup[actionName][direction].overriddenBones = this.overriddenBonesArrays[index];
                        animationLookup[actionName][direction].overriddenBoneSlotsByFrame = this.checkIfSameOverriddenBoneArray(animationLookup[actionName][direction].overriddenBoneSlotsByFrame)
                    } else {
                        this.overriddenBonesArrays.push(animationLookup[actionName][direction].overriddenBones)
                        this.overriddenBonesArraysStringified.push(stringified);

                        this.overriddenFrameBonesArrays.push(animationLookup[actionName][direction].overriddenBoneSlotsByFrame);
                        animationLookup[actionName][direction].overriddenBoneSlotsByFrame.forEach(frame => {
                            this.overriddenBoneSingleFrameArrays.push(frame);
                        })
                    }
                }
            }
        }
    }
    private checkIfBoneSlotComboExist(arrayToCheck: Array<number>, boneId: number, slotId: number) {
        for(let i = 0; i < arrayToCheck.length; i+=2) {
            if(arrayToCheck[i] == boneId) {
                return arrayToCheck[i+1] == slotId;
            }
        }
        return false;
    }

    private checkIfSameOverriddenBoneArray (arrayToCheck: Array<Array<number>>) : Array<Array<number>> {
        for(let i = 0; i < this.overriddenFrameBonesArrays.length; i++) {
            let matched = true;
            const curFrames = this.overriddenBonesArrays[i];
            if(curFrames.length !== arrayToCheck.length) continue;

            for(let j = 0; j < curFrames.length; j++) {
                const curFrame = curFrames[j];
                const checkCurFrame = arrayToCheck[j]
                if(curFrame.length !== checkCurFrame.length) {
                    matched = false;
                    break;
                }
                for(let k = 0; k < curFrame.length; k+=2) {
                    const curBone = curFrames[k];
                    const curSlotId = curFrames[k+1]
                    if(!(this.checkIfBoneSlotComboExist(checkCurFrame, curBone, curSlotId))) {
                        matched = false;
                        break;
                    }
                }
                if(!matched) break;
            }
            if(matched) {
                return curFrames
            } else {
                break;
            }
        }

        // couldnt find a match, iterate the arrayToCheck and see if we can match any single frame arrays

        for(let i = 0; i < arrayToCheck.length; i++) {
            const curFrame = arrayToCheck[i];
            let matched;
            for(let j = 0; j < this.overriddenBoneSingleFrameArrays.length; j++) {
                const curSingleFrameArray = this.overriddenBoneSingleFrameArrays[j];
                if(curSingleFrameArray.length !== curFrame.length) break;
                matched = curSingleFrameArray;
                for(let k = 0; k < curSingleFrameArray.length; k+=2) {
                    const boneId = curSingleFrameArray[k];
                    const slotId = curSingleFrameArray[k+1]
                    if(!(this.checkIfBoneSlotComboExist(curFrame, boneId, slotId))) {
                        matched = null;
                        break;
                    }
                }
                if(matched) break;
            }
            if(matched) {
                arrayToCheck[i] = matched;
            } else {
                this.overriddenBoneSingleFrameArrays.push(arrayToCheck[i])
            }
        }
        this.overriddenFrameBonesArrays.push(arrayToCheck);
        return arrayToCheck;
    }
}