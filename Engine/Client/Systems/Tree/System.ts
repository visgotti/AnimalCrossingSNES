import {ClientSystem} from "gotti";
import { Tree } from '../../Assemblages/Tree';
import {COLLIDER_TAGS, MESSAGES, SYSTEMS} from "../../../Shared/Constants";
import {
    getRandomItemFromArray,
    getRandomNumber,
    getRandomPositionFromPolygon,
    getRandomPositionFromRect
} from "../../../Shared/Utils";
import {resolveColliderType} from "../../lib/Gottimation/utils";
import {TreeComponent} from "./Component";

export class TreeSystem extends ClientSystem {
    private treeLayer : PIXI.Container;
    private addedTrees : boolean = false;
    private treeSeq : number = 0;
    private treeSpawnCollisionPlugin : any;
    private treeChopCollisionPlugin : any;
    private treeColliders: Array<any> = [];
    private trees: Array<Tree> = [];
    private currentChoppingTrees : Array<Tree> = [];
    private inPlayerRangeTrees : Array<Tree> = [];

    constructor() {
        super(SYSTEMS.TREE);
        this.treeSpawnCollisionPlugin = {
            name: 'tree',
            type: 'collision',
            tagAs: [COLLIDER_TAGS.tree],
            onAddedColliderWithTagA: (collider) => {
                this.treeColliders.push(collider.shapeData);
            },
        }
        this.treeChopCollisionPlugin = {
            name: 'tree_chop',
            type: 'collision',
            tagAs: [COLLIDER_TAGS.tree_stump],
            tagBs: [COLLIDER_TAGS.client_player],
            onCollisionStart:(treeCollider, clientCollider) => {
                if(!treeCollider.data.entity) throw new Error(`Expected an entity object in treeCollider.data`);
                const tree : Tree = treeCollider.data.entity;
                if(this.inPlayerRangeTrees.includes(tree)) throw new Error(`Already included.`)
                this.inPlayerRangeTrees.push(tree);
            },
            onCollisionEnd: (treeCollider, clientCollider) => {
                if(!treeCollider.data.entity) throw new Error(`Expected an entity object in treeCollider.data`);
                const tree : Tree = treeCollider.data.entity;
                if(!this.inPlayerRangeTrees.includes(tree)) throw new Error(`Should have been included.`)
                this.inPlayerRangeTrees = this.inPlayerRangeTrees.filter(t => t !== tree);
            },
        }
    }

    onClear(): void {
    }

    public onInit() {
        this.globals.tileWorld.use(this.treeSpawnCollisionPlugin);
        this.globals.tileWorld.use(this.treeChopCollisionPlugin);
        this.globals.tileWorld.onMapCreated(() => {
            if(this.treeSeq === 0) {
                for(let i = 0; i < 50; i++) {
                    this.spawnRandomTree();
                }
            }
        });
    }

    private getNextTreeSpawn() : { x: number, y: number } {
        const collider = getRandomItemFromArray(this.treeColliders);
        let point;
        switch(resolveColliderType(collider)) {
            case "polygon":
                point = getRandomPositionFromPolygon(collider);
                break;
            case "rect":
                point = getRandomPositionFromRect(collider);
                break;
        };
        return point;
    }
    private spawnTree(treeTypeIndex: number, position: { x: number, y: number }) {
        const tree = new Tree(++this.treeSeq);
        this.initializeEntity(tree, { position, treeTypeIndex });
    }

    private spawnRandomTree() {
        const p = this.getNextTreeSpawn();
        const tree = new Tree(++this.treeSeq);
        const treeTypeIndex = getRandomNumber(0, this.globals.treeTextures.length-1);
        this.initializeEntity(tree, { position: p, treeTypeIndex });
    }

    onLocalMessage(message): void {
        switch(message.type) {
            case MESSAGES.CLIENT_PLAYER_ENTITY_INITIALIZED:
                this.globals.clientPlayer.on('start-action', ({ action, direction}) => {
                    if(action === 'swing') {
                        const treeGameObject = this.inPlayerRangeTrees[0]?.treeGameObject;
                        if(treeGameObject && this.inPlayerRangeTrees.length === 1) {
                            if(!treeGameObject['__tempchopcount']) {
                                treeGameObject['__tempchopcount'] = 1;
                            } else {
                                treeGameObject['__tempchopcount']++;
                            }
                            if(treeGameObject['__tempchopcount'] === 3) {
                                const sprite = treeGameObject.delegatedSprite || treeGameObject;
                                if(sprite.visible) {
                                    for(let i = 0; i < 5; i++) {
                                        this.$api.dropItem('log',
                                            treeGameObject.worldX + getRandomNumber(0, 50),
                                            treeGameObject.worldY + getRandomNumber(0, 50)
                                        );
                                    }
                                    sprite.visible = false;
                                }
                            }
                        }
                    }
                });
                break;
        }
    }
    onPeerMessage(peerId: number | string, message): any {
    }
    public onEntityAddedComponent(entity: Tree, component : TreeComponent) {
        this.trees.push(entity);
        const textures = this.globals.treeTextures[component.treeType];
        if(!textures) throw new Error(`Invalid tree type: ${component.treeType}`);
        const p = entity.getComponent(SYSTEMS.POSITION).getPosition();
        let offsetX = 0;
        if(textures.shadow.width > textures.tree.width) {
            offsetX = (textures.shadow.width - textures.tree.width) / 2;
        } else {
            offsetX = (textures.tree.width - textures.shadow.width) / 2;
        }
        const offsetY = textures.tree.height - (textures.shadow.height/2)
        const container = new PIXI.Container();
        container.x = p.x;
        container.y = p.y;
        container['treeContainer'] = true;
        const shadow = new PIXI.Sprite(textures.shadow);
        shadow.alpha = .5;
        const tree = new PIXI.Sprite(textures.tree);
        container.addChild(shadow);
        container.addChild(tree);
        shadow.x = offsetX;
        shadow.y = offsetY;
        entity.treeGameObject = this.globals.tileWorld.addGameObject({
            position: p,
            sprite: container,
            layer: 1,
            colliders: [{
                dynamic: false,
                layer: 1,
                shapeData: { x: tree.width/2 - 10, y: tree.height-20, w: 20 , h: 20 },
                tags: ['tree_stump', 'blocking']
            }]
        });
        const col = entity.treeGameObject.colliders[0];
        entity.treeGameObject.entity = entity;
        col.data = col.data || {};
        col.data.entity = entity;
        this.addedTrees = true;
        if(!this.treeLayer) {
            this.treeLayer = container.parent;
        }
    }
    public onEntityRemovedComponent(entity: Tree, component) {
        if(entity.treeGameObject) {
            entity.treeGameObject.colliders?.forEach(c => {
                if(c.data) delete c.data.entity;
            })
            entity.treeGameObject.removeFromMap();
            delete entity.treeGameObject.entity;
        }
        this.trees = this.trees.filter(t => t !== entity);
    }

    onServerMessage(message): any {
    }

    update(delta: any): void {
        if(this.addedTrees) {
            this.treeLayer.children.sort((c1, c2) => {
                if(!c1['treeContainer'] || !c2['treeContainer']) {
                    return 0;
                } else {
                    // @ts-ignore
                    return (c1.y + c1.height) - (c2.y + c2.height);
                }
            });
            this.addedTrees = false;
        }
    }
}