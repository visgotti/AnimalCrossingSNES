import Gotti, {ClientSystem} from "gotti";
import {COLLIDER_TAGS, MESSAGES, SYSTEMS} from "../../../Shared/Constants";
import {GameStateData, GameValues, NPC_TYPES, NPCStateData} from "../../../Shared/types";
import {ClientPlayer} from "../../Assemblages/ClientPlayer";
import {NPC} from "../../Assemblages/NPC";
import {NPCMovementComponent} from "../NPCMovement/Component";
import {NOM_TOOK_WALK_TO_YOU, WALK_TO_HOUSE_PATHS} from "../../../Shared/GameData";
import assert = require("assert");
import {asyncTimeout} from "../../../Shared/Utils";

type InventoryChangeEvent = { type: 'add' | 'remove' | 'update', name : string, quantity: number, index?: number };

export class NPCSystem extends ClientSystem {
    private nomTookSkeleton;
    private nomTook : NPC;
    private nomTookGameObject;
    private isWaitingForClientPlayer: boolean = true;
    private startedTutorial : boolean = false;
    private fadedIn : boolean = false;
    constructor() {
        super(SYSTEMS.NPC)
    }


    onLocalMessage(message): void {
        switch(message.type) {
            case MESSAGES.GAME_STATE_INITIALIZED:
                this.handleInitializedGameState(message.data);
                break;
            case MESSAGES.CLIENT_PLAYER_ENTITY_INITIALIZED:
                this.handleInitializedClientPlayer()
                break;
        }
    }
    private async addNomTook(data: NPCStateData) : Promise<NPC> {
        const npc = new NPC(NPC_TYPES.NomTook)
        this.nomTook = npc;
        this.nomTookSkeleton = await this.globals.gottimation.createSkeleton('nomtook', { direction: 'south'});
        await this.nomTookSkeleton.setSkins([
            {atlasName: 'nomtook', skinName: 'default.png'}
        ]);
        this.initializeEntity(npc, { speed: GameValues.PlayerSpeed, x: data.position.x, y: data.position.y, skeleton: this.nomTookSkeleton })
        this.nomTookGameObject = this.globals.tileWorld.addGameObject({
            sprite: this.nomTookSkeleton,
            position: { x: data.position.x, y: data.position.y },
            layer: 1,
            colliders: [{ layer: 1, shapeData: { x: 10, y: 23, r: 10 }, dynamic: true, tags: [COLLIDER_TAGS.npc]} ],
        })
        npc.gameObject = this.nomTookGameObject;
        npc.gameObject.entity = npc;
        this.nomTookGameObject.sprite.x = data.position.x;
        this.nomTookGameObject.sprite.y = data.position.y;
        return npc;
    }
    private handleInitializedClientPlayer() {
        this.isWaitingForClientPlayer = false;
        this.doStartGameIfReadyAndNeeded();
    }

    async handleInitializedGameState(state: GameStateData) {
        await this.addNomTook(state.npcData.nomTook);
        this.doStartGameIfReadyAndNeeded();
    }
    private doStartGameIfReadyAndNeeded() {
        if(!this.$api.needsTutorial()) return;
        if(!this.isWaitingForClientPlayer && this.nomTookGameObject && this.fadedIn && !this.startedTutorial) {
            this.startedTutorial = true;
            const nomMovement : NPCMovementComponent = this.nomTook.getComponent(SYSTEMS.NPC_MOVEMENT);
            const playerMovement : NPCMovementComponent = this.globals.clientPlayer.getComponent(SYSTEMS.NPC_MOVEMENT);
            nomMovement.moveTo(NOM_TOOK_WALK_TO_YOU.x, NOM_TOOK_WALK_TO_YOU.y);
            this.nomTook.once('reached-spot', async () => {
                //TODO: dialogue ie = hey welcome to down, let me show you to your house.
                await asyncTimeout(1000);
                nomMovement.moveToQueue([...WALK_TO_HOUSE_PATHS.nomTook]);
                playerMovement.moveToQueue([...WALK_TO_HOUSE_PATHS.player]);
                const lastPosition = WALK_TO_HOUSE_PATHS.player[WALK_TO_HOUSE_PATHS.player.length - 1];
                const playerMovementListener = ({ x, y, direction }) => {
                    if(x === lastPosition.x && y === lastPosition.y && direction === lastPosition.direction) {
                        this.globals.clientPlayer.emit('reached-house', true);
                    }
                }
                this.globals.clientPlayer.on('reached-spot', playerMovementListener);
                this.globals.clientPlayer.once('reached-house', async () => {
                    this.globals.clientPlayer.off('reached-spot', playerMovementListener);
                    //TODO: more dialogue ie = hey this is your house, do you want it? okay great your next job is to go collect flowers.
                    await asyncTimeout(1000);
                    assert.strictEqual(this.globals.clientPlayer.gameState.npcData.nomTook.task, 0);
                    assert(this.globals.clientPlayer.hasComponent(SYSTEMS.NPC_MOVEMENT));
                    assert(this.globals.clientPlayer.getComponent(SYSTEMS.PLAYER_MOVEMENT).disabled);
                    this.dispatchLocalInstant({
                        to: [SYSTEMS.GAME_STATE],
                        type: MESSAGES.FINISH_NPC_TASK,
                        data: 'nomTook'
                    });
                    assert.strictEqual(this.globals.clientPlayer.gameState.npcData.nomTook.task, 1);
                    const { success, error } = this.$api.addItem('net', 1);
                    assert(success);
                });
            });
        }
    }

    onClear(): void {
    }

    onInit() {
    }

    onPeerMessage(peerId: number | string, message): any {
    }
    onStart() {
        if(this.$api.needsTutorial()) {
            Gotti.once('faded-in-halfway', () => {
                this.fadedIn = true;
                this.doStartGameIfReadyAndNeeded();
            })
        }
    }

    onEntityAddedComponent(entity: ClientPlayer, component) {
    }


    onServerMessage(message): any {
    }

    update(delta: any): void {
    }


}