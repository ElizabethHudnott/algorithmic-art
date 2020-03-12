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

		let blankSpacing;
		let blankProbability = this.blankProbability;
		if (blankProbability > 0) {
			blankSpacing = Math.trunc(1 / this.blankProbability);
			while (blankSpacing > 1 && (cellsAcrossCanvas % blankSpacing <= 1 || cellsAcrossCanvas % blankSpacing === blankSpacing - 1)) {
				blankSpacing--;
			}
			blankProbability =  this.blankProbability * blankSpacing;
		} else {
			blankSpacing = cellsAcrossCanvas * cellsDownCanvas;
		}

		let cellNumber = 1;
		for (let cellY = 0; cellY < cellsDownCanvas; cellY++) {
			const yTop = cellY * cellHeight;
			const yBottom = yTop + cellHeight;
			for (let cellX = 0; cellX < cellsAcrossCanvas; cellX++) {
				cellNumber++;
				if (blankSpacing > 0 && cellNumber % blankSpacing === 0 && Math.random() < blankProbability) {
					continue;
				}

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
