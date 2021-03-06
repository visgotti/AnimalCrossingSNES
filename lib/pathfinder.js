// const Worker = require('worker-loader!./pathfinder.worker.js');
class Pathfinder {
    constructor() {
        this.worker = null;
        this.pendingPathRequests = {};
        this.reqSeq = 0;
    }
    create(cellSize, rows, columns, blockingCells) {
        this.worker && this.destroy();
        this.worker = new Worker('..\\..\\lib\\pathfinder.worker.js');
        this.worker.postMessage([0, cellSize, rows, columns, blockingCells]);
        this.worker.onmessage = (e) => {
            const [protocol, ...params] = e.data;
            if(protocol === 1) { // getPath
                const [paths, seq] = params;
                const positionPaths = paths.map(p => {
                    return {
                        x: p[0] * cellSize + (cellSize / 2),
                        y: p[1] * cellSize + (cellSize / 2),
                    }
                });
                if(this.pendingPathRequests[seq]) {
                    this.pendingPathRequests[seq](positionPaths);
                }
            } else {
                const [success, seq] = params;
                if(this.pendingPathRequests[seq]) {
                    this.pendingPathRequests[seq](success);
                }
            }
        }
    }

    async removeBlockingCells(positions) {
        const curReqSeq = this.reqSeq++;
        this.worker.postMessage([2, positions, curReqSeq]);
        return new Promise((resolve, reject) => {
            this.pendingPathRequests[curReqSeq] = (success) => {
                delete this.pendingPathRequests[curReqSeq];
                if(success) {
                    return resolve(true);
                } else {
                    return reject('Error setting as walkable.')
                }
            };
        });
    }

    async addBlockingCells(positions) {
        const curReqSeq = this.reqSeq++;
        this.worker.postMessage([3, positions, curReqSeq]);
        return new Promise((resolve, reject) => {
            this.pendingPathRequests[curReqSeq] = (success) => {
                delete this.pendingPathRequests[curReqSeq];
                if(success) {
                    return resolve(true);
                } else {
                    return reject('Error setting as not walkable.')
                }
            };
        });
    }

    destroy() {
        this.worker.terminate();
        this.worker = null;
        this.pendingPathRequests = {};
    }

    async getPath(startPosition, toPosition) {
        if(!this.worker) throw new Error('no worker');
        const curReqSeq = this.reqSeq++;
        this.worker.postMessage([1, startPosition.x, startPosition.y, toPosition.x, toPosition.y, curReqSeq]);
        return new Promise((resolve, reject) => {
            this.pendingPathRequests[curReqSeq] = (positionPaths) => {
                console.log('resolved:', [...positionPaths]);
                delete this.pendingPathRequests[curReqSeq];
                return resolve(positionPaths);
            };
        });
    }
}

if(typeof global !== 'undefined') {
    global.Pathfinder = Pathfinder;
} else if (typeof window !== 'undefined') {
    window.Pathfinder = Pathfinder;
}