import {defaultGameData, StartGameData} from "../../Shared/types";

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
import * as World from '../lib/tileyo.js';
import DebugColliderPlugin from '../lib/TileYoPlugins/DebugPlugin.js';
//World.use(DebugColliderPlugin);
import { Gottimation } from "../lib/Gottimation/Runtime/Gottimation";
import {GridPathFinder} from "../lib/Pathfinder";
const resolutionSettings = {
    dynamicResolution: true,
    maxView: {
        w: 550,
        h: 350,
    },
}

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
import { BugMovementSystem } from "../Systems/BugMovement/System";
import { BugSpawnSystem } from "../Systems/BugSpawn/System";
import { BeeKeepSystem } from "../Systems/BeeKeep/System";
import { FlowerSystem } from "../Systems/Flower/System";

import Gotti from 'gotti';
import {getRandomNumber} from "../../Shared/Utils";
export default {
    isNetworked: false,
    type: 'island',
    systems: [
        GameStateSystem,
        KeyboardInputSystem,
        LevelSystem,
        PlayerActionSystem,
        PlayerManagerSystem,
        PathfindingSystem,
        PlayerAnimationSystem,
        PlayerMovementSystem,
        TimerSystem,
        TreeSystem,
        NPCMovementSystem,
        ItemDropSystem,
        InventorySystem,
        DialogueSystem,
        BugCatchSystem,
        BugMovementSystem,
        BugSpawnSystem,
        BeeKeepSystem,
        FlowerSystem,
    ],
    plugins: [],
    areas: [],
    async globals(gameData, areaData, client) {
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
        tryPlaySong();

        const canvas = document.getElementById("game-canvas")
        canvas.style.opacity = `1`;
        const fadeIn = async () => {
            canvas.style.opacity = `${Math.min(parseFloat(canvas.style.opacity) + .01, 1)}`;
            if(parseFloat(canvas.style.opacity) < 1) {
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

        const gottimation = await Gottimation.Init(`Assets/evil_farm_anis`, {lazyLoadTextures: true, renderer, preloadAtlasDefaults: true }, tileWorld.loader);
        const pathfinder = new GridPathFinder();
        const res = await loadSpritesAndData();
        pathfinder.create(16, 1024/16, 1024/16);
        const treeTextures : Array<{ shadow: PIXI.Texture, tree: PIXI.Texture, shadowOffsetX?: number, shadowOffsetY?: number }> = [];
        for(let i = 1; i < 5; i++) {
            treeTextures.push({
                tree: res['farm_sprites'].textures[`tree${i}.png`],
                shadow: res['farm_sprites'].textures[`tree${i}shadow.png`]
            })
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
                    gameStateData = defaultGameData(payload.data, startData.startingSpawn);
                } else {
                    gameStateData = payload.data;
                }
                if(gameStateData.level !== "main") {
                    await tileWorld.loadMap(gameStateData.level);
                    tileWorld.bindCameraCenter(gameStateData.position);
                    tileWorld.update(1);
                }
                return resolve({
                    fadeIn,
                    fadeOut,
                    gameStateData,
                    song,
                    playerCharacter: '',
                    spouseCharacter: '',
                    renderer,
                    gottimation,
                    treeTextures,
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
    const fonts = [
     //   { name: 'ns-small', url: 'Assets/fonts/ns-small.fnt'},
        { name: 'stroke-small', url: 'Assets/fonts/stroke-small.fnt'},
        { name: 'medium-stroke', url: 'Assets/fonts/medium-stroke.fnt'},
        { name: 'medium', url: 'Assets/fonts/medium.fnt'},
        { name: 'large-stroke', url: 'Assets/fonts/large-stroke.fnt'},
        { name: 'large', url: 'Assets/fonts/large.fnt'},
        { name: 'xsmall', url: 'Assets/fonts/xsmall.fnt'},
        { name: 'xsmall-stroke', url: 'Assets/fonts/xsmall-stroke.fnt'}
    ].forEach(asset => {
        loader.add(asset.name, asset.url);
    });
    loader.add('farm_sprites', 'Assets/sprites/evilfarmsprites.json');
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