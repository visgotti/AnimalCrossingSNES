import {ShapeData, TransformativeData} from "../types";

export interface ICollider {
    shapeData: ShapeData;
    tags?: Array<string>;
    updateTransformedShapeData: (transformData: { x?: number, y?: number, scaleX?: number, scaleY?: number, rotation?: number }) => void;
}