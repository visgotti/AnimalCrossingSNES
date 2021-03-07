"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameValues = exports.NPC_TYPES = exports.EntityTypes = exports.BugTypes = exports.defaultGameData = exports.ItemTypes = void 0;
var ItemTypes;
(function (ItemTypes) {
    ItemTypes[ItemTypes["TOOL"] = 0] = "TOOL";
    ItemTypes[ItemTypes["TREE"] = 1] = "TREE";
    ItemTypes[ItemTypes["FLOWER"] = 2] = "FLOWER";
    ItemTypes[ItemTypes["BUG"] = 3] = "BUG";
    ItemTypes[ItemTypes["FURNITURE"] = 4] = "FURNITURE";
    ItemTypes[ItemTypes["RESOURCE"] = 5] = "RESOURCE";
    ItemTypes[ItemTypes["PLANTABLE"] = 6] = "PLANTABLE";
})(ItemTypes = exports.ItemTypes || (exports.ItemTypes = {}));
function defaultGameData(playerName, startingSpawn) {
    playerName = playerName || 'Player';
    return {
        totalElapsedTime: 0,
        lastUid: 0,
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
    };
}
exports.defaultGameData = defaultGameData;
var BugTypes;
(function (BugTypes) {
    BugTypes["BEE"] = "bee";
    BugTypes["BUTTERFLY"] = "butterfly";
})(BugTypes = exports.BugTypes || (exports.BugTypes = {}));
var EntityTypes;
(function (EntityTypes) {
    EntityTypes[EntityTypes["ClientPlayer"] = 0] = "ClientPlayer";
    EntityTypes[EntityTypes["RemotePlayer"] = 1] = "RemotePlayer";
    EntityTypes[EntityTypes["NPC"] = 2] = "NPC";
    EntityTypes[EntityTypes["Tree"] = 3] = "Tree";
    EntityTypes[EntityTypes["DroppedItem"] = 4] = "DroppedItem";
    EntityTypes[EntityTypes["Bug"] = 5] = "Bug";
})(EntityTypes = exports.EntityTypes || (exports.EntityTypes = {}));
var NPC_TYPES;
(function (NPC_TYPES) {
    NPC_TYPES[NPC_TYPES["Neighbor"] = 0] = "Neighbor";
    NPC_TYPES[NPC_TYPES["Townperson"] = 1] = "Townperson";
    NPC_TYPES[NPC_TYPES["Mayor"] = 2] = "Mayor";
})(NPC_TYPES = exports.NPC_TYPES || (exports.NPC_TYPES = {}));
exports.GameValues = {
    PlayerSpeed: 100,
    PlayerDirections: {
        east: 'east',
        west: 'west',
        north: 'north',
        south: 'south'
    },
    InventorySlots: 50,
};
