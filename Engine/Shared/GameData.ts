import {GameData, GameStateData, GlobalItemData, ItemTypes} from "./types";
import {SeedData} from "./Constants";

const BedFurnitureData : GlobalItemData = {
    type: ItemTypes.FURNITURE,
    shop: {
        shopPrice: 1000,
        sellPrice: 500,
    }
}

const ToolData : GlobalItemData = {
    type: ItemTypes.TOOL,
}

const SeedInventoryData : GlobalItemData = {
    type: ItemTypes.PLANTABLE,
}

const DropArray = ['drop'];

export const ItemTypeInventoryActionLookup = {
    [ItemTypes.TOOL]: ['equip'],
    [ItemTypes.RESOURCE]: DropArray,
    [ItemTypes.BUG]: DropArray,
    [ItemTypes.FURNITURE]: DropArray,
    [ItemTypes.PLANTABLE]: ['drop', 'plant'],
    [ItemTypes.TREE]: [],
}


export const PlatableGameData : {[seedName: string]: SeedData } = {
    'seed1': {
        flower: 'flower1',
        timeToGrow: 100,
        beeFactor: 1,
        spawnRate: 10000,
    },
    'seed2': {
        flower: 'flower2',
        timeToGrow: 150,
        beeFactor: 1.5,
        spawnRate: 15000,
    },
    'seed3': {
        flower: 'flower3',
        timeToGrow: 500,
        beeFactor: 5,
        spawnRate: 25000,
    },
    'seed4': {
        flower: 'flower4',
        timeToGrow: 1000,
        beeFactor: 10,
        spawnRate: 50000,
    },
    'seed5': {
        flower: 'flower4',
        timeToGrow: 1500,
        beeFactor: 15,
        spawnRate: 55000,
    }
}


export const START_POSITIONS = {
    nomTook: { x: 1030, y: 550, direction: 'south'},
    player: { x: 1030, y: 750, direction: 'north' }
}

export const TOM_NOOK_SHOP_POSITION = { x: 1000, y: 970 };

export const NOM_TOOK_WALK_TO_YOU = { x: 1030, y: 715, direction: 'south'};

export const WALK_TO_HOUSE_PATHS = {
    player: [
        { x: 1060, y: 750, direction: 'east' }, // move out of nom's way
        { x: 1030, y: 750, direction: 'west' }, // get back behind nom
        { x: 1030, y: 950, direction: 'south' }, // follow nom
        { x: 1060, y: 950, direction: 'east' }, // get out of noms way again
        { x: 1060, y: 1000, direction: 'south' }, // go below nom
        { x: 1030, y: 1000, direction: 'west' }, // go back in front of nom
        { x: 1030, y: 1000, direction: 'north'} // look at nom.
    ],
    nomTook: [{ x: 1030, y: 970, direction: 'south' }],
}

const FlowerItemData = {
    type: ItemTypes.FLOWER,
}

export const GlobalGameData : GameData = {
    items: {
        'butterfly': {
            type: ItemTypes.BUG,
            shop: {
                sellPrice: 1500,
            },
        },
        'bee': {
            type: ItemTypes.BUG,
            shop: {
                sellPrice: 1500,
            },
        },
        'net': ToolData,
        'axe': ToolData,
        'red_bed': BedFurnitureData,
        'blue_bed': BedFurnitureData,
        'green_bed': BedFurnitureData,
        'seeds1': SeedInventoryData,
        'seeds2': SeedInventoryData,
        'seeds3': SeedInventoryData,
        'seeds4': SeedInventoryData,
        'pedals1': {
            type: ItemTypes.RESOURCE,
            shop: {
                sellPrice: 100,
            }
        },
        'pedals2': {
            type: ItemTypes.RESOURCE,
            shop: {
                sellPrice: 150,
            }
        },
        'pedals3': {
            type: ItemTypes.RESOURCE,
            shop: {
                sellPrice: 250,
            }
        },
        'pedals4': {
            type: ItemTypes.RESOURCE,
            shop: {
                sellPrice: 500,
            }
        },
        'pedals5': {
            type: ItemTypes.RESOURCE,
            shop: {
                sellPrice: 1000,
            }
        },
        'flower1': FlowerItemData,
        'flower2': FlowerItemData,
        'flower3': FlowerItemData,
        'flower4': FlowerItemData,
        'flower5': FlowerItemData,
    }
}

export function defaultGameData(playerName) : GameStateData {
    playerName = playerName || 'Player';
    return {
        totalElapsedTime: 0,
        lastUid: 0,
        honey: 0,
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
        npcData: {
            nomTook: {
                level: 'island',
                position: { x: START_POSITIONS.nomTook.x, y: START_POSITIONS.nomTook.y },
                task: 0,
                direction: 'south'
            },
            honeyBear: {
                level: 'island',
                position: { x: START_POSITIONS.nomTook.x, y: START_POSITIONS.nomTook.y },
                task: 0,
                direction: 'south'
            }
        },
        level: 'island',
        direction: START_POSITIONS.player.direction,
        position: {
            x:  START_POSITIONS.player.x,
            y: START_POSITIONS.player.y,
        },
        inventory: []
    }
}