import {GameData, GlobalItemData, ItemTypes} from "./types";
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

const ItemTypeInventoryActionLookup = {
    [ItemTypes.TOOL]: ['equip', 'drop'],
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
