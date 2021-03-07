import { Action, StickAction } from "./types";

export interface DefaultControllerTriggers {
    l1: Action,
    l2: Action,
    r1: Action,
    r2: Action,
}

export interface DefaultControllerSticks {
    left?: StickAction,
    leftPress?: StickAction,
    right?: StickAction,
    rightPress?: StickAction,
}

export interface DefaultController {
    buttons: {
        north: Action,
        south: Action,
        east: Action,
        west: Action,
    }
    dpad: Action,
    triggers: DefaultControllerTriggers,
    sticks: DefaultControllerSticks,
}

export interface XBoxController {
    buttons: {
        y: Action,
        x: Action,
        b: Action,
        a: Action,
    },
    dpad: Action,
    triggers: DefaultControllerTriggers,
    sticks: DefaultControllerSticks,
}
export interface PlaystationController {
    buttons: {
        triangle: Action,
        square: Action,
        circle: Action,
        x: Action,
    },
    dpad: Action,
    triggers: DefaultControllerTriggers,
    sticks: DefaultControllerSticks,
}