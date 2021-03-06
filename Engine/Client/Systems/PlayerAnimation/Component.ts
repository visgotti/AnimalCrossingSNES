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

    private playerMovementComponent : PlayerMovementComponent;
    private playIdleAniTimeout : any;
    private mountedAttachment : AnimationTrack;
    readonly shirtSkin : 'default' | 'wife' | 'police'
    readonly hatSkin : 'default' | 'wife' | 'police'

    constructor(skeletonName : string, shirtSkin?: 'default' | 'wife' | 'police', hatSkin?: 'default' | 'wife' | 'police') {
        super(SYSTEMS.PLAYER_ANIMATION);
        // @ts-ignore
        shirtSkin = shirtSkin === 'husband' ? 'default' : shirtSkin;
        this.skeletonName = skeletonName;
        this.shirtSkin = shirtSkin || 'default';
        this.hatSkin = hatSkin || 'default';
    }
    public async initSkeleton(gottimation: Gottimation, direction?: 'east' | 'west' | 'south' | 'north') {
        direction = direction || 'south';
        this.skeleton = await gottimation.createSkeleton(this.skeletonName,{ direction });
        await this.skeleton.setSkins([
            { atlasName: 'tools', skinName: 'default.png' },
            { atlasName: 'base', skinName: 'default.png' },
            { atlasName: 'shirt', skinName: `${this.shirtSkin}.png` },
            { atlasName: 'blood', skinName: 'default.png'}
        ]);
        setTimeout(() => {
          //  this.skeleton.setSkin({ skinName: 'wife.png', atlasName: 'shirt'})
        }, 5000);
       // console.error('skel:', this.skeleton);
        //this.skeleton.play('idle');
        this.emit('skeleton-ready', this.skeleton);
        this.skeleton.onEnd((actionName, track) => {
            if(track !== this.skeleton.baseTrack) return;
         //   console.error('ENDING:', actionName);
            if(actionName === 'run' || actionName === 'walk') return;
            this.clearIdleAniTimeout();
            const aC : PlayerActionComponent = this.entity.getComponent(SYSTEMS.PLAYER_ACTION);
            if(aC?.action === actionName) {
            //    console.error('stopping action.', aC.action);
                if(!this.skeleton.baseTrack.stopped) {
                    this.skeleton.stop();
                }
                if(!aC.repeatingAction) {
                    aC.stopAction();
                    this.clearIdleAniTimeout();
                    this.playIdleAniTimeout = setTimeout(() => {
                        this.playIdleAniTimeout = null;
                        this.skeleton.play('idle', null, { loop: false, timeScale: .8 });
                    }, getRandomNumber(2500, 6000));
                } else {
                  //  console.error('replay action.', aC.action);
                    this.skeleton.play(aC.action, null, { timeScale: 1 })
                }
            }
        })
        return this.skeleton
    }

    private unmountAttachmentIfMounted() {
        if(this.mountedAttachment) {
            this.mountedAttachment.unmount();
            this.mountedAttachment = null;
        }
    }

    private clearIdleAniTimeout() {
        if(this.playIdleAniTimeout) {
            clearTimeout(this.playIdleAniTimeout);
            this.playIdleAniTimeout = null;
        }
    }

    public updateAnimation(delta: number, actionComponent?: PlayerActionComponent) {
        const prevSkelAction = this.skeleton.baseTrack.currentAction;
        const prevSkelWasStopped = this.skeleton.baseTrack.stopped;

        if(actionComponent && actionComponent.action) {
            this.clearIdleAniTimeout();
            this.skeleton.direction = actionComponent.actionDirection || this.skeleton.direction;
            // if the entities action is not what the current skeleton is doing we update the skeleton.
            if(this.skeleton.baseTrack.currentAction != actionComponent.action) {
                this.unmountAttachmentIfMounted();
                if(!this.skeleton.baseTrack.stopped) {
                    //todo: why?
                    this.skeleton.stop();
                }
                if(actionComponent.actionAttachment) {
                    this.mountedAttachment = this.skeleton.mountAttachment('hatchet', 'hatchet');
                }
                this.skeleton.play(actionComponent.action, null,);
            }
        } else {
            this.unmountAttachmentIfMounted();
            // no current action or action component, so only check if we need to update walk > idle or idle > walk.
            if(this.playerMovementComponent.movingDirection !== null) {
                this.clearIdleAniTimeout();
                const ani = this.playerMovementComponent.isSprinting ? 'run' : 'walk';
                // player is moving, so set the direction and play the walk ani if not already.
                this.skeleton.direction = this.playerMovementComponent.movingDirection;
                if(prevSkelAction !== ani || prevSkelWasStopped) {
                    const timeScale = ani === 'walk' ? 1 : 1.5;
                    this.skeleton.play(ani, null, { loop: true, timeScale });
                }
            } else {
                // no movement direction, play idle if player isnt already.
                if(!prevSkelWasStopped && prevSkelAction !== 'idle') {
                    this.clearIdleAniTimeout();
                    this.skeleton.stop();
                    this.playIdleAniTimeout = setTimeout(() => {
                        this.playIdleAniTimeout = null;
                        this.skeleton.play('idle', null, { loop: false,  timeScale: .8 });
                    }, getRandomNumber(2500, 6000));
                }
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