import {Component} from "gotti";
import {SYSTEMS} from "../../../Shared/Constants";
import {GameStateData} from "../../../Shared/types";

export class GameStateComponent extends Component {
    readonly data : GameStateData;
    private saveTimeout : any;
    constructor(data : GameStateData) {
        super(SYSTEMS.GAME_STATE);
        this.data = data;
    }

    public save() {
        this.saveTimeout && clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.saveTimeout = null;
            this.persistSave();
        },  1500);
    }
    private persistSave() {
        this.saveTimeout && clearTimeout(this.saveTimeout);
        this.saveTimeout = null;
        if(typeof localStorage !== "undefined") {
            localStorage.setItem('game-state', JSON.stringify(this.data));
        }
    }
    onRemoved(entity) {
        this.persistSave();
    }
}