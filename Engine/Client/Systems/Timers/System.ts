import {ClientSystem} from "gotti";
import {CONFIG_CONSTANTS} from "../../Config";
import {MESSAGES, SYSTEMS} from "../../../Shared/Constants";

export class TimerSystem extends ClientSystem {
    private elapsedDaylightTime : number = 0;
    private fullDays : number = 0;
    private hoursPassed : number = 0;
    private secondsPerHour = CONFIG_CONSTANTS.SECONDS_PER_HOUR;
    private nextHourTime : number = CONFIG_CONSTANTS.SECONDS_PER_HOUR;
    private secondsPerDay = CONFIG_CONSTANTS.SECONDS_PER_HOUR * 24;
    private totalElapsedTime : number = null;
    private isChecking : boolean = false;

    constructor() {
        super(SYSTEMS.TIMER)
    }
    onClear(): void {
    }
    onLocalMessage(message): void {
        switch(message.type) {
            case MESSAGES.START_TIMERS:
                this.handleStartTimers(message.data);
                break;
        }
    }

    public calculateGameTime(timeStamp: number) : { hours: number, days: number, seconds: number } {
        return {
            hours: 1,
            days: 1,
            seconds: 1,
        }
    }

    handleStartTimers(elapsedTime?: number) {
        if(elapsedTime) {
            this.totalElapsedTime =elapsedTime
        } else {
            this.totalElapsedTime = 0;
        }
    }

    onPeerMessage(peerId: number | string, message): any {
    }

    onServerMessage(message): any {
    }

    update(delta: any): void {
        if(this.globals.tileWorld.loadedMap?.initialized && !this.globals.tileWorld.isLoading && this.totalElapsedTime !== null) {
            this.totalElapsedTime+=delta;
            this.elapsedDaylightTime += delta*1000;
            if (this.elapsedDaylightTime > this.secondsPerDay) {
                this.fullDays++;
                this.hoursPassed = 0;
                this.elapsedDaylightTime = 0;
                this.nextHourTime = this.secondsPerHour;
                this.dispatchAllLocal({
                    type: 'day-ended',
                    data: this.fullDays,
                })
            } else if (this.elapsedDaylightTime > this.nextHourTime) {
                this.hoursPassed++;
                this.nextHourTime += this.secondsPerHour;
                this.dispatchAllLocal({
                    type: 'hour-ended',
                    data: this.hoursPassed,
                })
            }
        }
    }
}