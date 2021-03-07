"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalGameData = exports.PlatableGameData = void 0;
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
const ItemTypeInventoryActionLookup = {
    [types_1.ItemTypes.TOOL]: ['equip', 'drop'],
    [types_1.ItemTypes.RESOURCE]: DropArray,
    [types_1.ItemTypes.BUG]: DropArray,
    [types_1.ItemTypes.FURNITURE]: DropArray,
    [types_1.ItemTypes.PLANTABLE]: ['drop', 'plant'],
    [types_1.ItemTypes.TREE]: [],
};
exports.PlatableGameData = {
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
