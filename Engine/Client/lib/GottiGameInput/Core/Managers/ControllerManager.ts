import { BaseControllerSystem } from '../Systems/Controllers/BaseControllerSystem';
import { DefaultController } from '../Systems/Controllers/ControllerSystems';
import { BaseManager } from './BaseManager';
import { ActionState, ActionStateDatumChange } from '../types';
export class ControllerManager extends BaseManager {
    readonly needsPolling: boolean = false;
    readonly trackedSystemArray: Array<BaseControllerSystem> = [];
    readonly initializedSystemArray: Array<BaseControllerSystem> = [];
    private state: any;
    constructor(state?: any) {
        super();
        this.state =state;
        if(typeof navigator === 'undefined') throw new Error(`No navigator object found.`)
        if(typeof window === 'undefined') throw new Error(`No window object found.`);
        this.needsPolling = !('ongamepadconnected' in window);
    }
    public onClear() {
        if(!this.needsPolling) {
            window.removeEventListener("gamepadconnected", this.handleGamePadConnected);
            window.removeEventListener("gamepaddisconnected", this.handleGamePadDisconnected);
        }
        [...this.initializedSystemArray].forEach(system => this.handleGamePadDisconnected({ gamepad: system.gamepad } as GamepadEvent));
        if(this.initializedSystemArray.length) throw new Error(`Should have no initialized systems left.`)
        if(!this.trackedSystemArray.every(s => !!s)) throw new Error(`Should have no truthy values in the tracked system array`)
    }

    public onUpdate() {
        this.needsPolling && this.pollGamepads();
    }

    // seperate init function so we can listen to events on controller manager after construction before the native events get fired incase its synchronous
    init() {
        this.handleGamePadConnected = this.handleGamePadConnected.bind(this);
        this.handleGamePadDisconnected = this.handleGamePadDisconnected.bind(this);
        if(!this.needsPolling) {
            // todo im going to query and init the arrays but im not sure if listening will do the callbacks right away and mess this up.
            window.addEventListener("gamepadconnected", this.handleGamePadConnected);
            window.addEventListener("gamepaddisconnected", this.handleGamePadDisconnected);
        }
        // even if we dont need to poll every tick, run the poll logic on init to get any already connected gamepads.
        this.pollGamepads();
    }

    private handleGamePadConnected(e: GamepadEvent) {
        const gpIdx = e.gamepad.index;
        const gp : Gamepad = navigator.getGamepads()[gpIdx];
        if(gp) {
            if(this.trackedSystemArray[gpIdx]) {
                console.error('gamepad:', gp, 'index:', e.gamepad.index)
                throw new Error(`This gamepad already had an initialized system at the index`)
            }
            const system = this.controllerSystemFactory(gp);
            this.trackedSystemArray[gpIdx] = system;
            this.initializedSystemArray.push(system);
            this.addSystem(system);
        }
    }
    private handleGamePadDisconnected(e: GamepadEvent) {
        const gpIdx = e.gamepad.index;
        const gp : Gamepad = navigator.getGamepads()[gpIdx];
        if(gp) {
            const trackedSystem = this.trackedSystemArray[gpIdx];
            if(!trackedSystem) throw new Error(`No tracked system found for index: ${gpIdx}`);
            // set tracked system reference to null.
            this.trackedSystemArray[gpIdx] = null;
            const initIndex = this.initializedSystemArray.indexOf(trackedSystem);
            if(initIndex < 0) throw new Error(`Expected init index to be greater than -1.`)
            this.initializedSystemArray.splice(initIndex, 1);
            this.removeSystem(trackedSystem);
        }
    }
    private pollGamepads() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator['webkitGetGamepads'] ? navigator['webkitGetGamepads'] : []);
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if(gamepad) {
                const gamePadSystemInitialized  = this.initializedSystemArray[gamepad.index]
                if(gamepad.connected) {
                    if(!gamePadSystemInitialized) {
                        this.handleGamePadConnected({ gamepad } as GamepadEvent)
                    } else {
                        gamePadSystemInitialized.gamepad = gamepad;
                    }
                } else if (!gamepad.connected && gamePadSystemInitialized) {
                    this.handleGamePadDisconnected({ gamepad } as GamepadEvent)
                }
            } else {
                //todo: figure out does the index here match the gamepad.index always? if so when will it become null vs connected = false?
               // this.handleGamePadDisconnected({ gamepad: { index: i } } as GamepadEvent)
            }
        }
    }
    private controllerSystemFactory(g: Gamepad) : DefaultController {
        const system = new DefaultController(g, this.state.default);
        return system;
    }
}