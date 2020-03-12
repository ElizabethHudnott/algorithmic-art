'use strict';

/**Inspired by Daniel Sheefmahhnnn's Coding Challenge #76 (https://thecodingtrain.com/CodingChallenges/076-10print.html)
 * which he developed from the book 10 PRINT (https://10print.org/).
 */

class TenPrint {

	constructor() {
		this.angle = Math.atan(1 / 0.936);
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

	readProperties() {

	}

	generate(canvas) {
		const context = canvas.getContext('2d');
		const cellsDownScreen = 25;
		const tan = Math.tan(this.angle);
		const sqrTan = Math.min(Math.sqrt(tan), 1);
		const zoom = this.zoomOut / sqrTan;

		const canvasHeight = canvas.height;
		const heightProportion = canvasHeight / screen.height;
		let cellsDownCanvas = heightProportion * cellsDownScreen * zoom;
		const cellHeight = Math.max(Math.round(canvasHeight / cellsDownCanvas), 2);
		cellsDownCanvas = Math.round(canvasHeight / cellHeight);

		const cellWidth = Math.max(Math.min(Math.round(cellHeight / tan), 200000), 2);
		const cellsAcrossCanvas = Math.max(Math.round(canvas.width / cellWidth), 1);

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
					blankDiffusion = 0;
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
		}
	}

}
