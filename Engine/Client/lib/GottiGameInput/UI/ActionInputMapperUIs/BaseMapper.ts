import { InputSystem } from "../../Core/Systems/InputSystem";
import { RemoveInputIdActionMapEvent, AddInputIdActionMapEvent } from "../../Core/types";
export abstract class BaseMapper extends PIXI.Container {
    readonly system: InputSystem;
    constructor(system: InputSystem) {
        super();
        this.system = system;
        this.handleMappedActionAdded = this.handleMappedActionAdded.bind(this);
        this.handleMappedActionRemoved = this.handleMappedActionRemoved.bind(this);
        this.system.onMappedActionAdded(this.handleMappedActionAdded);
        this.system.onMappedActionRemoved(this.handleMappedActionRemoved);
    }
    abstract drawUnmappedActionError : () => void;
    abstract drawInputItem : (inputId: string, action: string) => void;
    abstract drawActionOptionsForInput : (inputId: string) => void;
    abstract drawInputActivated : (inputId: string) => void;
    abstract drawInputDeactivated : (inputId: string) => void;
    private handleMappedActionAdded(event: AddInputIdActionMapEvent) {
    }
    private handleMappedActionRemoved(event: RemoveInputIdActionMapEvent) {
        if(event.actionNowUnmapped) {
            this.drawUnmappedActionError();
        }
    }
}