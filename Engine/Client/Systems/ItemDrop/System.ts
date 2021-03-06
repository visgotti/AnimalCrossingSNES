import {COLLIDER_TAGS, MESSAGES, SYSTEMS} from "../../../Shared/Constants";

import {ClientSystem} from "gotti";
import {ItemDropComponent} from './Component';
import {DroppedItem} from "../../Assemblages/DroppedItem";
import {ClientPlayer} from "../../Assemblages/ClientPlayer";
import {InventoryComponent} from "../Inventory/Component";
export class ItemDropSystem extends ClientSystem {
    private droppedItemSeq = 0;
    private droppedItems : Array<DroppedItem> = [];
    private droppedItemCollisionPlugin : any;

    private itemsToPickup : Array<DroppedItem> = [];

    constructor() {
        super(SYSTEMS.ITEM_DROP);
        const handleCollision = (colA, colB) => {
            const clientPlayer : ClientPlayer = colA.gameObject.entity;
            if(clientPlayer !== this.globals.clientPlayer) throw new Error('Expected colliderA\'s gameObject to have a entity prop link to the global client player.')
            const droppedItem : DroppedItem = colB.gameObject.entity;
            if(!droppedItem) throw new Error(`Expected colBs gameObject data to have itemData on it.`);
            if(!this.droppedItems.includes(droppedItem)) {
                throw new Error(`Expected to be in array.`)
            }
            if(!this.itemsToPickup.includes(droppedItem)) {
                this.itemsToPickup.push(droppedItem);
            }
        }
        this.droppedItemCollisionPlugin = {
            type: 'collision',
            name: 'inventory',
            tagAs: [COLLIDER_TAGS.in_front_of_client_player],
            tagBs: [COLLIDER_TAGS.dropped_item],
            onCollisionStart: handleCollision,
            onCollision: handleCollision,
            onAfterCollisions: () => {
                const item = this.itemsToPickup.pop();
                if(item && this.globals.clientPlayer.playerInput.grab) {
                    const inv : InventoryComponent = this.globals.clientPlayer.getComponent(SYSTEMS.INVENTORY);
                    const itemComponent : ItemDropComponent = this.getSystemComponent(item);
                    // if addItem returns false that means we couldnt add it to the inventory and do not want to delete.
                    if(inv.addItem(itemComponent.itemName, itemComponent.itemData)) {
                        this.destroyEntity(item);
                    }
                }
                this.itemsToPickup.length = 0;
            }
        }
    }
    onClear(): void {
    }
    onLocalMessage(message): void {
    }
    onInit() {
        this.globals.tileWorld.use(this.droppedItemCollisionPlugin)
        this.addApi(this.dropItem);
        this.addApi(this.dropItemFromPlayer);
    }

    public dropItemFromPlayer(itemName: string) : boolean {
        const p = this.globals.clientPlayer.getPosition();
        const direction = this.globals.clientPlayer.getComponent(SYSTEMS.PLAYER_ANIMATION).skeleton.direction;
        return false;
    }

    public dropItem(itemName: string, worldX: number, worldY: number, destroyTimeout?: number) {
        const layerIndex = 1;
        const texture = this.globals.gameTextures.items.placed[itemName];
        if(!texture) throw new Error(`No texture found with item name: ${itemName}`);

        const gameObject = this.globals.tileWorld.addGameObject({
            texture,
            position: { x: worldX, y: worldY },
            layer: layerIndex,
            colliders: [{
                dynamic: true,
                layer: layerIndex,
                shapeData: { x: 0, y: 0, w: texture.width, h: texture.height },
                tags: [COLLIDER_TAGS.dropped_item],
            }],
        });

        const entity = new DroppedItem(this.$api.getUid());
        entity.gameObject = gameObject;
        gameObject.entity = entity;

        this.dispatchLocal({
            to: [SYSTEMS.GAME_STATE],
            type: MESSAGES.DROP_ITEM,
            data: {
                level: 'island',
                data: {
                    uid: entity.id,
                    name: itemName,
                    x: worldX,
                    y: worldY,
                }
            }
        })

        this.initializeEntity(entity, { gameObject, itemName });
        if(destroyTimeout) {
            entity.destroyTimeout = setTimeout(() => {
                delete entity.destroyTimeout;
                this.destroyEntity(entity);
            }, destroyTimeout)
        }
    }
    onEntityAddedComponent(entity: DroppedItem, component) {
        this.droppedItems.push(entity);
    }
    onEntityRemovedComponent(entity: DroppedItem, component) {
        if(entity.destroyTimeout) {
            clearTimeout(entity.destroyTimeout);
            delete entity.destroyTimeout;
        }
        if(entity.gameObject) {
            entity.gameObject.removeFromMap();
            delete entity.gameObject.entity;
            delete entity.gameObject;
        }
        // these props are set inside the DroppedItem.ts assemblage initialize method. (called from this.initializeEntity)

        this.droppedItems = this.droppedItems.filter( i => i !== entity);
    }

    onPeerMessage(peerId: number | string, message): any {
    }

    onServerMessage(message): any {
    }

    update(delta: any): void {
    }
}