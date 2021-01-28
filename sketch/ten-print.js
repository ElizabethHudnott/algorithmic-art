/**Inspired by Daniel Shiffman's Coding Challenge #76 (https://thecodingtrain.com/CodingChallenges/076-10print.html)
 * which he developed from the book 10 PRINT (https://10print.org/).
 */
export default function TenPrint() {
	const me = this;
	this.title = '10 PRINT';
	hasRandomness(true);
	this.helpFile = 'help/ten-print.html';

	this.optionsDocument = downloadFile('ten-print.html', 'document').then(function (optionsDoc) {

		optionsDoc.getElementById('ten-print-side-length').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value > 0) {
				me.sideLength = value;
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('ten-print-cell-aspect').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value > 0) {
				me.cellAspect = value;
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('ten-print-line-width').addEventListener('input', function (event) {
			me.strokeRatio = parseFloat(this.value);
			generateBackground(1);
		});

		optionsDoc.getElementById('ten-print-gap-probability').addEventListener('input', function (event) {
			me.blankProbability = parseFloat(this.value);
			generateBackground(1);
		});

		optionsDoc.getElementById('ten-print-probability').addEventListener('input', function (event) {
			me.probability = parseFloat(this.value);
			generateBackground(1);
		});

		function changeColor(index) {
			return function (event) {
				me.colors[index] = this.value;
				generateBackground(1);
			};
		}

		optionsDoc.querySelectorAll('input[type=color]').forEach(function (item, index) {
			item.addEventListener('input', changeColor(index));
		});

		return optionsDoc;
	});

	this.sideLength = 25;
	this.cellAspect = 1;
	// Probability of a cell being left blank
	this.blankProbability = 0;
	// Probability of a forward slash given not blank
	this.probability = 0.5;
	this.colors = ['#887ecb', '#887ecb', '#887ecb', '#887ecb'];
	// Stroke width as a proportion of the cell's area.
	this.strokeRatio = 0.12;
}

TenPrint.prototype.animatable = {
	'continuous': [
		'colors', 'strokeRatio'
	]
};

TenPrint.prototype.generate = function* (context, canvasWidth, canvasHeight, preview) {
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

	const diagonalDist = Math.hypot(canvasWidth, canvasHeight);
	const style1 = context.createRadialGradient(0, canvasHeight, 0, 0, canvasHeight, diagonalDist);
	style1.addColorStop(0, this.colors[2]);
	style1.addColorStop(1, this.colors[1]);
	const style2 = context.createRadialGradient(canvasWidth, canvasHeight, 0, canvasWidth, canvasHeight, diagonalDist);
	style2.addColorStop(0, this.colors[3]);
	style2.addColorStop(1, this.colors[0]);

	const lineWidth = Math.max(Math.round(this.strokeRatio * Math.hypot(cellWidth, cellHeight)) / 2, 0.5);
	const lineWidth1 = Math.trunc(lineWidth);
	const lineWidth2 = Math.ceil(lineWidth);

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
		const yTop = cellY * cellHeight;
		const yBottom = yTop + cellHeight;

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
					continue;
				} else {
					blankDiffusion += blankProbability;
				}
			}
			if (blankDiffusion >= 1 && blankRunLength < maxBlankRun) {
				blankRunLength++;
				blankDiffusion--;
				continue;
			}

			blankRunLength = 0;
			const xLeft = cellX * cellWidth;
			const xRight = xLeft + cellWidth;

			const p = random.next();
			context.beginPath();

			if (p < this.probability) {
				// Forward slash
				context.fillStyle = style1;
				context.moveTo(xLeft, yBottom - lineWidth1);
				context.lineTo(xRight, yTop - lineWidth1);
				context.lineTo(xRight, yTop + lineWidth2);
				context.lineTo(xLeft, yBottom + lineWidth2);
				context.closePath();
			} else {
				// Backslash
				context.fillStyle = style2;
				context.moveTo(xLeft, yTop - lineWidth1);
				context.lineTo(xRight, yBottom - lineWidth1);
				context.lineTo(xRight, yBottom + lineWidth2);
				context.lineTo(xLeft, yTop + lineWidth2);
				context.closePath();
			}
			context.fill();
		}
		unitsProcessed++;
		if (unitsProcessed >= benchmark) {
			const now = calcBenchmark();
			if (now >= yieldTime) {
				yield;
			}
		}
	}
}
