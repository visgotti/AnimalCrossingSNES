import {ClientSystem} from "gotti";
import {MESSAGES, PLAYER_EVENTS, SYSTEMS} from "../../../Shared/Constants";
import {DroppedItemData, FurnitureState, GameStateData, LevelData, TreeState} from "../../../Shared/types";
import {GameStateComponent} from "./Component";
import {ClientPlayer} from "../../Assemblages/ClientPlayer";

type InventoryChangeEvent = { type: 'add' | 'remove' | 'update', name : string, quantity: number, index?: number };

export class GameStateSystem extends ClientSystem {
    private gameState : GameStateComponent;
    private lastUid : number = 0;

    constructor() {
        super(SYSTEMS.GAME_STATE)
        this.handleInventoryChange = this.handleInventoryChange.bind(this);
    }

    onClear(): void {
    }

    onInit() {
        this.addApi(this.getUid);
    }

    onLocalMessage(message): void {
        switch(message.type) {
            case MESSAGES.ADDED_HOLE:
                this.handleAddedHole(message.data.x, message.data.y, message.data.uid);
                break;
            case MESSAGES.REMOVED_HOLE:
                this.handleRemovedDrop({ level: 'island', uid: message.data });
                break;
            case MESSAGES.DROP_ITEM:
                this.handleDrop(message.data);
                break;
            case MESSAGES.REMOVE_DROPPED_ITEM:
                this.handleRemovedDrop(message.data);
                break;
        }
    }

    private validateAndGetLevelStateObject(level: string) : LevelData {
        const found = this.gameState.data.levels.find(l => l.name === level);
        if(!found) throw new Error(`Didnt find level data for ${level}`);
        return found;
    }
    private handleAddedHole(x: number, y: number, uid: number) {
        const levelData = this.validateAndGetLevelStateObject('island');
        levelData.state.items.push({
            x, y, uid, name: 'hole'
        });
        this.gameState.save();
    }
    private handleDrop(dropEvent: { level: string, data: DroppedItemData<FurnitureState | TreeState> }) {
        const { level, data } = dropEvent;
        const levelData = this.validateAndGetLevelStateObject(level);
        levelData.state.items.push({ ...data });
        this.gameState.save();
    }
    private handleRemovedDrop(dropEvent: { level: string, uid: number }) {
        const { level, uid } = dropEvent;
        const levelData = this.validateAndGetLevelStateObject(level);
        const item = levelData.state.items.find(i => i.uid === uid);
        if(!item) throw new Error(`No item found with uid ${uid}`);
        levelData.state.items.splice(levelData.state.items.indexOf(item), 1);
        this.gameState.save();
    }
    private handleInventoryChange(event : InventoryChangeEvent) {
        const { quantity, name, type, index } = event;
        const found = this.gameState.data.inventory.find(i => i.name === name);
        switch(type) {
            case "add":
                this.gameState.data.inventory.push({ quantity, name, index })
                break;
            case "remove":
            case "update":
                if(!found || found.name !== name) throw new Error(`Did not find item at inventory ${name} ${index}`);
            case "remove":
                this.gameState.data.inventory.splice(this.gameState.data.inventory.indexOf(found), 1);
                break;
            case "update":
                found.quantity += quantity;
                break;
        }
        this.gameState.save();
    }

    onPeerMessage(peerId: number | string, message): any {
    }
    onStart() {
    }

    onEntityAddedComponent(entity: ClientPlayer, component: GameStateComponent) {
        this.gameState = component;
        this.lastUid = component.data.lastUid;
        this.dispatchAllLocal({
            type: MESSAGES.GAME_STATE_INITIALIZED,
            data: component.data
        });
        // do the event listeners in a set timeout to make sure the entity has the inventory component when listening.
        setTimeout(() => {
            entity.on(PLAYER_EVENTS.INVENTORY_CHANGE, this.handleInventoryChange)
        });
    }

    public getUid() {
        this.gameState.data.lastUid++;
        this.gameState.save();
        return this.gameState.data.lastUid
    }

    onServerMessage(message): any {
    }

    update(delta: any): void {
    }

}