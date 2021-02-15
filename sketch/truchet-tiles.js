const PREVIEW_SIZE = 256;
const C = 0.551915024494;

export default function TruchetTiles() {
	const me = this;
	this.title = 'Tiling';
	hasRandomness(true);
	this.helpFile = 'help/truchet-tiles.html';

	this.optionsDocument = downloadFile('truchet-tiles.html', 'document').then(function (optionsDoc) {

		function listenSlider(id, property) {
			optionsDoc.getElementById(id).addEventListener('input', function (event) {
				me[property] = parseFloat(this.value);
				generateBackground(0);
			});
		}

		listenSlider('tiles-gap-probability', 'gapProbability');
		listenSlider('tiles-flow-probability', 'flowProbability');

		const designCanvas = optionsDoc.getElementById('tiles-design');
		const designContext = designCanvas.getContext('2d');
		let currentTileNum = 0;
		let currentColor = 0;

		function drawPreview() {
			const lineWidth = Math.round(Math.max(me.strokeRatio * PREVIEW_SIZE, 1));
			const shear = [0, 0, 0, 0];
			designContext.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
			me.tileTypes[currentTileNum].drawPreview(designContext, lineWidth, me);
		}

		drawPreview();

		optionsDoc.getElementById('tiles-tile-num').addEventListener('input', function (event) {
			const value = parseInt(this.value);
			if (value >= 0 && value < me.tileTypes.length) {
				currentTileNum = value;
				drawPreview();
				document.getElementById('tiles-tile-frequency').value = me.tileFrequencies[currentTileNum];
			}
		});


		optionsDoc.getElementById('tiles-add-tile').addEventListener('click', function (event) {
			currentTileNum = me.tileTypes.length;
			me.tileTypes[currentTileNum] = new MiddleLineTile('000000000');
			me.tileFrequencies[currentTileNum] = 1;
			drawPreview();
			const tileNumInput = document.getElementById('tiles-tile-num');
			tileNumInput.value = currentTileNum;
			tileNumInput.max = currentTileNum;
			document.getElementById('tiles-del-tile').disabled = false;
			document.getElementById('tiles-tile-frequency').value = 1;
		});

		optionsDoc.getElementById('tiles-del-tile').addEventListener('click', function (event) {
			me.tileTypes.splice(currentTileNum, 1);
			me.tileFrequencies.splice(currentTileNum, 1);
			const tileNumInput = document.getElementById('tiles-tile-num');
			if (currentTileNum > 0) {
				currentTileNum--;
				tileNumInput.value = currentTileNum;
			}
			tileNumInput.max = me.tileTypes.length - 1;
			this.disabled = me.tileTypes.length === 1;
			document.getElementById('tiles-tile-frequency').value = me.tileFrequencies[currentTileNum];
			drawPreview();
			generateBackground(0);
		});

		designCanvas.addEventListener('click', function (event) {
			const lineWidth = Math.min(Math.max(me.strokeRatio * PREVIEW_SIZE, 42), 72);
			const currentTile = me.tileTypes[currentTileNum];
			me.tileTypes[currentTileNum] = currentTile.mutate(event.offsetX, event.offsetY, lineWidth, currentColor);
			drawPreview();
			generateBackground(0);
		});

		optionsDoc.getElementById('tiles-tile-frequency').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value > 0) {
				me.tileFrequencies[currentTileNum] = value;
			}
			generateBackground(0);
		});

		optionsDoc.getElementById('tiles-stroke-ratio').addEventListener('input', function (event) {
			me.strokeRatio = parseFloat(this.value);
			generateBackground(0);
			drawPreview();
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

		optionsDoc.getElementById('tiles-shear-0').addEventListener('input', function (event) {
			me.shear[0] = parseFloat(this.value);
			generateBackground(0);
		});

		optionsDoc.getElementById('tiles-shear-1').addEventListener('input', function (event) {
			me.shear[1] = parseFloat(this.value);
			generateBackground(0);
		});

		optionsDoc.getElementById('tiles-shear-2').addEventListener('input', function (event) {
			me.shear[2] = parseFloat(this.value);
			generateBackground(0);
		});

		optionsDoc.getElementById('tiles-shear-3').addEventListener('input', function (event) {
			me.shear[3] = parseFloat(this.value);
			generateBackground(0);
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
	// Stroke width as a proportion of the cell's area.
	this.strokeRatio = 0.25;

	// Probability of a cell being left blank
	this.gapProbability = 0;

	this.colors = [
		'hsl(  4,  86%, 54%)',	// Red
		'hsl(148, 100%, 27%)',	// Green
		'hsl(222,  90%, 32%)',	// Blue
		'hsl( 49,  95%, 50%)',	// Yellow
		'hsl(180,  85%, 40%)',	// Turquoise
		'hsl(345,   6%, 18%)',	// Charcoal Grey
		'hsl(262,  42%, 49%)',	// Purple
		'hsl(346,  94%, 83%)',	// Pink
		'hsl( 94,  63%, 52%)',	// Lime
		'hsl(201,  87%, 42%)',	// Azure
		'hsl( 26,  90%, 56%)',	// Orange
		'hsl(205,   6%, 59%)',	// Grey
		'hsl(323,  99%, 26%)',	// Grape
		'hsl(327,  77%, 56%)',	// Magenta
		'hsl( 30, 100%, 26%)',	// Brown
	];
	this.numColors = 4;
	this.flowProbability = 1;

	// this.tileTypes = [new DiagonalLineTile('0'), new DiagonalLineTile('1')];
	this.tileTypes = [
		new MiddleLineTile('000010100'),	// Vertical line
		new MiddleLineTile('000001010'),	// Horizontal line
		new MiddleLineTile('000011100'),	// T-shape to the right
		new MiddleLineTile('000001110'),	// T-shape downwards
		new MiddleLineTile('000010110'),	// T-shape to the left
		new MiddleLineTile('000011010'),	// T-shape upwards
		new MiddleLineTile('100000001'),	// Curve, upper right
		new MiddleLineTile('010000002'),	// Curve, lower right
		new MiddleLineTile('001000004'),	// Curve, lower left
		new MiddleLineTile('000100008'),	// Curve, upper left
	];

	this.tileFrequencies = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
}

TruchetTiles.prototype.animatable = {
	'continuous': [
		'sideLength', 'cellAspect', 'shear', 'strokeRatio',
		'gapProbability',
		'colors',
		'flowProbability',
	],
	'stepped': [
		'numColors',
	]
};

/** Connections from a port on one tile to ports on neighbouring tiles.
 *	Format: output port -> collection of delta x, delta y, input port number triples
 */
TruchetTiles.connections = new Array(16);
TruchetTiles.connections[ 0] = [ [-1,  0,  4], [ 0, -1, 12], [-1, -1,  8]	];
TruchetTiles.connections[ 1] = [ [ 0, -1, 11]								];
TruchetTiles.connections[ 2] = [ [ 0, -1, 10]								];
TruchetTiles.connections[ 3] = [ [ 0, -1,  9]								];
TruchetTiles.connections[ 4] = [ [ 1,  0,  0], [ 0, -1,  8], [ 1, -1, 12]	];
TruchetTiles.connections[ 5] = [ [ 1,  0, 15]								];
TruchetTiles.connections[ 6] = [ [ 1,  0, 14]								];
TruchetTiles.connections[ 7] = [ [ 1,  0, 13]								];
TruchetTiles.connections[ 8] = [ [ 1,  0, 12], [ 0,  1,  4], [ 1,  1,  0]	];
TruchetTiles.connections[ 9] = [ [ 0,  1,  3]								];
TruchetTiles.connections[10] = [ [ 0,  1,  2]								];
TruchetTiles.connections[11] = [ [ 0,  1,  1]								];
TruchetTiles.connections[12] = [ [-1,  0,  8], [ 0,  1,  0], [-1,  1,  4]	];
TruchetTiles.connections[13] = [ [-1,  0,  7]								];
TruchetTiles.connections[14] = [ [-1,  0,  6]								];
TruchetTiles.connections[15] = [ [-1,  0,  5]								];

TruchetTiles.prototype.connectedTiles = function (x, y, port, width, height) {
	const connections = TruchetTiles.connections[port];
	const filteredLocations = [];
	for (let connection of connections) {
		const locationX = x + connection[0];
		const locationY = y + connection[1];
		if (locationX >= 0 && locationX < width && locationY >= 0 && locationY < height) {
			filteredLocations.push([locationX, locationY, connection[2]]);
		}
	}
	return filteredLocations;
}

TruchetTiles.prototype.colorPermutation = function* (excludeColors) {
	const colors = [];
	for (let i = 0; i < this.numColors; i++) {
		if (!excludeColors.has(i)) {
			colors.push(i);
		}
	}
	const numColors = colors.length;
	const permutationLength = Math.min(numColors, 3);
	for (let i = 0; i < permutationLength; i++) {
		const r = Math.trunc(random.next() * (numColors - i)) + i;
		const temp = colors[i];
		colors[i] = colors[r];
		colors[r] = temp;
		yield colors[i];
	}
	let i = 0;
	while (true) {
		yield colors[i % permutationLength];
		i++
	}
}

function chooseColor(histogram) {
	const max = Math.max(...histogram);
	if (max === 0) {
		return Math.trunc(random.next() * histogram.length);
	}
	const inverse = new Array(histogram.length);
	let total = 0;
	for (let i = 0; i < histogram.length; i++) {
		const value = histogram[i];
		const inverseVal = max - value;
		inverse[i] = inverseVal;
		total += inverseVal;
	}
	if (total === 0) {
		return Math.trunc(random.next() * histogram.length);
	}
	const r = random.next() * total;
	let accumulated = 0;
	for (let i = 0; i < inverse.length; i++) {
		accumulated += inverse[i];
		if (r < accumulated) {
			return i;
		}
	}
}

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
	cellsAcrossCanvas += Math.ceil(Math.abs(minX) / cellWidth) + 1;
	cellsDownCanvas += Math.ceil(Math.abs(minY) / cellHeight) + 1;
	minX = Math.min(minX, 0);
	minY = Math.min(minY, 0);
	//Chevrons
	if (shear[0] > 0) {
		minX--;
	}
	if (shear[2] > 0) {
		minY--;
	}

	let tileFrequenciesTotal = 0;
	const tileCDF = new Array(this.tileFrequencies.length);
	for (let i = 0; i < tileCDF.length; i++) {
		tileFrequenciesTotal += this.tileFrequencies[i];
		tileCDF[i] = tileFrequenciesTotal;
	}

	const tileMap = new Array(cellsDownCanvas);
	const lineWidth = Math.max(Math.round(this.strokeRatio * Math.min(cellWidth, cellHeight)), 1);

	let gapProbability = this.gapProbability;
	let blankSpacing = gapProbability === 0 ? 0 : Math.max(Math.trunc(1 / gapProbability), 1);
	let spacingShift;
	if (gapProbability < 0.06) {
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
	gapProbability =  this.gapProbability * blankSpacing;
	const maxBlankRun = Math.round(1 / (1 - this.gapProbability) + 0.49) - 1;

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
			if (cellNumber % blankSpacing === 0 &&  randomBlank < gapProbability) {
				if (blankRunLength < maxBlankRun) {
					blankRunLength++;
					blankDiffusion = 0;
					tileMapRow[cellX] = BlankTile.INSTANCE;
					continue;
				} else {
					blankDiffusion += gapProbability;
				}
			}
			if (blankDiffusion >= 1 && blankRunLength < maxBlankRun) {
				blankRunLength++;
				blankDiffusion--;
				tileMapRow[cellX] = BlankTile.INSTANCE;
				continue;
			}

			blankRunLength = 0;

			const p = random.next() * tileFrequenciesTotal;
			let tileTypeIndex = this.tileTypes.length - 1;
			while (tileTypeIndex > 0 && tileCDF[tileTypeIndex - 1] >= p) {
				tileTypeIndex--;
			}
			tileMapRow[cellX] = new Tile(this.tileTypes[tileTypeIndex]);
		}
		unitsProcessed++;
		if (unitsProcessed >= benchmark) {
			const now = calcBenchmark();
			if (now >= yieldTime) {
				yield;
			}
		}
	}

	const histogram = new Array(this.numColors);
	histogram.fill(0);

	for (let cellY = 0; cellY < cellsDownCanvas; cellY++) {
		const tileMapRow = tileMap[cellY];
		for (let cellX = 0; cellX < cellsAcrossCanvas; cellX++) {
			const tile = tileMapRow[cellX];
			for (let port of tile.ports()) {
				const color = chooseColor(histogram);
				let stack = [[cellX, cellY, port, color]];
				do {
					const length = stack.length;
					const [x, y, inPort, color] = stack[length - 1];
					stack.splice(length - 1, 1);
					const stackedTile = tileMap[y][x];
					if (stackedTile.getColor(inPort) !== undefined) {
						continue;
					}
					let connected = this.connectedTiles(x, y, inPort, cellsAcrossCanvas, cellsDownCanvas);
					if (random.next() < this.flowProbability) {
						for (let [x2, y2, port2] of connected) {
							if (tileMap[y2][x2].getColor(port2) === undefined) {
								stack.push([x2, y2, port2, color]);
							}
						}
					} else {
						const excluded = new Set();
						excluded.add(color);
						for (let [x2, y2, port2] of connected) {
							const color2 = tileMap[y2][x2].getColor(port2);
							if (color2 !== undefined) {
								excluded.add(color2);
							}
						}
						const permutation = this.colorPermutation(excluded);
						for (let [x2, y2, port2] of connected) {
							if (tileMap[y2][x2].getColor(port2) === undefined) {
								stack.push([x2, y2, port2, permutation.next().value]);
							}
						}
					}
					const outPorts = stackedTile.flowColor(inPort, color, histogram);
					for (let outPort of outPorts) {
						connected = this.connectedTiles(x, y, outPort, cellsAcrossCanvas, cellsDownCanvas);
						if (random.next() < this.flowProbability) {
							for (let [x2, y2, port2] of connected) {
								stack.push([x2, y2, port2, color]);
							}
						} else {
							const excluded = new Set();
							excluded.add(color);
							for (let [x2, y2, port2] of connected) {
								const color2 = tileMap[y2][x2].getColor(port2);
								if (color2 !== undefined) {
									excluded.add(color2);
								}
							}
							const permutation = this.colorPermutation(excluded);
							for (let [x2, y2, port2] of connected) {
								stack.push([x2, y2, port2, permutation.next().value]);
							}
						}
					}
				} while (stack.length > 0);
			} // For each port
		} // For each x
	} // For each y

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
		// Maps a port number to an set of port numbers
		this.connections = connections;
		for (let [connector, connectees] of Array.from(connections.entries())) {
			for (let connectee of connectees) {
				let reverseConnections = connections.get(connectee);
				if (reverseConnections === undefined) {
					reverseConnections = new Set();
					connections.set(connectee, reverseConnections);
				}
				reverseConnections.add(connector);
			}
		}
		// Find the transitive closure
		let added;
		do {
			added = false;
			for (let [connector, connectees] of connections.entries()) {
				for (let intermediate of connectees) {
					const destinations = connections.get(intermediate);
					if (destinations !== undefined) {
						for (let destination of destinations) {
							if (connector !== destination && !connectees.has(destination)) {
								connectees.add(destination);
								added = true;
							}
						}
					}
				}
			}
		} while (added === true);
	}

	drawPreview(context, lineWidth, generator) {
		this.draw(context, this.preview, 0, 0, PREVIEW_SIZE, PREVIEW_SIZE, lineWidth, [0, 0, 0, 0], generator);
	}

}

class Tile {
	constructor(tileType, colors) {
		this.tileType = tileType;
		// Maps port -> color
		this.colors = colors || new Map();
	}

	getColor(port) {
		return this.colors.get(port);
	}

	flowColor(inPort, color, histogram) {
		this.colors.set(inPort, color);
		let numColored = 1;
		const outPorts = [];
		const connected = this.tileType.connections.get(inPort);
		if (connected !== undefined) {
			for (let outPort of connected) {
				this.colors.set(outPort, color);
				numColored++;
				outPorts.push(outPort);
			}
		}
		histogram[color] += numColored;
		return outPorts;
	}

	ports() {
		return this.tileType.connections.keys();
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
		const destinations = new Set();
		if (str === '0') {
			// Forward slash
			destinations.add(12);
			connections.set(4, destinations);
		} else {
			// Backslash
			destinations.add(8);
			connections.set(0, destinations);
		}
		super(connections);
		this.type = str;
		//TODO add preview(), mutate()
	}

	draw(context, tile, left, top, width, height, lineWidth, shear, generator) {
		const transform = coordinateTransform.bind(null, left, top, width, height, shear);
		const lineWidth1 = Math.trunc(lineWidth);
		const lineWidth2 = Math.ceil(lineWidth);
		context.beginPath();
		if (this.type === '0') {
			// Forward slash
			let y = height - lineWidth1;
			context.moveTo(...transform(0, height - lineWidth1));
			context.lineTo(...transform(width, -lineWidth1))
			context.lineTo(...transform(width, lineWidth2));
			context.lineTo(...transform(0, height + lineWidth2));
			context.fillStyle = generator.colors[tile.colors.get(4)];
		} else {
			// Backslash
			context.moveTo(...transform(0, -lineWidth1));
			context.lineTo(...transform(width, height - lineWidth1));
			context.lineTo(...transform(width, height + lineWidth2));
			context.lineTo(...transform(0, lineWidth2));
			context.fillStyle = generator.colors[tile.colors.get(0)];
		}
		context.fill();
	}

}

class MiddleLineTile extends TileType {
	constructor(str) {
		const connections = new Map();
		const colors = new Array(8);
		const defaultColors = new Map();
		const colorMap = new Map();
		// First four characters represent diagonal lines
		for (let i = 0; i < 4; i++) {
			const color = parseInt(str[i]);
			colors[i] = color;
			if (str[i] !== '0') {
				let mapping = colorMap.get(color);
				if (mapping === undefined) {
					mapping = new Set();
					colorMap.set(color, mapping);
				}
				mapping.add(i * 4 + 2);
				mapping.add(((i + 1) * 4 + 2) % 16);
				defaultColors.set(i * 4 + 2, color - 1);
				defaultColors.set((i + 1) * 4 + 2, color - 1);
			}
		}
		// Second four characters represent horizontal and vertical lines
		for (let i = 0; i < 4; i++) {
			const color = parseInt(str[i + 4]);
			colors[i + 4] = color;
			if (str[i + 4] !== '0') {
				let mapping = colorMap.get(color);
				if (mapping === undefined) {
					mapping = new Set();
					colorMap.set(color, mapping);
				}
				mapping.add(i * 4 + 2);
				defaultColors.set(i * 4 + 2, color - 1);
			}
		}
		for (let [color, ports] of colorMap.entries()) {
			for (let port1 of ports) {
				for (let port2 of ports) {
					if (port1 !== port2) {
						let destinations = connections.get(port1);
						if (destinations === undefined) {
							destinations = new Set();
							connections.set(port1, destinations);
						}
						destinations.add(port2);
					}
				}
			}
		}
		super(connections);
		this.colors = colors;
		this.curved = parseInt(str.slice(-1), 16);
		this.preview = new Tile(this, defaultColors);
		this.str = str;
	}

	mutate(x, y, lineWidth, color) {
		const halfLength = PREVIEW_SIZE / 2;
		const min = halfLength - lineWidth / 2;
		const max = halfLength + lineWidth / 2;
		let index;
		if (x >= min && x <= max) {
			index = y < halfLength ? 4 : 6;
		} else if (y >= min && y <= max) {
			index = x < halfLength ? 7 : 5;
		} else if (x < halfLength) {
			index = y < halfLength ? 3 : 2;
		} else {
			index = y < halfLength ? 0 : 1;
		}
		let curved = this.curved;
		let newChar;
		if (this.str[index] === '0') {
			// Transition not present to straight.
			newChar = String(color + 1);
		} else if (index < 4) {
			const wasCurved = (curved & (1 << index)) !== 0;
			if (wasCurved) {
				// Transition curved to not present.
				newChar = '0';
				curved = curved - (1 << index);
			} else {
				// Transition straight to curved.
				newChar = this.str[index];
				curved = curved + (1 << index);
			}
		} else {
			// Transition straight to not present.
			newChar = '0';
		}
		const newStr = this.str.slice(0, index) + newChar + this.str.slice(index + 1, -1) + curved.toString(16);
		return new MiddleLineTile(newStr);
	}

	draw(context, tile, left, top, width, height, lineWidth, shear, generator) {
		const transform = coordinateTransform.bind(null, left, top, width, height, shear);
		const centre = Math.trunc(width / 2);
		const middle = Math.trunc(height / 2);
		const lineWidth1 = Math.trunc(lineWidth / 2);
		const lineWidth2 = Math.ceil(lineWidth / 2);
		const topToCentre = this.colors[4];
		const bottomToCentre = this.colors[6];
		const leftToCentre = this.colors[7];
		const rightToCentre = this.colors[5];
		if (topToCentre !== 0) {
			context.beginPath();
			context.moveTo(...transform(centre - lineWidth1, 0));
			context.lineTo(...transform(centre + lineWidth2, 0));
			context.lineTo(...transform(centre + lineWidth2, middle));
			if (bottomToCentre === 0) {
				if (leftToCentre !== 0 || rightToCentre !== 0) {
					context.lineTo(...transform(centre + lineWidth2, middle + lineWidth2));
					context.lineTo(...transform(centre - lineWidth1, middle + lineWidth2));
				}
				context.lineTo(...transform(centre - lineWidth1, middle));
				context.fillStyle = generator.colors[tile.colors.get(2)];
				context.fill();
			}
		}
		if (bottomToCentre !== 0) {
			if (topToCentre === 0) {
				context.beginPath();
				context.moveTo(...transform(centre + lineWidth2, middle - lineWidth1));
				context.lineTo(...transform(centre + lineWidth2, middle));
			}
			context.lineTo(...transform(centre + lineWidth2, height));
			context.lineTo(...transform(centre - lineWidth1, height));
			context.lineTo(...transform(centre - lineWidth1, middle));
			if (topToCentre === 0) {
				context.lineTo(...transform(centre - lineWidth1, middle - lineWidth1));
			}
			context.fillStyle = generator.colors[tile.colors.get(10)];
			context.fill();
		}
		if (leftToCentre !== 0) {
			let x = centre;
			if (topToCentre !== 0 || bottomToCentre !== 0) {
				x -= lineWidth1;
			}
			context.beginPath();
			context.moveTo(...transform(0, middle - lineWidth1));
			context.lineTo(...transform(x, middle - lineWidth1));
			context.lineTo(...transform(x, middle));
			context.lineTo(...transform(x, middle + lineWidth2));
			context.lineTo(...transform(0, middle + lineWidth2));
			context.fillStyle = generator.colors[tile.colors.get(14)];
			context.fill();
		}
		if (rightToCentre !== 0) {
			let x = centre;
			if (topToCentre !== 0 || bottomToCentre !== 0) {
				x += lineWidth2;
			}
			context.beginPath();
			context.moveTo(...transform(x, middle - lineWidth1));
			context.lineTo(...transform(width, middle - lineWidth1));
			context.lineTo(...transform(width, middle + lineWidth2));
			context.lineTo(...transform(x, middle + lineWidth2));
			context.lineTo(...transform(x, middle));
			context.fillStyle = generator.colors[tile.colors.get(6)];
			context.fill();
		}
		const gradient = height / width;
		const gradient2 = (height + lineWidth) / (width + lineWidth);
		const topToRight = this.colors[0];
		const rightToBottom = this.colors[1];
		const bottomToLeft = this.colors[2];
		const leftToTop = this.colors[3];
		if (topToRight) {
			context.beginPath()
			context.moveTo(...transform(centre + lineWidth2, 0));
			const [x, y] = transform(width, middle - lineWidth1);
			if ((this.curved & 1) === 1) {
				context.bezierCurveTo(
					...transform(centre + lineWidth2, C * (middle - lineWidth1)),
					...transform(width - C * (width / 2 - lineWidth2), middle - lineWidth1),
					x, y
				);
				context.lineTo(...transform(width, middle + lineWidth2));
				context.bezierCurveTo(
					...transform(width - C * (width / 2 + lineWidth1), middle + lineWidth2),
					...transform(centre - lineWidth1, C * (middle + lineWidth2)),
					...transform(centre - lineWidth1, 0)
				);
			} else {
				context.lineTo(x, y);
				if (rightToCentre !== 0) {
					context.lineTo(...transform(width - lineWidth / gradient, middle - lineWidth1));
				} else {
					context.lineTo(...transform(width, middle + lineWidth2));
				}
				if (topToCentre !== 0) {
					context.lineTo(...transform(centre + lineWidth2, lineWidth * gradient));
				} else if (leftToTop !== 0) {
					context.lineTo(...transform(centre, lineWidth / 2 * gradient2));
				} else {
					context.lineTo(...transform(centre - lineWidth1, 0));
				}
			}
			context.fillStyle = generator.colors[tile.colors.get(2)];
			context.fill();
		}
		if (rightToBottom) {
			context.beginPath();
			context.moveTo(...transform(width, middle + lineWidth2));
			const [x, y] = transform(centre + lineWidth2, height);
			if ((this.curved & 2) === 2) {
				context.bezierCurveTo(
					...transform(width - C * (width / 2 - lineWidth2), middle + lineWidth2),
					...transform(centre + lineWidth2, height - C * (height / 2 - lineWidth2)),
					x, y
				);
				context.lineTo(...transform(centre - lineWidth1, height));
				context.bezierCurveTo(
					...transform(centre - lineWidth1, height - C * (height / 2 + lineWidth1)),
					...transform(width - C * (width / 2 + lineWidth1), middle - lineWidth1),
					...transform(width, middle - lineWidth1)
				);
			} else {
				context.lineTo(x, y);
				if (bottomToCentre !== 0) {
					context.lineTo(...transform(centre + lineWidth2, height - lineWidth * gradient));
				} else {
					context.lineTo(...transform(centre - lineWidth1, height));
				}
				if (rightToCentre !== 0) {
					context.lineTo(...transform(width - lineWidth / gradient, middle + lineWidth2));
				} else if (topToRight !== 0) {
					context.lineTo(...transform(width - (lineWidth / 2) / gradient2, middle));
				} else {
					context.lineTo(...transform(width, middle - lineWidth1));
				}
			}
			context.fillStyle = generator.colors[tile.colors.get(6)];
			context.fill();
		}
		if (bottomToLeft !== 0) {
			context.beginPath();
			context.moveTo(...transform(centre - lineWidth1, height));
			const [x, y] = transform(0, middle + lineWidth2);
			if ((this.curved & 4) === 4) {
				context.bezierCurveTo(
					...transform(centre - lineWidth1, height - C * (height / 2 - lineWidth2)),
					...transform(C * (centre - lineWidth1), middle + lineWidth2),
					x, y
				);
				context.lineTo(...transform(0, middle - lineWidth1));
				context.bezierCurveTo(
					...transform(C * (centre + lineWidth2), middle - lineWidth1),
					...transform(centre + lineWidth2, height - C * (height / 2 + lineWidth1)),
					...transform(centre + lineWidth2, height),
				);
			} else {
				context.lineTo(x, y);
				if (leftToCentre !== 0) {
					context.lineTo(...transform(lineWidth / gradient, middle + lineWidth2));
				} else {
					context.lineTo(...transform(0, middle - lineWidth1));
				}
				if (bottomToCentre !== 0) {
					context.lineTo(...transform(centre - lineWidth1, height - lineWidth * gradient));
				} else if (rightToBottom !== 0) {
					context.lineTo(...transform(centre, height - lineWidth / 2 * gradient2));
				} else {
					context.lineTo(...transform(centre + lineWidth2, height));
				}
			}
			context.fillStyle = generator.colors[tile.colors.get(10)];
			context.fill();
		}
		if (leftToTop !== 0) {
			context.beginPath();
			context.moveTo(...transform(0, middle - lineWidth1));
			const [x, y] = transform(centre - lineWidth1, 0);
			if ((this.curved & 8) === 8) {
				context.bezierCurveTo(
					...transform(C * (centre - lineWidth1), middle - lineWidth1),
					...transform(centre - lineWidth1, C * (middle - lineWidth1)),
					x, y
				);
				context.lineTo(...transform(centre + lineWidth2, 0));
				context.bezierCurveTo(
					...transform(centre + lineWidth2, C * (middle + lineWidth2)),
					...transform(C * (centre + lineWidth2), middle + lineWidth2),
					...transform(0, middle + lineWidth2)
				);
			} else {
				context.lineTo(x, y);
				if (topToCentre !== 0) {
					context.lineTo(...transform(centre - lineWidth1, lineWidth * gradient));
				} else {
					context.lineTo(...transform(centre + lineWidth2, 0));
				}
				if (leftToCentre !== 0) {
					context.lineTo(...transform(lineWidth / gradient, middle - lineWidth1));
				} else if (bottomToLeft !== 0) {
					context.lineTo(...transform((lineWidth / 2) / gradient2, middle));
				} else {
					context.lineTo(...transform(0, middle + lineWidth2));
				}
			}
			context.fillStyle = generator.colors[tile.colors.get(14)];
			context.fill();
		}
	}

}

