export enum SYSTEMS {
    PLAYER_ACTION,
    PLAYER_MOVEMENT,
    PLAYER_ANIMATION,
    PLAYER_MANAGER,
    NPC_MOVEMENT,
    POSITION,
    INPUT,
    PATHFINDING,
    TIMER,
    TREE,
    LEVEL,
    INVENTORY,
    ITEM_DROP,
    DIALOGUE,
    GAME_STATE,
    FLOWER,
    BUG_SPAWN,
    BUG_MOVEMENT_AND_ANIMATION,
    BUG_CATCH,
    BEE_KEEP,
    DIG,
    NPC,
    HOUSE,
}
export type SeedData = {
    flower: string,
    timeToGrow: number,
    beeFactor: number,
    spawnRate: number
}
export enum MESSAGES {
    PLACE_FURNITURE,
    REMOVE_FURNITURE,
    ADDED_INVENTORY_ITEM,
    REMOVED_INVENTORY_ITEM,
    FINISHED_TUTORIAL,
    FINISH_NPC_TASK,
    GAME_STATE_INITIALIZED,
    INITIAL_MAP_LOADED,
    CLIENT_PLAYER_ENTITY_INITIALIZED,
    DROP_ITEM,
    PICKUP_ITEM,
    EQUIP_ITEM,
    USE_ITEM,
    REMOVE_DROPPED_ITEM,
    INVENTORY_ERROR,
    NEW_FLOWER,
    PLANTED_TREE,
    REMOVED_TREE,
    REMOVED_FLOWER,
    FLOWER_FULLY_GROWN,
    SPAWNED_BUG,
    REMOVED_BUG,
    START_TIMERS,
    ADDED_HOLE,
    REMOVED_HOLE,
}

export enum COLLIDER_TAGS {
    hole='hole',
    flower='flower',
    bug='bug',
    blocking='blocking',
    sort='sort',
    tree='tree',
    tree_stump='tree_stump',
    client_player='client_player',
    in_front_of_client_player='in_front_of_client_player',
    client_player_bug_detector='client_player_bug_detector',
    player='player',
    dropped_item='dropped_item',
    npc='npc',
    water='water',
}
export enum PLAYER_EVENTS {
    INVENTORY_CHANGE = 'inventory_change'
}
export const DIRECTION_INDEX_DATA = {
    DIRECTIONS_NAMES: ["east", "north", "west", "south"],
    NAMES_TO_INDEX: {
        "east": 0,
        "north": 1,
        "west": 2,
        "south": 3,
    },
    ROTATIONS: [180, 90, 0, 270]
};