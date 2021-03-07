import {ClientSystem} from "gotti";
import {MESSAGES, SYSTEMS} from "../../../Shared/Constants";
import {getRandomNumber} from "../../../Shared/Utils";
import {BugTypes} from "../../../Shared/types";
import {Bug} from "../../Assemblages/Bug";

export class BugSpawnSystem extends ClientSystem{
    private bugTypeLookup : {[bugName: string]: any} = {}
    private timeSinceLastSpawn : number = 0;
    private bugProbabilityLookup : {[bugName: string] : number } = {};
    private previous30SpawnedBugs : Array<BugTypes> = [];
    constructor() {
        super(SYSTEMS.BUG_SPAWN)
    }
    onClear(): void {
    }
    onLocalMessage(message): void {
        switch(message.type) {
            case MESSAGES.NEW_FLOWER:
                this.bugProbabilityLookup[BugTypes.BEE]++;
                break;
        }
    }

    onPeerMessage(peerId: number | string, message): any {
    }

    onServerMessage(message): any {
    }

    onEntityRemovedComponent(entity: any, component) {
        this.dispatchAllLocal({
            type: MESSAGES.REMOVED_BUG,
            data: entity,
        });
    }

    private getNextBugToSpawn() : BugTypes {
        const intervals = [];
        let sum = 0;
        Object.keys(this.bugProbabilityLookup).forEach(k => {
            intervals.push({ bugType: k, start: sum, end: sum += this.bugProbabilityLookup[k] })
        });
        let nextBug
        const number = getRandomNumber(0, sum);
        for(let i = 0; i < intervals.length; i++) {
            if(intervals[i].start <= number && intervals[i].end <= number) {
                nextBug = intervals[i].type;
                break;
            }
        }
        if(nextBug) {
            let timesItWasSpawnedLast30 = 0;
            for (let i = 0; i < this.previous30SpawnedBugs.length; i++) {
                if (this.previous30SpawnedBugs[i] === nextBug) {
                    timesItWasSpawnedLast30++;
                }
            }
            if (timesItWasSpawnedLast30 > 5) {
                this.bugProbabilityLookup[nextBug] -= 1;
            }
            return nextBug;
        }
    }

    update(delta: any): void {
        this.timeSinceLastSpawn += delta;
        if(this.timeSinceLastSpawn > 1) {
            const spawn = this.getNextBugToSpawn();
            if(spawn) {
                const data = this.globals.itemData[spawn];
                const bug = new Bug(this.$api.getUid(), spawn);
                this.dispatchLocal({
                    to: SYSTEMS.GAME_STATE,
                    data: bug,
                    type: MESSAGES.SPAWNED_BUG,
                });
                this.timeSinceLastSpawn = 0;
            }
        }
    }
}