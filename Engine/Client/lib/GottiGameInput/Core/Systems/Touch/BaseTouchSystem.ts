import { InputSystem } from "../InputSystem";


export class BaseTouchSystem extends InputSystem {
    public onClear(): void {
        throw new Error("Method not implemented.");
    }
    constructor() {
        super();
    }
    protected mapStickRangeToAction(axesIndex: number, start: number, end: number, callback: (StickEvent) => void) {
    }
    protected mapStickToAction(axesIndex: number, callback: (StickEvent)=>void) {
    }
    private makeButtonId(btnIndex: number) : string {
        return `button_${btnIndex}`
    }
    public updateState(): void {
    }
}