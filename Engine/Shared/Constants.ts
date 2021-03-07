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
    BUG_MOVEMENT,
    BUG_CATCH,
    BEE_KEEP,
}

export enum MESSAGES {
    INITIAL_MAP_LOADED,
    CLIENT_PLAYER_ENTITY_INITIALIZED,
    DROP_ITEM,
    REMOVE_DROPPED_ITEM,
    INVENTORY_ERROR,
    NEW_FLOWER,
}

export enum COLLIDER_TAGS {
    flower='flower',
    bug='bug',
    blocking='blocking',
    sort='sort',
    tree='tree',
    tree_stump='tree_stump',
    client_player='client_player',
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