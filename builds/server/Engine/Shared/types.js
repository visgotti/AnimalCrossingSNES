"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameValues = exports.NPC_TYPES = exports.EntityTypes = exports.BugTypes = exports.ItemTypes = void 0;
var ItemTypes;
(function (ItemTypes) {
    ItemTypes["TOOL"] = "tool";
    ItemTypes["TREE"] = "tree";
    ItemTypes["FLOWER"] = "flower";
    ItemTypes["BUG"] = "bug";
    ItemTypes["FURNITURE"] = "furniture";
    ItemTypes["RESOURCE"] = "resource";
    ItemTypes["PLANTABLE"] = "plantable";
})(ItemTypes = exports.ItemTypes || (exports.ItemTypes = {}));
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
    NPC_TYPES[NPC_TYPES["NomTook"] = 0] = "NomTook";
    NPC_TYPES[NPC_TYPES["Neighbor"] = 1] = "Neighbor";
    NPC_TYPES[NPC_TYPES["Townperson"] = 2] = "Townperson";
    NPC_TYPES[NPC_TYPES["Mayor"] = 3] = "Mayor";
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
