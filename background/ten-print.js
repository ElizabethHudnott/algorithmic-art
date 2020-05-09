'use strict';

/**Inspired by Daniel Sheefmahhnnn's Coding Challenge #76 (https://thecodingtrain.com/CodingChallenges/076-10print.html)
 * which he developed from the book 10 PRINT (https://10print.org/).
 */
 {

	function TenPrint() {
		const me = this;
		this.title = '10 PRINT';
		this.hasRandomness = true;
		this.credits = 'Inspired by Daniel Sheefmahhnnn\'s <a href="https://thecodingtrain.com/CodingChallenges/076-10print.html" target="_blank">Coding Challenge #76</a>, which he developed from the book <a href="https://10print.org" target="_blank">10 PRINT</a> by Montfort et al.';

		this.optionsDocument = downloadFile('ten-print.html', 'document').then(function (optionsDoc) {
			optionsDoc.getElementById('ten-print-zoom').addEventListener('input', function (event) {
				me.zoomOut = parseFloat(this.value);
				progressiveBackgroundGen(me, 1);
			});

			optionsDoc.getElementById('ten-print-angle').addEventListener('input', function (event) {
				me.angle = parseFloat(this.value) * Math.PI / 180;
				progressiveBackgroundGen(me, 1);
			});

			optionsDoc.getElementById('ten-print-line-width').addEventListener('input', function (event) {
				me.strokeRatio = parseFloat(this.value);
				progressiveBackgroundGen(me, 1);
			});

			optionsDoc.getElementById('ten-print-gap-probability').addEventListener('input', function (event) {
				me.blankProbability = parseFloat(this.value);
				progressiveBackgroundGen(me, 1);
			});

			optionsDoc.getElementById('ten-print-probability').addEventListener('input', function (event) {
				me.probability = parseFloat(this.value);
				progressiveBackgroundGen(me, 1);
			});

			function changeColor(index) {
				return function (event) {
					me.colors[index] = this.value;
					progressiveBackgroundGen(me, 1);
				};
			}

			optionsDoc.querySelectorAll('input[type=color]').forEach(function (item, index) {
				item.addEventListener('input', changeColor(index));
			});

			return optionsDoc;
		});

		this.angle = Math.atan2(1, 0.936);
		this.zoomOut = 1;
		// Probability of a cell being left blank
		this.blankProbability = 0;
		// Probability of a forward slash given not blank
		this.probability = 0.5;
		this.colors = ['#887ecb', '#887ecb', '#887ecb', '#887ecb'];
		// Stroke width as a proportion of the cell's area.
		this.strokeRatio = 0.12;
	}

	TenPrint.prototype.generate = function* (context, canvasWidth, canvasHeight, preview) {
		let beginTime = performance.now();
		const cellsDownScreen = 25;
		const tan = Math.tan(Math.max(this.angle, 0.0001));
		const sqrTan = Math.min(Math.sqrt(tan), 1);
		const zoom = this.zoomOut / sqrTan;

		const heightProportion = canvasHeight / screen.height;
		let cellsDownCanvas = heightProportion * cellsDownScreen * zoom;
		const cellHeight = Math.min(Math.max(Math.round(canvasHeight / cellsDownCanvas), 2), canvasHeight);
		cellsDownCanvas = Math.max(Math.round(canvasHeight / cellHeight), 1);

		const cellWidth = Math.max(Math.min(Math.round(cellHeight / tan), 200000), 2);
		const cellsAcrossCanvas = Math.max(Math.round(canvasWidth / cellWidth), 1);

		const diagonalDist = Math.hypot(canvasWidth, canvasHeight);
		const style1 = context.createRadialGradient(0, canvasHeight, 0, 0, canvasHeight, diagonalDist);
		style1.addColorStop(0, this.colors[2]);
		style1.addColorStop(1, this.colors[1]);
		const style2 = context.createRadialGradient(canvasWidth, canvasHeight, 0, canvasWidth, canvasHeight, diagonalDist);
		style2.addColorStop(0, this.colors[3]);
		style2.addColorStop(1, this.colors[0]);

		const lineWidth = Math.max(Math.round(this.strokeRatio * cellHeight / sqrTan) / 2, 0.5);
		const lineWidth1 = Math.trunc(lineWidth);
		const lineWidth2 = Math.ceil(lineWidth);

		let blankProbability = this.blankProbability;
		let blankSpacing = blankProbability === 0 ? 0 : Math.max(Math.trunc(1 / blankProbability), 1);
		let spacingShift;
		if (blankProbability < 0.06 && this.zoomOut > 3) {
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
				const randomBlank = Math.random();
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

				const p = Math.random();
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
			if (cellY % 20 === 19 && performance.now() >= beginTime + 20) {
				yield;
				beginTime = performance.now();
			}
		}
	}

	backgroundGenerators.set('ten-print', new TenPrint());
}
