"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultGameData = exports.GlobalGameData = exports.WALK_TO_HOUSE_PATHS = exports.NOM_TOOK_WALK_TO_YOU = exports.TOM_NOOK_SHOP_POSITION = exports.START_POSITIONS = exports.PlatableGameData = exports.ItemTypeInventoryActionLookup = void 0;
const types_1 = require("./types");
const BedFurnitureData = {
    type: types_1.ItemTypes.FURNITURE,
    shop: {
        shopPrice: 1000,
        sellPrice: 500,
    }
};
const ToolData = {
    type: types_1.ItemTypes.TOOL,
};
const SeedInventoryData = {
    type: types_1.ItemTypes.PLANTABLE,
};
const DropArray = ['drop'];
exports.ItemTypeInventoryActionLookup = {
    [types_1.ItemTypes.TOOL]: ['equip'],
    [types_1.ItemTypes.RESOURCE]: DropArray,
    [types_1.ItemTypes.BUG]: DropArray,
    [types_1.ItemTypes.FURNITURE]: DropArray,
    [types_1.ItemTypes.PLANTABLE]: ['drop', 'plant'],
    [types_1.ItemTypes.TREE]: [],
};
exports.PlatableGameData = {
    'seeds1': {
        flower: 'flower1',
        timeToGrow: 100,
        beeFactor: 1,
        spawnRate: 10000,
    },
    'seeds2': {
        flower: 'flower2',
        timeToGrow: 150,
        beeFactor: 1.5,
        spawnRate: 15000,
    },
    'seeds3': {
        flower: 'flower3',
        timeToGrow: 500,
        beeFactor: 5,
        spawnRate: 25000,
    },
    'seeds4': {
        flower: 'flower4',
        timeToGrow: 1000,
        beeFactor: 10,
        spawnRate: 50000,
    },
};
exports.START_POSITIONS = {
    nomTook: { x: 1030, y: 550, direction: 'south' },
    player: { x: 1030, y: 750, direction: 'north' }
};
exports.TOM_NOOK_SHOP_POSITION = { x: 1000, y: 970 };
exports.NOM_TOOK_WALK_TO_YOU = { x: 1030, y: 715, direction: 'south' };
exports.WALK_TO_HOUSE_PATHS = {
    player: [
        { x: 1060, y: 750, direction: 'east' },
        { x: 1030, y: 750, direction: 'west' },
        { x: 1030, y: 950, direction: 'south' },
        { x: 1060, y: 950, direction: 'east' },
        { x: 1060, y: 1000, direction: 'south' },
        { x: 1030, y: 1000, direction: 'west' },
        { x: 1030, y: 1000, direction: 'north' } // look at nom.
    ],
    nomTook: [{ x: 1030, y: 970, direction: 'south' }],
};
const FlowerItemData = {
    type: types_1.ItemTypes.FLOWER,
};
exports.GlobalGameData = {
    items: {
        'butterfly': {
            type: types_1.ItemTypes.BUG,
            shop: {
                sellPrice: 1500,
            },
        },
        'bee': {
            type: types_1.ItemTypes.BUG,
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
            type: types_1.ItemTypes.RESOURCE,
            shop: {
                sellPrice: 100,
            }
        },
        'pedals2': {
            type: types_1.ItemTypes.RESOURCE,
            shop: {
                sellPrice: 150,
            }
        },
        'pedals3': {
            type: types_1.ItemTypes.RESOURCE,
            shop: {
                sellPrice: 250,
            }
        },
        'pedals4': {
            type: types_1.ItemTypes.RESOURCE,
            shop: {
                sellPrice: 500,
            }
        },
        'pedals5': {
            type: types_1.ItemTypes.RESOURCE,
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
};
function defaultGameData(playerName) {
    playerName = playerName || 'Player';
    return {
        totalElapsedTime: 0,
        lastUid: 0,
        honey: 0,
        playerName,
        levels: [{
                name: 'home',
                isHome: true,
                droppableItems: [types_1.ItemTypes.FURNITURE, types_1.ItemTypes.RESOURCE],
                state: {
                    items: [],
                    wall: 'default',
                    floor: 'default',
                }
            }, {
                name: 'island',
                droppableItems: [types_1.ItemTypes.FURNITURE, types_1.ItemTypes.RESOURCE, types_1.ItemTypes.TREE],
                state: {
                    items: [],
                    holes: [],
                }
            }],
        house: { wall: 'default', floor: 'default', items: [] },
        npcData: {
            nomTook: {
                level: 'island',
                position: { x: exports.START_POSITIONS.nomTook.x, y: exports.START_POSITIONS.nomTook.y },
                task: 0,
                direction: 'south'
            },
            honeyBear: {
                level: 'island',
                position: { x: exports.START_POSITIONS.nomTook.x, y: exports.START_POSITIONS.nomTook.y },
                task: 0,
                direction: 'south'
            }
        },
        level: 'island',
        direction: exports.START_POSITIONS.player.direction,
        position: {
            x: exports.START_POSITIONS.player.x,
            y: exports.START_POSITIONS.player.y,
        },
        inventory: []
    };
}
exports.defaultGameData = defaultGameData;
