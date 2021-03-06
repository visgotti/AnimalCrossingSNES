import {NPC} from "../Client/Assemblages/NPC";
import {Entity} from "gotti";

export type TreeState = {
    growth: number,
    type: 'basic' | 'fruit',
    fruits?: number,
    chopped?: number,
}
export type FurnitureState = {
    rotation: number,
}

export type BugState = {
}

export enum ItemTypes {
    TREE,
    FURNITURE,
    RESOURCE,
}

export type DroppedItemData<T> = {
    uid: number,
    name: string,
    x: number,
    y: number,
    state?: T,
}

export type LevelData = {
    name: string,
    isHome?: boolean,
    droppableItems: Array<ItemTypes>,
    state: LevelStateData,
}

export type LevelStateData =  {
    items: Array<DroppedItemData<FurnitureState | TreeState | BugState>>,
    [prop: string]: any,
}
export type IslandStateData = LevelStateData & {
    holes: Array<{ x: number, y: number }>,
}
export type HouseStateData = LevelStateData & {
    wall: 'default' | 'fancy',
    floor: 'default' | 'fancy',
}

export type TaskStateData = {
    tomNook: number,
}
export type StartGameData = {
    startingSpawn: { x: number, y: number }
}

export function defaultGameData(playerName, startingSpawn) : GameStateData {
    playerName = playerName || 'Player';
    return {
        lastDroppedItemUid: 0,
        bells: 0,
        playerName,
        levels: [{
            name: 'home',
            isHome: true,
            droppableItems: [ItemTypes.FURNITURE, ItemTypes.RESOURCE],
            state: {
                items: [],
                wall: 'default',
                floor: 'default',
            }
        }, {
            name: 'island',
            droppableItems: [ItemTypes.FURNITURE, ItemTypes.RESOURCE, ItemTypes.TREE],
            state: {
                items: [],
                holes: [],
            }
        }],
        house: { wall: 'default', floor: 'default', items: [] },
        task: { tomNook: 0 },
        level: startingSpawn.level,
        direction: 'south',
        position: {
            x: startingSpawn.x,
            y: startingSpawn.y
        },
        inventory: []
    }
}

export type InventoryItem = {
    index: number,
    name: string,
    quantity: number,
}
export type GameStateData = {
    lastDroppedItemUid: number,
    bells: number,
    playerName: string,
    house: HouseStateData,
    levels: Array<LevelData>,
    task: TaskStateData,
    position: {x:number,y:number},
    level: string,
    direction: string,
    inventory: Array<InventoryItem>
}

export type PlayerInput = {
    action: boolean,
    hotkeyIndex: number,
    mouseX: number,
    mouseY: number,
    mouseDown: boolean,
    aimAngle: number,
    moveUp: boolean,
    moveDown: boolean,
    moveLeft: boolean,
    moveRight: boolean,
    inventory: boolean,
    sprint: boolean,
    grab: boolean,
}

export enum BugTypes {
    BEE,
    BUTTERFLY,
}

export type BugData = {
    speed: number,
    name: string,
    spawnProbability: number,
}

export enum EntityTypes {
    ClientPlayer,
    RemotePlayer,
    NPC,
    Tree,
    DroppedItem,
    Bug,
}

export enum NPC_TYPES {
    Neighbor,
    Townperson,
    Mayor,
}

export type PlayerDirections = 'north' | 'east' | 'south' | 'west';
export type PlayerActions = 'walk' | 'idle' | 'swing' | 'fish' | 'water' | 'pull';
export const GameValues = {
    PlayerSpeed:  100,
    PlayerDirections: {
        east: 'east',
        west: 'west',
        north: 'north',
        south: 'south'
    },
    InventorySlots: 50,
}