"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIRECTION_INDEX_DATA = exports.PLAYER_EVENTS = exports.COLLIDER_TAGS = exports.MESSAGES = exports.SYSTEMS = void 0;
var SYSTEMS;
(function (SYSTEMS) {
    SYSTEMS[SYSTEMS["PLAYER_ACTION"] = 0] = "PLAYER_ACTION";
    SYSTEMS[SYSTEMS["PLAYER_MOVEMENT"] = 1] = "PLAYER_MOVEMENT";
    SYSTEMS[SYSTEMS["PLAYER_ANIMATION"] = 2] = "PLAYER_ANIMATION";
    SYSTEMS[SYSTEMS["PLAYER_MANAGER"] = 3] = "PLAYER_MANAGER";
    SYSTEMS[SYSTEMS["NPC_MOVEMENT"] = 4] = "NPC_MOVEMENT";
    SYSTEMS[SYSTEMS["POSITION"] = 5] = "POSITION";
    SYSTEMS[SYSTEMS["INPUT"] = 6] = "INPUT";
    SYSTEMS[SYSTEMS["PATHFINDING"] = 7] = "PATHFINDING";
    SYSTEMS[SYSTEMS["TIMER"] = 8] = "TIMER";
    SYSTEMS[SYSTEMS["TREE"] = 9] = "TREE";
    SYSTEMS[SYSTEMS["LEVEL"] = 10] = "LEVEL";
    SYSTEMS[SYSTEMS["INVENTORY"] = 11] = "INVENTORY";
    SYSTEMS[SYSTEMS["ITEM_DROP"] = 12] = "ITEM_DROP";
    SYSTEMS[SYSTEMS["DIALOGUE"] = 13] = "DIALOGUE";
    SYSTEMS[SYSTEMS["GAME_STATE"] = 14] = "GAME_STATE";
})(SYSTEMS = exports.SYSTEMS || (exports.SYSTEMS = {}));
var MESSAGES;
(function (MESSAGES) {
    MESSAGES[MESSAGES["INITIAL_MAP_LOADED"] = 0] = "INITIAL_MAP_LOADED";
    MESSAGES[MESSAGES["CLIENT_PLAYER_ENTITY_INITIALIZED"] = 1] = "CLIENT_PLAYER_ENTITY_INITIALIZED";
    MESSAGES[MESSAGES["DROP_ITEM"] = 2] = "DROP_ITEM";
    MESSAGES[MESSAGES["REMOVE_DROPPED_ITEM"] = 3] = "REMOVE_DROPPED_ITEM";
})(MESSAGES = exports.MESSAGES || (exports.MESSAGES = {}));
var COLLIDER_TAGS;
(function (COLLIDER_TAGS) {
    COLLIDER_TAGS["blocking"] = "blocking";
    COLLIDER_TAGS["sort"] = "sort";
    COLLIDER_TAGS["tree"] = "tree";
    COLLIDER_TAGS["tree_stump"] = "tree_stump";
    COLLIDER_TAGS["client_player"] = "client_player";
    COLLIDER_TAGS["player"] = "player";
    COLLIDER_TAGS["dropped_item"] = "dropped_item";
    COLLIDER_TAGS["npc"] = "npc";
    COLLIDER_TAGS["water"] = "water";
})(COLLIDER_TAGS = exports.COLLIDER_TAGS || (exports.COLLIDER_TAGS = {}));
var PLAYER_EVENTS;
(function (PLAYER_EVENTS) {
    PLAYER_EVENTS["INVENTORY_CHANGE"] = "inventory_change";
})(PLAYER_EVENTS = exports.PLAYER_EVENTS || (exports.PLAYER_EVENTS = {}));
exports.DIRECTION_INDEX_DATA = {
    DIRECTIONS_NAMES: ["east", "north", "west", "south"],
    NAMES_TO_INDEX: {
        "east": 0,
        "north": 1,
        "west": 2,
        "south": 3,
    },
    ROTATIONS: [180, 90, 0, 270]
};
