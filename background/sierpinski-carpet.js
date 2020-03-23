'use strict';

{

	function SierpinskiCarpet() {
		this.title = 'Sierpinski Carpet';
		this.maxDepth = 6;
		const colors = [];

		colors[0] = 'hsla(330, 100%, 80%, 0.5)';
		colors[1] = 'hsla(  0, 100%, 80%, 0.5)';
		colors[2] = 'hsla( 30, 100%, 80%, 0.5)';

		colors[7] = 'hsla(330, 100%, 50%, 0.5)';
		colors[8] = 'black';
		colors[3] = 'hsla( 30, 100%, 50%, 0.5)';

		colors[6] = 'hsla(330, 100%, 20%, 0.5)';
		colors[5] = 'hsla(  0, 100%, 20%, 0.5)';
		colors[4] = 'hsla( 30, 100%, 20%, 0.5)';
		this.colors = colors;
	}

	backgroundGenerators.set('sierpinski-carpet', new SierpinskiCarpet());

	function Tile(x, y, color) {
		this.x = x;
		this.y = y;
		this.color = color;
	}

	SierpinskiCarpet.prototype.generate = function* (beginTime, canvas, context) {
		const outerSize = Math.min(canvas.width, canvas.height);
		const colors = this.colors;
		let queue = [new Tile(0, 0, 'transparent')];
		let nextQueue = [];
		let prevSideLength = outerSize;
		context.globalCompositeOperation = 'soft-light';

		for (let depth = 0; depth <= this.maxDepth; depth++) {
			let sideLength = outerSize / 3 ** (depth + 1);
			if (sideLength < 1) {
				break;
			}
			for (let tile of queue) {
				const x = tile.x;
				const y = tile.y;
				if (depth < 4) {
					context.fillStyle = tile.color;
					const roundedX = Math.trunc(x);
					const roundedY = Math.trunc(y);
					const roundedWidth = Math.ceil(prevSideLength + x - roundedX);
					const roundedHeight = Math.ceil(prevSideLength + y - roundedY);
					context.fillRect(roundedX, roundedY, roundedWidth, roundedHeight);
					context.fillStyle = colors[8];
				}

				const centreX = x + sideLength;
				const centreY = y + sideLength;
				const roundedCentreX = Math.round(centreX);
				const roundedCentreY = Math.round(centreY);
				const roundedWidth = Math.round(sideLength + centreX - roundedCentreX);
				const roundedHeight = Math.round(sideLength + centreY - roundedCentreY);
				context.fillRect(roundedCentreX, roundedCentreY, roundedWidth, roundedHeight);

				nextQueue.push(new Tile(x, y, colors[0]));
				nextQueue.push(new Tile(x + sideLength, y, colors[1]));
				nextQueue.push(new Tile(x + 2 * sideLength, y, colors[2]));
				nextQueue.push(new Tile(x + 2 * sideLength, y + sideLength, colors[3]));
				nextQueue.push(new Tile(x + 2 * sideLength, y + 2 * sideLength, colors[4]));
				nextQueue.push(new Tile(x + sideLength, y + 2 * sideLength, colors[5]));
				nextQueue.push(new Tile(x, y + 2 * sideLength, colors[6]));
				nextQueue.push(new Tile(x, y + sideLength, colors[7]));
			}
			queue = nextQueue;
			nextQueue = [];
			prevSideLength = sideLength;
		}
	}

}
