import {
    CircleData,
    PointData, PolygonData,
    RectData,
    ShapeData,
    TransformativeFrameDataItem
} from "./types";

import {AnimationFrameData, SkinParam} from "./Runtime/types";

export function rectContainsPoint(r: RectLike, p: PointData) {
    r = normalizeRectData(r);
    return p.x >= r.x && p.x <= r.x + r.w && p.y > r.y && p.y < r.y + r.h;
}

export function rectsCollide(r: RectLike, r2: RectLike) {
    r = normalizeRectData(r);
    r2 = normalizeRectData(r2);
    return r.x + r.w >= r2.x && r.x <= r2.x +r2.w && r.y + r.h >= r2.y && r.y <= r2.y + r2.h;
}

export function shapeDataToArray(shapeData: ShapeData) : Array<number> {
    const type = resolveColliderType(shapeData);
    switch(type) {
        case 'rect':
            shapeData= shapeData as RectData;
            // @ts-ignore
            return [shapeData.x, shapeData.y, shapeData.w, shapeData.h]
        case 'polygon':
            shapeData = shapeData as PolygonData
            return shapeData.map(d => {
                return [d.x, d.y]
                // @ts-ignore
            }).flat();
        case 'circle':
            shapeData= shapeData as CircleData;
            return  [shapeData.r, shapeData.cx, shapeData.cy]
        case 'point':
            shapeData= shapeData as PointData;
            return [shapeData.x, shapeData.y]
    }
}

//**blob to dataURL**
export async function blobToDataURL(blob) {
    const a = new FileReader();
    return new Promise((resolve, reject) => {
        a.readAsDataURL(blob);
        a.onload = (e) => {
            return resolve(e.target.result);
        }
    })
}

export enum FrameFromType {
    ATTACHMENT_SETUP = 0,
    SUB_ATTACHMENT_SETUP =1,
    ANIMATION_FRAME=2,
}

export type CascadedFrameDatum = { x: number, y: number, rotation: number, scaleX: number, scaleY: number, visible: boolean, slotId: number, frameType: FrameFromType, isMain?: boolean  }

export type CascadedTransformData = {
    id: number,
    parentId?: number,
    sortedFrames: Array<CascadedFrameDatum>
}

export function inherittedTransformItemHasDeltas(data: TransformativeFrameDataItem) : boolean {
    return data.scaleX != 1 || data.scaleY != 1 && data.rotation != 0 || data.x != 0 || data.y != 0
}


export function deltaPoints(p1, p2) {
    return {
        x: p1.x - p2.x,
        y: p1.y - p2.y,
    }
}

export function roundToNearest(number: number, multiple: number, method='ceil') {
    const round = Math[method];
    const sign = Math.sign(number) || 1;
    return (round((Math.abs(number))*multiple)/multiple) * sign;
}

export function logPoint(p: { x: number, y: number }, title?: string, logMethod='log') {
    if(title) {
        console[logMethod](`Point: ${title}, X: ${p.x}, Y: ${p.y}`)
    } else {
        console[logMethod]('X:', p.x, 'Y:', p.y)
    }
}
export function isFunction(functionToCheck) {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}
export function applyCascadedBoneData(id: number | string, allData: Array<CascadedTransformData>, debug=false) : { x: number, y: number, rotation: number, scaleX: number, scaleY: number, visible: boolean, slotId?: number } {
    const DEBUG_BONE_NAME = '';
    const item = allData.find(b => b.id == id);
    //console.log('passed in id:', id, 'all data:', allData)
    const frames = allData.find(d => d.id == id).sortedFrames;
    // last frame decides if its visible.
    const finalFrameData = { x: 0, y: 0, rotation: 0, scaleX: 0, scaleY: 0, visible: frames[frames.length-1].visible, slotId: frames[0].slotId, };
    for(let i = 0; i < frames.length; i++) {
        const {x, y, rotation, scaleX, scaleY, visible, slotId} = frames[i];
        finalFrameData.x += x;
        finalFrameData.y += y;
        finalFrameData.rotation += rotation;
        finalFrameData.scaleX += (scaleX - 1);
        finalFrameData.scaleY += (scaleY - 1);
        if (!visible || (slotId && finalFrameData.slotId !== slotId)) {
            finalFrameData.slotId = slotId;
        }
    }
   // console.log('the cascaded frames were', frames);
  //  console.log('ITEM PARENT ID:', item.parentId);
    if(item.parentId) {
        const foundParent = allData.find(b => b.id == item.parentId);
        if(foundParent) {
            const parentData = applyCascadedBoneData(item.parentId, allData);
            finalFrameData.x += parentData.x;
            finalFrameData.y += parentData.y;
            finalFrameData.rotation += parentData.rotation;
            if(parentData.rotation) {
                //  const before = { ...finalFrameData };
                //  console.log('rotation:', parentData.rotation, 'in radians:', deg2rad(parentData.rotation));
                //  logPoint( finalFrameData, 'BEFORE PIVOT', 'error');
                const { x: px, y: py } = pivotPoint(finalFrameData, parentData, deg2rad(parentData.rotation));
                finalFrameData.x = px;
                finalFrameData.y = py;
                //  logPoint(finalFrameData, 'AFTER PIVOT', 'error');
                //   console.log('delta was', deltaPoints(before, finalFrameData), 'error')
            }
            finalFrameData.scaleX += (parentData.scaleX-1);
            finalFrameData.scaleY += (parentData.scaleY-1);
        } else {
            console.warn('Cascading frame data on an item that has a parentId but the parent does not have frame data in the array.')
        }
    }

    finalFrameData.x = Math.round(finalFrameData.x)
    finalFrameData.y = Math.round(finalFrameData.y)
    finalFrameData.rotation = Math.round(finalFrameData.rotation)

    if(debug) {
        console.log('FINAL FRAME DATA;', finalFrameData)
    }
    finalFrameData.scaleX++;
    finalFrameData.scaleY++;
   // console.log('final scale:', finalFrameData.scaleX);
  //  console.log('final scale:', finalFrameData.scaleY)
    // last frame determines if its visible.
  //  console.log('last frame visible:', frames[frames.length-1].visible);
    finalFrameData.visible = frames[frames.length-1].visible;
    return finalFrameData;
}

export function round(v) {
    return Math.sign(v) * Math.round(Math.abs(v));
}
export function roundRadian(rad: number) : number {
    return deg2rad(Math.round(rad2deg(rad)));
}

export function rad2deg(rad: number, round=false) : number {
    if(round) {
        return Math.round(rad * (180/Math.PI))
    } else {
        return rad * (180/Math.PI)
    }
}
export function applyScaleToCollider(scaleX: number, scaleY: number, shapeData: ShapeData) : ShapeData {
    return shapeData;
}
export function applyRotationToCollider(rotation: number, shapeData: ShapeData) : ShapeData {
    return shapeData;
}
export function applyParentBonesToCollider(shapeData: ShapeData, parentBoneId: number, data: Array<TransformativeFrameDataItem>) {
    return shapeData;
}

export function deg2rad(degree: number) : number {
    return degree / (180/Math.PI)
}

export function circleContainsPoint(c: CircleData, p: Point) {
    const { cx, cy, r } = c;
    const { x, y } = p;
    const dist = (x - cx) * (x - cx) + (y - cy) * (y - cy);
   // console.log('DISTANCE WAS', dist, 'r*r was', r*r);
    if (dist < r*r) {
        return true;
    }
    return false;
}

export function resolveColliderType(shapeData: ShapeData) : 'polygon' | 'rect' | 'circle' | 'point' {
    if(Array.isArray(shapeData)) {
        return 'polygon'
    }
    if('r' in shapeData) {return 'circle'}
    if('x' in shapeData) {
        if ('w' in shapeData) {
            return 'rect'
        }
        return 'point'
    } else {
        console.error(shapeData);
        throw new Error(`Invalid shape data found on collider`);
    }
}

type Point = { x: number, y: number }
type Rect = { x: number, y: number, w: number, h: number };

type RectLike = Rect | { x: number, y: number, width: number, height: number } | Array<number>

export async function getDataURLFromTexture(renderer: PIXI.CanvasRenderer | PIXI.WebGLRenderer, texture: PIXI.Texture) {
    const blob = await getBlobFromTexture(renderer, texture);
    return blobToDataURL(blob);
}
export async function getBlobFromSprite(renderer: PIXI.CanvasRenderer | PIXI.WebGLRenderer, displayObject: PIXI.Sprite | PIXI.Container) : Promise<Blob> {
    return new Promise((resolve, reject) => {
        renderer.extract.canvas(displayObject).toBlob((blob) => {
            return resolve(blob);
        })
    });
}

export function rectsEqual(rect1: RectData, rect2: RectData)  : boolean {
    return rect1.x === rect2.x && rect1.y === rect2.y && rect1.w === rect2.w && rect1.h === rect2.h;
}

export async function getBlobFromTexture(renderer: PIXI.CanvasRenderer | PIXI.WebGLRenderer, texture: PIXI.Texture) : Promise<Blob> {
    return getBlobFromSprite(renderer, new PIXI.Sprite(texture))
}

export function bufferToBase64 (arrayBuffer) {
    return btoa(
        new Uint8Array(arrayBuffer)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
}

export async function getTextureFromBlob(blob: Blob) : Promise<PIXI.Texture> {
    const URL = window.URL || window.webkitURL;
    let blobURL;
    let needRevoke = true;
    try {
        blobURL = URL.createObjectURL(blob);
    } catch(err) {
        needRevoke = false;
        const base64 = bufferToBase64(blob);
        blobURL = 'data:image/png;base64,' + base64
        // return PIXI.Texture.from(base64);
    }
    const img = new Image();
    return new Promise((resolve, reject) => {
        img.src = blobURL;
        // @ts-ignore
        img.addEventListener("load", (event) => {
            if(needRevoke) {
                {URL.revokeObjectURL(blobURL);}
            }
            return resolve(new PIXI.Texture(new PIXI.BaseTexture(img)));
        });// onload revoke the blob URL (because the browser has loaded and parsed the image data)
    })
}
/*

export async function getTextureFromBlob(blob: Blob) : Promise<PIXI.Texture> {
    const blobURL = URL.createObjectURL(blob);
    const img = new Image();
    return new Promise((resolve, reject) => {
        img.src = blobURL;
        // @ts-ignore
        img.addEventListener("load", (event) => {
            {URL.revokeObjectURL(blobURL);}
            return resolve(new PIXI.Texture(new PIXI.BaseTexture(img)));
        });// onload revoke the blob URL (because the browser has loaded and parsed the image data)
    })
}
 */
export async function dataUrlToTexture(dataUrl) {
    return getTextureFromBlob(dataURLtoBlob(dataUrl));
}

export function dataURLtoBlob(dataurl) {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}

export function getRectFromPoints(p1, p2) : RectData {
    const maxX = Math.round(Math.max(p1.x, p2.x));
    const minX = Math.round(Math.min(p1.x, p2.x));
    const maxY = Math.round(Math.max(p1.y, p2.y));
    const minY = Math.round(Math.min(p1.y, p2.y));
    return { x: minX, y: minY, w: maxX-minX, h: maxY-minY }
}

export function getPixiRectFromPoints(p1, p2) : PIXI.Rectangle {
    const { x, y, w, h } = getRectFromPoints(p1, p2 )
    return new PIXI.Rectangle(x, y, w, h);
}

//https://codepen.io/unrealnl/pen/aYaxBW
export function drawDashedPolygon (g: PIXI.Graphics, points: Array<{ x: number, y: number }>, x, y, rotation, dash, gap, offsetPercentage=0, color1?: number, color2?: number){
    let p1;
    let p2;
    let dashLeft = 0;
    let gapLeft = 0;
    if(offsetPercentage>0){
        var progressOffset = (dash+gap)*offsetPercentage;
        if(progressOffset < dash) dashLeft = dash-progressOffset;
        else gapLeft = gap-(progressOffset-dash);
    }
    const rotatedPoints = rotation !== null ? rotatePoints(points, rotation) : points;
    let curLine=0;
    for(let i = 0; i<rotatedPoints.length; i++){
        p1 = rotatedPoints[i];
        if(i == rotatedPoints.length-1) p2 = rotatedPoints[0];
        else p2 = rotatedPoints[i+1];
        const dx = p2.x-p1.x;
        const dy = p2.y-p1.y;
        const len = Math.sqrt(dx*dx+dy*dy);
        const normal = {x:dx/len, y:dy/len};
        let progressOnLine = 0;
        g.moveTo(x+p1.x+gapLeft*normal.x, y+p1.y+gapLeft*normal.y);
        while(progressOnLine<=len){
            if(color1 !== undefined && color1 !== null && color2 !== undefined && color2 !== null) {
                g.lineColor = curLine % 2 === 0 ? color1 : color2;
            }
            curLine++;
            progressOnLine+=gapLeft;
            if(dashLeft > 0) progressOnLine += dashLeft;
            else progressOnLine+= dash;
            if(progressOnLine>len){
                dashLeft = progressOnLine-len;
                progressOnLine = len;
            }else{
                dashLeft = 0;
            }
            g.lineTo(x+p1.x+progressOnLine*normal.x, y+p1.y+progressOnLine*normal.y);
            progressOnLine+= gap;
            if(progressOnLine>len && dashLeft == 0){
                gapLeft = progressOnLine-len;
            }else{
                gapLeft = 0;
                g.moveTo(x+p1.x+progressOnLine*normal.x, y+p1.y+progressOnLine*normal.y);
            }
        }
    }
}

export function drawDashedBoundingBox(g, bb: { minX: number, maxX: number, minY: number, maxY: number }, x, y, rotation, dash, gap, offsetPercentage=0, color1?: number, color2?: number) {
    return drawDashedPolygon(g, boundingBoxToPolygon(bb), x, y, rotation, dash, gap, offsetPercentage, color1, color2)
}

function normalizeRectData(rect: RectLike) : Rect {
    if(Array.isArray(rect)) {
        if(rect.length > 4) {
            throw new Error(`Rect is longer than length 4.`)
        }
        return { x: rect[0], y: rect[1], h: rect[2], w: rect[3] }
    }
    if(!('x' in rect) || !('y' in rect)) {
        throw new Error(`Can not normalize rect`)
    }
    if('width' in rect && 'height' in rect) {
        return { x: rect.x, y: rect.y, w: rect.width, h: rect.height }
    } else if('w' in rect && 'h' in rect)  {
        return <Rect>rect;
    } else {
        throw new Error(`Can not normalize rect`)
    }
}

export function drawDashedRect(g, rect: Rect | { x: number, y: number, width: number, height: number }, rotation, dash, gap, offsetPercentage=0, color1?: number, color2?: number) {
    const bb = boundingBoxFromRect(normalizeRectData(rect));
    return drawDashedPolygon(g, boundingBoxToPolygon(bb), 0, 0, rotation, dash, gap, offsetPercentage, color1, color2)
}

export function getNearestPriorFrame(frameTime: number, frames: Array<AnimationFrameData>) {
        // if the length of the array is 0... theres obviously no previous, return null.
    if(!frames.length) return null;
    // gets first frame thats over or equal to the current frametime, then the previous one is which were looking for.
    const found = frames.find(d => d.time >= frameTime);
    // if we didnt find any that means the frame before is going to wind up being the last one.
    if(!found) return frames[frames.length - 1];
    const index = frames.indexOf(found);
    // if index was 0, there is no previous, return null.
    if(!index) return null;
    return frames[index-1];
}

//todo: unpivot point
export function pivotPoint(pointToPivot, pivotPoint, radians){
    var originalX = pointToPivot.x;
    var originalY = pointToPivot.y;

    var angle = radians;
    var cosTheta = Math.cos(angle);
    var sinTheta = Math.sin(angle);

    var x =   (cosTheta * (originalX - pivotPoint.x) -
        sinTheta * (originalY - pivotPoint.y) + pivotPoint.x);

    var y = (sinTheta * (originalX - pivotPoint.x) +
        cosTheta * (originalY - pivotPoint.y) + pivotPoint.y);

    return { x, y }
}

export function findNeededOrigin(currentPoint, radians) {
}

export function rotatePoints(points, rotation) {
    return points.map(point => {
        const p = {x:point.x, y:point.y};
        const cosAngle = Math.cos(rotation);
        const sinAngle = Math.sin(rotation);
        const dx = p.x;
        const dy = p.y;
        p.x = (dx*cosAngle-dy*sinAngle);
        p.y = (dx*sinAngle+dy*cosAngle);
        return p;
    })
}

export function getDistance(p: { x: number, y: number }, p2: { x: number, y: number }) {
    const { x, y } = p;
    const { x : x2, y : y2 } = p2;
    return Math.sqrt((x2-x)*(x2-x)+(y2-y)*(y2-y));
}

export function rectToPolygon(rect: RectLike) : Array<{ x: number, y: number}> {
    return boundingBoxToPolygon(boundingBoxFromRect(rect))
}

export function boundingBoxToPolygon(bb: { minX: number, maxX: number, minY: number, maxY: number }) : Array<{x: number, y: number}> {
    const { minX, minY, maxX, maxY } = bb;
    return [
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY },
        { x: minX, y: minY },
    ];
}

export function rectFromBoundingBox(bb:{ minX: number, maxX: number, minY: number, maxY: number }) : { x: number, y: number, w: number, h: number }  {
    const { minX, maxX, minY, maxY } = bb;
    return {
        x: minX,
        y: minY,
        w: maxX - minX,
        h: maxY - minY
    }
}

export function ceilPoint(pt: { x: number, y: number }) : { x: number, y: number } {
    return {
        x: Math.ceil(pt.x),
        y: Math.ceil(pt.y)
    }
}


export function roundPoint(pt: Point, inPlace=false) : Point {
    if(inPlace) {
        pt.x = Math.round(pt.x);
        pt.y = Math.round(pt.y)
        return pt;
    }
    return {
        x: Math.round(pt.x),
        y: Math.round(pt.y)
    }
}

export function floorPoint(pt: Point) : Point {
    return {
        x: Math.floor(pt.x),
        y: Math.floor(pt.y)
    }
}



export function boundingBoxFromPolygon(points: Array<{ x: number, y: number } >) : { minX: number, maxX: number, minY: number, maxY: number } {
    if(points.length <= 3) throw new Error('Not enough points in polygon.')
    let maxX = points[0].x;
    let maxY = points[0].y;
    let minX = points[0].x;
    let minY = points[0].y;
    for(let i = 1; i < points.length; i++) {
        const { x, y } = points[i];
        minX = Math.min(x, minX);
        minY = Math.min(y, minY);
        maxX = Math.max(x, maxX);
        maxY = Math.max(y, maxY);
    }
    return { minX, minY, maxX, maxY };
}
export function boundingBoxFromRect(rect: RectLike) : { minX: number, maxX: number, minY: number, maxY: number } {
    rect = normalizeRectData(rect);
    const { x, y, w, h } = rect;
    return {
        minX: x,
        minY: y,
        maxX: x+w,
        maxY: y+h
    }
}


export function rectFromPolygon(points: Array<Point>) : Rect {
    return rectFromBoundingBox(boundingBoxFromPolygon(points));
}

export function boundingFromPositions(p1: Point, p2: Point) : { minX: number, maxX: number, minY: number, maxY: number } {
    return {
        minX: Math.min(p1.x, p2.x),
        maxX: Math.max(p1.x, p2.x),
        minY: Math.min(p1.y, p2.y),
        maxY: Math.max(p1.y, p2.y)
    }
}

export function updateObject(mainObject: any, updatedObject: any) {
    for(let globalDatumKey in mainObject) {
        const updatedItem = updatedObject[globalDatumKey];
        if(!updatedItem) continue;
        const currentItem = mainObject[globalDatumKey];
        if(Array.isArray(mainObject[globalDatumKey])) {
            updatedItem.forEach(datum => {
                const found = currentItem.find(curDatum => curDatum.id == datum.id);
                if(found) { // found it in current, so replace.
                    currentItem[currentItem.indexOf(found)] = datum;
                } else {
                    currentItem.push(datum)
                }
            });
        }
    }
}
export function addObject(mainObject: any, updatedObject: any) {
    for(let globalDatumKey in mainObject) {
        const updatedItem = updatedObject[globalDatumKey];
        if(!updatedItem) continue;
        const currentItem = mainObject[globalDatumKey];
        if(Array.isArray(mainObject[globalDatumKey])) {

        }
    }
}
export function removeObject(mainObject: any, addedObject: any) {
}

export function validateSkinParams(params: Array<SkinParam>, idLookup?: {[sheetId: number]: any}, nameLookup?: {[sheetName: number]: any}) : { valid: Array<SkinParam>, invalid: Array<{ error: string, param: SkinParam}> } {
    const valid = [], invalid = [];
    for(let i = 0; i < params.length; i++) {
        try {
            validateSkinParam(params[i], idLookup, nameLookup);
            valid.push(params[i]);
        } catch(err) {
            invalid.push({ param: params[i], error: err.message ? err.message : err });
        }
    }
    return { valid, invalid, }
}

export function validateSkinParam(param : SkinParam, idLookup?: {[sheetId: number]: any}, nameLookup?: {[sheetName: number]: any}) {
    // default these to nulls if they're not objects so we can use this function in array.filter/maps w/o issue.
    const error = (msg) => {
        console.error('invalid param:', param);
        idLookup && console.error('id lookup:', idLookup);
        nameLookup && console.error('name lookup:', nameLookup);
        console.error(msg);
        throw new Error(msg)
    }
    try {
        if(!param.atlasName && !param.atlasId) {
            error(`No atlasId or atlasName property in the SkinParam: ${JSON.stringify(param)}`)
        }
        if(!param.skinName && !param.skinUrl) {
            error(`No skinName or atlasName property in the SkinParam: ${JSON.stringify(param)}`)
        }
        if(param.atlasId && idLookup && (!(param.atlasId in idLookup))) {
            error(`Invalid atlas id: ${param.atlasId}, it was not found in the lookup.`)
        }
        if(param.atlasName && nameLookup && (!(param.atlasName in nameLookup))) {
            error(`Invalid atlas name: ${param.atlasId}, it was not found in the lookup.`)
        }
    } catch(err) {
        throw err;
    }
}

export async function httpGetAsync(url: string, parseJson=true) : Promise<any> {
    const xmlHttp = new XMLHttpRequest();
    if(!parseJson) {
        xmlHttp.responseType = "arraybuffer";
    }
    xmlHttp.open("GET", url, true); // true for asynchronous
    xmlHttp.send(null);

    return new Promise((resolve, reject) => {
        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState == 4) {
                if (xmlHttp.status == 200) {
                    return parseJson ? resolve(JSON.parse(xmlHttp.responseText)) : resolve(xmlHttp.response);
                } else {
                    try {
                        return parseJson ? reject(JSON.parse(xmlHttp.responseText)) : reject(xmlHttp.response);
                    } catch(err) {
                        console.error('Error parsing http error response', xmlHttp);
                        return reject(err);
                    }
                }
            }
        }
    })
}