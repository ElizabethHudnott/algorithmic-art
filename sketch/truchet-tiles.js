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
		listenSlider('tiles-stroke-ratio', 'strokeRatio');
		listenSlider('tiles-flow-probability', 'flowProbability');

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

		let dualShearControl;

		optionsDoc.getElementById('tiles-shear-0').addEventListener('input', function (event) {
			me.shear[0] = parseFloat(this.value);
			generateBackground(0);
		});

		function checkShear1(event) {
			dualShearControl = me.shear[0] === me.shear[1] / 2;
		}

		optionsDoc.getElementById('tiles-shear-1').addEventListener('pointerdown', checkShear1);
		optionsDoc.getElementById('tiles-shear-1').addEventListener('keydown', checkShear1);

		optionsDoc.getElementById('tiles-shear-1').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (dualShearControl) {
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

		function checkShear3(event) {
			dualShearControl = me.shear[3] === me.shear[2] / 2;
		}

		optionsDoc.getElementById('tiles-shear-3').addEventListener('pointerdown', checkShear3);
		optionsDoc.getElementById('tiles-shear-3').addEventListener('keydown', checkShear3);

		optionsDoc.getElementById('tiles-shear-3').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (dualShearControl) {
				me.shear[2] = value / 2;
				document.getElementById('tiles-shear-2').value = value / 2;
			}
			me.shear[3] = value;
			generateBackground(0);
		});

		optionsDoc.getElementById('tiles-shear-1-reset').addEventListener('click', function (event) {
			if (me.shear[0] === me.shear[1] / 2) {
				me.shear[0] = 0;
				document.getElementById('tiles-shear-0').value = 0;
			}
			me.shear[1] = 0;
			document.getElementById('tiles-shear-1').value = 0;
			generateBackground(0);
		});

		optionsDoc.getElementById('tiles-shear-3-reset').addEventListener('click', function (event) {
			if (me.shear[2] === me.shear[3] / 2) {
				me.shear[2] = 0;
				document.getElementById('tiles-shear-2').value = 0;
			}
			me.shear[3] = 0;
			document.getElementById('tiles-shear-3').value = 0;
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

	this.colors = ['#e00000', '#007a00', '#0000b0', '#ffaa00'];	// #887ecb
	this.numColors = 4;
	this.flowProbability = 1;
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

TruchetTiles.prototype.connectedTiles = function (x, y, port, width, height) {
	const locations = [];
	switch (port) {
	case 0:
		locations.push([x - 1, y, 4]);
		locations.push([x, y - 1, 12]);
		locations.push([x - 1, y - 1, 8]);
		break;
	case 1:
	case 2:
	case 3:
		locations.push([x, y - 1, 12 - port]);
		break;
	case 4:
		locations.push([x + 1, y, 0]);
		locations.push([x, y - 1, 8]);
		locations.push([x + 1, y - 1, 12]);
		break;
	case 5:
	case 6:
	case 7:
		locations.push([x + 1, y, 20 - port]);
		break;
	case 8:
		locations.push([x + 1, y, 12]);
		locations.push([x, y + 1, 4]);
		locations.push([x + 1, y + 1, 0]);
		break;
	case 9:
	case 10:
	case 11:
		locations.push([x, y + 1, 12 - port]);
		break;
	case 12:
		locations.push([x - 1, y, 8]);
		locations.push([x, y + 1, 0]);
		locations.push([x - 1, y + 1, 4]);
		break;
	default:
		locations.push([x - 1, y, 20 - port]);
	}
	const filteredLocations = [];
	for (let location of locations) {
		const x = location[0];
		const y = location[1];
		if (x >= 0 && x < width && y >= 0 && y < height) {
			filteredLocations.push(location);
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

	// const tileTypes = [new DiagonalLineTile('0'), new DiagonalLineTile('1')];
	const tileTypes = [
		new MiddleLineTile('000010100'),	// Vertical line
		new MiddleLineTile('000001010'),	// Horizontal line
		new MiddleLineTile('000011100'),	// T-shape to the right
		new MiddleLineTile('000001110'),	// T-shape downwards
		new MiddleLineTile('000010110'),	// T-shape to the left
		new MiddleLineTile('000011010'),	// T-shape upwards
		/*
		new MiddleLineTile('100000000'),	// Top to left diagonal
		new MiddleLineTile('100010100'),	// Vertical line + top to left diagonal
		new MiddleLineTile('100001010'),	// Horizontal line + top to left diagonal
		new MiddleLineTile('010000000'),	// Right to bottom diagonal
		new MiddleLineTile('010010100'),	// Vertical line + right to bottom diagonal
		new MiddleLineTile('010001010'),	// Horizontal line + right to bottom diagonal
		new MiddleLineTile('001000000'),	// Bottom to left diagonal
		new MiddleLineTile('001010100'),	// Vertical line + bottom to left diagonal
		new MiddleLineTile('001001010'),	// Horizontal line + bottom to left diagonal
		new MiddleLineTile('000100000'),	// Left to top diagonal
		new MiddleLineTile('000110100'),	// Vertical line + left to top diagonal
		new MiddleLineTile('000101010'),	// Horizontal line + left to top diagonal
		new MiddleLineTile('010200000'),	// Two diagonals, forward facing
		new MiddleLineTile('102000000'),	// Two diagonals, backward facing
		new MiddleLineTile('011000000'),	// Upward V
		new MiddleLineTile('001100000'),	// Rightward V
		new MiddleLineTile('100100000'),	// Downward V
		new MiddleLineTile('110000000'),	// Leftward V
		new MiddleLineTile('010110100'),	// /|/
		new MiddleLineTile('101001010'),	// \-\
		new MiddleLineTile('101010100'),	// \|\
		new MiddleLineTile('010101010'),	// /-/
		new MiddleLineTile('100000001'),	// Curve, upper right
		new MiddleLineTile('010000002'),	// Curve, lower right
		new MiddleLineTile('001000004'),	// Curve, lower left
		new MiddleLineTile('000100008'),	// Curve, upper left
		*/
	];

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

			const tileTypeIndex = Math.trunc(random.next() * tileTypes.length);
			tileMapRow[cellX] = new Tile(tileTypes[tileTypeIndex]);
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
		// Maps a port number to an array of port numbers
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
}

class Tile {
	constructor(tileType) {
		this.tileType = tileType;
		this.colors = new Map();
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
		// First four characters represent diagonal lines
		for (let i = 0; i < 4; i++) {
			colors[i] = parseInt(str[i]);
			if (str[i] !== '0') {
				const destinations = new Set();
				destinations.add(((i + 1) * 4 + 2) % 16);
				connections.set(i * 4 + 2, destinations);
			}
		}
		// Second four characters represent horizontal and vertical lines
		const intoCentre = new Set();
		for (let i = 0; i < 4; i++) {
			colors[i + 4] = parseInt(str[i + 4]);
			if (str[i + 4] !== '0') {
				intoCentre.add(i);
			}
		}
		for (let i of intoCentre) {
			let connected = connections.get(i * 4 + 2);
			if (connected === undefined) {
				connected = new Set();
				connections.set(i * 4 + 2, connected);
			}
			for (let j of intoCentre) {
				if (i === j) {
					continue;
				}
				if (str[i + 4] === str[j + 4]) {
					connected.add(j * 4 + 2);
				}
			}
		}
		super(connections);
		this.colors = colors;
		this.curved = parseInt(str.slice(-1), 16);
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
			const extend = topToCentre === 0 && (leftToCentre !== 0 || rightToCentre !== 0);
			if (topToCentre === 0) {
				context.beginPath();
				if (extend) {
					context.moveTo(...transform(centre + lineWidth2, middle - lineWidth1));
					context.lineTo(...transform(centre + lineWidth2, middle));
				}
			}
			context.lineTo(...transform(centre + lineWidth2, height));
			context.lineTo(...transform(centre - lineWidth1, height));
			context.lineTo(...transform(centre - lineWidth1, middle));
			if (extend) {
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
				if (rightToCentre !== 0) {
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

