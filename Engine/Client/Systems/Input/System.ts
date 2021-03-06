import {SYSTEMS} from "../../../Shared/Constants";

import { PlayerInput } from '../../../Shared/types';
import {ClientSystem} from "gotti";
import {InputComponent} from "./Component";
const defaultInput = { mouseX: 0, mouseY: 0, mouseDown: false, aimAngle: 0, moveUp: false, moveDown: false, moveLeft: false, moveRight: false, grab: false };
export class KeyboardInputSystem extends ClientSystem {
    private registeredInput: boolean = false;
    private playerPosition: { x: number, y: number } = null;
    private keyToActionMap: {[keyCode: string]: string } = {
        KeyW: 'moveUp',
        KeyA: 'moveLeft',
        KeyD: 'moveRight',
        KeyS: 'moveDown',
        Space: 'action',
        ShiftLeft: 'sprint',
        KeyG: 'grab',
    }

    private trackedHotkeyIndexes : Array<any> = [];

    private hotkeyArray = ['Digit1', 'Digit2', 'Digit3', 'Digit4']

    public clientInputComponent : InputComponent;

    constructor() {
        super(SYSTEMS.INPUT);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
    }
    onServerMessage(message) {}
    onPeerMessage(peerId: string | number, message) {}
    onLocalMessage(message): void {}
    update(delta: any): void {}
    onClear(): void {throw new Error("Method not implemented.");}
    onInit() {}
    private handleMouseMove(event: MouseEvent) {
        this.clientInputComponent.playerInput.mouseX = event.clientX;
        this.clientInputComponent.playerInput.mouseY = event.clientY;
    }
    private handleMouseDown(event: MouseEvent) {
        this.clientInputComponent.playerInput.mouseDown = true;
    }
    private handleKeyUp(event: KeyboardEvent) {
        event.preventDefault();
        const type = this.keyToActionMap[event.code];
        if(type) {
            this.clientInputComponent.playerInput[type]=false;
        } else {
            const idx = this.hotkeyArray.indexOf(event.code);
            if(idx > -1) {
                this.trackedHotkeyIndexes = this.trackedHotkeyIndexes.filter(kIdx => kIdx != idx);
                if(this.trackedHotkeyIndexes.length) {
                    this.clientInputComponent.playerInput.hotkeyIndex = this.trackedHotkeyIndexes[this.trackedHotkeyIndexes.length-1];
                } else {
                    this.clientInputComponent.playerInput.hotkeyIndex = -1;
                }
            }
        }
    }
    private handleKeyDown(event: KeyboardEvent) {
        event.preventDefault();
        const type = this.keyToActionMap[event.code];
        if(type) {
            this.clientInputComponent.playerInput[type]=true;
        } else {
            const idx = this.hotkeyArray.indexOf(event.code);
            if(idx > -1) {
                if(!this.trackedHotkeyIndexes.includes(idx)) {
                    this.trackedHotkeyIndexes.push(idx);
                }
                this.clientInputComponent.playerInput.hotkeyIndex = idx;
            }
        }
    }
    private handleMouseUp(event: MouseEvent) {
        this.clientInputComponent.playerInput.mouseDown = false;
    }
    onEntityRemovedComponent(entity: any, component) {
        this.removeListeners();
    }
    private removeListeners() {
    }
    onEntityAddedComponent(entity, component) {
        this.clientInputComponent = component;
        this.registerInputs();
    }
    private registerInputs() {
        if(this.registeredInput) throw new Error(`Already registered input.`)
        let emitter : WindowEventHandlers | DocumentAndElementEventHandlers;
        if(typeof document !== 'undefined' && document !== null) {
            emitter = document;
        } else if (typeof window !== 'undefined' && window !== null) {
            emitter = window;
        }
        emitter.addEventListener('mousemove', this.handleMouseMove);
        emitter.addEventListener('mousedown', this.handleMouseDown);
        emitter.addEventListener('mouseup', this.handleMouseUp);
        emitter.addEventListener('keydown', this.handleKeyDown);
        emitter.addEventListener('keyup', this.handleKeyUp);
    }
}