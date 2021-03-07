import { ControllerManager } from "./Managers/ControllerManager";
import { BaseControllerSystem } from "./Systems/Controllers/BaseControllerSystem";
import { InputSystem } from "./Systems/InputSystem";
import {MappedActionToInputState, StickInputId, UpdatedSystemActionState} from "./types";
import { KeyboardSystem } from "./Systems/Controllers/KeyboardSystem";
import { BaseTouchSystem } from "./Systems/Touch/BaseTouchSystem";
import { MouseSystem } from "./Systems/Controllers/MouseSystem";

export class GameInput {
    private keyboardSystem: KeyboardSystem;
    private mouseSystem: MouseSystem;
    private controllerManager: ControllerManager;
    private touchSystem: BaseTouchSystem;

    public updateController: () => Array<UpdatedSystemActionState> = () => [];
    public updateKeyboard: () => UpdatedSystemActionState = () => null;
    public updateTouch: () => UpdatedSystemActionState = () => null;
    public updateMouse: () => UpdatedSystemActionState = () => null;

    private interfaceIsOpen : boolean;

    constructor(mappedInputStates?: { keyboard?: MappedActionToInputState, mouse?: MappedActionToInputState, controller: any }, disableOpts?: { controller?: boolean, mouse?: boolean, keyboard?: boolean, touch?: boolean }) {
        disableOpts = disableOpts || {};
        !disableOpts.keyboard && this.initializeKeyboardSystem(mappedInputStates?.keyboard);
        !disableOpts.mouse && this.initializeMouseManager();
        !disableOpts.controller && this.initializeControllerManager(mappedInputStates.controller);
     //   !disableOpts.touch && this.initializeTouchManager();
    }
    public update() : { keyboard: UpdatedSystemActionState, mouse: UpdatedSystemActionState, controller: Array<UpdatedSystemActionState>, touch: UpdatedSystemActionState } {
        return {
            keyboard: this.updateKeyboard(),
            mouse: this.updateMouse(),
            controller: this.updateController(),
            touch: this.updateTouch(),
        }
    }
    public unmapKeyboardAction(action: string, key: string) {
        this.keyboardSystem.unmapInputFromAction(key, action);
    }
    public mapKeyboardAction(action: string, key: string) {
        this.keyboardSystem.mapInputIdToAction(key, action)
    }
    public mapController(controllerIndex: number, id?: string | StickInputId) {
       // this.controllerManager.initializedSystemArray
    }
    public updateOnlyTouch() {
    }
    private registerSystemHandlers(system : InputSystem) {
    }
    private initializeKeyboardSystem(state?: MappedActionToInputState) {
        this.keyboardSystem = new KeyboardSystem(state);
        this.updateKeyboard = this.keyboardSystem.update.bind(this.keyboardSystem);
    }
    private initializeTouchManager(factory: () => BaseTouchSystem) {
        this.touchSystem = factory();
        //this.touchManager = new KeyboardManager();
        this.updateTouch = this.touchSystem.update.bind(this.touchSystem);
    }
    private initializeMouseManager(state?: MappedActionToInputState) {
        this.mouseSystem = new MouseSystem(state);
        this.updateMouse = this.mouseSystem.update.bind(this.mouseSystem);
    }
    private initializeControllerManager(state?: any) {
        this.controllerManager = new ControllerManager(state);
        this.controllerManager.on('add', (system : BaseControllerSystem) => {
            console.error('ADDED CONTROLLER SYSTEM:', system)
        });
        this.controllerManager.on('remove', (system : BaseControllerSystem) => {
        });
        this.controllerManager.init();
        this.updateController = this.controllerManager.update.bind(this.controllerManager);
    }
}