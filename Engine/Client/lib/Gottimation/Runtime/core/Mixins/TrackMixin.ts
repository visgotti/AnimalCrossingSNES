import {AnimationTrack} from "../AnimationTrack";
import {Skeleton} from "../Skeleton";
import {PlayOptions} from "../../types";
import {ShapeData} from "../../../types";

export type TrackAttachmentEventListener = (attachmentSlotName: string, attachmentName: string, track: TrackMixin) => void;
export type TrackAnimationEventListener = (actionName: string, track: TrackMixin) => void;
export type TrackAttachmentChangeEventListener = (track: TrackMixin, newAttachment: string, oldAttachment: string) => void;

export type TrackAnimationFrameEventListener = (actionName: string, track: TrackMixin, data?: TrackFrameEventData) => void;
export type TrackFrameEventData = {[key: string]: string | number | boolean | TrackFrameEventData };

export class TrackMixin {
    public _onRemovedFromParentListeners: Array<(parentTrack: TrackMixin) => void>;
    public _onChangeAttachmentListeners: Array<TrackAttachmentChangeEventListener>;
    public _onEndListeners: Array<TrackAnimationEventListener>;
    public _onStartListeners: Array<TrackAnimationEventListener>;
    public _onEventListeners: Array<TrackAnimationEventListener>;
    public _onAddededListeners: Array<TrackAttachmentEventListener>;
    public _onRemovedListeners: Array<TrackAttachmentEventListener>;
    public _onFrameEventListeners: {[tag:  string]: Array<TrackAnimationFrameEventListener> };
    public parentTrack?: TrackMixin;
    public childTracks?: Array<AnimationTrack>;
    public activePassiveAttachmentTracks: Array<AnimationTrack>;
    public getCollider: (id: number | string) => ShapeData;

    static ApplyMixin(object: any) {
        object.onChangedAttachment = TrackMixin.prototype.onChangedAttachment.bind(object);
        object.offChangedAttachment = TrackMixin.prototype.offChangedAttachment.bind(object);
        object.offEventListener = TrackMixin.prototype.offEventListener.bind(object);
        object.removeAllAnimationListeners = TrackMixin.prototype.removeAllAnimationListeners.bind(object);
        object.emitAttachmentEvents = TrackMixin.prototype.emitAttachmentEvents.bind(object);
        object.emitAnimationEvents = TrackMixin.prototype.emitAnimationEvents.bind(object);
        object.emitFrameEvents = TrackMixin.prototype.emitFrameEvents.bind(object);
        object.onEnd = TrackMixin.prototype.onEnd.bind(object);
        object.onStart = TrackMixin.prototype.onStart.bind(object);
        object.offEnd = TrackMixin.prototype.offEnd.bind(object);
        object.offStart = TrackMixin.prototype.offStart.bind(object);
        object.onRemovedFromParent = TrackMixin.prototype.onRemovedFromParent.bind(object);
        object.onRemovedAttachment = TrackMixin.prototype.onRemovedAttachment.bind(object);
        object.onAddedAttachment = TrackMixin.prototype.onAddedAttachment.bind(object);
        object.offRemovedAttachment = TrackMixin.prototype.offRemovedAttachment.bind(object);
        object.offAddedAttachment = TrackMixin.prototype.offAddedAttachment.bind(object);
        object.removeChildPassiveTracks = TrackMixin.prototype.removeChildPassiveTracks.bind(object);
        object.addNeededChildPassiveTracks = TrackMixin.prototype.addNeededChildPassiveTracks.bind(object);
    }

    public removeChildPassiveTracks(action: string) {
        if(!this.activePassiveAttachmentTracks) return;
        for(let i = 0; i < this.activePassiveAttachmentTracks.length; i++) {
            if(!this.activePassiveAttachmentTracks[i].removePassiveTrack(action)) {
                throw new Error(`expected true`);
            }
        }
        delete this.activePassiveAttachmentTracks;
    }
    public addNeededChildPassiveTracks(action: string, array: Array<AnimationTrack>, playOptions: PlayOptions) {
        if(!array) return;
        for(let i = 0; i < array.length; i++) {
            if(array[i].addPassiveTrack(action, playOptions)) {
                if(!this.activePassiveAttachmentTracks) {
                    this.activePassiveAttachmentTracks = [array[i]]
                } else {
                    this.activePassiveAttachmentTracks.push(array[i]);
                }
            }
        }
    }
    public removeAllAnimationListeners() {
        if(this._onFrameEventListeners) {
            Object.keys(this._onFrameEventListeners).forEach(e => {
                this._onFrameEventListeners[e].length = 0;
                delete this._onFrameEventListeners[e];
            })
        }
        delete this._onFrameEventListeners;
        if(this._onEndListeners) this._onEndListeners.length = 0;
        delete this._onEndListeners;
        if(this._onStartListeners) this._onStartListeners.length = 0;
        delete this._onStartListeners;

        if(this._onAddededListeners) this._onAddededListeners.length = 0;
        delete this._onAddededListeners;

        if(this._onRemovedListeners) this._onRemovedListeners.length = 0;
        delete this._onAddededListeners;
        if(this._onEndListeners) this._onEndListeners.length = 0;
        delete this._onEndListeners;
    }

    public onFrameEvent(eventName: string, cb: TrackAnimationEventListener) {
        if(!(this._onFrameEventListeners)) {
            this._onFrameEventListeners = {[eventName]:  [cb] };
        } else if(!this._onFrameEventListeners[eventName]) {
            this._onFrameEventListeners[eventName] = [cb]
        } else {
            this._onFrameEventListeners[eventName].push(cb);
        }
    }

    public offFrameEvent(eventName: string, cb: TrackAnimationEventListener) {
        if(this._onFrameEventListeners) {
            const array = this._onFrameEventListeners[eventName];
            if(array && (!this.offEventListener(array, cb))) {
                delete this._onFrameEventListeners[eventName];
                if(!(Object.keys(this._onFrameEventListeners)).length) {
                    delete this._onFrameEventListeners;
                }
            }
        }
    }
    public emitFrameEvents(frameEventName: string, action: string, data: TrackFrameEventData, track: TrackMixin) {
        if (this._onFrameEventListeners) {
            const array = this._onFrameEventListeners[frameEventName];
            if (array) {
                for (let i = 0; i < array.length; i++) {
                    array[i](action, track, data);
                }
            }
        }
    }
    public emitAttachmentEvents(arrayName: string, attachmentSlotName: string, attachmentName: string, track: TrackMixin) {
      //  console.log('emitting', this, arrayName);
        if(this[arrayName]) {
            for(let i = 0; i < this[arrayName].length; i++) {
                this[arrayName][i](attachmentSlotName, attachmentName, track);
            }
        }
    }
    public emitAnimationEvents(arrayName: string, actionName: string, track: TrackMixin) {
        if(this[arrayName]) {
            for(let i = 0; i < this[arrayName].length; i++) {
                this[arrayName][i](actionName, track);
            }
        }
    }

    public onChangedAttachment(cb: TrackAttachmentChangeEventListener) {
        if(!this._onChangeAttachmentListeners) {
            this._onChangeAttachmentListeners = [cb];
        } else {
            this._onChangeAttachmentListeners.push(cb);
        }
    }
    public offChangedAttachment(cb: TrackAttachmentChangeEventListener) {if(!(this.offEventListener(this._onChangeAttachmentListeners, cb))) delete this._onChangeAttachmentListeners;}

    public onEnd(cb: TrackAnimationEventListener) {
        if(!this._onEndListeners) {
            this._onEndListeners = [cb];
        } else {
            this._onEndListeners.push(cb);
        }
    }
    public offEnd(cb: TrackAnimationEventListener) {if(!(this.offEventListener(this._onEndListeners, cb))) delete this._onEndListeners;}

    public onStart(cb: TrackAnimationEventListener) {
        if(!this._onStartListeners) {
            this._onStartListeners = [cb];
        } else {
            this._onStartListeners.push(cb);
        }
    }
    public offStart(cb: TrackAnimationEventListener) {if(!(this.offEventListener(this._onStartListeners, cb))) delete this._onStartListeners;}

    public onRemovedFromParent(cb: (parent: TrackMixin) => void) {
        if(!this._onRemovedFromParentListeners) {
            this._onRemovedFromParentListeners = [cb];
        } else {
            this._onRemovedFromParentListeners.push(cb);
        }
    }

    public onRemovedAttachment(cb: TrackAttachmentEventListener) {
        if(!this._onRemovedListeners) {
            this._onRemovedListeners = [cb];
        } else {
            this._onRemovedListeners.push(cb);
        }
    }
    public offRemovedAttachment(cb: TrackAttachmentEventListener) {if(!(this.offEventListener(this._onRemovedListeners, cb))) delete this._onRemovedListeners;}

    public onAddedAttachment(cb: TrackAttachmentEventListener) {
        if(!this._onAddededListeners) {
            this._onAddededListeners = [cb];
        } else {
            this._onAddededListeners.push(cb);
        }
    }
    public offAddedAttachment(cb: TrackAttachmentEventListener) {if(!(this.offEventListener(this._onAddededListeners, cb))) delete this._onAddededListeners;}

    public offEventListener(array: Array<TrackAttachmentEventListener> | Array<TrackAnimationEventListener> | Array<TrackAttachmentChangeEventListener>, cb) : number {
        for(let i = 0; i < array.length; i++) {
            if(array[i] === cb) {
                array.splice(i, 1);
                return array.length;
            }
        }
        return -1;
    }
}