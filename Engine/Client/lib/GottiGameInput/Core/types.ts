export type ActionStateDatumChange = { previous: boolean | number | any, current: boolean | number | any }
export type AxesRangeAction = { state: number, end: number };
export type StickEvent = { degrees: number, power: number };
export type Angles = { degrees: number, radians: number }
export type DirectionString =  'north' | 'south' | 'west' | 'east' | 'northeast' | 'northwest' | 'southeast' | 'southwest';
export type DirectionalActionObject = {
    north?: Action,
    south?: Action,
    west?: Action,
    east?: Action,
}
export type ActionMapTypes = 'key' | 'mouse'
export type ActionState = {[action: string]: boolean | StickAngleState };
export type RemoveInputIdActionMapEvent = { inputId: string | number | StickInputId, action: string, actionNowUnmapped: boolean }
export type AddInputIdActionMapEvent = { inputId: string | number | StickInputId, action: string  }
export type MappedActionToInputState = {[action: string]: Array<string | number> };
export type MappedInputToActionStates = {
    [inputId in string | number]: Array<string>;
};

export type UpdatedSystemActionState = { state: ActionState, changed: {[action: string]: ActionStateDatumChange } };
export type Action = string | Array<string>;
export type StickAction = RangedStickAction | Action
export type StickDegreeDirections = { min: number, max: number }
export type RangedStickActionDirection = StickDegreeDirections | DirectionString;
export type StickAngleState =  { angles?: { default: Angles, north0: Angles }, power: number };
export type RangedStickAction = {
    direction: RangedStickActionDirection | Array<RangedStickActionDirection>,
    action: Action,
}

export type StickInputId = {
    index: number,
    direction?: RangedStickActionDirection,
}

export type DefaultControllerStickState = {
    left: StickAction,
    leftPress: StickAction,
    right?: StickAction,
    rightPress?: StickAction,
}
export type DefaultTriggerState = {
    l1: Action,
    l2: Action,
    r1: Action,
    r2: Action,
}

export type DefaultControllerButtonState = {
    select: Action,
    start: Action,
    north: Action,
    south: Action,
    east: Action,
    west: Action,
}

export type DefaultControllerState = {
    buttons: DefaultControllerButtonState,
    sticks: DefaultControllerStickState,
    triggers:  DefaultTriggerState,
    dpad: DirectionalActionObject | Array<DirectionalActionObject>,
}


export type KeyboardUI_Interface = {
    [keycode: string]: {
        x: number,
        y: number,
    }
}