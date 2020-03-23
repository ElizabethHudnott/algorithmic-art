'use strict';

{

	function SierpinskiCarpet() {
		this.title = 'Sierpinski Carpet';
		this.maxDepth = 6;
	}

	backgroundGenerators.set('sierpinski-carpet', new SierpinskiCarpet());

	function Tile(x, y) {
		this.x = x;
		this.y = y;
	}

	SierpinskiCarpet.prototype.generate = function* (beginTime, canvas, context) {
		const outerSize = Math.min(canvas.width, canvas.height);
		let queue = [new Tile(0, 0)];
		let nextQueue = [];
		for (let depth = 0; depth <= this.maxDepth; depth++) {
			let sideLength = Math.round(outerSize / 3 ** (depth + 1));
			if (sideLength === 0) {
				break;
			}
			for (let tile of queue) {
				const x = tile.x;
				const y = tile.y;
				context.fillRect(x + sideLength, y + sideLength, sideLength, sideLength);
				nextQueue.push(new Tile(x, y));
				nextQueue.push(new Tile(x + sideLength, y));
				nextQueue.push(new Tile(x + 2 * sideLength, y));
				nextQueue.push(new Tile(x + 2 * sideLength, y + sideLength));
				nextQueue.push(new Tile(x + 2 * sideLength, y + 2 * sideLength));
				nextQueue.push(new Tile(x + sideLength, y + 2 * sideLength));
				nextQueue.push(new Tile(x, y + 2 * sideLength));
				nextQueue.push(new Tile(x, y + sideLength));
			}
			queue = nextQueue;
			nextQueue = [];
		}
	}

}
