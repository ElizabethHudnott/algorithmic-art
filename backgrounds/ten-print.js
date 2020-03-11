'use strict';

/**Inspired by Daniel Sheefmahhnnn's Coding Challenge #76 (https://thecodingtrain.com/CodingChallenges/076-10print.html)
 * which he developed from the book 10 PRINT (https://10print.org/).
 */

class TenPrint {

	constructor() {
		this.cellsAcrossScreen = 54;
		this.cellsDownScreen = 25;
		this.zoomOut = 1;
		this.blankProbability = 0; // 0 <= x <= 0.25 are good values.
		this.probability = 0.5;
		this.strokeStyle = '#0088FF';
		// Stroke width as a proportion of the cell's width or height.
		this.strokeRatio = 0.125;
	}

	readProperties() {

	}

	generate(canvas) {
		const canvasWidth = canvas.width;
		const context = canvas.getContext('2d');
		const zoom = this.zoomOut;

		const widthProportion = canvasWidth / screen.width;
		let cellsAcrossCanvas = widthProportion * this.cellsAcrossScreen * zoom;
		const cellWidth = Math.round(canvasWidth / cellsAcrossCanvas);
		cellsAcrossCanvas = Math.round(canvasWidth / cellWidth);

		const canvasHeight = canvas.height;
		const heightProportion = canvasHeight / screen.height;
		let cellsDownCanvas = heightProportion * this.cellsDownScreen * zoom;
		const cellHeight = Math.round(canvasHeight / cellsDownCanvas);
		cellsDownCanvas = Math.round(canvasHeight / cellHeight);

		let lineWidth;
		if (cellWidth <= cellHeight) {
			lineWidth = Math.round(this.strokeRatio * cellWidth);
		} else {
			lineWidth = Math.round(this.strokeRatio * cellHeight);
		}
		if (lineWidth === 0) {
			lineWidth = 1;
		}
		if (lineWidth % 2 === 1) {
			context.translate(0.5, 0.5);
		}

		context.beginPath();
		context.lineWidth = lineWidth;
		context.lineCap = 'square';
		context.strokeStyle = this.strokeStyle;

		let blankSpacing = Math.trunc(1 / this.blankProbability);
		while (blankSpacing > 1 && (cellsAcrossCanvas % blankSpacing <= 1 || cellsAcrossCanvas % blankSpacing === blankSpacing - 1)) {
			blankSpacing--;
		}
		const blankProbability =  this.blankProbability * blankSpacing;

		let cellNumber = 1;
		for (let cellY = 0; cellY < cellsDownCanvas; cellY++) {
			const y = cellY * cellHeight;
			for (let cellX = 0; cellX < cellsAcrossCanvas; cellX++) {
				cellNumber++;
				if (blankSpacing > 0 && cellNumber % blankSpacing === 0 && Math.random() < blankProbability) {
					continue;
				}

				const x = cellX * cellWidth;
				const p = Math.random();
				if (p > this.probability) {
					// Backslash
					context.moveTo(x, y);
					context.lineTo(x + cellWidth, y + cellHeight);
				} else {
					// Forward slash
					context.moveTo(x, y + cellHeight);
					context.lineTo(x + cellWidth, y);
				}
			}
		}
		context.stroke();
	}

}
