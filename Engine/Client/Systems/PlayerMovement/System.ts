import {ClientSystem} from "gotti";
import {ClientPlayer} from "../../Assemblages/ClientPlayer";
import {RemotePlayer} from "../../Assemblages/RemotePlayer";
import {EntityTypes, PlayerInput} from "../../../Shared/types";
import {PlayerMovementComponent} from "./Component";
import {Position as PositionComponent} from "../../../Shared/Components/Position";
import {COLLIDER_TAGS, SYSTEMS} from "../../../Shared/Constants";
import {NPC} from "../../Assemblages/NPC";
import {PlayerActionComponent} from "../PlayerAction/Component";

import {
    getSegmentsFromRect,
    lineCircleData,
    LineCircleResponse,
    resolveLineCircleCollisionPosition
} from "../../../Shared/Utils";

const AheadOfPlayerOffsets = {
    north: { x: 0, y: 0 },
    south: { x: 0, y: 25 },
    west: { x: -10, y: 17 },
    east: { x: 10, y: 17  },
}

export class PlayerMovementSystem extends ClientSystem {
    private remotePlayers : Array<RemotePlayer> = [];
    private npcPlayers : Array<NPC> = [];
    private clientPlayer : ClientPlayer;
    private previousDirection : string;
    private clientCollider : { shapeData: { x: number, y: number, r: number }};

    private aheadOfPlayerGameObject : any;
    private playerBlockingPlugin : any;
    private possibleLineCollisions: Array< { p1: { x: number, y: number }, p2: { x: number, y: number } }> = [];
    private resolvedPlayerPositionDeltas: { x: number, y: number };

    constructor() {
        super(SYSTEMS.PLAYER_MOVEMENT);
        const addPossibleCollisionToArray = (colB) => {
            if(colB.isRect) {
                getSegmentsFromRect(colB.shapeData).forEach(a => {
                    this.possibleLineCollisions.push({ p1: { x: a[0].x, y: a[0].y }, p2: { x: a[1].x, y: a[1].y } });
                });
            } else if (colB.isLine) {
                const a =  colB.shapeData;
                this.possibleLineCollisions.push({ p1: { x: a[0].x, y: a[0].y }, p2: { x: a[1].x, y: a[1].y } });
            }
        };

        this.playerBlockingPlugin = {
            type: 'collision',
            name: 'wall_resolution',
            tagAs: [COLLIDER_TAGS.client_player],
            tagBs: [COLLIDER_TAGS.blocking, COLLIDER_TAGS.water],
            onCollisionStart: (colA, colB) => {
                if(!this.clientCollider) return;
                addPossibleCollisionToArray(colB);
            },
            onCollision: (colA, colB) => {
                if(!this.clientCollider) return;
                addPossibleCollisionToArray(colB);
            },
            onAfterCollisions: () => {
                if(this.clientCollider && this.possibleLineCollisions.length) {
                    console.log('the player collision position WAS', this.globals.clientPlayer.getPosition());
                    const circlePositionBefore = { x: this.clientCollider.shapeData.x, y: this.clientCollider.shapeData.y };
                    const circle = {
                        ...this.clientCollider.shapeData,
                        diameter: this.clientCollider.shapeData.r*2,
                        radius: this.clientCollider.shapeData.r,
                    }
                    this.possibleLineCollisions.forEach((c, i) => {
                        let collisionData = lineCircleData(c.p1.x, c.p1.y, c.p2.x, c.p2.y, circle.x, circle.y, circle.radius);
                        if(collisionData) {
                            const { x, y }  = resolveLineCircleCollisionPosition(<LineCircleResponse>collisionData, circle);
                            circle.x = x + circle.radius;
                            circle.y = y + circle.radius;
                        }
                    });
                    this.resolvedPlayerPositionDeltas = {
                        x: circle.x - circlePositionBefore.x,
                        y: circle.y - circlePositionBefore.y
                    }
                    console.log('RESOLVED POSITION:', {...this.resolvedPlayerPositionDeltas});
                    const p = this.globals.clientPlayer.setPositionByDeltas(this.resolvedPlayerPositionDeltas.x, this.resolvedPlayerPositionDeltas.y);
                    this.setHeadDataFrom(p.x, p.y)
                    this.possibleLineCollisions.length = 0;
                }
            }
        };
    }
    onClear(): void {
    }
    onLocalMessage(message): void {}
    onServerMessage(message): any {
    }

    onEntityAddedComponent(entity: any, component) {
        if(!entity.hasComponent(SYSTEMS.POSITION)) throw new Error(`Entities added with a player movement component should have a position component added first always.`)
        if(entity.type === EntityTypes.ClientPlayer) {
            this.clientPlayer = entity;
            if(!this.clientPlayer.gameObject) {
                entity.once('gameobject-ready', (gameObject) => {
                    this.clientCollider = gameObject.colliders[0];
                });
            } else {
                this.clientCollider = this.clientPlayer.gameObject.colliders[0];
            }
            console.log('client col:', this.clientCollider);
            const p = this.clientPlayer.getPosition();
            this.aheadOfPlayerGameObject = this.globals.tileWorld.addGameObject({
                texture: PIXI.Texture.EMPTY,
                position: { ...p },
                layer: 1,
                colliders: [{
                    layer: 2,
                    dynamic: true,
                    shapeData: { x: 0, y: 0, w: 20, h: 20 },
                    tags: [COLLIDER_TAGS.in_front_of_client_player]
                }]
            });
        } else if (entity.type === EntityTypes.RemotePlayer) {
            this.remotePlayers.push(entity);
        } else {
            console.error(entity);
            throw new Error(`Unexpected entity: ${entity.id} had a player movement entity`)
        }
    }

    public getAheadOfPlayerPosition() : { x: number, y: number } {
        const { x, y, w, h } = this.aheadOfPlayerGameObject.colliders[0].shapeData
        return { x: (x + w / 2), y: (y + h / 2) }
    }

    onEntityRemovedComponent(entity: any, component) {
        if(entity.type === EntityTypes.ClientPlayer) {
            if(this.clientPlayer && entity !== this.clientPlayer) { throw new Error(`Unexpected entity marked as client losing component.`)}
            this.clientPlayer = null;
        } else if (entity.type === EntityTypes.RemotePlayer) {
            this.remotePlayers = this.remotePlayers.filter(r => r !== entity);
        } else {
            console.error(entity);
            throw new Error(`Unexpected entity: ${entity.id} had a player movement entity`)
        }
    }

    private getVelocitiesFromInput(speed: number, input : PlayerInput) : { x: number, y: number } {
        const s = { x: 0, y : 0};
        if(input.moveDown) { s.y += speed; return s };
        if(input.moveUp) { s.y -= speed; return s };
        if(input.moveLeft){ s.x -= speed; return s };
        if(input.moveRight) {s.x += speed; return s };
        return s;
    }

    onInit() {
        this.globals.tileWorld.use(this.playerBlockingPlugin);
        this.addApi(this.getAheadOfPlayerPosition);
    }

    private setHeadDataFrom(x, y) {
        const pmc : PlayerMovementComponent = this.getSystemComponent(this.clientPlayer);
        let offsets;
        if(pmc.movingDirection !== null) {
            offsets = AheadOfPlayerOffsets[pmc.movingDirection];
        } else {
            const actionComponent : PlayerActionComponent = this.clientPlayer.getComponent(SYSTEMS.PLAYER_ACTION);
            const aniComponent = this.clientPlayer.getComponent(SYSTEMS.PLAYER_ANIMATION);
            const dir = aniComponent.skeleton?.direction || this.clientPlayer.getComponent(SYSTEMS.GAME_STATE).data.direction;
            offsets = AheadOfPlayerOffsets[dir];
        }
        this.aheadOfPlayerGameObject.setPosition(x+offsets.x, y+offsets.y);
    }

    update(delta: any): void {
        if(this.clientPlayer && !this.$api.isInventoryOpen() && !this.$api.isInDialogue()) {
            const pmc : PlayerMovementComponent = this.getSystemComponent(this.clientPlayer);
            if(pmc.disabled) {
                const aniComponent = this.clientPlayer.getComponent(SYSTEMS.PLAYER_ANIMATION);
                const dir = aniComponent.skeleton?.direction || this.clientPlayer.getComponent(SYSTEMS.GAME_STATE).data.direction;
                const offsets = AheadOfPlayerOffsets[dir];
                const finalPosition = this.clientPlayer.getPosition();
                this.aheadOfPlayerGameObject.setPosition(finalPosition.x+offsets.x, finalPosition.y+offsets.y);
                return;
            };
            const actionComponent : PlayerActionComponent = this.clientPlayer.getComponent(SYSTEMS.PLAYER_ACTION);
            if(actionComponent?.action) {
                pmc.setVelocities(0, 0);
                return;
            };
            let finalSpeed = pmc.speed;
            const { x, y } = this.getVelocitiesFromInput(finalSpeed, this.clientPlayer.playerInput);
            pmc.setVelocities(x, y);
            const deltaX = x * delta;
            const deltaY = y * delta;
            const p : PositionComponent = this.clientPlayer.getComponent(SYSTEMS.POSITION);
            let finalPosition = p.getPosition();
            if(x || y) {
                finalPosition = p.setPositionByDeltas(deltaX, deltaY);
            }
            this.setHeadDataFrom(finalPosition.x, finalPosition.y);
        }
    }

    onPeerMessage(peerId: number | string, message): any {
    }
}