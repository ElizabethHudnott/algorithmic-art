export default function TruchetTiles() {
	const me = this;
	this.title = '10 PRINT';
	hasRandomness(true);
	this.helpFile = 'help/truchet-tiles.html';

	this.optionsDocument = downloadFile('truchet-tiles.html', 'document').then(function (optionsDoc) {

		optionsDoc.getElementById('tiles-gap-probability').addEventListener('input', function (event) {
			me.blankProbability = parseFloat(this.value);
			generateBackground(0);
		});

		optionsDoc.getElementById('tiles-probability').addEventListener('input', function (event) {
			me.probability = parseFloat(this.value);
			generateBackground(1);
		});

		function changeColor(index) {
			return function (event) {
				me.colors[index] = this.value;
				generateBackground(0);
			};
		}

		optionsDoc.querySelectorAll('input[type=color]').forEach(function (item, index) {
			item.addEventListener('input', changeColor(index));
		});

		optionsDoc.getElementById('tiles-side-length').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value > 0) {
				me.sideLength = value;
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('tiles-cell-aspect').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value > 0) {
				me.cellAspect = value;
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('tiles-line-width').addEventListener('input', function (event) {
			me.strokeRatio = parseFloat(this.value);
			generateBackground(0);
		});

		optionsDoc.getElementById('tiles-shear-0').addEventListener('input', function (event) {
			me.shear[0] = parseFloat(this.value);
			generateBackground(0);
		});

		optionsDoc.getElementById('tiles-shear-1').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (me.shear[0] === me.shear[1] / 2) {
				me.shear[0] = value / 2;
				document.getElementById('tiles-shear-0').value = value / 2;
			}
			me.shear[1] = value;
			generateBackground(0);
		});

		optionsDoc.getElementById('tiles-shear-2').addEventListener('input', function (event) {
			me.shear[2] = parseFloat(this.value);
			generateBackground(0);
		});

		optionsDoc.getElementById('tiles-shear-3').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (me.shear[3] === me.shear[2] / 2) {
				me.shear[2] = value / 2;
				document.getElementById('tiles-shear-2').value = value / 2;
			}
			me.shear[3] = value;
			generateBackground(0);
		});

		return optionsDoc;
	});

	this.sideLength = 25;
	this.cellAspect = 1;
	/*Shearing. Normal range of values is 0-1.
	 * Element 0: X displacement for the middle
	 * Element 1: X displacement for the bottom
	 * Element 2: Y-Shear for the left half
	 * Element 3: Y-Shear for the right half;
	 */
	this.shear = [0, 0, 0, 0];
	// Probability of a cell being left blank
	this.blankProbability = 0;
	// Probability of a forward slash given not blank
	this.probability = 0.5;
	this.colors = ['#887ecb', '#887ecb', '#887ecb', '#887ecb'];
	this.numColors = 4;
	// Stroke width as a proportion of the cell's area.
	this.strokeRatio = 0.12;
}

TruchetTiles.prototype.animatable = {
	'continuous': [
		'colors', 'strokeRatio'
	]
};

TruchetTiles.prototype.generate = function* (context, canvasWidth, canvasHeight, preview) {
	let cellWidth, cellHeight, cellsDownCanvas, cellsAcrossCanvas;
	if (canvasWidth >= canvasHeight) {
		cellHeight = Math.max(Math.trunc(canvasHeight / this.sideLength), 2);
		cellsDownCanvas = Math.ceil(canvasHeight / cellHeight);
		cellWidth = Math.max(Math.round(cellHeight * this.cellAspect), 2);
		cellsAcrossCanvas = Math.ceil(canvasWidth / cellWidth);
	} else {
		cellWidth = Math.max(Math.round(canvasWidth / this.sideLength), 2);
		cellsAcrossCanvas = Math.ceil(canvasWidth / cellWidth);
		cellHeight = Math.max(Math.round(cellWidth / this.cellAspect), 2);
		cellsDownCanvas = Math.ceil(canvasHeight / cellHeight);
	}

	const shear = new Array(3);
	shear[0] = this.shear[0] * cellWidth;
	shear[1] = this.shear[1] * cellWidth - shear[0];
	const totalShearX = shear[0] + shear[1];
	shear[2] = this.shear[2] * cellHeight;
	shear[3] = this.shear[3] * cellHeight - shear[2];
	const totalShearY = shear[2] + shear[3];
	let minX = -totalShearX * cellsDownCanvas;
	let minY = -totalShearY * cellsAcrossCanvas;
	cellsAcrossCanvas += Math.ceil(Math.abs(minX) / cellWidth);
	cellsDownCanvas += Math.ceil(Math.abs(minY) / cellHeight);
	minX = Math.min(minX, 0);
	minY = Math.min(minY, 0);
	//Chevrons
	if ((shear[0] > 0 && shear[1] < 0) || (shear[0] < 0 && shear[1] > 0)) {
		minX--;
		cellsAcrossCanvas += 2;
	}
	if ((shear[2] > 0 && shear[3] < 0) || (shear[2] < 0 && shear[3] > 0)) {
		minY--;
		cellsDownCanvas += 2;
	}

	const tiles = [new DiagonalLineTile('0'), new DiagonalLineTile('1')];
	const tileMap = new Array(cellsDownCanvas);
	const lineWidth = Math.max(Math.round(this.strokeRatio * Math.min(cellWidth, cellHeight)), 1);

	let blankProbability = this.blankProbability;
	let blankSpacing = blankProbability === 0 ? 0 : Math.max(Math.trunc(1 / blankProbability), 1);
	let spacingShift;
	if (blankProbability < 0.06) {
		blankSpacing = 1;
		spacingShift = 0;
	} else {
		const halfBlankSpacing = Math.trunc(blankSpacing / 2);
		let bestSpacingShift = 1;
		let maxRemainder = 0;
		for (spacingShift = 2; spacingShift <= halfBlankSpacing; spacingShift++) {
			const remainder = blankSpacing % spacingShift;
			if (remainder > maxRemainder) {
				bestSpacingShift = spacingShift;
				maxRemainder = remainder;
			}
		}
		spacingShift = bestSpacingShift;
	}
	blankProbability =  this.blankProbability * blankSpacing;
	const maxBlankRun = Math.round(1 / (1 - this.blankProbability) + 0.49) - 1;

	let blankRunLength = 0;
	let blankDiffusion = 0;
	for (let cellY = 0; cellY < cellsDownCanvas; cellY++) {
		const tileMapRow = new Array(cellsAcrossCanvas);
		tileMap[cellY] = tileMapRow;

		if (blankSpacing > 1) {
			blankRunLength = 0;
		}

		for (let cellX = 0; cellX < cellsAcrossCanvas; cellX++) {
			const cellNumber = cellX + cellY * spacingShift + 1;
			const randomBlank = random.next();
			if (cellNumber % blankSpacing === 0 &&  randomBlank < blankProbability) {
				if (blankRunLength < maxBlankRun) {
					blankRunLength++;
					blankDiffusion = 0;
					tileMapRow[cellX] = BlankTile.INSTANCE;
					continue;
				} else {
					blankDiffusion += blankProbability;
				}
			}
			if (blankDiffusion >= 1 && blankRunLength < maxBlankRun) {
				blankRunLength++;
				blankDiffusion--;
				tileMapRow[cellX] = BlankTile.INSTANCE;
				continue;
			}

			blankRunLength = 0;

			const p = random.next();

			if (p < this.probability) {
				// Forward slash
				tileMapRow[cellX] = new Tile(tiles[0]);
			} else {
				// Backslash
				tileMapRow[cellX] = new Tile(tiles[1]);
			}
		}
		unitsProcessed++;
		if (unitsProcessed >= benchmark) {
			const now = calcBenchmark();
			if (now >= yieldTime) {
				yield;
			}
		}
	}

	for (let cellY = 0; cellY < cellsDownCanvas; cellY++) {
		const tileMapRow = tileMap[cellY];
		for (let cellX = 0; cellX < cellsAcrossCanvas; cellX++) {
			tileMapRow[cellX].randomizeColors(this.numColors);
		}
	}

	for (let cellY = 0; cellY < cellsDownCanvas; cellY++) {
		const tileMapRow = tileMap[cellY];
		for (let cellX = 0; cellX < cellsAcrossCanvas; cellX++) {
			const x = minX + cellX * cellWidth + cellY * totalShearX;
			const y = minY + cellY * cellHeight + cellX * totalShearY;
			tileMapRow[cellX].draw(context, x, y, cellWidth, cellHeight, lineWidth, shear, this);
		}
	}
}

/*	Locations of port numbers
	0	1	2	3	4
	15				5
	14				6
	13				7
	12	11	10	9	8
 */

class TileType {
	constructor(connections) {
		// Maps a port number to an array of port numbers
		this.connections = connections;
		for (let [connector, connectees] of Array.from(connections.entries())) {
			for (let connectee of connectees) {
				let reverseConnections = connections.get(connectee);
				if (reverseConnections === undefined) {
					reverseConnections = [];
					connections.set(connectee, reverseConnections);
				}
				if (!reverseConnections.includes(connector)) {
					reverseConnections.push(connector);
				}
			}
		}
	}
}

class Tile {
	constructor(tileType) {
		this.tileType = tileType;
		this.colors = new Map();
	}

	flowColor(inPort, color) {
		if (this.colors.has(inPort)) {
			return [];
		}
		this.colors.set(inPort, color);
		const outPorts = [];
		const connected = this.tileType.connections.get(inPort);
		if (connected !== undefined) {
			for (let outPort of connected) {
				if (!this.colors.has(outPort)) {
					this.colors.set(outPort, color);
					outPorts.push(outPort);
				}
			}
		}
		return outPorts;
	}

	randomizeColors(numColors) {
		for (let port of this.tileType.connections.keys()) {
			const colorNum = Math.trunc(Math.random() * numColors);
			this.colors.set(port, colorNum);
		}
	}

	draw(context, x, y, cellWidth, cellHeight, lineWidth, shear, generator) {
		this.tileType.draw(context, this, x, y, cellWidth, cellHeight, lineWidth, shear, generator);
	}

}

function coordinateTransform(xReference, yReference, width, height, shear, relativeX, relativeY) {
	const halfWidth = width / 2;
	const halfHeight = height / 2;
	let transformedX, transformedY;
	if (relativeY <= halfHeight) {
		transformedX = Math.round(relativeX + relativeY / halfHeight * shear[0]);
	} else {
		transformedX = Math.round(relativeX + shear[0] + (relativeY - halfHeight) / halfHeight * shear[1]);
	}
	if (relativeX <= halfWidth) {
		transformedY = Math.round(relativeY + relativeX / halfWidth * shear[2]);
	} else {
		transformedY = Math.round(relativeY + shear[2] + (relativeX - halfWidth) / halfWidth * shear[3]);
	}
	return [xReference + transformedX, yReference + transformedY];
}

class BlankTile extends TileType {
	static INSTANCE = new Tile(new BlankTile());

	constructor() {
		super(new Map());
	}

	draw(context, tile, left, top, width, height, lineWidth, shear, generator) {
		// Nothing to draw
	}
}

class DiagonalLineTile extends TileType {
	constructor(str) {
		const connections = new Map();
		if (str === '0') {
			// Forward slash
			connections.set(4, [12]);
		} else {
			// Backslash
			connections.set(0, [8]);
		}
		super(connections);
		this.type = str;
	}

	draw(context, tile, left, top, width, height, lineWidth, shear, generator) {
		const transform = coordinateTransform.bind(null, left, top, width, height, shear);
		const lineWidth1 = Math.trunc(lineWidth);
		const lineWidth2 = Math.ceil(lineWidth);
		context.beginPath();
		if (this.type === '0') {
			// Forward slash
			context.fillStyle = generator.colors[tile.colors.get(4)];
			let y = height - lineWidth1;
			context.moveTo(...transform(0, height - lineWidth1));
			context.lineTo(...transform(width, -lineWidth1))
			context.lineTo(...transform(width, lineWidth2));
			context.lineTo(...transform(0, height + lineWidth2));
		} else {
			// Backslash
			context.fillStyle = generator.colors[tile.colors.get(0)];
			context.moveTo(...transform(0, -lineWidth1));
			context.lineTo(...transform(width, height - lineWidth1));
			context.lineTo(...transform(width, height + lineWidth2));
			context.lineTo(...transform(0, lineWidth2));
		}
		context.fill();
	}

}
