import {SYSTEMS} from "../../../Shared/Constants";
import {Component} from "gotti";
import {Skeleton} from "../../lib/Gottimation/Runtime/core/Skeleton";
import {Gottimation} from "../../lib/Gottimation/Runtime/Gottimation";
import {PlayerMovementComponent} from "../PlayerMovement/Component";
import {ClientPlayer} from "../../Assemblages/ClientPlayer";
import {RemotePlayer} from "../../Assemblages/RemotePlayer";
import {PlayerActionComponent} from "../PlayerAction/Component";
import {NPC} from "../../Assemblages/NPC";
import {getRandomNumber} from "../../../Shared/Utils";
import {AnimationTrack} from "../../lib/Gottimation/Runtime/core/AnimationTrack";
import {EntityTypes} from "../../../Shared/types";

export class PlayerAnimationComponent extends Component {
    public skeleton : Skeleton;
    readonly skeletonName : string;
    private entity : RemotePlayer | ClientPlayer | NPC;

    private currentHeldItem : string;

    private playerMovementComponent : PlayerMovementComponent;
    constructor(skeletonName : string) {
        super(SYSTEMS.PLAYER_ANIMATION);
        // @ts-ignore
        this.skeletonName =  skeletonName || 'default';
    }
    public async initSkeleton(gottimation: Gottimation, direction?: 'east' | 'west' | 'south' | 'north') {
        direction = direction || 'south';
        this.skeleton = await gottimation.createSkeleton(this.skeletonName,{ direction });
        await this.skeleton.setSkins([
            { atlasName: 'player', skinName: 'default.png'}
        ]);
        setTimeout(() => {
          //  this.skeleton.setSkin({ skinName: 'wife.png', atlasName: 'shirt'})
        }, 5000);
       // console.error('skel:', this.skeleton);
        //this.skeleton.play('idle');
        this.emit('skeleton-ready', this.skeleton);
        return this.skeleton
    }

    private resolveAniName(baseAni: 'walk' | 'idle', itemFromAction?: 'shovel' | 'net' | 'axe') {
        if(itemFromAction) {
            return `${baseAni}_${itemFromAction}`
        }
        return baseAni;
    }

    public canPlayActionAnimation() : boolean {
        if (!this.skeleton) return false;
        return this.skeleton.baseTrack.stopped || !this.skeleton.baseTrack.currentAction || (this.skeleton.baseTrack.currentAction.includes('walk') || this.skeleton.baseTrack.currentAction.includes('idle'));
    }

    public updateAnimation(delta: number, actionComponent?: PlayerActionComponent) {
        if(this.playerMovementComponent.disabled) return;
        const itemFromAction = actionComponent.actionAttachment;
        if(actionComponent && actionComponent.action) {
            this.skeleton.direction = actionComponent.actionDirection || this.skeleton.direction;
        } else {
            if(this.playerMovementComponent.movingDirection !== null) {
                // player is moving, so set the direction and play the walk ani if not already.
                this.skeleton.direction = this.playerMovementComponent.movingDirection;
                const resolved = this.resolveAniName('walk', itemFromAction);
                if(this.skeleton.baseTrack.currentAction !== resolved || this.skeleton.baseTrack.stopped) {
                    this.skeleton.play(resolved, null, { loop: true });
                }
            } else {
                if((this.skeleton.baseTrack.currentAction && this.skeleton.baseTrack.currentAction.includes('walk')) || !this.skeleton.baseTrack.stopped) {
                    //    this.skeleton.play(resolved, null, { loop: true });
                    if(this.skeleton.baseTrack.currentAction && this.skeleton.baseTrack.currentAction !== 'walk') {
                        this.skeleton.baseTrack.pause();
                    } else {
                        this.skeleton.stop();
                    }
                }
                /* use this when we have idle implemented
                                const resolved = this.resolveAniName('idle', itemFromAction);
                if(this.skeleton.baseTrack.currentAction !== resolved || this.skeleton.baseTrack.stopped) {
                //    this.skeleton.play(resolved, null, { loop: true });
                    this.skeleton.stop();
                }

                 */
            }
        }
        this.skeleton.update(delta);
    }
    public isReady() : boolean {
        return !!this.skeleton;
    }
    onAdded(entity : RemotePlayer | ClientPlayer | NPC) {
        this.entity = entity;
        this.playerMovementComponent = entity.getComponent(SYSTEMS.PLAYER_MOVEMENT) ;
        if(entity.type == EntityTypes.ClientPlayer && !this.playerMovementComponent) throw new Error(`Expected a player movement componnet.`)
    }
}