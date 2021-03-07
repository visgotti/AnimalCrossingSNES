import { InputSystem } from "../InputSystem";
import { MappedActionToInputState } from "../../types";

export class MouseSystem extends InputSystem {
    private actionsFinished : Array<string> = [];
    private actionsStarted : Array<string> = [];

    constructor(state?: MappedActionToInputState) {
        super(state);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);

        window.addEventListener('mousedown', this.handleMouseDown);
        window.addEventListener('mouseup', this.handleMouseUp);
        window.addEventListener('mousemove', this.handleMouseMove);
    }
    public updateState(): void {
        this.actionsFinished.forEach(a => {
            this.actionState[a] = false;
        });
        this.actionsStarted.forEach(a => {
            this.actionState[a] = true;
        })
        this.actionsStarted.length = 0;
        this.actionsFinished.length = 0;
    }
    private handleMouseMove(event: MouseEvent) {
    }
    private handleMouseDown(event: MouseEvent) {
        const actions = this.resolveActions(event.button);
        actions &&  this.actionsStarted.push(...actions);
    }
    private handleMouseUp(event: MouseEvent) {
        const actions = this.resolveActions(event.button);
        actions && this.actionsFinished.push(...actions);
    }
    public onClear(): void {
        window.removeEventListener('mousedown', this.handleMouseDown);
        window.removeEventListener('mouseup', this.handleMouseUp);
        window.removeEventListener('mousemove', this.handleMouseMove);
    }
}