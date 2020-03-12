'use strict';

/**Inspired by Daniel Sheefmahhnnn's Coding Challenge #76 (https://thecodingtrain.com/CodingChallenges/076-10print.html)
 * which he developed from the book 10 PRINT (https://10print.org/).
 */

class TenPrint {

	constructor() {
		this.cellsDownScreen = 25;
		this.angle = Math.atan(3 / 4);
		this.zoomOut = 1;
		this.blankProbability = 0; // 0 <= x <= 0.25 are good values.
		this.probability = 0.5;
		this.stroke1Style = '#887ecb';
		this.stroke2Style = '#887ecb';
		// Stroke width as a proportion of the cell's width or height.
		this.strokeRatio = 0.125;
	}

	readProperties() {

	}

	generate(canvas) {
		const context = canvas.getContext('2d');
		const zoom = this.zoomOut;

		const canvasHeight = canvas.height;
		const heightProportion = canvasHeight / screen.height;
		let cellsDownCanvas = heightProportion * this.cellsDownScreen * zoom;
		const cellHeight = Math.max(Math.round(canvasHeight / cellsDownCanvas), 2);
		cellsDownCanvas = Math.round(canvasHeight / cellHeight);

		const cellWidth = Math.max(Math.min(Math.round(cellHeight / Math.tan(this.angle)), 200000), 2);
		const cellsAcrossCanvas = Math.max(Math.round(canvas.width / cellWidth), 1);

		let lineWidth;
		if (cellWidth <= cellHeight) {
			lineWidth = Math.round(this.strokeRatio * 2 / 3 * cellWidth);
		} else {
			lineWidth = Math.round(this.strokeRatio  * 2 / 3 * cellHeight);
		}
		if (lineWidth < 1) {
			lineWidth = 1;
		}

		const blankSpacing = Math.max(Math.trunc(1 / this.blankProbability), 1);
		let spacingShift = Math.ceil(blankSpacing / 2);
		while (blankSpacing % spacingShift === 0 && spacingShift > 2) {
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
			blankDiffusion = 0;
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
				if (blankDiffusion >= 1 && blankRunLength === 0) {
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
