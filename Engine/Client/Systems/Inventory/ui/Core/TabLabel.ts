import {PixiElement} from "pixidom.js/lib";

export type TabStyleHandlers = {
    default: (previousContainer?: PIXI.Container) => PIXI.Container,
    selected?: (previousContainer: PIXI.Container) => PIXI.Container,
    hovered?: (previousContainer: PIXI.Container) => PIXI.Container,
    pressed?: (previousContainer: PIXI.Container) => PIXI.Container,
}

export class TabLabel extends PixiElement {
    public handlers : TabStyleHandlers;
    readonly category : string;
    constructor(category: string, handlers: TabStyleHandlers, parentTab?: TabLabel) {
        super();
        this.category = category;
        this.handlers = handlers;
    }
}