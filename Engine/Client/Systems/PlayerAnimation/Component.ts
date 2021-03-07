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

    public updateAnimation(delta: number, actionComponent?: PlayerActionComponent) {
        if(actionComponent && actionComponent.action) {
            this.skeleton.direction = actionComponent.actionDirection || this.skeleton.direction;
        } else {
            if(this.playerMovementComponent.movingDirection !== null) {
                // player is moving, so set the direction and play the walk ani if not already.
                this.skeleton.direction = this.playerMovementComponent.movingDirection;
                if(this.skeleton.baseTrack.currentAction !== 'walk' || this.skeleton.baseTrack.stopped) {
                    this.skeleton.play('walk', null, { loop: true });
                }
            } else if(!this.skeleton.baseTrack.stopped){
                this.skeleton.stop();
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