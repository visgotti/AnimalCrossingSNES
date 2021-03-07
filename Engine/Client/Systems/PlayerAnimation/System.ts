import {ClientSystem} from 'gotti';
import {PlayerAnimationComponent} from './Component';
import {ClientPlayer} from "../../Assemblages/ClientPlayer";
import {RemotePlayer} from "../../Assemblages/RemotePlayer";
import {NPC} from "../../Assemblages/NPC";
import {COLLIDER_TAGS, SYSTEMS} from "../../../Shared/Constants";
import {EntityTypes, NPC_TYPES} from "../../../Shared/types";

export const DefaultPlayerColliders = (tags?: Array<string>) =>  [
    { layer: 1, shapeData: { x: 10, y: 23, r: 10 }, dynamic: true, tags },
    { layer: 1, shapeData: { x: -86, y: -86, w: 192, h: 192 }, tags: ['sort'], dynamic: true, data: { sortOffsetTop: 15 } }
]

export class PlayerAnimationSystem extends ClientSystem {
    private uninitComponents : Array<PlayerAnimationComponent> = [];
    private readyEntities : Array<ClientPlayer | RemotePlayer | NPC> = [];

    public sortCollisionPlugin;

    constructor() {
        super(SYSTEMS.PLAYER_ANIMATION);

        const doSort = (colliderA, colliderB) => {
            if(colliderA.gameObject.layerIndex === colliderB.gameObject.layerIndex) {
                const spriteA = colliderA.gameObject.delegatedSprite || colliderA.gameObject;
                const spriteB = colliderB.gameObject.delegatedSprite || colliderB.gameObject;
                const parentA = spriteA.parent;
                const parentB = spriteB.parent;
                if(parentA !== parentB) throw new Error(`Expected to be the same parents.`)
                const parent = parentA;
                const indexA = parent.children.indexOf(spriteA);
                const indexB = parent.children.indexOf(spriteB);

                const spriteOffsetTop = colliderA.data?.sortOffsetTop || 0;
                const spriteSortPoint = (spriteA.y + (spriteA.height/2) + spriteOffsetTop);

                if(spriteSortPoint > spriteB.y + spriteB.height) {
                    if(indexA < indexB) {
                        parentA.setChildIndex(spriteA, indexB);
                    }
                } else {
                    if(indexA > indexB) {
                        parentA.setChildIndex(spriteA, Math.max(indexB-1, 0));
                    }
                }
            }
        }

        this.sortCollisionPlugin = {
            type: 'collision',
            name: 'sort',
            tagAs: [COLLIDER_TAGS.sort],
            tagBs: [COLLIDER_TAGS.tree_stump],
            onCollision(colliderA, colliderB) {
                doSort(colliderA, colliderB);
            },
            onCollisionStart(colliderA, colliderB) {
                doSort(colliderA, colliderB);
            }
        }
    }
    onClear(): void {
    }
    onLocalMessage(message): void {}

    onServerMessage(message): any {
    }

    onInit() {
        this.globals.tileWorld.use(this.sortCollisionPlugin);
    }


    onEntityAddedComponent(entity: any, component: PlayerAnimationComponent) {
     //   console.error('added ani component.')
        if(!entity.hasComponent(SYSTEMS.PLAYER_MOVEMENT) && !entity.hasComponent(SYSTEMS.NPC_MOVEMENT)) {
            console.error(entity);
            throw new Error(`Expected entity to have a player movement component added before the player animation component.`)
        }
        this.uninitComponents.push(component);
        entity.once('skeleton-ready', (skeleton) => {
            this.uninitComponents = this.uninitComponents.filter(c => c !== component);
            this.readyEntities.push(entity);

            const p = entity.getComponent(SYSTEMS.POSITION).getPosition();
            skeleton.x = p.x;
            skeleton.y = p.y;
            const tags = [];
            let colliderArray;
            if(entity.type === EntityTypes.ClientPlayer) {
                tags.push('client_player', 'player')
                colliderArray = DefaultPlayerColliders(tags);
                colliderArray.push({ layer: 1, shapeData: { x: 10, y: 18, r: 40 }, dynamic: true, tags: [COLLIDER_TAGS.client_player_bug_detector] })
                // we have special logic for police npcs so do not add colliders to gameobject here, we do it inside the Police Assemblage.
            } else if(entity.type === EntityTypes.NPC) {
                tags.push(COLLIDER_TAGS.npc);
                colliderArray = DefaultPlayerColliders(tags);;
            }

            entity['gameObject'] = this.globals.tileWorld.addGameObject({
                sprite: skeleton,
                layer: 1,
                colliders:colliderArray,
            });
            entity['gameObject']['entity'] = entity;
            entity.emit('gameobject-ready', entity.gameObject);
        });
        component.initSkeleton(this.globals.gottimation);
    }

    onEntityRemovedComponent(entity: any, component: PlayerAnimationComponent) {
        if(component.isReady()) {
            entity.gameObject.removeFromMap();
            delete entity['gameObject']['entity'];
            delete entity['gameObject']
            this.readyEntities = this.readyEntities.filter(e => e !== entity);
        } else {
            this.uninitComponents = this.uninitComponents.filter(c => c !== component);
        }
    }

    update(delta: any): void {
        const normalizedDelta = delta*1000;
        for(let i = 0; i < this.readyEntities.length; i++) {
            const c : PlayerAnimationComponent = this.getSystemComponent(this.readyEntities[i]);
            if(this.readyEntities[i].hasComponent(SYSTEMS.PLAYER_MOVEMENT)) {
                const actionComponent = this.readyEntities[i].getComponent(SYSTEMS.PLAYER_ACTION);
                c.updateAnimation(normalizedDelta, actionComponent);
            } else {
                c.skeleton.update(normalizedDelta);
            }
        }
    }

    onPeerMessage(peerId: number | string, message): any {
    }
}