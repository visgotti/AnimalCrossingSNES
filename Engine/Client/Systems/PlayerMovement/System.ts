import {ClientSystem, Entity} from "gotti";
import {ClientPlayer} from "../../Assemblages/ClientPlayer";
import {RemotePlayer} from "../../Assemblages/RemotePlayer";
import {EntityTypes, PlayerInput} from "../../../Shared/types";
import {PlayerMovementComponent} from "./Component";
import System from "gotti/lib/core/System/System";
import { Position as PositionComponent } from "../../../Shared/Components/Position";
import {COLLIDER_TAGS, SYSTEMS} from "../../../Shared/Constants";
import {NPC} from "../../Assemblages/NPC";
import {NPCMovementComponent} from "../NPCMovement/Component";
import {PlayerActionComponent} from "../PlayerAction/Component";
import {getPercentage} from "../../../Shared/Utils";


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

    private aheadOfPlayerGameObject : any;

    constructor() {
        super(SYSTEMS.PLAYER_MOVEMENT);
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
        this.addApi(this.getAheadOfPlayerPosition);
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
            let offsets;
            if(pmc.movingDirection !== null) {
                offsets = AheadOfPlayerOffsets[pmc.movingDirection];
            } else {
                const aniComponent = this.clientPlayer.getComponent(SYSTEMS.PLAYER_ANIMATION);
                const dir = aniComponent.skeleton?.direction || this.clientPlayer.getComponent(SYSTEMS.GAME_STATE).data.direction;
                offsets = AheadOfPlayerOffsets[dir];
            }
            this.aheadOfPlayerGameObject.setPosition(finalPosition.x+offsets.x, finalPosition.y+offsets.y);
        }
    }

    onPeerMessage(peerId: number | string, message): any {
    }
}