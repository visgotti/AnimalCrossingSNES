export async function asyncTimeout(timeout: number) : Promise<void>{
    return new Promise((resolve) => {
        setTimeout(() => {
            return resolve();
        }, timeout)
    })
}
type Rect = { x: number, y: number, w: number, h: number };
type RectLike = Rect | { x: number, y: number, width: number, height: number } | Array<number>

function normalizeRectData(rect: RectLike) : Rect {
    if(Array.isArray(rect)) {
        if(rect.length > 4) {
            throw new Error(`Rect is longer than length 4.`)
        }
        return { x: rect[0], y: rect[1], h: rect[2], w: rect[3] }
    }
    if('width' in rect) {
        return { x: rect.x, y: rect.y, w: rect.width, h: rect.height }
    } else {
        return <Rect>rect;
    }
}

export function getPercentage(percent, total) {
    return ((percent/ 100) * total);
}

export function getDistance(p1, p2) {
    return Math.sqrt( Math.pow((p1.x-p2.x), 2) + Math.pow((p1.y-p2.y), 2) );
};

export function rectsAreColliding(rect1, rect2) {
    return (rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.height + rect1.y > rect2.y)
};

export function getMovementDataFromDeltas(deltaX, deltaY) : number {

    let movingDirectionIndex = -1;

    if (deltaY < 0 && deltaX <= 0) {
        movingDirectionIndex = 1;
    } else if(deltaX > 0){
        movingDirectionIndex = 0;
    } else if(deltaY > 0 && deltaX === 0) { // just to add variety of looking up/down on diagnol movement
        movingDirectionIndex = 3;
    } else if(deltaX < 0) {
        movingDirectionIndex = 2;
    }

    return movingDirectionIndex;
}

export function toRadian(degrees) {
    return degrees * Math.PI / 180;
}

export function getRectEdges(rect) {
    return [
        { x: rect.x, y: rect.y },
        { x: rect.x, y: rect.y + rect.height },
        { x: rect.x + rect.width, y: rect.y },
        { x: rect.x + rect.width, y: rect.y + rect.height }
    ]
};

export function pointIsWithinRectDistance(point: { x: number, y: number }, rect: { x: number,y:number, width: number, height: number }, distance: number) {
    const rectEdges = getRectEdges(rect);
    for(let i = 0; i < rectEdges.length; i++) {
        if (getDistance(rectEdges[i], point) <= distance) return true;
    }
    return false;
}

export function rectsAreWithinDistance(rect1, rect2, distance) {
    const rect1Edges = getRectEdges(rect1);
    const rect2Edges = getRectEdges(rect2);

    for(let i = 0; i < rect1Edges.length; i++) {
        for(let j = 0; j < rect2Edges.length; j++) {
            if (getDistance(rect1Edges[i], rect2Edges[j]) <= distance) return true;
        }
    }
    return false;
};

export function flattenPointArray (a: Array<{ x: number, y: number }>) : Array<number> {
    const newArray = [];
    for(let i = 0; i < a.length; i++) {
        newArray.push(a[i].x, a[i].y)
    }
    return newArray;
}

export function unflattenPointArrays (a: Array<number>) : Array<{ x: number, y: number }> {
    const newArray = [];
    for(let i = 0; i < a.length; i+=2) {
        newArray.push({ x: a[i], y: a[i+1]})
    }
    return newArray;
}
export function getMinRectToRectDistance(rect1, rect2) {
    const rect1Edges = getRectEdges(rect1);
    const rect2Edges = getRectEdges(rect2);
    let min = 99999999;
    for(let i = 0; i < rect1Edges.length; i++) {
        for(let j = 0; j < rect2Edges.length; j++) {
            min = Math.min(getDistance(rect1Edges[i], rect2Edges[j]), 99999999)
        }
    }
    return min;
}

export function removeAndDeleteSprite(sprite, isBitMap=false) {
    if(sprite) {
        if(sprite.parent) {
            sprite.parent.removeChild(sprite);
        }
        if(isBitMap) {
            sprite.destroy({ children: true, texture: false, baseTexture: false });
        } else {
            sprite.destroy({ children: true })
        }
    }
}


export function getRadianAngleFromPositions(p1, p2) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
};

export function getDegreeAngleFromPositions(p1, p2) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
};

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


function segmentCircleAreColliding(circle: { x: number, y: number, radius: number }, segment: Array<{ x: number, y: number }>) {
    // is either end INSIDE the circle?
    // if so, return true immediately

    const x1 = segment[0].x;
    const y1 = segment[0].y;

    const x2 = segment[1].x;
    const y2 = segment[1].y;

    const cx = circle.x;
    const cy = circle.y;
    const r = circle.radius;

    const inside1 = pointCircle(x1,y1, cx,cy,r);
    const inside2 = pointCircle(x2,y2, cx,cy,r);
    if (inside1 || inside2) {

        const angle = Math.atan2((y1 - y2), (x1 - x2));

        return {
            collide: true,
        }
    }

    // get length of the line
    let distX = x1 - x2;
    let distY = y1 - y2;
    const len = Math.sqrt( (distX*distX) + (distY*distY) );

    // get dot product of the line and circle
    const dot = ( ((cx-x1)*(x2-x1)) + ((cy-y1)*(y2-y1)) ) / Math.pow(len,2);

    // find the closest point on the line
    const closestX = x1 + (dot * (x2-x1));
    const closestY = y1 + (dot * (y2-y1));

    // is this point actually on the line segment?
    // if so keep going, but if not, return false
    const onSegment = linePoint(x1,y1,x2,y2, closestX,closestY);
    if (!onSegment) return false;

    // get distance to closest point
    distX = closestX - cx;
    distY = closestY - cy;
    const distance = Math.sqrt( (distX*distX) + (distY*distY) );

    if (distance <= r) {
        //const angle = Math.atan2((y1 - y2), (x1 - x2));
        // gets the angle of which the circle collided at
        const angle = angleOf(circle, { x: closestX, y: closestY });
        return {
            collide: true,
            angle,
        }
    }
    return false;
}

export function getDirectionAndRelativeAngleFromAngle (angle){
    let dirIndex = 0;
    let relativeAngle = 0;
    if(angle >= -180 && angle <= -157.5 || angle <= 180 && angle > 157.5) {
        dirIndex = 6;
        if(angle >= -180 && angle <= -157.5 ) {
            relativeAngle = Math.abs(-180 - angle) + 22.5;
        } else {
            relativeAngle = Math.abs(157.5 - angle)
        }
    } else if (angle >= -157.5 && angle < -112.5){
        dirIndex = 5;
        relativeAngle = Math.abs(-157.5 - angle);
    } else if (angle >= -112.5  && angle < -67.5 ){
        dirIndex = 4;
        relativeAngle = Math.abs(-112.5- angle);
    } else if (angle >= -67.5 && angle < -22.5){
        dirIndex  = 3;
        relativeAngle = Math.abs(-67.5- angle);
    } else if (angle >= -22.5 && angle < 22.5){
        relativeAngle = angle + 22.5;
        dirIndex =  2;
    } else if( angle >= 22.5 && angle < 67.5){
        relativeAngle = angle - 22.5;
        dirIndex  = 1
    }else if (angle >= 67.5 && angle < 112.5){
        dirIndex = 0;
        relativeAngle = angle - 67.5;
    }else if(angle >= 112.5 && angle < 157.5){
        dirIndex = 7;
        relativeAngle = angle -112.5;
    }

    return {
        dirIndex,
        relativeAngle
    };
};

export function getScreenPositionFromWorldPosition(cameraCenterWorldPosition, worldPosition) {

}

function getPolygonCentroid(polygon: Array<{ x: number, y: number }> ) : { x: number, y : number } {
    let minX, maxX, minY, maxY;
    for (var i = 0; i < polygon.length; i++)
    {
        minX = (polygon[i].x < minX || minX == null) ? polygon[i].x: minX;
        maxX = (polygon[i].x  > maxX || maxX == null) ? polygon[i].x  : maxX;
        minY = (polygon[i].y < minY || minY == null) ? polygon[i].y : minY;
        maxY = (polygon[i].y > maxY || maxY == null) ? polygon[i].y : maxY;
    }
    return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}

export function getLinesFromPolygon(polygon: Array<{ x: number, y: number }>) {
}

export function translatePoint(point, radians, distance)  : { x: number, y: number } {
    return { x: point.x + distance * Math.cos(radians), y: point.y + distance * Math.sin(radians) };

}

export function flipPolygon(polygon: Array<{ x: number, y: number }>, horizontal: boolean, vertical: boolean) : Array<{ x: number, y: number }> {
    // deep copy
    polygon = polygon.map(p => {
        return {
            ...p
        }
    });
    let maxX = polygon[0].x;
    let minX = polygon[0].x;

    let maxY = polygon[0].y;
    let minY = polygon[0].y;

    for(let i = 1; i < polygon.length; i++) {
        maxX = Math.max(maxX, polygon[i].x);
        minX = Math.min(minX, polygon[i].x);

        maxY = Math.max(maxY, polygon[i].y);
        minY = Math.min(minY, polygon[i].y);
    }

    if(horizontal) {
        for (let i = 0; i < polygon.length; i++) {
            if(polygon[i].x === minX) {
                polygon[i].x = maxX;
            } else if(polygon[i].x === maxX) {
                polygon[i].x = minX;
            } else {
                polygon[i].x = maxX - (polygon[i].x - minX);
            }
        }
    }
    if(vertical) {
        for (let i = 0; i < polygon.length; i++) {
            if (polygon[i].y === minY) {
                polygon[i].y = maxY;
            } else if (polygon[i].y === maxY) {
                polygon[i].y = minY;
            } else {
                polygon[i].y = maxY - (polygon[i].y - minY);
            }
        }
    }
    return polygon;
}

export function rotatePolygon(polygon: Array<{ x: number, y: number }>, degrees: number) {
    const centroid = getPolygonCentroid(polygon);
    return polygon.map(p =>{
        return pivotPoint(p, centroid, toRadian(degrees))
    });
}

export function circleCircleColliding(circle1, circle2) : boolean {
    const radius1 = circle1.radius ? circle1.radius : circle1.r;
    const radius2 = circle2.radius ? circle2.radius : circle2.r;
    const dx = circle1.x - circle2.x;
    const dy = circle1.y - circle2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < radius1 + radius2;
}

export function rectCircleColliding(rect, circle){
    var distX = Math.abs(circle.x - rect.x-rect.width/2);
    var distY = Math.abs(circle.y - rect.y-rect.height/2);

    if (distX > (rect.width /2 + circle.radius)) { return false; }
    if (distY > (rect.height/2 + circle.radius)) { return false; }

    if (distX <= (rect.width /2)) {
        return true;
    }

    if (distY <= (rect.height/2)) { return true; }

    var dx=distX-rect.width /2;
    var dy=distY-rect.height/2;

    return (dx*dx+dy*dy<=(circle.radius*circle.radius));
}

export function rectContainsPoint(rect, point){
    return rect.x <= point.x && point.x <= rect.x + rect.width &&
        rect.y <= point.y && point.y <= rect.y + rect.height;
}

export function getVerticesFromRect(rect) : Array<{x: number, y: number }> {
    let vertices = [];
    vertices.push({ x: rect.x, y: rect.y }); // top left;
    vertices.push({ x: rect.x + rect.width, y: rect.y }); // top right;
    vertices.push({ x: rect.x + rect.width, y: rect.y + rect.height }); // bottom right
    vertices.push({ x: rect.x, y: rect.y + rect.height }); // bottom left
    return vertices;
}

function getSegmentsFromRect(rect) {
    const verticies = getVerticesFromRect(rect);
    return [
        [{ x: verticies[0].x, y: verticies[0].y}, { x: verticies[1].x, y: verticies[1].y}], // top left to top right
        [{ x: verticies[1].x, y: verticies[1].y}, { x: verticies[2].x, y: verticies[2].y}], // top right to bottom right
        [{ x: verticies[3].x, y: verticies[3].y}, { x: verticies[2].x, y: verticies[2].y}], // bottom left to bottom right
        [{ x: verticies[0].x, y: verticies[0].y}, { x: verticies[3].x, y: verticies[3].y}] // top left to bottom left
    ]
}

export function getRectRectSegmentCollisions(rect1, rect2) {
    const radius = rect1.width / 2;
    const circle = {
        x: rect1.x + radius,
        y: rect1.y + radius,
        radius,
    }
    const segments = getSegmentsFromRect(rect2);

    const col1 = segmentCircleAreColliding(circle, segments[0]);
    const col2 = segmentCircleAreColliding(circle, segments[1]);
    const col3 = segmentCircleAreColliding(circle, segments[2]);
    const col4 = segmentCircleAreColliding(circle, segments[3]);
    let array = [];
    if(col1) {
        array.push({  angle: 0, slope: 0 });
    }
    if(col2){
        array.push({ ...col2, slope: "vertical" });
    }
    if(col3){
        array.push({ angle: 0, slope: 0 });
    }
    if(col4){
        array.push({ ...col4, slope: "vertical" });
    }
    return array;
}


const fromLeft = {
    angle: 1.5707963267948966,
    slope: "vertical"
};
const fromRight = {
    angle: -1.5707963267948966,
    slope: "vertical"
}

const topDown = {
    angle: 0,
    slope: 0,
}

export function getRect1CollisionAngleAndSlope(rect1, rect2) {
    // from left/right slope = "vertical";
    // from left angle = 1.5707963267948966
    // from right angle = -1.5707963267948966
    // from top/bottom slope = 0"
    // from top angle = 0
    // from bottom angle = 0
    console.log('rect1:', rect1);
    console.log('rect2:', rect2);

    let array = [];

    const colFromLeft = rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x + rect2.width;
    const colFromRight = rect1.x + rect1.width > rect2.x && rect1.x < rect2.x;
    const colFromTop = rect1.y + rect1.height > rect2.y && rect2.y + rect2.height > rect2.y + rect2.height;
    const colFromBottom = rect1.y < rect2.y + rect2.height && rect1.y < rect2.height;
    if(colFromLeft && !colFromBottom && !colFromTop) {
        return fromLeft;
    } else if (colFromRight && !colFromBottom && !colFromTop) {
        return fromRight;
    } else {
        return topDown;
    }
}

function pointCircle(px, py, cx, cy, r) {

    // get distance between the point and circle's center
    // using the Pythagorean Theorem
    var distX = px - cx;
    var distY = py - cy;
    var distance = Math.sqrt( (distX*distX) + (distY*distY) );

    // if the distance is less than the circle's
    // radius the point is inside!
    if (distance <= r) {
        return true;
    }
    return false;
}

function angleOf(cPosition, hPosition) {
    if(!hPosition) return null;
    return ((Math.atan2(cPosition.x - hPosition.x, cPosition.y - hPosition.y)))
}

export function polyCircleCollision(vertices: Array<{x: number, y: number}>, cx, cy, r) {

    // go through each of the vertices, plus
    // the next vertex in the list
    var next = 0;
    for (var current=0; current<vertices.length; current++) {

        // get next vertex in list
        // if we've hit the end, wrap around to 0
        next = current+1;
        if (next == vertices.length) next = 0;

        // get the PVectors at our current position
        // this makes our if statement a little cleaner
        var vc = vertices[current];    // c for "current"
        var vn = vertices[next];       // n for "next"

        // check for collision between the circle and
        // a line formed between the two vertices
        var collision = lineCircle(vc.x,vc.y, vn.x,vn.y, cx,cy,r);
        if (collision) return collision;

    }

    // the above algorithm only checks if the circle
    // is touching the edges of the polygon – in most
    // cases this is enough, but you can un-comment the
    // following code to also test if the center of the
    // circle is inside the polygon

    // boolean centerInside = polygonPoint(vertices, cx,cy);
    // if (centerInside) return true;

    // otherwise, after all that, return false
    return false;
}


export function lineCircle(x1, y1, x2, y2, cx, cy, r) {

    // is either end INSIDE the circle?
    // if so, return true immediately
    var inside1 = pointCircle(x1,y1, cx,cy,r);
    var inside2 = pointCircle(x2,y2, cx,cy,r);
    if (inside1 || inside2) {

        var angle = Math.atan2((y1 - y2), (x1 - x2))

        return {
            collide: true,
            angle,
        }
    }

    // get length of the line
    var distX = x1 - x2;
    var distY = y1 - y2;
    var len = Math.sqrt( (distX*distX) + (distY*distY) );

    // get dot product of the line and circle
    var dot = ( ((cx-x1)*(x2-x1)) + ((cy-y1)*(y2-y1)) ) / Math.pow(len,2);

    // find the closest point on the line
    var closestX = x1 + (dot * (x2-x1));
    var closestY = y1 + (dot * (y2-y1));

    // is this point actually on the line segment?
    // if so keep going, but if not, return false
    var onSegment = linePoint(x1,y1,x2,y2, closestX,closestY);
    if (!onSegment) return false;

    // get distance to closest point
    distX = closestX - cx;
    distY = closestY - cy;
    var distance = Math.sqrt( (distX*distX) + (distY*distY) );

    if (distance <= r) {
        var angle = Math.atan2((y1 - y2), (x1 - x2));
        return {
            collide: true,
            angle,
            hitPoint: { x: closestX, y: closestX },
        }
    }
    return false;
}

function linePoint( x1,  y1,  x2, y2, px, py) {

    // get distance from the point to the two ends of the line
    var d1 = getDistance({x: px, y: py}, {x: x1, y: y1})
    var d2 = getDistance({x: px, y: py}, {x: x2, y: y2})

    // get the length of the line
    var lineLen = getDistance({x: x1, y: y1}, {x: x2, y: y2 });

    // since floats are so minutely accurate, add
    // a little buffer zone that will give collision
    var buffer = 0.1;    // higher # = less accurate

    // if the two distances are equal to the line's
    // length, the point is on the line!
    // note we use the buffer here to give a range,
    // rather than one #
    if (d1+d2 >= lineLen-buffer && d1+d2 <= lineLen+buffer) {
        return true;
    }
    return false;
}

export function getRandomItemFromArray(array) {
    return array[Math.floor((Math.random()*array.length))];
}

export function popRandomFromArray(array) {
    const index = Math.floor((Math.random()*array.length));
    const value = array[index];
    array.splice(index, 1);
    return value;
}

type PolygonLike = Array<number> | Array<{ x: number, y: number }> | Array<Array<number>>;

export function normalizePolygon(polygon: PolygonLike) : Array<{ x: number, y: number }> {
    if (!polygon.length) throw new Error(`No points in polygon data.`);
    const final: Array<{ x: number, y: number }> = [];
    if (typeof polygon[0] === 'object') {
        if (Array.isArray(polygon[0])) {
            polygon.forEach(p => {
                final.push({x: p[0], y: p[1]})
            })
        } else {
            polygon.forEach(p => {
                final.push({x: p.x, y: p.y})
            })
        }
    } else {
        for (let i = 0; i < polygon.length; i += 2) {
            final.push({x: polygon[i] as number, y: polygon[i + 1] as number})
        }
    }

    return final;
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

export function rectFromBoundingBox(bb:{ minX: number, maxX: number, minY: number, maxY: number }) : { x: number, y: number, w: number, h: number }  {
    const { minX, maxX, minY, maxY } = bb;
    return {
        x: minX,
        y: minY,
        w: maxX - minX,
        h: maxY - minY
    }
}

export function rectFromPolygon(points: Array<{  x: number, y: number }>) : Rect {
    return rectFromBoundingBox(boundingBoxFromPolygon(points));
}

export function polygonContainsPoint(polygon: Array<{ x: number, y: number }>, point: {  x: number, y: number }) {
    // console.log('the point was', colB);
    let collision = false;
    let next = 0;
    for (let i=0; i<polygon.length; i++) {
        next = i+1;
        if (next === polygon.length) next = 0;
        let vc = polygon[i];
        let vn = polygon[next];
        if (((vc.y >= point.y && vn.y < point.y) || (vc.y < point.y && vn.y >= point.y)) &&
            (point.x < (vn.x-vc.x)*(point.y-vc.y) / (vn.y-vc.y)+vc.x)) {
            collision = !collision;
        }
    }
    return collision;
}

export function boundingFromPositions(p1: {  x: number, y: number }, p2: { x: number, y: number }) : { minX: number, maxX: number, minY: number, maxY: number } {
    return {
        minX: Math.min(p1.x, p2.x),
        maxX: Math.max(p1.x, p2.x),
        minY: Math.min(p1.y, p2.y),
        maxY: Math.max(p1.y, p2.y)
    }
}

export function getRandomPositionFromPolygon(polygon: PolygonLike, maxTries=20) : { x: number, y: number } {
    polygon = normalizePolygon(polygon);
    const a = [...polygon];
    const rect = rectFromPolygon(polygon);
    let randomPoint = getRandomPositionFromRect(rect);
    let tries = 0;
    let containedPoint = polygonContainsPoint(polygon, randomPoint);
    do {
        randomPoint = getRandomPositionFromRect(rect);
        containedPoint = polygonContainsPoint(polygon, randomPoint);
        tries++;
    } while(!containedPoint && tries < maxTries);

    randomPoint = containedPoint ? randomPoint : getRandomItemFromArray(polygon);
    return randomPoint;
}

export function getRandomPositionFromCircle(circle: { cx: number, cy: number, r: number }) : { x: number, y: number } {
    const angle = Math.random() * 2 * Math.PI;
    const rSq = Math.random() * circle.r * circle.r;
    return {
        x: Math.sqrt(rSq) * Math.cos(angle),
        y: Math.sqrt(rSq) * Math.cos(angle),
    }
}

export function getRandomPositionFromRect(rect: RectLike, leftBuffer?: number, rightBuffer?: number, topBuffer?: number, bottomBuffer?: number) : { x: number, y: number } {
    let { x, y, w, h } = normalizeRectData(rect);
    leftBuffer = leftBuffer || 0;
    rightBuffer = rightBuffer || 0;
    topBuffer = topBuffer || 0;
    bottomBuffer = bottomBuffer || 0;

    x -= leftBuffer;
    y -= bottomBuffer;
    const finalW = (w + leftBuffer + rightBuffer);
    const finalH = (h + topBuffer + bottomBuffer);

    return {
        x: getRandomNumber(x, x + finalW),
        y: getRandomNumber(y, y + finalH),
    }
}

export function getRandomNumber(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}