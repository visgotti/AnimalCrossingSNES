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
    private playerHasNetEquipped : boolean = false;
    private swingCooldown : number = 0;
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
        }
    }
    onClear(): void {
    }
    onLocalMessage(message): void {
        switch(message.type) {
            case MESSAGES.EQUIP_ITEM:
                if (message.data === 'net') {
                    this.playerHasNetEquipped = true;
                } else {
                    this.playerHasNetEquipped = false;
                }
        }
    }


    private canSwingNet() : boolean {
        return !!(this.globals.clientPlayer?.getComponent(SYSTEMS.PLAYER_ANIMATION)?.canPlayActionAnimation())
            && this.swingCooldown === 0;
    }

    private tryingToSwing() {
        return this.globals.clientPlayer?.playerInput.grab && this.playerHasNetEquipped
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
        if(this.swingCooldown){
            this.swingCooldown = Math.max(this.swingCooldown-delta, 0);
        }
        if(this.tryingToSwing() && this.canSwingNet()) {
            this.swingCooldown = .5;
            // todo: play bug swing noise
            //this.$api.playSound('swing');
            this.globals.clientPlayer.getComponent(SYSTEMS.PLAYER_ANIMATION).play('swing_net', null, { loop: false });
            if(this.bugsWithinPlayer.length) {
                for(let i = 0; i < this.bugsWithinPlayer.length; i++) {
                    this.$api.addItem(this.bugsWithinPlayer[i].bugType, 1);
                    this.destroyEntity(this.bugsWithinPlayer[i])
                }
                // todo: play catch bug noise
                //this.$api.playSound('catchbug');
            }
        }
        this.bugsWithinPlayer.length = 0;
    }
}