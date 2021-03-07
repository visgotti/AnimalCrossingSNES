import { BaseControllerSystem } from '../BaseControllerSystem';
import { normalizeAxes, getDirectionFromNorth0Degrees } from '../../../../utils';
import { DefaultControllerState, DefaultControllerStickState, DirectionalActionObject, DefaultTriggerState, DefaultControllerButtonState } from '../../../types';
export class DefaultController extends BaseControllerSystem {
    constructor(gamepad: Gamepad, state?: DefaultControllerState) {
        super(gamepad, state);
        if(state) {
            this.applyControllerState(state);
        }
    }
    protected applyControllerTriggers(triggers: DefaultTriggerState) {
        const { l1, l2, r1, r2 } = triggers;
        const apply = (trigger, btnIdx, isPower: boolean) => {
            if (Array.isArray(trigger)) {
                trigger.forEach(a => {
                    this.mapInputIdToAction( (btnIdx), a);
                    if(isPower) {
                        this.actionState[a] = 0;
                    } else {
                        this.actionState[a] = false;
                    }
                })
            } else {
                this.mapInputIdToAction(btnIdx, trigger);
                if(isPower) {
                    this.actionState[trigger] = 0;
                } else {
                    this.actionState[trigger] = false;
                }
            }
        }
        l1 && apply(l1, 4, false);
        l2 && apply(l2, 6, true);
        r1 && apply(r1, 5, false);
        r2 && apply(r2, 7, true);
    }

    protected applyControllerSticks(sticks: DefaultControllerStickState) {
        const { left, leftPress, right, rightPress } = sticks;
        const applyStick = (stick, index, isPressed) => {
            if (Array.isArray(stick) || typeof stick === 'string') {
                this.mapStickToAction(index, stick, isPressed);
            } else if (typeof stick === 'object') {
                for (let action in stick) {
                    this.mapStickToAction(index, {action, direction: stick[action]}, isPressed);
                }
            } else {
                throw new Error(`unhandled left controller state`)
            }
        }
        left && applyStick(left, 0, false);
        leftPress && applyStick(leftPress, 0,true);
        right && applyStick(right, 1, false);
        rightPress && applyStick(rightPress, 1, true);
    }
    public applyControllerDPad(dpad: DirectionalActionObject | Array<DirectionalActionObject>) {
        if(Array.isArray(dpad)) {
            dpad.forEach(this.applyControllerDPad.bind(this));
        } else {
            const actionMap = {};
            const { north, west, east, south } = dpad;
            north && this.mapInputIdToAction(12, north);
            south && this.mapInputIdToAction(13, south);
            west && this.mapInputIdToAction(14, west);
            east && this.mapInputIdToAction(15, east);
        }
    }
    public isPowerBtn(buttonIndex: number) {
        return buttonIndex === 6 || buttonIndex === 7
    }
    public applyControllerState(state: DefaultControllerState) {
        const { sticks, triggers, dpad, buttons } = state;
        sticks && this.applyControllerSticks(sticks);
        dpad && this.applyControllerDPad(dpad);
        triggers && this.applyControllerTriggers(triggers);
        buttons && this.applyControllerButtons(buttons);
    }
    public applyControllerButtons(buttons: DefaultControllerButtonState) {
        const { select, start, north, south, east, west } = buttons;
        select && this.mapInputIdToAction(8, select);
        start && this.mapInputIdToAction(9, start);
        north && this.mapInputIdToAction(3, north);
        west && this.mapInputIdToAction(2, west);
        east && this.mapInputIdToAction(1, east);
        south && this.mapInputIdToAction(0, south);
    }
    public isStickPressed(stickIndex: number): boolean {
        // default controller stick index buttons are 10 and 11
        return this.gamepad.buttons[stickIndex+10].pressed;
    }
    public updateState(): void {
        super.updateState();
        for(let i = 0; i < this.stickActionArray.length; i++) {
            if(!this.currentIterationTrueLookup[this.stickActionArray[i]]) {
                this.actionState[this.stickActionArray[i]] = false;
            }
        }
        const updateStickState = (stickIndex, isPressed) => {
            const movedMap = this.mappedStickActions.move[stickIndex];
            const pressedMap = this.mappedStickActions.press[stickIndex];
            if(movedMap || pressedMap) {
                const stickX = parseFloat(this.gamepad.axes[stickIndex*2].toFixed(2));
                const stickY = parseFloat((this.gamepad.axes[stickIndex*2+1]).toFixed(2))*-1 ;
                const { angles, power } = normalizeAxes(stickX, stickY);
                if(!power) {
                    if(movedMap) {
                        movedMap.degreeDirections?.forEach(d => {
                            d.actions.forEach(a => {
                                if(!this.currentIterationTrueLookup[a]) {
                                    this.actionState[a] = false;
                                }
                            });
                        });
                        if(movedMap.stringDirections) {
                            const keys = Object.keys(movedMap.stringDirections);
                            keys.forEach(k => {
                                movedMap.stringDirections[k].forEach(a => {
                                    if(!this.currentIterationTrueLookup[a]) {
                                        this.actionState[a] = false;
                                    }
                                })
                            });
                        }
                        movedMap.actions?.forEach(a => {
                            this.actionState[a] = { angles, power }
                        })
                    }
                    // make all false.
                    isPressed && pressedMap?.actions?.forEach(a => {
                        this.actionState[a] = true;
                    })
                } else {
                    const { degrees } = angles.north0;
                    const dir = getDirectionFromNorth0Degrees(degrees);
                    movedMap && this.updateStickState(angles, power, dir, movedMap);
                    if(isPressed && pressedMap) {
                        this.updateStickState(angles, power, dir, pressedMap);
                    }
                }
            }
        }
        updateStickState(0, this.isStickPressed(0));
        updateStickState(1, this.isStickPressed(1));
    }
}