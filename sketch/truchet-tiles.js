import {Tile, BLANK_TILE, POSSIBLE_CONNECTIONS, checkTiling, chooseTile, coordinateTransform, weightedPoint, ConstraintLogic} from './tilesets/common.js';
import MiddleLineTile from './tilesets/middle-line.js';

export default function TruchetTiles() {
	const me = this;
	this.title = 'Tiling';
	hasRandomness(true);
	this.helpFile = 'help/truchet-tiles.html';

	this.optionsDocument = downloadFile('truchet-tiles.html', 'document').then(function (optionsDoc) {
		let numLineWidths = 1;
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

		function listenSliderArray(idPrefix, property, index) {
			optionsDoc.getElementById(idPrefix + '-' + index).addEventListener('input', function (event) {
				me[property][index] = parseFloat(this.value);
				generateBackground(0);
			});
		}

		listenSlider('tiles-gap-probability', 'gapProbability');
		listenSlider('tiles-grid-opacity', 'gridOpacity');
		listenSlider('tiles-grid-color', 'gridColor');

		for (let i = 0; i < 4; i++) {
			listenSliderArray('tiles-overlap', 'overlap', i);
		}

		let editColorIndex = 0;
		let designColorIndex = 0;

		const designCanvas = optionsDoc.getElementById('tiles-design');
		let previewWidth = designCanvas.width;
		let previewHeight = designCanvas.height;
		const designContext = designCanvas.getContext('2d');
		let currentTileNum = 0;

		function drawPreview() {
			const lineWidth1 = Math.round(Math.max(me.strokeRatio1 * previewWidth, 1));
			const lineWidth2 = Math.round(Math.max(me.strokeRatio2 * previewHeight, 1));
			designContext.clearRect(0, 0, previewWidth, previewHeight);
			me.tileTypes[currentTileNum].drawPreview(designContext, previewWidth, previewHeight, lineWidth1, lineWidth2, me);
		}

		drawPreview();

		$(optionsDoc.getElementById('tiles-inventory-tab')).on('shown.bs.tab', function (event) {
			drawPreview();
		});

		{
			let mouseIsDown = false;
			const div = optionsDoc.getElementById('tiles-design-div');
			div.addEventListener('mousedown', function (event) {
				mouseIsDown = true;
			});
			div.addEventListener('mouseup', function (event) {
				mouseIsDown = false;
			});
			let widgetSize;
			const observer = new ResizeObserver(function (entries) {
				if (!mouseIsDown) {
					return;
				}
				for (let entry of entries) {
					if (entry.target === div) {
						if (widgetSize === undefined) {
							widgetSize = entry.contentRect.height - designCanvas.height;
							return;
						}
						const size = Math.trunc(Math.min(entry.contentRect.height, div.parentElement.clientWidth));
						previewWidth = size - widgetSize;
						previewHeight = size;
						designCanvas.width = previewWidth;
						designCanvas.height = previewHeight;
						drawPreview();
					}
				}
			});
			observer.observe(div);
		}

		function showTile() {
			drawPreview();
			document.getElementById('tiles-tile-num').value = currentTileNum;
			document.getElementById('tiles-tile-frequency').value = me.tileFrequencies[currentTileNum];
			const currentTileType = me.tileTypes[currentTileNum];
			checkInput(document.getElementById('tiles-special-constraints'), 'tiles-special-constraints', currentTileType.checkSpecialConstraints);
			document.getElementById('tiles-min-connections').value = currentTileType.minConnections;
			document.getElementById('tiles-max-connections').value = currentTileType.maxConnections;
		}

		optionsDoc.getElementById('tiles-tile-num').addEventListener('input', function (event) {
			const value = parseInt(this.value);
			if (value >= 0 && value < me.tileTypes.length) {
				currentTileNum = value;
				showTile();
			}
		});

		optionsDoc.getElementById('tiles-add-tile').addEventListener('click', function (event) {
			currentTileNum = me.tileTypes.length;
			me.tileTypes[currentTileNum] = new MiddleLineTile('000000000', 1, 4, ConstraintLogic.DONT_CARE);
			me.tileFrequencies[currentTileNum] = 12;
			showTile();
			document.getElementById('tiles-tile-num').max = currentTileNum;
			document.getElementById('tiles-del-tile').disabled = false;
		});

		optionsDoc.getElementById('tiles-del-tile').addEventListener('click', function (event) {
			me.tileTypes.splice(currentTileNum, 1);
			me.tileFrequencies.splice(currentTileNum, 1);
			if (currentTileNum > 0) {
				currentTileNum--;
			}
			showTile();
			document.getElementById('tiles-tile-num').max = me.tileTypes.length - 1;
			this.disabled = me.tileTypes.length === 1;
			generateBackground(0);
		});

		designCanvas.addEventListener('click', function (event) {
			const lineWidth1 = Math.min(Math.max(me.strokeRatio1 * previewWidth, 42), 72);
			const lineWidth2 = Math.min(Math.max(me.strokeRatio2 * previewHeight, 42), 72);
			const currentTile = me.tileTypes[currentTileNum];
			me.tileTypes[currentTileNum] = currentTile.mutate(event.offsetX, event.offsetY, previewWidth, previewHeight, lineWidth1, lineWidth2, designColorIndex);
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

		function specialConstraintsOption(event) {
			me.tileTypes[currentTileNum].checkSpecialConstraints = parseInt(this.value);
			generateBackground(0);
		}

		for (let option of optionsDoc.getElementById('tiles-special-constraints').getElementsByTagName('input')) {
			option.addEventListener('input', specialConstraintsOption);
		}

		optionsDoc.getElementById('tiles-min-connections').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0) {
				me.tileTypes[currentTileNum].minConnections = value;
			}
			generateBackground(0);
		});

		optionsDoc.getElementById('tiles-max-connections').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0) {
				me.tileTypes[currentTileNum].maxConnections = value;
			}
			generateBackground(0);
		});

		optionsDoc.getElementById('tiles-line-widths-1').addEventListener('input', function (event) {
			$('#tiles-line-width-2').collapse('hide');
			document.getElementById('tiles-line-width-label').hidden = true;
			me.strokeRatio2 = me.strokeRatio1;
			generateBackground(0);
			drawPreview();
			numLineWidths = 1;
		});

		optionsDoc.getElementById('tiles-line-widths-2').addEventListener('input', function (event) {
			document.getElementById('tiles-stroke-ratio2').value = me.strokeRatio2;
			$('#tiles-line-width-2').collapse('show');
			document.getElementById('tiles-line-width-label').hidden = false;
			numLineWidths = 2;
		});

		optionsDoc.getElementById('tiles-stroke-ratio1').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			me.strokeRatio1 = value;
			if (numLineWidths === 1) {
				me.strokeRatio2 = value;
			}
			generateBackground(0);
			drawPreview();
		});

		optionsDoc.getElementById('tiles-stroke-ratio2').addEventListener('input', function (event) {
			me.strokeRatio2 = parseFloat(this.value);
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
				if (value >= 1) {
					previewWidth = 252 * value;
					previewHeight = 252;
				} else {
					previewWidth = 252;
					previewHeight = Math.round(previewWidth / value);
				}
				designCanvas.style.width = 'min(' + previewWidth + 'px, 100%)';
				designCanvas.width = previewWidth;
				designCanvas.height = previewHeight;
				drawPreview();
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

		function parseGridPattern(input, property) {
			if (!input.checkValidity()) {
				return;
			}
			const str = input.value.trim();
			const values = [];
			if (str === '') {
				values.push(1);
			} else {
				let i = 0;
				do {
					let char = str[i];
					if (char === '0') {
						values.push(0);
						i++;
						continue;
					}
					const sign = char === '+' ? 1 : -1;
					i++;
					char = str[i];
					if (char >= '1' && char <= '9') {
						let magnitude = '';
						do {
							magnitude += char;
							i++;
							char = str[i];
						} while (char >= '0' && char <= '9');
						let j = magnitude.length - 1;
						while (magnitude[j] === '0') {
							i--;
							j--;
						}
						values.push(sign * parseInt(magnitude) * 10 ** -magnitude.length);
					} else {
						values.push(sign);
					}
				} while (i < str.length);
			}
			me[property] = values;
			generateBackground(0);
		}

		optionsDoc.getElementById('tiles-grid-row-pattern').addEventListener('input', function (event) {
			parseGridPattern(this, 'shearXMultipliers');
		});

		optionsDoc.getElementById('tiles-grid-col-pattern').addEventListener('input', function (event) {
			parseGridPattern(this, 'shearYMultipliers');
		});

		optionsDoc.getElementById('tiles-grid-width').addEventListener('input', function (event) {
			const value = parseInt(this.value);
			if (value >= 0) {
				me.gridWidth = value;
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('tiles-grid-spacing-x').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 1) {
				me.gridSpacingX = value;
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('tiles-grid-spacing-y').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 1) {
				me.gridSpacingY = value;
				generateBackground(0);
			}
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
				if (editColorIndex > numColors - 1) {
					selectEditColor(numColors - 1);
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

		function selectEditColor(eventOrNumber) {
			paletteUI.children[editColorIndex].children[0].classList.remove('active');
			if (typeof(eventOrNumber) === 'number') {
				editColorIndex = eventOrNumber;
			} else {
				editColorIndex = parseInt(eventOrNumber.target.dataset.index);
			}
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
			button.style.backgroundColor = hsla(color[0], color[1], color[2], color[3]);
			if (index < 9) {
				button = designColors.children[index].children[0];
				button.style.backgroundColor = hsla(color[0], color[1], color[2], 1);
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

	this.tileTypes = [
		new MiddleLineTile('000033300', 3, 4, ConstraintLogic.TRUE),	// T-shape to the right
		new MiddleLineTile('000004440', 3, 4, ConstraintLogic.TRUE),	// T-shape downwards
		new MiddleLineTile('000010110', 3, 4, ConstraintLogic.TRUE),	// T-shape to the left
		new MiddleLineTile('000022020', 3, 4, ConstraintLogic.TRUE),	// T-shape upwards
		new MiddleLineTile('100000001', 1, 4, ConstraintLogic.DONT_CARE),	// Curve, upper right
		new MiddleLineTile('020000002', 1, 4, ConstraintLogic.DONT_CARE),	// Curve, lower right
		new MiddleLineTile('003000004', 1, 4, ConstraintLogic.DONT_CARE),	// Curve, lower left
		new MiddleLineTile('000400008', 1, 4, ConstraintLogic.DONT_CARE),	// Curve, upper left
	];

	this.tileFrequencies = [12, 12, 12, 12, 12, 12, 12, 12];

	// Stroke widths as a proportion of the cell's width or height.
	this.strokeRatio1 = 0.25;
	this.strokeRatio2 = 0.25;

	// Length of line caps (0..0.5)
	this.overlap = [0.25, 0.25, 0.25, 0.25];

	// Probability of a cell being left blank
	this.gapProbability = 0;

	this.colorMode = 'd';	// Coloured as they appear in the tile designer
	this.flowProbability = 1;
	this.numColors = 9;
	this.colorGroupSize = 1;

	// HSLA format (0-360 hue, 0..1 saturation and lightness)
	this.colors = [
		[  4,  0.86, 0.54, 1],	// Red
		[148,  1   , 0.27, 1],	// Green
		[222,  0.90, 0.32, 1],	// Blue
		[ 49,  0.95, 0.50, 1],	// Yellow
		[180,  0.85, 0.40, 1],	// Turquoise
		[345,   0.6, 0.18, 1],	// Charcoal Grey
		[262,  0.42, 0.49, 1],	// Purple
		[346,  0.94, 0.83, 1],	// Pink
		[ 94,  0.63, 0.52, 1],	// Lime
		[201,  0.87, 0.42, 1],	// Azure
		[ 26,  0.90, 0.56, 1],	// Orange
		[205,   0.6, 0.59, 1],	// Grey
		[323,  0.99, 0.26, 1],	// Grape
		[327,  0.77, 0.56, 1],	// Magenta
		[ 30,  1   , 0.26, 1],	// Brown
	];

	this.sideLength = 25;
	this.cellAspect = 1;
	this.gridColor = 100;
	this.gridOpacity = 0;
	this.gridWidth = 1;
	this.gridSpacingX = 1;
	this.gridSpacingY = 1;

	/*Shearing. Normal range of values is 0-1.
	 * Element 0: X displacement for the middle
	 * Element 1: X displacement for the bottom
	 * Element 2: Y-Shear for the left half
	 * Element 3: Y-Shear for the right half;
	 */
	this.shear = [0, 0, 0, 0];

	this.shearXMultipliers = [1];
	this.shearYMultipliers = [1];

}

TruchetTiles.prototype.animatable = {
	continuous: [
		'tileFrequencies', 'strokeRatio1', 'strokeRatio2', 'overlap', 'gapProbability',
		'colors', 'flowProbability',
		'sideLength', 'cellAspect', 'gridColor',
		'gridOpacity', 'gridWidth', 'gridSpacingX', 'gridSpacingY',
		'shear', 'shearXMultipliers', 'shearYMultipliers',
	],
	stepped: [
		'colorMode', 'numColors', 'colorGroupSize',
	],
	nominalArray: [
		'tileTypes'
	]
};

TruchetTiles.prototype.getColor = function (index) {
	const color = this.colors[index];
	return hsla(color[0], color[1], color[2], color[3]);
}

TruchetTiles.prototype.connectedTiles = function (x, y, port, width, height) {
	const connections = POSSIBLE_CONNECTIONS[port];
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
	shear[2] = this.shear[2] * cellHeight;
	shear[3] = this.shear[3] * cellHeight - shear[2];
	const totalShearX = shear[0] + shear[1];
	let minX = 0;
	for (let j = 0; j < cellsDownCanvas; j++) {
		minX -= totalShearX * this.shearXMultipliers[j % this.shearXMultipliers.length];
	}
	const totalShearY = shear[2] + shear[3];
	let minY = 0;
	for (let i = 0; i < cellsAcrossCanvas; i++) {
		minY -= totalShearY * this.shearYMultipliers[i % this.shearYMultipliers.length];
	}
	cellsAcrossCanvas += Math.ceil(Math.abs(minX) / cellWidth) + 2;
	cellsDownCanvas += Math.ceil(Math.abs(minY) / cellHeight) + 2;
	minX = Math.min(minX, -cellWidth);
	minY = Math.min(minY, -cellHeight);

	const tileFrequencies = this.tileFrequencies;
	let tileFrequenciesTotal = 0;
	const tileCDF = new Array(tileFrequencies.length);
	for (let i = 0; i < tileCDF.length; i++) {
		tileFrequenciesTotal += tileFrequencies[i];
		tileCDF[i] = tileFrequenciesTotal;
	}
	const unusedTileTypes = new Set();
	for (let i = 0; i < tileFrequencies.length; i++) {
		if (tileFrequencies[i] === 0) {
			unusedTileTypes.add(i);
		}
	}
	const numTileTypes = this.tileTypes.length;

	const tileMap = new Array(cellsDownCanvas);

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
	let previousRowAttempts = [];

	for (let cellY = 0; cellY < cellsDownCanvas; cellY++) {
		const tileMapRow = new Array(cellsAcrossCanvas);
		const currentRowAttempts = [];
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

			// TODO generalize to handle diagonal connections
			let attempts, leftAttempts, upperAttempts;
			leftAttempts = currentRowAttempts[cellX - 1];
			upperAttempts = previousRowAttempts[cellX];
			let permitted, leftPermitted;
			let changeLeft, changeUpper;
			do {
				const oldLeftTile = tileMapRow[cellX - 1];
				let tile;
				do {
					attempts = new Set(unusedTileTypes);
					do {
						tile = chooseTile(this.tileTypes, tileCDF, tileFrequenciesTotal, attempts, this.colorMode);
						tileMapRow[cellX] = tile;
						permitted = checkTiling(tileMap, cellX, cellY, cellsAcrossCanvas, cellsDownCanvas);

					} while (!permitted && attempts.size < numTileTypes);

					changeLeft = !permitted && leftAttempts !== undefined && leftAttempts.size < numTileTypes;
					if (changeLeft) {
						tileMapRow[cellX] = undefined;
						do {
							const leftTile = chooseTile(this.tileTypes, tileCDF, tileFrequenciesTotal, leftAttempts, this.colorMode);
							tileMapRow[cellX - 1] = leftTile;
							leftPermitted = checkTiling(tileMap, cellX - 1, cellY, cellsAcrossCanvas, cellsDownCanvas);
						} while (!leftPermitted && leftAttempts.size < numTileTypes);
					} else {
						leftPermitted = true;
					}
				} while (changeLeft && leftPermitted);
				changeUpper = !permitted && upperAttempts !== undefined && upperAttempts.size < numTileTypes;
				if (changeUpper) {
					const oldUpperTile = tileMap[cellY - 1][cellX];
					tileMapRow[cellX] = undefined;
					do {
						if (cellX > 0) {
							tileMapRow[cellX - 1] = undefined;
							leftAttempts = new Set(unusedTileTypes);
							currentRowAttempts[cellX - 1] = leftAttempts;
						}
						const upperTile = chooseTile(this.tileTypes, tileCDF, tileFrequenciesTotal, upperAttempts, this.colorMode);
						tileMap[cellY - 1][cellX] = upperTile;
						permitted = checkTiling(tileMap, cellX, cellY - 1, cellsAcrossCanvas, cellsDownCanvas);
						if (permitted && cellX > 0) {
							do {
								const leftTile = chooseTile(this.tileTypes, tileCDF, tileFrequenciesTotal, leftAttempts, this.colorMode);
								tileMapRow[cellX - 1] = leftTile;
								permitted = checkTiling(tileMap, cellX - 1, cellY, cellsAcrossCanvas, cellsDownCanvas);
							} while (!permitted && leftAttempts.size < numTileTypes);
						}
					} while (!permitted && upperAttempts.size < numTileTypes);

					if (!permitted) {
						// Give up but restore previous partial solution
						tileMap[cellY - 1][cellX] = oldUpperTile;
						if (cellX > 0) {
							tileMapRow[cellX - 1] = oldLeftTile;
						}
					}

				} else if (!leftPermitted) {
					// Give up
					tileMapRow[cellX] = tile;
				}

			} while (changeUpper);
			currentRowAttempts[cellX] = attempts;

			unitsProcessed++;
			if (unitsProcessed >= benchmark) {
				const now = calcBenchmark();
				if (now >= yieldTime) {
					yield;
				}
			}
		} // next cellX
		previousRowAttempts = currentRowAttempts;
	} // next cellY

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

	this.drawTiles(context, tileMap, cellWidth, cellHeight, minX, minY, shear);
}

TruchetTiles.prototype.drawTiles = function (context, tileMap, cellWidth, cellHeight, minX = 0, minY = 0, shear = [0, 0, 0, 0]) {
	const cellsDownCanvas = tileMap.length;
	const cellsAcrossCanvas = tileMap[0].length;
	const totalShearX = shear[0] + shear[1];
	const totalShearY = shear[2] + shear[3];
	const lineWidthH = Math.max(Math.round(this.strokeRatio1 * cellWidth), 1);
	const lineWidthV = Math.max(Math.round(this.strokeRatio2 * cellHeight), 1);
	const localShear = [0, 0, 0, 0];
	let sumShearX = 0, sumShearY = 0;

	for (let cellY = 0; cellY < cellsDownCanvas; cellY++) {
		const tileMapRow = tileMap[cellY];
		if (tileMapRow === undefined) {
			break;
		}
		const shearXMultiplier = this.shearXMultipliers[cellY % this.shearXMultipliers.length];
		localShear[0] = shear[0] * shearXMultiplier;
		localShear[1] = shear[1] * shearXMultiplier;

		sumShearY = 0;
		for (let cellX = 0; cellX < cellsAcrossCanvas; cellX++) {
			const shearYMultiplier = this.shearYMultipliers[cellX % this.shearYMultipliers.length];
			localShear[2] = shear[2] * shearYMultiplier;
			localShear[3] = shear[3] * shearYMultiplier;

			const x = minX + cellX * cellWidth + sumShearX;
			const y = minY + cellY * cellHeight + sumShearY;
			const tile = tileMapRow[cellX];
			if (tile === undefined) {
				break;
			}
			tile.draw(context, x, y, cellWidth, cellHeight, lineWidthH, lineWidthV, localShear, this, tileMap, cellX, cellY);
			sumShearY += totalShearY * shearYMultiplier;
		}
		sumShearX += totalShearX * shearXMultiplier;
	}

	if (this.gridWidth > 0) {
		// TODO handle different anchor points
		context.beginPath();
		const halfCellWidth = cellWidth / 2;
		const halfCellHeight = cellHeight / 2;
		const lineWidthLR = lineWidthH / 2;
		const lineWidthTB = lineWidthV / 2;
		context.lineWidth = this.gridWidth;
		if (this.gridWidth % 2 === 1) {
			context.translate(0.5, 0.5);
		}
		// Horizontal lines
		sumShearX = 0;
		let prevPoints = new Array(cellsAcrossCanvas * 4 + 1);
		prevPoints.fill([0, 0]);

		for (let cellY = 0; cellY < cellsDownCanvas; cellY++) {
			const shearXMultiplier = this.shearXMultipliers[cellY % this.shearXMultipliers.length];
			localShear[0] = shear[0] * shearXMultiplier;
			localShear[1] = shear[1] * shearXMultiplier;
			sumShearY = 0;
			let x = Math.round(minX + sumShearX);
			let y = Math.round(minY + (cellY + 1) * cellHeight);
			const points = new Array(cellsAcrossCanvas * 4 + 1);
			points[0] = [x, y];
			const mod = cellY % this.gridSpacingY;
			const weight = 1 - mod;
			context.moveTo(...weightedPoint(prevPoints[0], points[0], weight));
			for (let cellX = 0; cellX < cellsAcrossCanvas; cellX++) {
				const shearYMultiplier = this.shearYMultipliers[cellX % this.shearYMultipliers.length];
				localShear[2] = shear[2] * shearYMultiplier;
				localShear[3] = shear[3] * shearYMultiplier;
				x = minX + cellX * cellWidth + sumShearX;
				y = minY + cellY * cellHeight + sumShearY;
				const lineLeft = coordinateTransform(x, y, cellWidth, cellHeight, localShear, halfCellWidth - lineWidthLR, cellHeight);
				const centre = coordinateTransform(x, y, cellWidth, cellHeight, localShear, halfCellWidth, cellHeight);
				const lineRight = coordinateTransform(x, y, cellWidth, cellHeight, localShear, halfCellWidth + lineWidthLR, cellHeight);
				const right = coordinateTransform(x, y, cellWidth, cellHeight, localShear, cellWidth, cellHeight);
				points[cellX * 4 + 1] = lineLeft;
				points[cellX * 4 + 2] = centre;
				points[cellX * 4 + 3] = lineRight;
				points[cellX * 4 + 4] = right;
				if (mod >= 0 && mod < 1) {
					if (cellY < cellsDownCanvas - 1) {
						const thisTile = tileMap[cellY][cellX];
						const bottomTile = tileMap[cellY + 1][cellX];
						if ((!thisTile.hasPort(10)) ^ (!bottomTile.hasPort(2))) {
							context.lineTo(...weightedPoint(prevPoints[cellX * 4 + 2], centre, weight));
						} else {
							context.lineTo(...weightedPoint(prevPoints[cellX * 4 + 1], lineLeft, weight));
							context.lineTo(...weightedPoint(prevPoints[cellX * 4 + 3], lineRight, weight));
						}
					} else {
						context.lineTo(...weightedPoint(prevPoints[cellX * 4 + 2], centre, weight));
					}
					context.lineTo(...weightedPoint(prevPoints[cellX * 4 + 4], right, weight));
				}
				sumShearY += totalShearY * shearYMultiplier;
			}
			sumShearX += totalShearX * shearXMultiplier;
			prevPoints = points;
		}
		// Vertical lines
		sumShearY = 0;
		prevPoints = new Array(cellsDownCanvas * 4 + 1);
		prevPoints.fill([0, 0]);

		for (let cellX = 0; cellX < cellsAcrossCanvas; cellX++) {
			const shearYMultiplier = this.shearYMultipliers[cellX % this.shearYMultipliers.length];
			localShear[2] = shear[2] * shearYMultiplier;
			localShear[3] = shear[3] * shearYMultiplier;
			sumShearX = 0;
			let x = Math.round(minX + (cellX + 1) * cellWidth);
			let y = Math.round(minY + sumShearY);
			const points = new Array(cellsDownCanvas * 4 + 1);
			points[0] = [x, y];
			const mod = cellX % this.gridSpacingX;
			const weight = 1 - mod;
			context.moveTo(...weightedPoint(prevPoints[0], points[0], weight));
			for (let cellY = 0; cellY < cellsDownCanvas; cellY++) {
				const shearXMultiplier = this.shearXMultipliers[cellY % this.shearXMultipliers.length];
				localShear[0] = shear[0] * shearXMultiplier;
				localShear[1] = shear[1] * shearXMultiplier;
				x = minX + cellX * cellWidth + sumShearX;
				y = minY + cellY * cellHeight + sumShearY;
				const lineTop = coordinateTransform(x, y, cellWidth, cellHeight, localShear, cellWidth, halfCellHeight - lineWidthTB);
				const middle = coordinateTransform(x, y, cellWidth, cellHeight, localShear, cellWidth, halfCellHeight);
				const lineBottom = coordinateTransform(x, y, cellWidth, cellHeight, localShear, cellWidth, halfCellHeight + lineWidthTB);
				const bottom = coordinateTransform(x, y, cellWidth, cellHeight, localShear, cellWidth, cellHeight);
				points[cellY * 4 + 1] = lineTop;
				points[cellY * 4 + 2] = middle;
				points[cellY * 4 + 3] = lineBottom;
				points[cellY * 4 + 4] = bottom;
				if (mod >= 0 && mod < 1) {
					if (cellX < cellsAcrossCanvas - 1) {
						const thisTile = tileMap[cellY][cellX];
						const rightTile = tileMap[cellY][cellX + 1];
						if ((!thisTile.hasPort(6)) ^ (!rightTile.hasPort(14))) {
							context.lineTo(...weightedPoint(prevPoints[cellY * 4 + 2], middle, weight));
						} else {
							context.lineTo(...weightedPoint(prevPoints[cellY * 4 + 1], lineTop, weight));
							context.lineTo(...weightedPoint(prevPoints[cellY * 4 + 3], lineBottom, weight));
						}
					} else {
						context.lineTo(...weightedPoint(prevPoints[cellY * 4 + 2], middle, weight));
					}
					context.lineTo(...weightedPoint(prevPoints[cellY * 4 + 4], bottom, weight));
				}
				sumShearX += totalShearX * shearXMultiplier;
			}
			sumShearY += totalShearY * shearYMultiplier;
			prevPoints = points;
		}
		const gridIntensity = this.gridColor;
		context.strokeStyle = rgba(gridIntensity, gridIntensity, gridIntensity, this.gridOpacity);
		context.stroke();
	}
}
