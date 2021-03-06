"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Position = void 0;
const gotti_1 = require("gotti");
const Constants_1 = require("../Constants");
class Position extends gotti_1.Component {
    constructor(x = 0, y = 0) {
        super(Constants_1.SYSTEMS.POSITION);
        this.setPositionCallback = null;
        this.lastPosition = { x: 0, y: 0 };
        // number of frames that passed since we received updated the position
        this.framesSinceReceivedNewPosition = 0;
        this.expectedFramesBetweenPosition = 3;
        this.position = { x: 0, y: 0 };
        this.setPosition(x, y);
    }
    getPosition() {
        return this.position;
    }
    lockPosition(position) {
        if (position) {
            this.x = position.x;
            this.y = position.y;
        }
        this.positionLocked = true;
        this.setPositionCallback && this.setPositionCallback(this.x, this.y);
        // not implementing on client
    }
    // gets added in server PlayerMovement server system onEntityAddedComponent
    addLockUnlockPositionCallback(callback) {
        this.setPositionCallback = callback;
    }
    getDistance(p) {
        return Math.sqrt(Math.pow((this.x - p.x), 2) + Math.pow((this.y - p.y), 2));
    }
    unlockPosition(position) {
        if (position) {
            this.x = position.x;
            this.y = position.y;
        }
        this.positionLocked = false;
        this.setPositionCallback && this.setPositionCallback(this.x, this.y);
    }
    interpolatePosition() {
        this.framesSinceReceivedNewPosition++;
        if (this.framesSinceReceivedNewPosition >= this.expectedFramesBetweenPosition) {
            this.x = this._nextX;
            this.y = this._nextY;
            return true;
        }
        else {
            const percent = this.framesSinceReceivedNewPosition / this.expectedFramesBetweenPosition;
            // https://stackoverflow.com/questions/27237169/obtaining-the-point-at-a-certain-percentage-along-a-line-segment
            this.setPosition(this._startInterpolationX + (this._nextX - this._startInterpolationX) * percent, // interpolated X
            this._startInterpolationY + (this._nextY - this._startInterpolationY) * percent // interpolated Y
            );
            return false;
        }
    }
    setLastPosition() {
        this.lastPosition.x = this.position.x;
        this.lastPosition.y = this.position.y;
    }
    getLastPosition() {
        return Object.assign({}, this.lastPosition);
    }
    setPosition(x, y) {
        //console.error('setting position', x, y);
        //console.error('distance in set position was', Math.round(getDistance({ x, y }, this.getPosition())));
        if (!this.positionLocked) {
            this.x = x;
            this.y = y;
        }
        return this.position;
    }
    setPositionByDeltas(deltaX, deltaY) {
        if (!this.positionLocked) {
            this.x = this._x + deltaX;
            this.y = this._y + deltaY;
        }
        ;
        return this.position;
    }
    setNextPositions(x, y) {
        this.framesSinceReceivedNewPosition = 0;
        this._startInterpolationX = this._x;
        this._startInterpolationY = this._y;
        this._nextX = x;
        this._nextY = y;
    }
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
    //TODO: i dont like how now i call gameObject.setPosition each time we set either the x or y...
    set x(value) {
        var _a, _b;
        // value = Math.round(value);
        this._x = value;
        this.position.x = value;
        (_b = (_a = this.entity) === null || _a === void 0 ? void 0 : _a.gameObject) === null || _b === void 0 ? void 0 : _b.setPosition(value, this.y);
    }
    set y(value) {
        var _a, _b;
        //  value = Math.round(value);
        this._y = value;
        this.position.y = value;
        (_b = (_a = this.entity) === null || _a === void 0 ? void 0 : _a.gameObject) === null || _b === void 0 ? void 0 : _b.setPosition(this._x, value);
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
    onRemoved() { }
    ;
}
exports.Position = Position;
;
