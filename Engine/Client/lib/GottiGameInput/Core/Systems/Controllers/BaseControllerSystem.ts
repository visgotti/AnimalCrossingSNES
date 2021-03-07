import { InputSystem } from "../InputSystem";
import { StickAction, AddInputIdActionMapEvent, RemoveInputIdActionMapEvent, RangedStickAction, StickInputId } from "../../types";
import { isValidDirection, getDirectionFromNorth0Degrees } from "../../../utils";



type FormattedStickActionLookup = {
    actions?: Array<string>,
    stringDirections?: {
        north?: Array<string>,
        south?: Array<string>,
        east?: Array<string>,
        west?:Array<string>,
        northwest?: Array<string>,
        northeast?: Array<string>,
        southwest?: Array<string>,
        southeast?: Array<string>,
    },
    degreeDirections?: Array<{ min: number, max: number, actions: Array<string> }>
}

export abstract class BaseControllerSystem extends InputSystem {
    public gamepad: Gamepad;
    private buttonIndexIdMap: Array<string>;

    public stickActionCount: {[action: string] : number } = {}

    private _onMappedStickActionAddedListeners: Array<(event: StickAction) => void> = [];
    private _onMappedStickActionRemovedListeners: Array<(event: StickAction) => void> = [];
    readonly stickActionArray : Array<string> = [];
    readonly mappedStickRotationActions: {[stickIndex: number]: Array<{ start: number, end: number, callback: (rotation: number, power: number) => void }>} = {};
    readonly mappedAxesActions: {[axesIndex: number]: Array<{ start: number, end: number, callback: (rotation: number) => void }>} = {};
    readonly mappedStickActions: { press: Array<FormattedStickActionLookup>, move: Array<FormattedStickActionLookup> } = { press: [], move: [] };
    readonly trackedStickActions: Array<{ press: Array<string>, move: Array<string> }> = [];
    constructor(gamepad: Gamepad, state: any) {
        super();
        this.gamepad = gamepad;
    }
    public onClear(): void {}

    protected currentIterationTrueLookup: {[action: string]: boolean } = {};

    public abstract isPowerBtn(buttonIndex: number) : boolean;
    public abstract isStickPressed (stickIndex: number) : boolean;
    public abstract applyControllerState (state: any) : void;
    protected mapStickRangeToAction(axesIndex: number, start: number, end: number, callback: (StickEvent) => void) {
        this.mappedStickRotationActions[axesIndex]
    }

    public unmapStickFromAction(stickIndex: number, stickAction: StickAction, press: boolean) {
        if(Array.isArray(stickAction)) {
            stickAction.forEach(a => {
                this.unmapStickFromAction(stickIndex, stickAction, press);
            })
            return;
        }
        const type = this.validateStickActionType(stickAction);
        const stickActions = this.getStickActionLookup(stickIndex, press, false);
        const inputId : StickInputId = { index: stickIndex };
        const eventData : RemoveInputIdActionMapEvent = { inputId, actionNowUnmapped: false, action: '' };
        let actionString;
        if(type === 'string') {
            actionString = stickAction;
            const idx = stickActions.actions.indexOf(actionString);
            if(idx < 0) throw new Error(`Expected`)
            stickActions.actions.splice(idx, 1);
            if(!stickActions.actions.length) {
                delete stickActions.actions;
            }
            eventData.action = actionString;
            this.updateStickActionCount(actionString, false)
            eventData.actionNowUnmapped = !this.actionIsMapped(actionString);
            this._onMappedActionRemovedListeners.forEach(l => l(eventData));
        } else {
            stickAction = (<RangedStickAction>stickAction)
            actionString = stickAction.action;
            const directions = Array.isArray(stickAction.direction) ? stickAction.direction : [stickAction.direction];
            directions.forEach(direction => {
                inputId.direction = direction;
                if(typeof direction === 'string') {
                    const idx = stickActions.stringDirections[direction].indexOf(actionString);
                    if(idx < 0) throw new Error(`Action ${actionString} was not mapped to direction ${direction} on the ${stickIndex} stick`);
                    stickActions.stringDirections[direction].splice(idx, 1);
                    if(!stickActions.stringDirections[direction].length) {
                        delete stickActions.stringDirections[direction];
                        if(!(Object.keys(stickActions.stringDirections).length)) {
                            delete stickActions.stringDirections;
                        }
                    }
                } else {
                    const { min, max } = direction;
                    const found = stickActions.degreeDirections.find(d => d.min == min && d.max == d.max && d.actions.includes(actionString));
                    if(!found) throw new Error(`Action ${actionString} was not mapped to direction min max: ${direction} on the ${stickIndex} stick`);
                    found.actions.splice(found.actions.indexOf(actionString), 1);
                    if(!found.actions.length) {
                        stickActions.degreeDirections.splice(stickActions.degreeDirections.indexOf(found), 1);
                        if(!stickActions.degreeDirections.length) {
                            delete stickActions.degreeDirections;
                        }
                    }
                }
                this.updateStickActionCount(actionString, false)
                eventData.action = actionString;
                eventData.actionNowUnmapped = !this.actionIsMapped(actionString);
                this._onMappedActionRemovedListeners.forEach(l => l(eventData));
            })
        }
    }
    private actionIsMapped(action: string) : boolean {
        if(this.stickActionCount[action]) {
            return true;
        }
        if(this.mappedActionToInputIds[action]?.length) {
            return true;
        }
        return false;
    }
    private getStickActionLookup(stickIndex: number, isPress: boolean, createIfNotAdded=true) : FormattedStickActionLookup {
        const key = isPress ? 'press' : 'move';
        if(!this.mappedStickActions[key][stickIndex]) {
            if(createIfNotAdded) {
                this.mappedStickActions[key][stickIndex] = {};
            } else {
                throw new Error(`Expected to have index`)
            }
        }
        return this.mappedStickActions[key][stickIndex];
    }
    private validateStickActionType(stickAction: StickAction) : 'string' | 'object' {
        const type = typeof stickAction;
        if(type !== 'string' && type !== 'object') {
            throw new Error(`Invalid action type: ${stickAction}`)
        }
        return type
    }

    private updateStickActionCount(action: string, add: boolean, press?: boolean) {
        if(add) {
            if(!this.stickActionCount[action]) {
                this.stickActionArray.push(action);
                this.stickActionCount[action] = 1;
            } else {
                this.stickActionCount[action]++;
            }
        } else {
            this.stickActionCount[action]--;
            if(!this.stickActionCount[action]) {
                const idx = this.stickActionArray.indexOf(action);
                if(idx < 0) throw new Error(`Mismatch stick action array and count tracker.`)
                this.stickActionArray.splice(idx, 1);
                delete this.stickActionCount[action];
            }
        }
    }

    public mapStickToAction(stickIndex: number, stickAction: StickAction, press: boolean) {
        if(Array.isArray(stickAction)) {
            stickAction.forEach(a => {
                this.mapStickToAction(stickIndex, a, press);
            })
            return;
        }
        const type = this.validateStickActionType(stickAction);
        const stickActions = this.getStickActionLookup(stickIndex, press, true);
        const inputId : StickInputId = { index: stickIndex };
        const eventData : AddInputIdActionMapEvent = { inputId, action: '' };
        let actionString;
        if(type === 'string') {
            actionString = stickAction;
            if(!stickActions.actions) {
                stickActions.actions = [actionString];
            } else {
                stickActions.actions.push(actionString);
            }
            eventData.action = actionString;
            this.updateStickActionCount(actionString, true)
            this._onMappedActionAddedListeners.forEach(l => l(eventData));
        } else {
            stickAction = (<RangedStickAction>stickAction)
            actionString = stickAction.action;
            const directions = Array.isArray(stickAction.direction) ? stickAction.direction : [stickAction.direction];
            directions.forEach(direction => {
                inputId.direction = direction;
                if(typeof direction === 'string') {
                    if(!isValidDirection(direction)) {
                        throw new Error(`Invalid direction string ${direction}`)
                    }
                    if(!stickActions.stringDirections) {
                        stickActions.stringDirections = {[direction]: [actionString]}
                    } else if (!stickActions.stringDirections[direction]) {
                        stickActions.stringDirections[direction] = [actionString];
                    } else {
                        stickActions.stringDirections[direction].push(actionString);
                    }
                } else {
                    const { min, max } = direction;
                    this.validateMinMax(min, max)
                    if(!stickActions.degreeDirections) {
                        stickActions.degreeDirections = [{ min, max, actions: [actionString] }]
                    } else {
                        const found = stickActions.degreeDirections.find(d => d.min == min && d.max == max);
                        if(found) {
                            found.actions.push(actionString);
                        }else {
                            stickActions.degreeDirections.push({ min, max, actions: [actionString]});
                            stickActions.degreeDirections.sort((aa, bb) => {
                                const aaMin = aa.min || 0;
                                const bbMin = bb.min || 0;
                                return aaMin - bbMin;
                            });
                        }
                    }
                }
                this.updateStickActionCount(actionString, true)
                eventData.action = actionString;
                this._onMappedActionAddedListeners.forEach(l => l(eventData));
            })
        }
    }
    public updateState(): void {
        this.currentIterationTrueLookup = {};
        this.gamepad.buttons.forEach((b, i) => {
            const resolvedBtnActions = this.resolveActions(i);
            if(!resolvedBtnActions) return;
            resolvedBtnActions.forEach(a => {
                if(!this.currentIterationTrueLookup[a]) {
                    const v = this.isPowerBtn(i) ? b.value : b.pressed;
                    this.actionState[a] = v;
                    if(v) this.currentIterationTrueLookup[a] = true;
                }
            })
        });
    }
    private validateMinMax(min?: number, max?: number) {
        const hasMin =min !== undefined && min !== null;
        const hasMax = max !== undefined && max !== null;
        if(hasMin) {
            if(min < 0 || min > 360) {
                throw new Error(`Invalid degree value, must be 0-360`)
            }
        }
        if(hasMax) {
            if(max < 0 || max > 360) {
                throw new Error(`Invalid degree value, must be 0-360`)
            }
        }
        if(hasMax && hasMin) {
            if(min >= max) {
                throw new Error(`Min should be less than max.`)
            }
        }
    }

    protected updateStickState(angles, power, direction: string, stickMap: FormattedStickActionLookup) {
        const { degrees } = angles.north0;
        const dir = getDirectionFromNorth0Degrees(degrees);
        if(stickMap.actions) {
            stickMap.actions.forEach(a => {
                this.actionState[a] = { angles, power }
            })
        }
        if(stickMap.stringDirections) {
            const keys = Object.keys(stickMap.stringDirections);
            keys.forEach(k => {
                stickMap.stringDirections[k].forEach(a => {
                    const wasValid = k === dir;
                    if(wasValid && !this.currentIterationTrueLookup[a]) {
                        this.currentIterationTrueLookup[a] = true;
                        this.actionState[a] = true;
                    } else if (!wasValid && !this.currentIterationTrueLookup[a]) {
                        this.actionState[a] = false;
                    }
                })
            });
        }
        if(stickMap.degreeDirections) {
            for(let i = 0; i < stickMap.degreeDirections.length; i++) {
                const d = stickMap.degreeDirections[i];
                const wasValid = (!d.min || d.min <= degrees) && (!d.max || d.max >= degrees);
                d.actions.forEach(a => {
                    if(wasValid && !this.currentIterationTrueLookup[a]) {
                        this.currentIterationTrueLookup[a] = true;
                        this.actionState[a] = true;
                    } else if (!wasValid && !this.currentIterationTrueLookup[a]) {
                        this.actionState[a] = false;
                    }
                })
            }
        }
    }
}