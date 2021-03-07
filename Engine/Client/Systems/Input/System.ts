import {SYSTEMS} from "../../../Shared/Constants";

import { PlayerInput } from '../../../Shared/types';
import {ClientSystem} from "gotti";
import {InputComponent} from "./Component";
import GottiGameInput from "../../lib/GottiGameInput";
const defaultInput = { mouseX: 0, mouseY: 0, mouseDown: false, aimAngle: 0, moveUp: false, moveDown: false, moveLeft: false, moveRight: false, grab: false };
export class KeyboardInputSystem extends ClientSystem {
    private registeredInput: boolean = false;
    private gameInput : GottiGameInput;

    private trackedHotkeyIndexes : Array<any> = [];

    private hotkeyArray = ['Digit1', 'Digit2', 'Digit3', 'Digit4']

    public clientInputComponent : InputComponent;

    constructor() {
        super(SYSTEMS.INPUT);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
    }
    onServerMessage(message) {}
    onPeerMessage(peerId: string | number, message) {}
    onLocalMessage(message): void {}

    private iterateInput(input) {
        const { state, changed } = input
        for(let key in state) {
            if(state[key] && !this.clientInputComponent.playerInput[key]) {
                this.clientInputComponent.playerInput[key] = state[key];
            }
        }
    }
    private resetState() {
        ['moveDown', 'moveUp', 'moveLeft', 'moveRight', 'inventory', 'grab', 'cancel', 'pause'].forEach(k =>{
            this.clientInputComponent.playerInput[k]=false;
        })
    }
    update(delta: any): void {
        if(this.gameInput && this.clientInputComponent) {
            this.resetState();
            const { controller, keyboard } = this.gameInput.update();
            keyboard && this.iterateInput(keyboard);
            (controller && controller[0]) && this.iterateInput(controller[0]);
        }
    }
    onClear(): void {throw new Error("Method not implemented.");}
    onInit() {
        this.gameInput = this.globals.gameInput;
    }
    private handleMouseMove(event: MouseEvent) {
        this.clientInputComponent.playerInput.mouseX = event.clientX;
        this.clientInputComponent.playerInput.mouseY = event.clientY;
    }
    private handleMouseDown(event: MouseEvent) {
        this.clientInputComponent.playerInput.mouseDown = true;
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
    }
}