import {
    DIRECTION_INDEX_DATA,
    MESSAGES,
    SYSTEMS
} from "../../../Shared/Constants";
import {ClientSystem, Message} from 'gotti';
import {NPC} from "../../Assemblages/NPC";
import {PlayerAnimationComponent} from "../PlayerAnimation/Component";
import {NPCMovementComponent} from "./Component";

export class NPCMovementSystem extends ClientSystem {
    private movingNPCs: Array<NPC> = [];
    constructor() {
        super(SYSTEMS.NPC_MOVEMENT);
    }
    public moveBaddy(baddyId: string, x: number, y: number) {
        const c : NPCMovementComponent = this.getSystemComponent(this.$api.findBaddy(baddyId));
        c && c.moveTo(x, y);
    }
    onClear(): void {}
    onStart() {
        this.addApi(this.moveBaddy);
        //  this.globals.tileWorld.addColliderCouples([[COLLIDER_TAGS.NPC_HITBOX, COLLIDER_TAGS.CLIENT_OWNED_PROJECTILE]])
    }
    onStop() {
        //   this.globals.tileWorld.removeColliderCouples([[COLLIDER_TAGS.NPC_HITBOX, COLLIDER_TAGS.CLIENT_OWNED_PROJECTILE]])
    }
    onLocalMessage(message): void {
        switch(message.type) {
        }
    }


    onPeerMessage(peerId, message): any {
    }

    public onEntityAddedComponent(entity: any, component: NPCMovementComponent): void {
        entity['$moveTo'] = component.moveTo.bind(component);
        this.movingNPCs.push(entity);
    }
    public onEntityRemovedComponent(entity: any, component): void {
        for(let i = 0; i < this.movingNPCs.length; i++) {
            if(this.movingNPCs[i] === entity) {
                this.movingNPCs.splice(i, 1);
                return;
            }
        }
    }
    update(delta: any): void {
        for(let i = 0; i < this.movingNPCs.length; i++) {
            const baddy = this.movingNPCs[i];
            const mc : NPCMovementComponent = this.getSystemComponent(baddy);
            if(!mc) {
                console.error(baddy, this);
                throw new Error(`Expected movement component`);
            }
            //TODO: fix mobster1 animation so we dont need to inverse it or need the additional inverse logic anywhere(also done somewhere in the npc attack system)
            mc.updateMovement(delta); //: { x?: number, y?: number, movingDirectionIndex?: number, lookingDirectionIndex: number } {
        }
    }
    onServerMessage(message: Message) {
        throw new Error("Method not implemented.");
    }
}