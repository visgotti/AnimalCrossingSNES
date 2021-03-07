import {ClientSystem} from "gotti";
import {COLLIDER_TAGS, MESSAGES, SYSTEMS} from "../../../Shared/Constants";
import {GameStateData, LevelStateData, PlayerInput} from "../../../Shared/types";
import {PlayerActionComponent} from "../PlayerAction/Component";
import {PlayerAnimationComponent} from "../PlayerAnimation/Component";

export class DigSystem extends ClientSystem {
    private playerInput : PlayerInput;
    private playerAction : PlayerActionComponent;
    private playerAnimation : PlayerAnimationComponent;
    private isReady : boolean = false;
    private holes : Array<PIXI.Sprite> = [];
    public possibleCollidersPreventingHole: Array<any> = [];
    private collidersPreventingHole : Array<any>;

    private focusedHole : any;

    private playerHoleCollisionPlugin : any;
    private playerPreventHoleCollisionPlugin : any;
    private initializingFromGameState : boolean = false;

    private holeTexture : PIXI.Texture;

    constructor() {
        super(SYSTEMS.DIG)
        this.playerHoleCollisionPlugin = {
            type: 'collision',
            name: 'holes',
            tagAs: [COLLIDER_TAGS.in_front_of_client_player],
            tagBs: [COLLIDER_TAGS.hole],
            onCollisionStart: (colA, colB) => {
                if(!this.focusedHole) {
                    this.focusedHole = colB.gameObject;
                }
            },
            onCollision: (colA, colB) => {
                if(!this.focusedHole) {
                    this.focusedHole = colB.gameObject;
                }
            },
            onCollisionEnd: (colA, colB) => {
                if(this.focusedHole === colB.gameObject) {
                    this.focusedHole = null;
                }
            },
        }
        this.playerPreventHoleCollisionPlugin = {
            type: 'collision',
            name: 'prevent_holes',
            tagAs: [COLLIDER_TAGS.in_front_of_client_player],
            tagBs: [COLLIDER_TAGS.npc, COLLIDER_TAGS.dropped_item, COLLIDER_TAGS.hole, COLLIDER_TAGS.blocking],
            onCollisionStart: (colA, colB) => {
                this.possibleCollidersPreventingHole.push(colB);
            },
            onCollision: (colA, colB) => {
                this.possibleCollidersPreventingHole.push(colB);
            },
        }
    }



    onClear(): void {
    }

    public addHole() {
    }

    handleInitPlayer() {
        this.playerInput = this.globals.clientPlayer.playerInput;
        this.playerAction = this.globals.clientPlayer.getComponent(SYSTEMS.PLAYER_ACTION);
        this.playerAnimation = this.globals.clientPlayer.getComponent(SYSTEMS.PLAYER_ANIMATION);
        if(this.playerAnimation.skeleton) {
            this.isReady = true;
        } else {
            this.globals.clientPlayer.once('skeleton-ready', () => {
            });
        }
    }

    public getFocusedHole() : any {
        return this.focusedHole;
    }

    private onPlayerReady() {
        this.isReady = true;
    }

    private canDig() {
        return this.globals.tileWorld.loadedMap === 'island' &&
            !this.possibleCollidersPreventingHole.length &&
            this.playerAnimation.canPlayActionAnimation();
    }

    private tryingToDig() {
        return this.playerInput.grab && this.playerAction.actionAttachment === 'shovel'
    }

    private handleGameStateInitialized(gameState : GameStateData) {
        this.initializingFromGameState = true;
        const levelState : LevelStateData = gameState.levels.find(l => l.name === 'island').state;
        levelState.items.forEach(i => {
            if(i.name === 'hole') {
                this.addNewHole(i.x, i.y, i.uid);
            }
        })
        this.initializingFromGameState = false;
    }

    private addNewHole(x, y, uid) {
        const to = !this.initializingFromGameState ? [SYSTEMS.GAME_STATE, SYSTEMS.FLOWER] : [SYSTEMS.FLOWER];
       const hole = {
           texture: this.globals.gameTextures.items.placed.hole,
           position: { x, y },
           colliders: [{
               shapeData: { x: 0, y: 0, w: this.holeTexture.width, h: this.holeTexture.height },
               tags: [COLLIDER_TAGS.hole]
           }],
           data: {
               uid,
           }
       }
        this.holes.push(
            this.globals.tileWorld.addGameObject()
        )
        this.dispatchLocal({
            type: MESSAGES.ADDED_HOLE,
            data: { uid, x, y, gameObject: hole },
            to,
        })
    }
    public removeHole(hole: any | number) {
        let foundHole = hole;
        let foundHoleUid;
        if(typeof hole !== 'object') {
            foundHole = this.holes.find(h => h['data'].uid === hole);
            if(!foundHole) throw new Error(`Could not find hole ${hole}`);
            foundHoleUid = hole;
            foundHole.removeFromMap();
            if(hole === this.focusedHole) {
                this.focusedHole = null;
            }
            this.holes = this.holes.splice(this.holes.indexOf(foundHole), 1);
        } else {
            foundHoleUid = foundHole.data.uid;
        }
        this.dispatchLocal({
            type: MESSAGES.REMOVED_HOLE,
            data: foundHoleUid,
            to: [SYSTEMS.GAME_STATE]
        })
    }

    onLocalMessage(message): void {
        switch(message.type) {
            case MESSAGES.GAME_STATE_INITIALIZED:
                this.handleGameStateInitialized(message.data);
                break;
            case MESSAGES.CLIENT_PLAYER_ENTITY_INITIALIZED:
                this.handleInitPlayer();
                break;
        }
    }

    onPeerMessage(peerId: number | string, message): any {
    }

    onServerMessage(message): any {
    }

    onInit() {
        this.holeTexture = this.globals.gameTextures.items.placed.hole.width
        this.addApi(this.removeHole);
        this.addApi(this.getFocusedHole);
    }

    update(delta: any): void {
        if (!this.isReady) return;
        if(this.tryingToDig()) {
            if(this.canDig()) {
                this.playerAnimation.skeleton.play('dig', null, { loop: false });
                const { x, y } = this.$api.getAheadOfPlayerPosition();
                this.addNewHole(x, y, this.$api.getUid());
            }
        }
        this.possibleCollidersPreventingHole.length = 0;
    }
}