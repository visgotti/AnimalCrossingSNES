import {ClientSystem} from "gotti";
import {COLLIDER_TAGS, MESSAGES, SeedData, SYSTEMS} from "../../../Shared/Constants";
import {
    BugTypes,
    DroppedItemData,
    FlowerState,
    FlowerTypes,
    GameStateData,
    ItemTypes,
    LevelStateData
} from "../../../Shared/types";
import {Bug} from "../../Assemblages/Bug";
import {Flower} from "../../Assemblages/Flower";
import {PlatableGameData} from "../../../Shared/GameData";
import {FlowerComponent} from "./Component";
import {getRandomNumber, rectsAreColliding} from "../../../Shared/Utils";

export class FlowerSystem extends ClientSystem{
    private playerFlowCollisionPlugin;
    private possiblePickupableFlowers : Array<any>
    private numberOfBees : number = 0;
    private numberOfTrees : number = 0;
    private numberOfFullGrownFlowers : number = 0;
    private timeTillNextFlower : number = 0;
    private initializingGameState: boolean = false;
    private focusedFlower: Flower;
    // @ts-ignore
    private holes : Array<GameObject> = [];

    constructor() {
        super(SYSTEMS.FLOWER)
        const handleCol = (colA, colB) => {
            const player = colA.gameObject.entity;
            const flower = colB.gameObject.entity;
            this.possiblePickupableFlowers.push(flower);
        }

        this.playerFlowCollisionPlugin = {
            type: 'collision',
            name: 'flower',
            tagAs: [COLLIDER_TAGS.in_front_of_client_player],
            tagBs: [COLLIDER_TAGS.flower],
            onCollisionStart: (colA, colB) => {
                if(!this.focusedFlower) {
                    this.focusedFlower = colB.gameObject.entity;
                }
            },
            onCollision: (colA, colB) => {
                if(!this.focusedFlower) {
                    this.focusedFlower = colB.gameObject.entity;
                }
            },
            onCollisionEnd: (colA, colB) => {
                if(this.focusedFlower === colB.gameObject.entity) {
                    this.focusedFlower = null;
                }
            },
        }
    }
    onClear(): void {
    }

    get growthHash() : string {
        return `${this.numberOfBees}_${this.numberOfTrees}_${this.numberOfFullGrownFlowers}`
    }

    get growthRate() : number {
        return this.numberOfBees + this.numberOfTrees + this.numberOfFullGrownFlowers;
    }

    private handleSpawnedBug(bug: Bug) {
        if(bug.bugType === BugTypes.BEE) {
            this.numberOfBees--;
        }
    }
    private handleInitializedClientPlayer() {
        this.globals.clientPlayer.on('action', ({ actionName }) => {
            if(actionName === 'shovel') {
            }
        })
    }
    private handleRemovedBug(bug: Bug) {
        if(bug.bugType === BugTypes.BEE) {
            this.numberOfBees++;
        }
    }

    private isPlant(itemName: string) {
    }

    private getSeedDataForFlower(type: FlowerTypes) : SeedData {
        const seedType = type.replace('flower', 'seed');
        if(!(seedType in PlatableGameData)) throw new Error(`Could not find flower: ${type} from seed: ${seedType} in the lookup`);
        return PlatableGameData[seedType]
    }

    private createFlowerEntity(type: FlowerTypes, plantedByPlayer: boolean, elapsedTimeAlive: number, x: number, y: number, uid: number) : Flower {
        const seedData = this.getSeedDataForFlower(type);
        const flowerData : DroppedItemData<FlowerState> = {
            uid,
            name: type,
            x,
            y,
            state: {
                elapsedTimeAlive,
                plantedByPlayer,
            },
        }
        const flower = new Flower(flowerData);
        this.initializeEntity(flower);
        return flower;
    }
    private handleInitializedGameState(state: GameStateData) {
        this.initializingGameState = true;
        const islandData : LevelStateData = state.levels.find(l => l.name === 'island').state;
        const flowers : Array<DroppedItemData<FlowerState>> = islandData.items.filter(i => this.globals.gameData[i.name].type === ItemTypes.FLOWER) as  Array<DroppedItemData<FlowerState>>;
        flowers.forEach(f => {
            this.createFlowerEntity(f.name as FlowerTypes, f.state.plantedByPlayer, f.state.elapsedTimeAlive, f.x, f.y, f.uid);
        });
        this.initializingGameState = false;
    }

    onLocalMessage(message): void {
        switch(message.type) {
            case MESSAGES.GAME_STATE_INITIALIZED:
                this.handleInitializedGameState(message.data);
                break;
            case MESSAGES.CLIENT_PLAYER_ENTITY_INITIALIZED:
                this.handleInitializedClientPlayer();
                break;
            case MESSAGES.REMOVED_TREE:
                this.numberOfTrees--;
                break;
            case MESSAGES.REMOVED_BUG:
                this.handleRemovedBug(message.data.bug);
                break;
            case MESSAGES.SPAWNED_BUG:
                this.handleSpawnedBug(message.data.bug);
                break;
            case MESSAGES.ADDED_HOLE:
                this.handleAddedHole(message.data.gameObject);
                break;
        }
    }

    private handleAddedHole(hole: any) {
        const shapeData = hole.colliders[0].shapeData;
        if(this.focusedFlower && rectsAreColliding(shapeData, this.focusedFlower.gameObject.colliders[0].shapeData)) {
            if(this.isFullyGrown(this.focusedFlower)) {
            } else {
            }
            this.removeFlower(this.focusedFlower)
        }
    }

    private removeFlower(flower: Flower) {
        const wasFullyGrown = this.isFullyGrown(flower);
        flower.gameObject.removeFromMap();
        const p = flower.getPosition();
        const flowerType = flower.flowerType;
        this.destroyEntity(flower);
        this.dispatchLocal({
            to: [SYSTEMS.GAME_STATE, SYSTEMS.BUG_SPAWN],
            type: MESSAGES.REMOVED_FLOWER,
            data: { uid: flower.id, type: flower.flowerType, wasFullyGrown }
        });

        const seedName = flowerType.replace('flower', 'seed');
        const pedalName = flowerType.replace('flower', 'pedal');

        const randomSeedSpot1 = {x: getRandomNumber(p.x-15, p.x+5), y: getRandomNumber(p.y-15, p.y+15) };
        const randomSeedSpot2 = { x: getRandomNumber(p.x-5, p.x+15), y: getRandomNumber(p.y-15, p.y+15) };
        const randomPedalSpot = { x: getRandomNumber(p.x-15, p.x+15), y: getRandomNumber(p.y-15, p.y+15) };
        this.$api.dropItem(seedName, randomSeedSpot1.x, randomSeedSpot1.y);
        this.$api.dropItem(seedName, randomSeedSpot2.x, randomSeedSpot2.y);
        this.$api.dropItem(pedalName, randomPedalSpot.x, randomPedalSpot.y);
    }

    private isFullyGrown(f: Flower) {
        const seedData =  this.getSeedDataForFlower(f.flowerType);
        return seedData.timeToGrow < f.timeAlive;
    }


    onEntityRemovedComponent(entity: any, component) {
        if(entity.gameObject) {
            delete entity.gameObject.entity;
            delete entity.gameObject
        }
    }

    onEntityAddedComponent(entity: Flower, component : FlowerComponent) {
        const to = !this.initializingGameState ? [SYSTEMS.BUG_SPAWN] : [SYSTEMS.BUG_SPAWN, SYSTEMS.GAME_STATE];
        entity.gameObject = this.globals.tileWorld.addGameObject({
            texture: this.globals.gameTextures.items.placed[entity.flowerType],
            p: { ...entity.getPosition() },
            collider: [{
                dynamic: false,
                shapeData: [{ x: 0, y: 0, w: 10, h: 10 }],
                tags: [COLLIDER_TAGS.flower]
            }]
        });
        entity.gameObject.entity = entity;

        this.dispatchLocal({
            type: MESSAGES.NEW_FLOWER,
            data: entity,
            to
        })
        if(this.isFullyGrown(entity)) {
            this.dispatchLocal({
                type: MESSAGES.FLOWER_FULLY_GROWN,
                data: entity,
                to
            })
        }
    }

    onPeerMessage(peerId: number | string, message): any {
    }
    onServerMessage(message): any {
    }

    update(delta: any): void {
    }
}