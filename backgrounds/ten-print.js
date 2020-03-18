'use strict';

/**Inspired by Daniel Sheefmahhnnn's Coding Challenge #76 (https://thecodingtrain.com/CodingChallenges/076-10print.html)
 * which he developed from the book 10 PRINT (https://10print.org/).
 */
 {

	function TenPrint() {
		const me = this;
		this.title = '10 PRINT';
		this.optionsDocument = downloadDocument('ten-print.html').then(function (optionsDoc) {
			optionsDoc.getElementById('ten-print-zoom').addEventListener('input', function (event) {
				me.zoomOut = this.value;
				me.generate(true);
			});

			optionsDoc.getElementById('ten-print-angle').addEventListener('input', function (event) {
				me.angle = this.value * Math.PI / 180;
				me.generate(true);
			});
			return optionsDoc;
		});

		this.angle = Math.atan2(1, 0.936);
		this.zoomOut = 1;
		// Probability of a cell being left blank
		this.blankProbability = 0;
		// Probability of a forward slash given not blank
		this.probability = 0.5;
		// Forward slash style
		this.stroke1Style = '#887ecb';
		// Backslash style
		this.stroke2Style = '#887ecb';
		// Stroke width as a proportion of the cell's area.
		this.strokeRatio = 0.125;
	}

	backgroundGenerators.set('ten-print', new TenPrint());

	TenPrint.prototype.generate = function (preview) {
		const beginTime = performance.now();
		const canvas = document.getElementById('background-canvas');
		const context = canvas.getContext('2d');
		context.clearRect(0, 0, canvas.width, canvas.height);
		const cellsDownScreen = 25;
		const tan = Math.tan(Math.max(this.angle, 0.0001));
		const sqrTan = Math.min(Math.sqrt(tan), 1);
		const zoom = this.zoomOut / sqrTan;

		const canvasHeight = canvas.height;
		const heightProportion = canvasHeight / screen.height;
		let cellsDownCanvas = heightProportion * cellsDownScreen * zoom;
		const cellHeight = Math.min(Math.max(Math.round(canvasHeight / cellsDownCanvas), 2), canvasHeight);
		cellsDownCanvas = Math.max(Math.round(canvasHeight / cellHeight), 1);

		const cellWidth = Math.max(Math.min(Math.round(cellHeight / tan), 200000), 2);
		let cellsAcrossCanvas = Math.max(Math.round(canvas.width / cellWidth), 1);
		if (preview && cellsAcrossCanvas > 200) {
			cellsAcrossCanvas = 200;
		}

		const lineWidth = Math.max(Math.round(0.5 * this.strokeRatio * cellHeight / sqrTan), 1);

		const blankSpacing = Math.max(Math.trunc(1 / this.blankProbability), 1);
		let spacingShift = Math.ceil(blankSpacing / 2);
		while (blankSpacing % spacingShift === 0 && spacingShift > 1) {
			spacingShift--;
		}
		const blankProbability =  this.blankProbability * blankSpacing;
		const maxBlankRun = Math.round(1 / (1 - this.blankProbability) + 0.49) - 1;

		let blankRunLength = 0;
		let blankDiffusion = 0;
		for (let cellY = 0; cellY < cellsDownCanvas; cellY++) {
			const yTop = cellY * cellHeight;
			const yBottom = yTop + cellHeight;
			blankRunLength = 0;
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
					context.fillStyle = this.stroke1Style;
					context.moveTo(xLeft, yBottom - lineWidth);
					context.lineTo(xRight, yTop - lineWidth);
					context.lineTo(xRight, yTop + lineWidth);
					context.lineTo(xLeft, yBottom + lineWidth);
					context.closePath();
				} else {
					// Backslash
					context.fillStyle = this.stroke2Style;
					context.moveTo(xLeft, yTop - lineWidth);
					context.lineTo(xRight, yBottom - lineWidth);
					context.lineTo(xRight, yBottom + lineWidth);
					context.lineTo(xLeft, yTop + lineWidth);
					context.closePath();
				}
				context.fill();
			}
			if (preview && yBottom >= 480 && performance.now() >= beginTime + 20) {
				break;
			}
		}
	}

}
