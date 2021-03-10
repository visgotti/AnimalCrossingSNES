
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

export type FlowerState = {
    plantedByPlayer: boolean,
    elapsedTimeAlive : number;
}

export type FlowerTypes ='flower1' | 'flower2' | 'flower3' | 'flower4';

export enum ItemTypes {
    TOOL='tool',
    TREE='tree',
    FLOWER='flower',
    BUG='bug',
    FURNITURE='furniture',
    RESOURCE='resource',
    PLANTABLE='plantable',
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
    items: Array<DroppedItemData<FurnitureState | TreeState | BugState | FlowerState>>,
    [prop: string]: any,
}
export type IslandStateData = LevelStateData & {
    holes: Array<{ x: number, y: number }>,
}
export type HouseStateData = LevelStateData & {
    wall: 'default' | 'fancy',
    floor: 'default' | 'fancy',
}

export type GameData = {
    items: {[itemName: string]: GlobalItemData },
}

export type NPCStateData = {
    task?: number,
    level: string,
    position: { x: number, y: number },
    direction: string,
}

export type StartGameData = {
    startingSpawn: { x: number, y: number }
}

export type ItemTypeData = {}


export type ItemActions = 'equip' | 'drop' | 'sell' | 'plant'


export type ItemShopData = {
    shopPrice?: number,
    sellPrice?: number,
}
export type GlobalItemData = {
    type: ItemTypes,
    shop?: ItemShopData
}
export type InventoryItem = {
    index: number,
    name: string,
    quantity: number,
}
export type GameStateData = {
    totalElapsedTime: number,
    lastUid: number,
    honey: number,
    playerName: string,
    house: HouseStateData,
    levels: Array<LevelData>,
    npcData: {
        nomTook: NPCStateData,
        honeyBear: NPCStateData,
    },
    position: {x:number,y:number},
    level: string,
    direction: string,
    inventory: Array<InventoryItem>
}

export type InventoryTextures = {
    background: PIXI.Texture,
    contextMenu: {
        background: PIXI.Texture,
        selectedBackground: PIXI.Texture,
        pointer: PIXI.Texture,
    },
    item: {
        emptyBackground: PIXI.Texture,
        selectedBackground: PIXI.Texture,
        pointer: PIXI.Texture,
    }
}

export type DialogueInterface = {
    npc: {
        nameLabel: PIXI.Texture,
        diaglogueBackground: PIXI.Texture,
        continueIndicator: PIXI.Texture,
    },
    response: {
        background: PIXI.Texture,
        selectedOptionBackground: PIXI.Texture,
        pointer: PIXI.Texture,
    }
}

export type ItemTextures = {
    net: PIXI.Texture,
    shovel: PIXI.Texture,
    pedals1: PIXI.Texture,
    pedals2: PIXI.Texture,
    pedals3: PIXI.Texture,
    pedals4: PIXI.Texture,
    tree: PIXI.Texture,
    seeds1: PIXI.Texture,
    seeds2: PIXI.Texture,
    seeds3: PIXI.Texture,
    seeds4: PIXI.Texture,
    flower1: PIXI.Texture,
    flower2: PIXI.Texture,
    flower3: PIXI.Texture,
    flower4: PIXI.Texture,
    planted: PIXI.Texture,
    sapling: PIXI.Texture,
    beehive: PIXI.Texture,
    hole: PIXI.Texture,
    bee: PIXI.Texture,
    red_bed: PIXI.Texture,
    blue_bed: PIXI.Texture,
    green_bed: PIXI.Texture,
}

export type GameTextures = {
    dialogue: DialogueInterface,
    inventory: InventoryTextures,
    honey: PIXI.Texture,
    items: { icons: ItemTextures, placed: ItemTextures },
    animations: {
        bugs: {
            bee: Array<PIXI.Texture>,
        }
    }
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
    cancel: boolean,
    escape: boolean,
}

export enum BugTypes {
    BEE='bee',
    BUTTERFLY='butterfly',
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
    NomTook,
    Neighbor,
    Townperson,
    Mayor,
}

export type PlayerDirections = 'north' | 'east' | 'south' | 'west';
export type PlayerActions = 'walk' | 'idle' | 'swing';
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