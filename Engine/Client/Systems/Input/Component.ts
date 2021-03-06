import {PlayerInput} from "../../../Shared/types";
import {Component} from "gotti";
import {SYSTEMS} from "../../../Shared/Constants";

export class InputComponent extends Component {
    readonly playerInput : PlayerInput;
    constructor(inputObj: PlayerInput) {
        super(SYSTEMS.INPUT);
        this.playerInput = inputObj
    }
}