import {ClientSystem} from "gotti";
import {COLLIDER_TAGS, MESSAGES, SYSTEMS} from "../../../Shared/Constants";
import {getRandomNumber} from "../../../Shared/Utils";
import {BugTypes} from "../../../Shared/types";
import {Bug, BugSpawnData} from "../../Assemblages/Bug";

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
        if(entity.gameObject) {
            delete entity.gameObject.entity;
            entity.gameObject.removeFromMap();
            delete entity.gameObject;
        }
        this.dispatchAllLocal({
            type: MESSAGES.REMOVED_BUG,
            data: entity,
        });
    }

    private getNextBugToSpawn() : BugTypes {
        return BugTypes.BEE;
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
    private initBug(bug: Bug, data: BugSpawnData) {
        this.initializeEntity(bug, data);
    }
    update(delta: any): void {
        if(!this.$api.gameStateInitialized()) return;
        this.timeSinceLastSpawn += delta;
        if(this.timeSinceLastSpawn > 1) {
            const spawn = this.getNextBugToSpawn();
            if(spawn) {
                const sprite = new PIXI.Sprite();
                const go = this.globals.tileWorld.addGameObject({
                    sprite,
                    layer: 1,
                    colliders: [{
                        layer: 1,
                        type: COLLIDER_TAGS.bug,
                        shapeData: { x: 0, y: 0, r: 5 },
                        dynamic: true,
                    }]
                })
                const bug = new Bug(this.$api.getUid(), spawn, go);
                const bugData : BugSpawnData = {
                    type: spawn,
                    speed: 5,
                    position: { x: 10, y: 10 },
                    angle: 1,
                    size: 1,
                    frames: this.globals.gameTextures.animations.bugs[spawn],
                    sprite,
                }
                this.initBug(bug, bugData);
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