import {ClientSystem} from "gotti";
import {COLLIDER_TAGS, MESSAGES, SYSTEMS} from "../../../Shared/Constants";
import {BugCatchComponent} from "./Component";
import {ClientPlayer} from "../../Assemblages/ClientPlayer";
import {Bug} from "../../Assemblages/Bug";
import {Skeleton} from "../../lib/Gottimation/Runtime/core/Skeleton";
import {circleCircleColliding} from "../../../Shared/Utils";

export class BugCatchSystem extends ClientSystem {
    private bugCatchPlugin;
    private bugsWithinPlayer : Array<Bug> = [];
    private playerIsSwingingNet : boolean;
    constructor() {
        super(SYSTEMS.BUG_CATCH)

        const handleBugCollision = (colA, colB) => {
            const player : ClientPlayer = colA.gameObject.entity;
            const bug : Bug = colB.gameObject.entity;
            if(!this.bugsWithinPlayer.includes(bug)) {
                this.bugsWithinPlayer.push(bug);
            }
        }

        this.bugCatchPlugin = {
            type: 'collision',
            name: 'bugcatch',
            tagAs: [COLLIDER_TAGS.client_player_bug_detector],
            tagBs: [COLLIDER_TAGS.bug],
            onCollision: handleBugCollision,
            onCollisionStart: handleBugCollision,
            onAfterCollision: () => {
                let bugsCaught = [];
                if(this.bugsWithinPlayer.length && this.playerIsSwingingNet) {
                    const playerSkeleton : Skeleton = this.globals.clientPlayer.getComponent(SYSTEMS.PLAYER_ANIMATION).skeleton;
                    const netShapeData = playerSkeleton.getFirstSlotColliderWithTag('net')?.shapeData;
                    if(!netShapeData) { throw new Error(`Expected net shape data `)};
                    for(let i = 0; i < this.bugsWithinPlayer.length; i++) {
                        const bugShapeData = this.bugsWithinPlayer[i].gameObject.colliders[0].shapeData;
                        if(circleCircleColliding(netShapeData, bugShapeData)) {
                            bugsCaught.push(this.bugsWithinPlayer[i]);
                        }
                    }
                }
                if(bugsCaught.length) {
                    bugsCaught.forEach(b => {
                        if(this.globals.clientPlayer.addItem(b.type)) {
                            this.destroyEntity(b);
                        }
                    });
                }
                this.bugsWithinPlayer.length = 0;
            }
        }
    }
    onClear(): void {
    }
    onLocalMessage(message): void {
    }

    onPeerMessage(peerId: number | string, message): any {
    }

    onServerMessage(message): any {
    }

    onEntityRemovedComponent(entity: any, component) {
        this.playerIsSwingingNet = false;
    }

    onEntityAddedComponent(entity: ClientPlayer, component: BugCatchComponent) {
        const skel = entity.getComponent(SYSTEMS.PLAYER_ANIMATION).skeleton;
        const regAniListeners = (_skel) => {
            _skel.onStart(actionName => {
                if(actionName === 'swing-net') {
                    this.playerIsSwingingNet =true;
                }
            });
            _skel.onEnd(actionName => {
                if(actionName === 'swing-net') {
                    this.playerIsSwingingNet =false;
                }
            });
        }
        !skel ? entity.once('skeleton-ready', regAniListeners) : regAniListeners(skel);
    }
    update(delta: any): void {
    }
}