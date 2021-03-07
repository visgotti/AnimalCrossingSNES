import {ClientSystem, Entity} from "gotti";
import {ClientPlayer} from "../../Assemblages/ClientPlayer";
import {RemotePlayer} from "../../Assemblages/RemotePlayer";
import {EntityTypes, PlayerInput} from "../../../Shared/types";
import {PlayerMovementComponent} from "./Component";
import System from "gotti/lib/core/System/System";
import { Position as PositionComponent } from "../../../Shared/Components/Position";
import {SYSTEMS} from "../../../Shared/Constants";
import {NPC} from "../../Assemblages/NPC";
import {NPCMovementComponent} from "../NPCMovement/Component";
import {PlayerActionComponent} from "../PlayerAction/Component";
import {getPercentage} from "../../../Shared/Utils";

export class PlayerMovementSystem extends ClientSystem {
    private remotePlayers : Array<RemotePlayer> = [];
    private npcPlayers : Array<NPC> = [];
    private clientPlayer : ClientPlayer;
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
        } else if (entity.type === EntityTypes.RemotePlayer) {
            this.remotePlayers.push(entity);
        } else if (entity.type === EntityTypes.NPC) {
            this.npcPlayers.push(entity);
        }else {
            console.error(entity);
            throw new Error(`Unexpected entity: ${entity.id} had a player movement entity`)
        }
    }
    onEntityRemovedComponent(entity: any, component) {
        if(entity.type === EntityTypes.ClientPlayer) {
            if(this.clientPlayer && entity !== this.clientPlayer) { throw new Error(`Unexpected entity marked as client losing component.`)}
            this.clientPlayer = null;
        } else if (entity.type === EntityTypes.RemotePlayer) {
            this.remotePlayers = this.remotePlayers.filter(r => r !== entity);
        } else if (entity.type === EntityTypes.NPC) {
            this.npcPlayers =this.npcPlayers.filter(r => r !== entity);
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

    update(delta: any): void {
        if(this.clientPlayer && !this.$api.isInventoryOpen()) {
            const pmc : PlayerMovementComponent = this.getSystemComponent(this.clientPlayer);
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
            if(x || y) {
                p.setPositionByDeltas(deltaX, deltaY);
            }
        }
        for(let i = 0 ; i < this.npcPlayers.length; i++) {
            const pmc : NPCMovementComponent = this.npcPlayers[i].getComponent(SYSTEMS.NPC_MOVEMENT);
            pmc.updateMovement(delta);
        }
    }

    onPeerMessage(peerId: number | string, message): any {
    }
}