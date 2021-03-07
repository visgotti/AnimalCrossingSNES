import { InputSystem } from "../InputSystem";
import { MappedActionToInputState } from "../../types";

export class KeyboardSystem extends InputSystem {
    private actionsQueued : Array<{ action: string, value: boolean }> = [];
    constructor(state: MappedActionToInputState) {
        super(state);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        window.addEventListener('keydown', this.handleKeyDown)
        window.addEventListener('keyup', this.handleKeyUp)
    }
    public updateState(): void {
        this.actionsQueued.forEach(({ action, value }) => {
            this.actionState[action] = value;
        });
        this.actionsQueued.length = 0;
    }
    private handleKeyDown(event: KeyboardEvent) {
        const actions = this.resolveActions(event.code);
        actions && this.actionsQueued.push(...actions.map(action => { return { action, value: true  } }));
    }
    private handleKeyUp(event: KeyboardEvent) {
        const actions = this.resolveActions(event.code);
        actions && this.actionsQueued.push(...actions.map(action => { return { action, value: false  } }));
    }
    public onClear(): void {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }
}