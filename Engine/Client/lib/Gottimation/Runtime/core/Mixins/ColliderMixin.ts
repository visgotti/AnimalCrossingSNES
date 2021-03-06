import {IColliderManager} from "../../Gottimation";

interface IColliderMixin<T> {
}

export class ColliderMixin {
    public colliderManager: IColliderManager;
}