import { InputSystem } from "../Systems/InputSystem";
import { ActionState, ActionStateDatumChange } from "../types";

export abstract class BaseManager {
    readonly managedSystems : Array<InputSystem> = [];
    readonly _systemListeners: { 'add': Array<(system: InputSystem) => void>, 'remove' : Array<(system: InputSystem) => void> } = { add: [], remove: [] }
    constructor() {
    }
    public update() : Array<{ state: ActionState, changed: {[action: string]: ActionStateDatumChange } }> {
        this.onUpdate();
        return this.managedSystems.map(s => s.update());
    }
    public clear() {
        this.onClear();
        const systems = [...this.managedSystems];
        systems.forEach(this.removeSystem.bind(this));
    }
    public abstract onUpdate() : void;
    public abstract onClear() : void;

    public emit(eventname: 'remove' | 'add', system: InputSystem) {
        if(eventname === 'add') {
            this.managedSystems.push(system);
        }
        for(let i = 0; i < this._systemListeners[eventname].length; i++) {
            this._systemListeners[eventname][i](system)
        }
    }
    public addSystem(system: InputSystem) {
        for(let i = 0; i < this._systemListeners['add'].length; i++) {
            this._systemListeners['add'][i](system)
        }
        this.managedSystems.push(system);
    }
    public removeSystem(system: InputSystem) {
        system.onClear();
        for(let i = 0; i < this._systemListeners['remove'].length; i++) {
            this._systemListeners['remove'][i](system)
        }
        const idx = this.managedSystems.indexOf(system);
        idx > -1 && this.managedSystems.splice(idx, 1);
    }
    public on(eventname: 'remove' | 'add', cb: (system: InputSystem) => void) {
        this._systemListeners[eventname].push(cb);
    }
    public off(eventname: 'remove' | 'add', cb: (system: InputSystem) => void) {
        const idx = this._systemListeners[eventname].indexOf(cb);
        idx > -1 && this._systemListeners[eventname].splice(idx, 1);
    }
}