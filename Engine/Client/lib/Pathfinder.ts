const cellSize = 10;
const rows = 50;
const columns = 50;

import * as PF from 'pathfinding';

export class GridPathFinder {
    private finder: PF.AStarFinder;
    private grid: PF.Grid;
    private cellSize: number;
    private rows: number;
    private columns;
    private cachedAddedRects: {[id: number]: Array<number> } = {};
    constructor() {
        this.finder = new PF.AStarFinder({
            allowDiagonal: true,
            dontCrossCorners: true
        });
    }

    public create(cellSize, rows, columns, blockingCells?) {
        this.cellSize = cellSize;
        this.rows = rows;
        this.columns = columns;
        this.grid = new PF.Grid(columns, rows);
        blockingCells?.length && this.addBlockingCells(blockingCells);
    }
    // 2d array of [x, y]
    public removeBlockingCells(cells: Array<number>, reqSeq) {
        cells.forEach((xyCellArray) => {
            this.grid.setWalkableAt( Math.floor(xyCellArray[0]/this.cellSize), Math.floor(xyCellArray[1]/this.cellSize), true);
        });
    }
    // 2d array of [x, y]
    public addBlockingCells(cells: Array<number>) {
        cells.forEach((xyCellArray) => {
            this.grid.setWalkableAt( Math.floor(xyCellArray[0]/this.cellSize), Math.floor(xyCellArray[1]/this.cellSize), false);
        });
    }
    public toggleBlockingLine(line: Array<{ x: number, y: number}>, isBlocking: boolean)  {
        const { cellXys } = this.getCellsForLine(line);
        for(let i = 0 ; i < cellXys.length; i+=2) {
            this.grid.setWalkableAt( cellXys[i], cellXys[i+1], !isBlocking);
        }
    }
    public toggleBlockingPolygon(polygon: Array<{ x: number, y: number}>, isBlocking: boolean)  {
        const { cellXys } = this.getBucketsForPolygon(polygon);
        for(let i = 0 ; i < cellXys.length; i+=2) {
            this.grid.setWalkableAt( cellXys[i], cellXys[i+1], !isBlocking);
        }
    }

    public toggleBlockingRect(rect: { x: number, y: number, w: number, h: number }, isBlocking: boolean) {
        const { cellXys } = this.getCellsForRect(rect)
        for(let i = 0 ; i < cellXys.length; i+=2) {
            this.grid.setWalkableAt( cellXys[i], cellXys[i+1], !isBlocking);
        }
    }

    public getPath(fromX, fromY, toX, toY) : Array<number> {
        const gridCopy = this.grid.clone();
        fromX = Math.floor(fromX / this.cellSize);
        fromY = Math.floor(fromY / this.cellSize);
        toX = Math.floor(toX / this.cellSize);
        toY = Math.floor(toY / this.cellSize);
        const path = PF.Util.compressPath(this.finder.findPath(fromX, fromY, toX, toY, this.grid));
        this.grid = gridCopy;
        return path;
    }

    private getCellsForLine(_points : Array<{  x: number, y: number }>, alreadyFoundCells?: Array<number>) : { cellIds: Array<number>, cellXys: Array<number> } {
        const p1 = _points[0];
        const p2 = _points[1];
        if(p1.x === p2.x || p1.y === p2.y) {
            // since its a straight line either horizontal or vertical we can calculate it as a rect with width/height as 1
            const found = this.getCellsForRect({ x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y), w: Math.max(1, Math.abs(p1.x - p2.x)), h:  Math.max(1, Math.abs(p1.y - p2.y)) });
            if(!alreadyFoundCells) return found;
            const finalCellIds = [];
            const finalCellXys = [];
            found.cellIds.forEach((cellId, i) => {
                if(!alreadyFoundCells.includes(cellId)) {
                    finalCellIds.push(cellId);
                    finalCellXys.push(found.cellXys[i*2], found.cellXys[(i*2) + 1])
                }
            })
            return { cellIds: finalCellIds, cellXys: finalCellXys }
        }

        const cellIds = [];
        const cellXys = [];

        const slope = (p2.y - p1.y / p2.x - p1.x);
        const y_intercept = p1.y - ((p1.x) * slope);
        let distanceTraversed = 0;

        const x_inc = p1.x > p2.x ? -1 : 1;
        const y_inc = p1.y > p2.y ? -1 : 1;

        let currentX = p1.x;
        let currentY = p1.y;

        const endX = p2.x;
        const endY = p2.y;

        let neededDistance = 0;
        const points = [currentX, currentY, endX, endY];
        let useXInc = false;

        const nextY = (p1.x + x_inc) * slope + y_intercept;

        if (Math.abs(nextY - p1.y) <= 1) {
            neededDistance = Math.abs(p1.x - p2.x);
            useXInc = true;
        } else {
            neededDistance = Math.abs(p1.y - p2.y);
        }
        let traveling = true;
        while(traveling){
            if(useXInc) {
                currentX = currentX + x_inc;
                distanceTraversed+= x_inc;
                currentY = currentX * slope + y_intercept;
            } else {
                currentY = currentY + y_inc;
                distanceTraversed+= y_inc;
                currentX = (currentY - y_intercept) / slope;
            }
            if(currentX >= 0 && currentY >= 0) {
                points.push(currentX);
                points.push(currentY);
            }

            if(Math.abs(distanceTraversed) >= neededDistance) {
                traveling = false;
            }
        }
        for(let i = 0; i < points.length; i+=2) {
            const relX = Math.floor(points[i] / this.cellSize);
            const relY =Math.floor(points[i+1] / this.cellSize)
            const cellPosition =  relX+ relY * this.columns;
            if(!(cellIds.includes(cellPosition)) && (!alreadyFoundCells || !alreadyFoundCells.includes(cellPosition))){
                cellIds.push(cellPosition);
                cellXys.push(relX, relY);
            }
        }
        return { cellIds, cellXys };
    }
    private getCellsForRect({ x, y, w, h }: { x: number, y: number, w: number, h: number }) :{ cellIds: Array<number>, cellXys: Array<number> } {
        const cellIds = [];
        const cellXys = [];
        if(w > this.cellSize || h > this.cellSize) {
            const cellX_start = Math.floor(x/this.cellSize);
            const cellY_start = Math.floor(y/this.cellSize);

            const cellX_end =  Math.ceil((x + w)/this.cellSize);
            const cellY_end =  Math.ceil((y + h)/this.cellSize);
            for(let i = cellX_start; i < cellX_end; i++) {
                for(let j = cellY_start; j < cellY_end; j++) {
                    let column = i;
                    let row = j;

                    let cellPosition = row * this.columns + column;
                    if(cellIds.includes(cellPosition)){
                        cellIds.push(cellPosition);
                        cellXys.push(i, j);
                    }
                }
            }
        } else {
            const addCell = (_x, _y) => {
                if(!(_x / this.cellSize >= this.columns) && !(y/this.cellSize >= this.rows ) &&
                    !(_x < 0) && !(_y < 0)){
                    const relX =  Math.floor(_x / this.cellSize);
                    const relY = Math.floor(_y / this.cellSize)
                    let cellPosition = relX + relY * this.columns;
                    if(!cellIds.includes(cellPosition)){
                        cellIds.push(cellPosition);
                        cellXys.push(relX, relY)
                    }
                }
            }
            let maxX = x + w;
            let maxY = y + h;
            addCell(x, y);
            addCell(x, maxY);
            addCell(maxX, y);
            addCell(maxX, maxY);
        }
        return { cellIds, cellXys }
    }
    private getBucketsForPolygon(polygon: Array<{ x: number, y: number }>, bucketIds=[]) : { cellIds: Array<number>, cellXys: Array<number> } {
        const cellIds = [];
        const cellXys = [];
        for(let i = 0; i < polygon.length; i++) {
            const p1 = polygon[i];
            const p2 = i === polygon.length-1 ? polygon[0] : polygon[i+1];
            const found = this.getCellsForLine([p1, p2], cellIds);
            cellIds.push(...found.cellIds);
            cellXys.push(...found.cellXys);
        }
        return { cellIds, cellXys };
    }
}
