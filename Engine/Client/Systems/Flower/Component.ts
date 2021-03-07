import {Component} from "gotti";
import {SYSTEMS} from "../../../Shared/Constants";
import {FlowerState} from "../../../Shared/types";

export class FlowerComponent extends Component {
    private state : FlowerState;
    constructor(state : FlowerState) {
        super(SYSTEMS.FLOWER);
        this.state = state;
    }

    get timeAlive() {
        return this.state.elapsedTimeAlive;
    }

    updateTimeAlive(delta) {
        this.state.elapsedTimeAlive += delta;
    }
    onAdded(entity) {
    }
}