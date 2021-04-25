const PREVIEW_SIZE = 256;
const C = 0.551915024494;

export default function TruchetTiles() {
	const me = this;
	this.title = 'Tiling';
	hasRandomness(true);
	this.helpFile = 'help/truchet-tiles.html';

	this.optionsDocument = downloadFile('truchet-tiles.html', 'document').then(function (optionsDoc) {

		let redrawTimeout;

		function redraw() {
			generateBackground(0);
			redrawTimeout = undefined;
		}

		function listenSlider(id, property) {
			optionsDoc.getElementById(id).addEventListener('input', function (event) {
				me[property] = parseFloat(this.value);
				generateBackground(0);
			});
		}

		listenSlider('tiles-gap-probability', 'gapProbability');

		let editColorIndex = 0;
		let designColorIndex = 0;

		const designCanvas = optionsDoc.getElementById('tiles-design');
		const designContext = designCanvas.getContext('2d');
		let currentTileNum = 0;

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
			me.tileTypes[currentTileNum] = currentTile.mutate(event.offsetX, event.offsetY, lineWidth, designColorIndex);
			drawPreview();
			generateBackground(0);
		});

		optionsDoc.getElementById('tiles-tile-frequency').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0) {
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

		optionsDoc.getElementById('tiles-color-mode').addEventListener('input', function (event) {
			const section = document.getElementById('tiles-color-flow');
			if (this.value === 'r') {
				$(section).collapse('show');
			} else {
				$(section).collapse('hide');
				numColorsInput.value = 9;
				setNumColors();
			}
			me.colorMode = this.value;
			generateBackground(0);
		});

		const flowSlider = optionsDoc.getElementById('tiles-flow-probability');
		const numColorsInput = optionsDoc.getElementById('tiles-num-colors');
		const colorGroupInput = optionsDoc.getElementById('tiles-color-group-size');
		const paletteUI = optionsDoc.getElementById('tiles-palette');

		flowSlider.addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			me.flowProbability = value;
			if (value < 1) {
				const groupSize = Math.max(me.colorGroupSize, 2);
				me.colorGroupSize = groupSize;
				colorGroupInput.value = groupSize;
				const numColors = Math.max(me.numColors, 2);
				me.numColors = numColors;
				numColorsInput.value = numColors;
			}
			generateBackground(0);
		});

		function setNumColors() {
			const numColors = parseInt(numColorsInput.value);
			if (numColors > 0 && numColors <= 15) {
				for (let i = 0; i < 15; i++) {
					paletteUI.children[i].hidden = i >= numColors;
				}
				// Show/hide spacer
				paletteUI.children[15].hidden = numColors <= 8;
				me.numColors = numColors;
				if (numColors === 1) {
					me.flowProbability = 1;
					flowSlider.value = 1;
					me.colorGroupSize = 1;
					colorGroupInput.disabled = true;
					colorGroupInput.value = 1;
				} else {
					colorGroupInput.disabled = false;
					const maxGroupSize = Math.max(Math.ceil(numColors / 2), 2);
					const groupSize = Math.min(me.colorGroupSize, maxGroupSize);
					me.colorGroupSize = groupSize;
					colorGroupInput.value = groupSize;
					colorGroupInput.max = maxGroupSize;
				}
				generateBackground(0);
			}
		}

		numColorsInput.addEventListener('input', setNumColors);

		colorGroupInput.addEventListener('input', function (event) {
			const value = parseInt(this.value);
			if (value > 0 && value <= this.max) {
				me.colorGroupSize = value;
				if (value === 1) {
					me.flowProbability = 1;
					flowSlider.value = 1;
				}
				generateBackground(0);
			}
		});


		const designColors = optionsDoc.getElementById('tiles-design-colors');
		const hueSlider = optionsDoc.getElementById('tiles-hue');
		const saturationSlider = optionsDoc.getElementById('tiles-saturation');
		const lightnessSlider = optionsDoc.getElementById('tiles-lightness');
		const opacitySlider = optionsDoc.getElementById('tiles-opacity');

		function updateColorSliders() {
			const color = me.colors[editColorIndex];
			hueSlider.value = color[0];
			saturationSlider.value = color[1];
			lightnessSlider.value = color[2];
			opacitySlider.value = color[3];
		}

		function selectEditColor(event) {
			paletteUI.children[editColorIndex].children[0].classList.remove('active');
			editColorIndex = parseInt(event.target.dataset.index);
			paletteUI.children[editColorIndex].children[0].classList.add('active');
			updateColorSliders();
		}

		function selectDesignColor(event) {
			designColors.children[designColorIndex].children[0].classList.remove('active');
			designColorIndex = parseInt(event.target.dataset.index);
			designColors.children[designColorIndex].children[0].classList.add('active');
		}

		function updateSwatch(index) {
			const color = me.colors[index];
			let button = paletteUI.children[index].children[0];
			button.style.backgroundColor = hsla(color[0] * 360, color[1], color[2], color[3]);
			if (index < 9) {
				button = designColors.children[index].children[0];
				button.style.backgroundColor = hsla(color[0] * 360, color[1], color[2], 1);
				drawPreview();
			}
		}

		{
			const spacer = paletteUI.children[0];
			for (let i = 0; i < 15; i++) {
				let div = optionsDoc.createElement('DIV');
				div.hidden = i >= me.numColors;
				let button = optionsDoc.createElement('BUTTON');
				div.appendChild(button);
				button.type = 'button';
				button.name = 'tiles-swatch';
				button.dataset.index = i;
				button.classList.add('btn');
				button.addEventListener('click', selectEditColor);
				paletteUI.insertBefore(div, spacer);

				if (i < 9) {
					div = optionsDoc.createElement('DIV');
					button = optionsDoc.createElement('BUTTON');
					div.appendChild(button);
					button.type = 'button';
					button.name = 'tiles-design-color';
					button.dataset.index = i;
					button.classList.add('btn');
					button.addEventListener('click', selectDesignColor);
					designColors.appendChild(div);
				}
				updateSwatch(i);
			}
			paletteUI.children[0].children[0].classList.add('active');
			designColors.children[0].children[0].classList.add('active');
			updateColorSliders();
		}

		function previewColor() {
			updateSwatch(editColorIndex);
			if (redrawTimeout === undefined) {
				redrawTimeout = setTimeout(redraw, 100);
			}
		}

		hueSlider.addEventListener('input', function (event) {
			me.colors[editColorIndex][0] = parseFloat(this.value);
			previewColor();
		});
		hueSlider.addEventListener('pointerup', redraw);
		hueSlider.addEventListener('keyup', redraw);

		saturationSlider.addEventListener('input', function (event) {
			me.colors[editColorIndex][1] = parseFloat(this.value);
			previewColor();
		});
		saturationSlider.addEventListener('pointerup', redraw);
		saturationSlider.addEventListener('keyup', redraw);

		lightnessSlider.addEventListener('input', function (event) {
			me.colors[editColorIndex][2] = parseFloat(this.value);
			previewColor();
		});
		lightnessSlider.addEventListener('pointerup', redraw);
		lightnessSlider.addEventListener('keyup', redraw);

		opacitySlider.addEventListener('input', function (event) {
			me.colors[editColorIndex][3] = parseFloat(this.value);
			previewColor();
		});
		opacitySlider.addEventListener('pointerup', redraw);
		opacitySlider.addEventListener('keyup', redraw);

		return optionsDoc;
	});

	// this.tileTypes = [new DiagonalLineTile('0'), new DiagonalLineTile('1')];
	this.tileTypes = [
		new MiddleLineTile('000033300'),	// T-shape to the right
		new MiddleLineTile('000004440'),	// T-shape downwards
		new MiddleLineTile('000010110'),	// T-shape to the left
		new MiddleLineTile('000022020'),	// T-shape upwards
		new MiddleLineTile('100000001'),	// Curve, upper right
		new MiddleLineTile('020000002'),	// Curve, lower right
		new MiddleLineTile('003000004'),	// Curve, lower left
		new MiddleLineTile('000400008'),	// Curve, upper left
	];

	this.tileFrequencies = [1, 1, 1, 1, 1, 1, 1, 1];

	// Stroke width as a proportion of the cell's area.
	this.strokeRatio = 0.25;

	// Probability of a cell being left blank
	this.gapProbability = 0;

	this.colorMode = 'd';	// Coloured as they appear in the tile designer
	this.flowProbability = 1;
	this.numColors = 9;
	this.colorGroupSize = 1;

	// HSLA format (0..1 range)
	this.colors = [
		[  4/360,  0.86, 0.54, 1],	// Red
		[148/360,  1   , 0.27, 1],	// Green
		[222/360,  0.90, 0.32, 1],	// Blue
		[ 49/360,  0.95, 0.50, 1],	// Yellow
		[180/360,  0.85, 0.40, 1],	// Turquoise
		[345/360,   0.6, 0.18, 1],	// Charcoal Grey
		[262/360,  0.42, 0.49, 1],	// Purple
		[346/360,  0.94, 0.83, 1],	// Pink
		[ 94/360,  0.63, 0.52, 1],	// Lime
		[201/360,  0.87, 0.42, 1],	// Azure
		[ 26/360,  0.90, 0.56, 1],	// Orange
		[205/360,   0.6, 0.59, 1],	// Grey
		[323/360,  0.99, 0.26, 1],	// Grape
		[327/360,  0.77, 0.56, 1],	// Magenta
		[ 30/360,  1   , 0.26, 1],	// Brown
	];

	this.sideLength = 25;
	this.cellAspect = 1;
	/*Shearing. Normal range of values is 0-1.
	 * Element 0: X displacement for the middle
	 * Element 1: X displacement for the bottom
	 * Element 2: Y-Shear for the left half
	 * Element 3: Y-Shear for the right half;
	 */
	this.shear = [0, 0, 0, 0];

}

TruchetTiles.prototype.animatable = {
	'continuous': [
		'tileFrequencies', 'strokeRatio', 'gapProbability',
		'colors', 'flowProbability',
		'sideLength', 'cellAspect', 'shear',
	],
	'stepped': [
		'tileTypes',
		'colorMode', 'numColors', 'colorGroupSize',
	]
};

TruchetTiles.prototype.getColor = function (index) {
	const color = this.colors[index];
	return hsla(color[0] * 360, color[1], color[2], color[3]);
}

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

TruchetTiles.prototype.colorPermutation = function* (currentColor, excludeColors) {
	const groupSize = this.colorGroupSize;
	const groupNumber = Math.trunc(currentColor / groupSize);
	const minColor = groupNumber * groupSize;
	const maxColor = Math.min((groupNumber + 1) * groupSize, this.numColors) - 1;

	const colors = [];
	for (let i = minColor; i <= maxColor; i++) {
		if (!excludeColors.has(i)) {
			colors.push(i);
		}
	}
	let numColors = colors.length;
	if (numColors === 0) {
		colors.push(currentColor);
		numColors = 1;
	}
	const permutationLength = Math.min(numColors, 3);
	let i;
	for (i = 0; i < permutationLength; i++) {
		const r = Math.trunc(random.next() * (numColors - i)) + i;
		const temp = colors[i];
		colors[i] = colors[r];
		colors[r] = temp;
		yield colors[i];
	}
	// Cycle if less than 3 colours
	i = 0;
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
					tileMapRow[cellX] = BLANK_TILE;
					continue;
				} else {
					blankDiffusion += gapProbability;
				}
			}
			if (blankDiffusion >= 1 && blankRunLength < maxBlankRun) {
				blankRunLength++;
				blankDiffusion--;
				tileMapRow[cellX] = BLANK_TILE;
				continue;
			}

			blankRunLength = 0;

			const p = random.next() * tileFrequenciesTotal;
			let tileTypeIndex = this.tileTypes.length - 1;
			while (
				tileTypeIndex > 0 &&
				(tileCDF[tileTypeIndex - 1] >= p || this.tileFrequencies[tileTypeIndex] === 0)
			) {
				tileTypeIndex--;
			}
			let tile;
			switch (this.colorMode) {
			case 'd':
				tile = this.tileTypes[tileTypeIndex].preview;
				break;

			case 'r':
				tile = new Tile(this.tileTypes[tileTypeIndex]);
				break;
			}
			tileMapRow[cellX] = tile;
		}
		unitsProcessed++;
		if (unitsProcessed >= benchmark) {
			const now = calcBenchmark();
			if (now >= yieldTime) {
				yield;
			}
		}
	}

	if (this.colorMode === 'r') {
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
							const permutation = this.colorPermutation(color, excluded);
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
								const permutation = this.colorPermutation(color, excluded);
								for (let [x2, y2, port2] of connected) {
									stack.push([x2, y2, port2, permutation.next().value]);
								}
							}
						}
					} while (stack.length > 0);
				} // For each port
			} // For each x
		} // For each y
	} // End of colour flowing

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
	}

	getLineColor(port1, port2, colors) {
		return colors.get(port1);
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

	getLineColor(port1, port2) {
		return this.tileType.getLineColor(port1, port2, this.colors);
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

	constructor() {
		super(new Map());
	}

	draw(context, tile, left, top, width, height, lineWidth, shear, generator) {
		// Nothing to draw
	}
}

const BLANK_TILE = new Tile(new BlankTile());

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
		//TODO add .preview, mutate()
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
			context.fillStyle = generator.getColor(tile.getLineColor(4, 12));
		} else {
			// Backslash
			context.moveTo(...transform(0, -lineWidth1));
			context.lineTo(...transform(width, height - lineWidth1));
			context.lineTo(...transform(width, height + lineWidth2));
			context.lineTo(...transform(0, lineWidth2));
			context.fillStyle = generator.getColor(tile.getLineColor(0, 8));
		}
		context.fill();
	}

}

class ShapeSet {
	constructor(top, right, bottom, left) {
		if (top) {
			this.topYLeft = top[0];
			this.topYRight = top[1];
			this.topX = top[2] || 0;
		}
		if (right) {
			this.rightXTop = right[0];
			this.rightXBottom = right[1];
			this.rightY = right[2] || 0;
		}
		if (bottom) {
			this.bottomYLeft = bottom[0];
			this.bottomYRight = bottom[1];
			this.bottomX = bottom[2] || 0;
		}
		if (left) {
			this.leftXTop = left[0];
			this.leftXBottom = left[1];
			this.leftY = left[2] || 0;
		}
	}
}

const shapesMap = new Map();
{
	/* 1st digit represents a possible line from the top to the centre.
	 * 2nd digit right to centre, 3rd bottom to centre, 4th left to centre.
	 * Each digit is either 0 if that line is not present, or the sum of the values of the
	 * lines that have the same colour as itself (including itself).
	 * The weights are 1 = line from top to centre has the same colour as the current line,
	 * 2 = line from right to centre, 4 = bottom to centre, 8 = left to centre.
	 */
	shapesMap.set('0000', new ShapeSet());
	shapesMap.set('0008', new ShapeSet(null, null, null, [1, 1]));
	shapesMap.set('0200', new ShapeSet(null, [0, 0]));
	shapesMap.set('0040', new ShapeSet(null, null, [0, 0]));
	shapesMap.set('1000', new ShapeSet([1, 1]));
	shapesMap.set('0a0a', new ShapeSet(null, [1, 1], null, [1, 1]));
	shapesMap.set('5050', new ShapeSet([1, 1], null, [1, 1]));
	shapesMap.set('9009', new ShapeSet([0, 0], null, null, [1, 1]));
	shapesMap.set('3300', new ShapeSet([0, 0], [0, 0]));
	shapesMap.set('0660', new ShapeSet(null, [0, 0], [1, 1]));
	shapesMap.set('00cc', new ShapeSet(null, null, [0, 0], [0, 0]));
	shapesMap.set('0208', new ShapeSet(null, [1, 0], null, [1, 0]));
	shapesMap.set('1040', new ShapeSet([1, 0], null, [1, 0]));
	shapesMap.set('1008', new ShapeSet([0, 1], null, null, [0, 1]));
	shapesMap.set('1200', new ShapeSet([1,0], [1, 0]));
	shapesMap.set('0240', new ShapeSet(null, [0, 1], [0, 1]));
	shapesMap.set('0048', new ShapeSet(null, null, [1, 0], [1, 0]));
	shapesMap.set('d0dd', new ShapeSet([1, 1], null, [1, 1], [0, 0]));
	shapesMap.set('7770', new ShapeSet([1, 1], [1, 1], [1, 1]));
	shapesMap.set('bb0b', new ShapeSet([1, 1], [1, 1], null, [0, 0]));
	shapesMap.set('0eee', new ShapeSet(null, [1, 1], [0, 0], [0, 0]));
	shapesMap.set('10cc', new ShapeSet([0, 1], null, [0, 1], [0, 0]));
	shapesMap.set('1660', new ShapeSet([1, 0], [1, 1], [1, 0]));
	shapesMap.set('9209', new ShapeSet([1, 0], [1, 0], null, [0, 0]));
	shapesMap.set('02cc', new ShapeSet(null, [0, 1], [0, 1], [0, 0]));
	shapesMap.set('9049', new ShapeSet([1, 0], null, [1, 0], [0, 0]));
	shapesMap.set('3340', new ShapeSet([0, 1], [1, 1], [0, 1]));
	shapesMap.set('3308', new ShapeSet([0, 1], [1, 1], null, [0, 1]));
	shapesMap.set('0668', new ShapeSet(null, [1, 1], [1, 0], [1, 0]));
	shapesMap.set('5058', new ShapeSet([1, 1], null, [1, 1], [0, 0]));
	shapesMap.set('5250', new ShapeSet([1, 1], [1, 1], [1, 1]));
	shapesMap.set('1a0a', new ShapeSet([0, 0], [1, 1], null, [1, 1]));
	shapesMap.set('0a4a', new ShapeSet(null, [1, 1], [1, 1], [1, 1]));
	const cross = new ShapeSet([1, 1], [1, 1], [1, 1], [0, 0]);
	shapesMap.set('ffff', cross);
	shapesMap.set('d2dd', cross);
	shapesMap.set('7778', cross);
	shapesMap.set('bb4b', cross);
	shapesMap.set('1eee', new ShapeSet([0, 0], [1, 1], [0, 0], [0, 0]));
	shapesMap.set('5a5a', cross); // Over-under
	shapesMap.set('5258', cross);
	shapesMap.set('9669', new ShapeSet([1, 0], [1, 0], [1, 1], [0, 0]));
	shapesMap.set('33cc', new ShapeSet([0, 1], [1, 1], [0, 1], [0, 0]));
	shapesMap.set('1a4a', new ShapeSet([0, 0], [1, 1], [1, 1], [1, 1]));
	shapesMap.set('1248', new ShapeSet([0.5, 0, 0.5], [0.5, 1, 0.5], [0.5, 1, 0.5], [0.5, 0, 0.5]));

	shapesMap.set('9249', new ShapeSet([1, 1], [1, 1], [1, 1], [0, 0]));
	shapesMap.set('12cc', new ShapeSet([0, 0], [1, 1], [0, 0], [0, 0]));
	shapesMap.set('3348', new ShapeSet([1, 1], [1, 1], [1, 1], [0, 0]));
	shapesMap.set('1668', new ShapeSet([0, 0], [1, 1], [0, 0], [0, 0]));

	/* Alternatives
	shapesMap.set('9249', new ShapeSet([1, 0], [0.5, 1, 0.5], [0.5, 1, 0.5], [0, 0]));
	shapesMap.set('12cc', new ShapeSet([0.5, 0, 0.5], [0.5, 1, 0.5], [0, 1], [0, 0]));
	shapesMap.set('3348', new ShapeSet([0, 1], [1, 1], [0.5, 1, 0.5], [0.5, 0, 0.5]));
	shapesMap.set('1668', new ShapeSet([0.5, 0, 0.5], [1, 0], [1, 1], [0.5, 0, 0.5]));
	*/

	shapesMap.set('1048', new ShapeSet([0, 0.5], null, [1, 0.5], [1, 0, 0.5]));
	shapesMap.set('1240', new ShapeSet([0.5, 0], [0, 1, 0.5], [0.5, 1]));
	shapesMap.set('1208', new ShapeSet([1, 0, 0.5], [1, 0.5], null, [0, 0.5]));
	shapesMap.set('0248', new ShapeSet(null, [0.5, 1], [0, 1, 0.5], [0.5, 0]));
}


class MiddleLineTile extends TileType {
	/**
	 * First 4 digits: diagonal lines: upper right quadrant, lower right, lower left, upper left
	 * Second 4 digits: straight lines: up, right, down, left
	 * Last digit bits: 1 = upper right, 2 = lower right, 4 = lower left, 8 = upper left
	 */
	constructor(str) {
		const connections = new Map();
		const defaultColors = new Map();
		const colorMap = new Map();
		const usedPorts = new Set();
		// Second four characters represent horizontal and vertical lines
		for (let i = 0; i < 4; i++) {
			const color = parseInt(str[i + 4]);
			if (str[i + 4] !== '0') {
				let mapping = colorMap.get(color);
				if (mapping === undefined) {
					mapping = new Set();
					colorMap.set(color, mapping);
				}
				const source = i * 4 + 2;
				mapping.add(source);
				usedPorts.add(source)
				defaultColors.set(source, color - 1);
			}
		}
		// First four characters represent diagonal lines
		for (let i = 0; i < 4; i++) {
			const color = parseInt(str[i]);
			if (str[i] !== '0') {
				let mapping = colorMap.get(color);
				if (mapping === undefined) {
					mapping = new Set();
					colorMap.set(color, mapping);
				}
				const source = i * 4 + 2;
				if (!usedPorts.has(source)) {
					mapping.add(source);
					usedPorts.add(source);
					defaultColors.set(source, color - 1);
				}
				const destination = ((i + 1) * 4 + 2) % 16;
				if (!usedPorts.has(destination)) {
					mapping.add(destination);
					usedPorts.add(destination);
					defaultColors.set(destination, color - 1);
				}
			}
		}
		for (let [color, ports] of colorMap.entries()) {
			for (let port1 of ports) {
				if (ports.size === 1) {
					connections.set(port1, new Set());
				} else {
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
		}
		super(connections);
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
		// By default transition not present to straight or to a new colour.
		let newChar = String(color + 1);
		if (this.str[index] !== '0' && this.str[index] === newChar) {
			if (index < 4) {
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
		}
		const newStr = this.str.slice(0, index) + newChar + this.str.slice(index + 1, -1) + curved.toString(16);
		return new MiddleLineTile(newStr);
	}

	getLineColor(port1, port2, colors) {
		const index1 = (port1 - 2) / 4;
		const index2 = index1 + 4;
		const index3 = (index1 + 3) % 4;
		const str = this.str;
		const designColor1 = str[index1];
		const designColor2 = str[index2];
		const designColor3 = str[index3];
		if (
			(designColor2 !== '0' && designColor2 !== designColor1) ||
			(designColor3 !== '0' && designColor3 !== designColor1)
		) {
			return colors.get(port2);
		} else {
			return colors.get(port1);
		}
	}

	draw(context, tile, left, top, width, height, lineWidth, shear, generator) {
		const transform = coordinateTransform.bind(null, left, top, width, height, shear);
		const centre = Math.trunc(width / 2);
		const middle = Math.trunc(height / 2);
		const lineWidth1 = Math.trunc(lineWidth / 2);
		const lineWidth2 = Math.ceil(lineWidth / 2);
		const gradient = height / width;
		const gradient2 = (height + lineWidth) / (width + lineWidth);

		const topToRight = this.str[0] !== '0';
		const rightToBottom = this.str[1] !== '0';
		const bottomToLeft = this.str[2] !== '0';
		const leftToTop = this.str[3] !== '0';
		const topToCentre = this.str[4] !== '0';
		const rightToCentre = this.str[5] !== '0';
		const bottomToCentre = this.str[6] !== '0';
		const leftToCentre = this.str[7] !== '0';

		const matchingColors = [0, 0, 0, 0];
		for (let i = 0; i < 4; i++) {
			if (this.str[4 + i] !== '0') {
				const color = tile.getColor(i * 4 + 2);
				for (let j = 0; j < 4; j++) {
					if (this.str[4 + j] !== '0' && tile.getColor(j * 4 + 2) === color) {
						matchingColors[i] += 1 << j
					}
				}
			}
		}
		const shapeStr = matchingColors[0].toString(16) + matchingColors[1].toString(16) +
			matchingColors[2].toString(16) + matchingColors[3].toString(16);
		const shapes = shapesMap.get(shapeStr);

		function portion(amount, middle) {
			switch (amount) {
			case 0:
				return middle - lineWidth1;
			case 0.5:
				return middle;
			case 1:
				return middle + lineWidth2;
			}
		}

		if (topToCentre) {
			context.beginPath();
			context.moveTo(...transform(centre - lineWidth1, 0));
			context.lineTo(...transform(centre - lineWidth1, middle - lineWidth1));
			context.lineTo(...transform(portion(shapes.topX, centre), portion(shapes.topYLeft, middle)));
			context.lineTo(...transform(centre + lineWidth2, portion(shapes.topYRight, middle)));
			context.lineTo(...transform(centre + lineWidth2, 0));
			context.fillStyle = generator.getColor(tile.getColor(2));
			context.fill();
		}

		if (bottomToCentre) {
			context.beginPath();
			context.moveTo(...transform(centre - lineWidth1, height));
			context.lineTo(...transform(centre - lineWidth1, middle + lineWidth2));
			context.lineTo(...transform(portion(shapes.bottomX, centre), portion(shapes.bottomYLeft, middle)));
			context.lineTo(...transform(centre + lineWidth2, portion(shapes.bottomYRight, middle)));
			context.lineTo(...transform(centre + lineWidth2, height));
			context.fillStyle = generator.getColor(tile.getColor(10));
			context.fill();
		}

		if (leftToCentre) {
			context.beginPath();
			context.moveTo(...transform(0, middle - lineWidth1));
			context.lineTo(...transform(centre - lineWidth1, middle - lineWidth1));
			context.lineTo(...transform(portion(shapes.leftXTop, centre), portion(shapes.leftY, middle)));
			context.lineTo(...transform(portion(shapes.leftXBottom, centre), middle + lineWidth2));
			context.lineTo(...transform(0, middle + lineWidth2));
			context.fillStyle = generator.getColor(tile.getColor(14));
			context.fill();
		}

		if (rightToCentre) {
			context.beginPath();
			context.moveTo(...transform(width, middle - lineWidth1));
			context.lineTo(...transform(middle + lineWidth2, middle - lineWidth1));
			context.lineTo(...transform(portion(shapes.rightXTop, centre), portion(shapes.rightY, middle)));
			context.lineTo(...transform(portion(shapes.rightXBottom, centre), middle + lineWidth2));
			context.lineTo(...transform(width, middle + lineWidth2));
			context.fillStyle = generator.getColor(tile.getColor(6));
			context.fill();
		}

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
				if (rightToCentre) {
					context.lineTo(...transform(width - lineWidth / gradient, middle - lineWidth1));
				} else {
					context.lineTo(...transform(width, middle + lineWidth2));
				}
				if (topToCentre) {
					context.lineTo(...transform(centre + lineWidth2, lineWidth * gradient));
				} else if (leftToTop) {
					context.lineTo(...transform(centre, lineWidth / 2 * gradient2));
				} else {
					context.lineTo(...transform(centre - lineWidth1, 0));
				}
			}
			context.fillStyle = generator.getColor(tile.getLineColor(2, 6));
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
				if (bottomToCentre) {
					context.lineTo(...transform(centre + lineWidth2, height - lineWidth * gradient));
				} else {
					context.lineTo(...transform(centre - lineWidth1, height));
				}
				if (rightToCentre) {
					context.lineTo(...transform(width - lineWidth / gradient, middle + lineWidth2));
				} else if (topToRight) {
					context.lineTo(...transform(width - (lineWidth / 2) / gradient2, middle));
				} else {
					context.lineTo(...transform(width, middle - lineWidth1));
				}
			}
			context.fillStyle = generator.getColor(tile.getLineColor(6, 10));
			context.fill();
		}

		if (bottomToLeft) {
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
				if (leftToCentre) {
					context.lineTo(...transform(lineWidth / gradient, middle + lineWidth2));
				} else {
					context.lineTo(...transform(0, middle - lineWidth1));
				}
				if (bottomToCentre) {
					context.lineTo(...transform(centre - lineWidth1, height - lineWidth * gradient));
				} else if (rightToBottom) {
					context.lineTo(...transform(centre, height - lineWidth / 2 * gradient2));
				} else {
					context.lineTo(...transform(centre + lineWidth2, height));
				}
			}
			context.fillStyle = generator.getColor(tile.getLineColor(10, 14));
			context.fill();
		}

		if (leftToTop) {
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
				if (topToCentre) {
					context.lineTo(...transform(centre - lineWidth1, lineWidth * gradient));
				} else {
					context.lineTo(...transform(centre + lineWidth2, 0));
				}
				if (leftToCentre) {
					context.lineTo(...transform(lineWidth / gradient, middle - lineWidth1));
				} else if (bottomToLeft) {
					context.lineTo(...transform((lineWidth / 2) / gradient2, middle));
				} else {
					context.lineTo(...transform(0, middle + lineWidth2));
				}
			}
			context.fillStyle = generator.getColor(tile.getLineColor(14, 2));
			context.fill();
		}
	}

}

