import { GameTextures, InventoryTextures, StartGameData} from "../../Shared/types";

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
import * as World from '../lib/tileyo.js';
import DebugColliderPlugin from '../lib/TileYoPlugins/DebugPlugin.js';
World.use(DebugColliderPlugin);
import { Gottimation } from "../lib/Gottimation/Runtime/Gottimation";
import {GridPathFinder} from "../lib/Pathfinder";
const resolutionSettings = {
    dynamicResolution: true,
    maxView: {
        w: 550,
        h: 350,
    },
}
import { NPCSystem } from "../Systems/NPC/System";
import { KeyboardInputSystem } from "../Systems/Input/System";
import { PathfindingSystem } from "../Systems/PathFinding/System";
import { PlayerAnimationSystem } from "../Systems/PlayerAnimation/System";
import { PlayerMovementSystem } from "../Systems/PlayerMovement/System";
import { PlayerManagerSystem } from "../Systems/PlayerManager/System";
import { PlayerActionSystem } from "../Systems/PlayerAction/System";
import { TimerSystem } from '../Systems/Timers/System';
import { TreeSystem } from "../Systems/Tree/System";
import { LevelSystem } from "../Systems/Level/System";
import { InventorySystem } from "../Systems/Inventory/System";
import { ItemDropSystem } from '../Systems/ItemDrop/System';
import {DialogueSystem} from "../Systems/Dialogue/System";
import { NPCMovementSystem } from "../Systems/NPCMovement/System";
import {GameStateSystem} from "../Systems/GameState/System";
import { BugCatchSystem } from "../Systems/BugCatch/System";
import { BugMovementSystem } from "../Systems/BugMovementAndAnimation/System";
import { BugSpawnSystem } from "../Systems/BugSpawn/System";
import { BeeKeepSystem } from "../Systems/BeeKeep/System";
import { FlowerSystem } from "../Systems/Flower/System";
import { DigSystem } from "../Systems/Dig/System";

import Gotti from 'gotti';
import {getRandomNumber} from "../../Shared/Utils";
import GottiGameInput from "../lib/GottiGameInput";
import {defaultGameData} from "../../Shared/GameData";
export default {
    isNetworked: false,
    type: 'island',
    systems: [
        GameStateSystem,
        InventorySystem,
        KeyboardInputSystem,
        LevelSystem,
        PlayerActionSystem,
        PlayerManagerSystem,
        PathfindingSystem,
        PlayerAnimationSystem,
        PlayerMovementSystem,
        NPCSystem,
        TimerSystem,
        TreeSystem,
        NPCMovementSystem,
        ItemDropSystem,
        DialogueSystem,
        BugCatchSystem,
        BugMovementSystem,
        BugSpawnSystem,
        BeeKeepSystem,
        FlowerSystem,
        DigSystem,
    ],
    plugins: [],
    areas: [],
    async globals(gameData, areaData, client) {
        // if you add a new action here, youll probably need to edit the code in Input / System.ts -> resetState() -> add the new action string to the hard coded array.
        const gameInput = new GottiGameInput({
            keyboard: {
                'moveDown':  ["KeyS", "ArrowDown"],
                'moveUp':  ["KeyW", "ArrowUp"],
                'moveLeft':  ["KeyA", "ArrowLeft"],
                'moveRight':  ["KeyD", "ArrowRight"],
                'inventory': ["KeyQ", "KeyShift"],
                "grab": ["Space", "KeyG", "Enter"],
                'cancel': ['Backspace', 'Delete'],
                'pause': ['Escape'],
            },
            controller: {
                default: {
                    buttons: {
                        'north': 'inventory',
                        'east': 'cancel',
                        'south': 'grab',
                        'select': 'inventory',
                        'start': 'pause',
                    },
                    dpad: {
                        south: 'moveDown',
                        west: 'moveLeft',
                        east: 'moveRight',
                        north: 'moveUp'
                    },
                    sticks: {
                        left: {
                            'moveLeft': {min: 225-22.5, max: 315+22.5 },
                            'moveRight': {min: 45-22.5, max: 135+22.5},
                            'moveDown': { min: 135-22.5, max: 225+22.5 },
                            'moveUp': [{ min:315-22.5, max: 360 }, { min: 0, max: 45+22.5 }]
                        },
                        right: {
                            'moveLeft': {min: 225-22.5, max: 315+22.5 },
                            'moveRight': {min: 45-22.5, max: 135+22.5},
                            'moveDown': { min: 135-22.5, max: 225+22.5 },
                            'moveUp': [{ min:315-22.5, max: 360 }, { min: 0, max: 45+22.5 }]
                        }
                    }
                }
            },
        });
        Gotti.emit('game-input', gameInput);

        let song;
        const tryPlaySong = async () => {
            try {
                song = new Audio('Assets/music/Animal_Crossing_SNES.mp3');
                await song.play();
                song.loop = true;
            } catch(err) {
                song = null;
                setTimeout(() => {
                    tryPlaySong();
                }, 200)
            }
        }
        // tryPlaySong();

        const canvas = document.getElementById("game-canvas")
        canvas.style.opacity = `1`;
        const fadeIn = async () => {
            const prev = parseFloat(canvas.style.opacity);
            const next = Math.min(prev + .01, 1);
            canvas.style.opacity = `${next}`;
            if(next < 1) {
                if(prev <= .5 && next >= .5) {
                    Gotti.emit('faded-in-halfway', true)
                }
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        return resolve(fadeIn());
                    }, 1000/60);
                });
            }
            return true;
        }
        let l = false;
        const fadeOut = async (step=.01) => {
            canvas.style.opacity = `${Math.max(parseFloat(canvas.style.opacity) - step, 0)}`;
            if(parseFloat(canvas.style.opacity) > 0) {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        return resolve(fadeOut());
                    }, 1000/60);
                });
            }
            return true;
        }
        const renderer = initializeRenderer();
        const tileWorld = await World.init(`Assets/ac`, renderer, { resolutionSettings });
        await tileWorld.loadMap('island');
        setTimeout(() => {
            Gotti.emit('initial-map-load', true);
        }, 200)
        tileWorld.resolutionManager.calculate();
        let startingSpawn = { x: 984, y: 1020, level: 'island' };
        try {
            startingSpawn = { ...tileWorld.getCollidersWithTags('start')[0].shapeData, level: 'island' }
        } catch(err) {
            console.error(`Error trying to get the collider for starting spawn: ${err}`)
        }
        const startPan = getRandomNumber(900, 1100);
        const panCameraPosition = { x: startPan , y: startPan }
        tileWorld.bindCameraCenter(panCameraPosition);
        tileWorld.update(1);

        const gottimation = await Gottimation.Init(`Assets/acsnes`, {lazyLoadTextures: true, renderer, preloadAtlasDefaults: true }, tileWorld.loader);
        const pathfinder = new GridPathFinder();
        const res = await loadSpritesAndData();
        pathfinder.create(16, 1024/16, 1024/16);
        const textures = res['actextures'].textures;
        const inventoryTextures : InventoryTextures = {
            background: textures['inventory_background.png'],
            contextMenu: {
                background: textures['context_menu_background.png'],
                selectedBackground: textures['context_menu_selected_option_background.png'],
                pointer: textures['context_menu_pointer.png'],
            },
            item: {
                emptyBackground: textures['unselected_inventory_icon.png'],
                pointer: textures['inventory_pointer.png'],
                selectedBackground: textures['selected_inventory_icon.png']
            }
        }
        const gameTextures : GameTextures = {
            animations: {
                bugs: {
                    bee: [textures['bee1.png'], textures['bee2.png']]
                }
            },
            honey: textures['honey_icon.png'],
            dialogue: {
                npc: {
                    nameLabel: textures['dialogue_name_background.png'],
                    diaglogueBackground: textures['dialogue_background.png'],
                    continueIndicator: textures['dialogue_name_background.png'],
                },
                response: {
                    background:textures['context_menu_background.png'],
                    selectedOptionBackground: textures['context_menu_selected_option_background.png'],
                    pointer:  textures['context_menu_pointer.png'],
                }
            },
            inventory: inventoryTextures,
            items: {
                icons: {
                    net: textures['net_icon.png'],
                    shovel: textures['shovel_icon.png'],
                    hole: textures['hole_dug_up.png'],
                    tree: textures['tree.png'],
                    seeds1: textures['item0_seeds1.png'],
                    seeds2: textures['item0_seeds2.png'],
                    seeds3: textures['item0_seeds3.png'],
                    seeds4: textures['item0_seeds4.png'],
                    pedals1: textures['flower_pedals1.png'],
                    pedals2: textures['flower_pedals2.png'],
                    pedals3: textures['flower_pedals3.png'],
                    pedals4: textures['flower_pedals4.png'],
                    flower1: textures['flower1.png'],
                    flower2: textures['flower2.png'],
                    flower3: textures['flower3.png'],
                    flower4: textures['flower4.png'],
                    beehive: textures['beehive.png'],
                    sapling: textures['sapling.png'],
                    planted: textures['just_planted_seeds.png'],
                    bee: textures['bee.png'],
                    red_bed: textures['items5_bed1.png'],
                    green_bed: textures['items6_bed2.png'],
                    blue_bed: textures['items7_bed3.png']
                },
                placed: {
                    net: textures['net_icon.png'],
                    shovel: textures['shovel_icon.png'],
                    hole: textures['hole_dug_up.png'],
                    tree: textures['tree.png'],
                    seeds1: textures['item0_seeds1.png'],
                    seeds2: textures['item0_seeds2.png'],
                    seeds3: textures['item0_seeds3.png'],
                    seeds4: textures['item0_seeds4.png'],
                    sapling: textures['sapling.png'],
                    planted: textures['just_planted_seeds.png'],
                    pedals1: textures['flower_pedals1.png'],
                    pedals2: textures['flower_pedals2.png'],
                    pedals3: textures['flower_pedals3.png'],
                    pedals4: textures['flower_pedals4.png'],
                    flower1: textures['flower1.png'],
                    flower2: textures['flower2.png'],
                    flower3: textures['flower3.png'],
                    flower4: textures['flower4.png'],
                    beehive: textures['beehive.png'],
                    bee: textures['bee.png'],
                    red_bed: textures['placeable_bed1.png'],
                    green_bed: textures['placeable_bed2.png'],
                    blue_bed: textures['placeable_bed3.png']
                }
            }
        }

        let panningRight = true;
        let panningDown = true;

        let panSpeed = 30;


        let last = 0;
        const pan = () => {
            last = last || Date.now();
            const now = Date.now();
            const delta = (now-last)/1000;
            last = now;
            if(panningRight) {
                panCameraPosition.x += delta*panSpeed;
                if(panCameraPosition.x > 1600) {
                    panningRight = false;
                }
            } else {
                panCameraPosition.x -= delta*panSpeed;
                if(panCameraPosition.x < 350) {
                    panningRight = true;
                }
            }
            if(panningDown) {
                panCameraPosition.y += delta*panSpeed;
                if(panCameraPosition.x > 1600) {
                    panningDown = false;
                }
            } else {
                panCameraPosition.y -= delta*panSpeed;
                if(panCameraPosition.y < 350) {
                    panningDown = true;
                }
            }
            panCameraPosition.x = Math.round(panCameraPosition.x);
            panCameraPosition.y = Math.round(panCameraPosition.y);
            tileWorld.update(delta);
            aniFrame = requestAnimationFrame(pan);
        }
        let aniFrame = requestAnimationFrame(pan);

        const startData : StartGameData = { startingSpawn };
        Gotti.emit('initial-map-load', startData);

        return new Promise((resolve, reject) => {
            Gotti.once('player-enter', async (payload: { isNew: boolean, data: any }) => {
                await fadeOut(.005);
                cancelAnimationFrame(aniFrame);
                let gameStateData;
                if(payload.isNew) {
                    gameStateData = defaultGameData(payload.data);
                } else {
                    gameStateData = payload.data;
                }
                if(gameStateData.level !== "main") {
                    await tileWorld.loadMap(gameStateData.level);
                    tileWorld.bindCameraCenter(gameStateData.position);
                    tileWorld.update(1);
                }
                return resolve({
                    canvas,
                    gameInput,
                    gameTextures,
                    fadeIn,
                    fadeOut,
                    gameStateData,
                    song,
                    playerCharacter: '',
                    spouseCharacter: '',
                    renderer,
                    gottimation,
                    tileWorld,
                    pathfinder,
                });
            });
        });
    }
};

const loadSpritesAndData = async () => {
    const loader = PIXI.loader;
    loader.reset();
    [
        { name: 'smallgold',url: 'Assets/fonts/smallgold.fnt'},
        { name: 'gold', url: 'Assets/fonts/gold.fnt'},
        { name: 'ns-small', url: 'Assets/fonts/ns-small.fnt'},
        { name: 'stroke-small', url: 'Assets/fonts/stroke-small.fnt'},
    ].forEach(asset => {
        loader.add(asset.name, asset.url);
    });
    loader.add('actextures', 'Assets/sprites/actextures.json');
    return new Promise((resolve, reject) => {
        loader.load((loader, resources) => {
            return resolve(resources);
        })
    })
}
function initializeRenderer() {
    const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
    if(!canvas) throw new Error('Could not find canvas element with css selector id game-canvas');
    const renderer = PIXI.autoDetectRenderer({
        antialias: false,
        forceCanvas: false,
        roundPixels: false,
        autoResize: false,
        view: canvas,
    });
    if(typeof CSS !== 'undefined') {
        if(CSS.supports('(image-rendering: pixelated)')) {
            canvas.style.imageRendering = 'pixelated';
        } else if(CSS.supports('(image-rendering: crisp-edges)')) {
            canvas.style.imageRendering = 'crisp-edges';
        } else if(CSS.supports('(image-rendering: -webkit-crisp-edges)')) {
            canvas.style.imageRendering = '-webkit-crisp-edges';
        } else if(CSS.supports('(image-rendering: -moz-crisp-edges)')) {
            canvas.style.imageRendering = '-moz-crisp-edges';
        }
    }
    return renderer;
}