import {Component, Entity} from 'gotti';
import {SYSTEMS} from "../Constants";
import {getDistance} from "../Utils";

export class Position extends Component {

    private entity: Entity & { gameObject?: { setPosition: (x: number, y: number) => null, updatePosition: (dX: number, dY: number) => null } };

    private _x: any;
    private _y: any;

    private setPositionCallback: Function = null;

    private _nextX: number;
    private _nextY: number;

    private positionLocked: boolean;

    private lastPosition: {
        x: number,
        y: number,
    } = { x: 0, y: 0 };

    private _startInterpolationX: number;
    private _startInterpolationY: number;

    // number of frames that passed since we received updated the position
    private framesSinceReceivedNewPosition: number = 0;
    private expectedFramesBetweenPosition: number = 3;

    private position: {
        x: number,
        y: number,
    } = { x: 0, y: 0 };

    constructor(x=0, y=0) {
        super(SYSTEMS.POSITION);
        this.setPosition(x, y);
    }

    public getPosition() {
        return this.position;
    }

    public lockPosition(position?: { x: number, y: number }) {
        if(position) {
            this.x = position.x;
            this.y = position.y;
        }
        this.positionLocked = true;
        this.setPositionCallback && this.setPositionCallback(this.x, this.y);
        // not implementing on client
    }

    // gets added in server PlayerMovement server system onEntityAddedComponent
    public addLockUnlockPositionCallback(callback) {
        this.setPositionCallback = callback;
    }

    public getDistance(p: { x: number, y: number }) {
        return Math.sqrt( Math.pow((this.x-p.x), 2) + Math.pow((this.y-p.y), 2) );
    }

    public unlockPosition(position?: { x: number, y: number}) {
        if(position) {
            this.x = position.x;
            this.y = position.y;
        }
        this.positionLocked = false;
        this.setPositionCallback && this.setPositionCallback(this.x, this.y);
    }

    public interpolatePosition() {
        this.framesSinceReceivedNewPosition++;
        if(this.framesSinceReceivedNewPosition >= this.expectedFramesBetweenPosition) {
            this.x = this._nextX;
            this.y = this._nextY;
            return true;
        } else {
            const percent = this.framesSinceReceivedNewPosition / this.expectedFramesBetweenPosition;
            // https://stackoverflow.com/questions/27237169/obtaining-the-point-at-a-certain-percentage-along-a-line-segment
            this.setPosition(
                this._startInterpolationX + (this._nextX - this._startInterpolationX) * percent, // interpolated X
                this._startInterpolationY + (this._nextY - this._startInterpolationY) * percent // interpolated Y
            );
            return false;
        }
    }

    public setLastPosition() {
        this.lastPosition.x = this.position.x;
        this.lastPosition.y = this.position.y;
    }

    public getLastPosition() {
        return { ...this.lastPosition };
    }

    public setPosition(x, y) {
        //console.error('setting position', x, y);
        //console.error('distance in set position was', Math.round(getDistance({ x, y }, this.getPosition())));
        if(!this.positionLocked){
            this.x = x;
            this.y = y;
        }
        return this.position;
    }

    public setPositionByDeltas(deltaX, deltaY) {
        if(!this.positionLocked) {
            this.x = this._x + deltaX;
            this.y = this._y + deltaY;
        };
        return this.position;
    }

    public setNextPositions(x, y) {
        this.framesSinceReceivedNewPosition = 0;
        this._startInterpolationX = this._x;
        this._startInterpolationY = this._y;
        this._nextX = x;
        this._nextY = y;
    }

    get x () {
        return this._x
    }

    get y () {
        return this._y
    }

    //TODO: i dont like how now i call gameObject.setPosition each time we set either the x or y...
    set x (value) {
        // value = Math.round(value);
        this._x = value;
        this.position.x = value;
        this.entity?.gameObject?.setPosition(value, this.y)
    }

    set y (value) {
        //  value = Math.round(value);
        this._y = value;
        this.position.y = value;
        this.entity?.gameObject?.setPosition(this._x, value)
    }

    onAdded(entity) {
        this.entity = entity;
        this.setAttributeGetter('x', () => {
            return this._x;
        });

        this.setAttributeGetter('y', () => {
            return this._y;
        });
    }

    onRemoved(){};
};
