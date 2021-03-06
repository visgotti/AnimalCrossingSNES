const cellSize = 10;
const rows = 50;
const columns = 50;
importScripts('../bower_components/pathfinding/pathfinding-browser.js');

class PathFinder {
    constructor() {
        this.finder = new PF.AStarFinder({
            allowDiagonal: true,
            dontCrossCorners: true
        });
    }
    create(cellSize, rows, columns, blockingCells) {
        this.cellSize = cellSize;
        this.rows = rows;
        this.columns = columns;
        this.grid = new PF.Grid(columns, rows);
        this.addBlockingCells(blockingCells, -1);
    }
    // 2d array of [x, y]
    removeBlockingCells(cells, reqSeq) {
        cells.forEach((xyCellArray) => {
            this.grid.setWalkableAt( Math.floor(xyCellArray[0]/this.cellSize), Math.floor(xyCellArray[1]/this.cellSize), true);
        });
        postMessage([2, true, reqSeq]);
    }
    // 2d array of [x, y]
    addBlockingCells(cells, reqSeq) {
        cells.forEach((xyCellArray) => {
            this.grid.setWalkableAt( Math.floor(xyCellArray[0]/this.cellSize), Math.floor(xyCellArray[1]/this.cellSize), false);
        });
        if(reqSeq > -1) {
            postMessage([3, true, reqSeq]);
        }
    }
    getPath(fromX, fromY, toX, toY, seq) {
        const gridCopy = this.grid.clone();
        fromX = Math.floor(fromX / this.cellSize);
        fromY = Math.floor(fromY / this.cellSize);
        toX = Math.floor(toX / this.cellSize);
        toY = Math.floor(toY / this.cellSize);
        const path = PF.Util.compressPath(this.finder.findPath(fromX, fromY, toX, toY, this.grid));
        postMessage([1, path, seq]);
        this.grid = gridCopy;
    }
}

const pf = new PathFinder();
onmessage = function(e) {
    const [protocol, ...params] = e.data;
    if(protocol === 0) { // create
     //   const [cellSize, rows, columns, blockingCells] = params;
        pf.create(params[0], params[1], params[2], params[3]);
    } else if (protocol === 1) { // getPath
     //   const [startX, startY, toX, toY, reqSeq] = params;
        pf.getPath(params[0], params[1], params[2], params[3], params[4]);
    } else if (protocol === 2) { // set as walkable
        pf.removeBlockingCells(params[0], params[1])
    } else if (protocol === 3) { // set as blockable
        pf.addBlockingCells(params[0], params[1]);
    }
}
