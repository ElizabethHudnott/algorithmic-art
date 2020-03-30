'use strict';

{

	function SierpinskiCarpet() {
		const me = this;
		this.title = 'Sierpinski Carpet';
		this.hasRandomness = false;

		this.optionsDocument = downloadDocument('sierpinski-carpet.html').then(function (optionsDoc) {

			optionsDoc.getElementById('carpet-depth').addEventListener('input', function (event) {
				me.maxDepth = parseInt(this.value) - 1;
				progressiveBackgroundGen(me, false);
			});

			optionsDoc.getElementById('carpet-pattern-depth').addEventListener('input', function (event) {
				me.patternDepth = parseInt(this.value) - 1;
				progressiveBackgroundGen(me, false);
			});

			optionsDoc.getElementById('carpet-composition-op').addEventListener('input', function (event) {
				me.compositionOp = this.value;
				progressiveBackgroundGen(me, false);
			});

			optionsDoc.querySelectorAll('input[name=carpet-filling]').forEach(function (item) {
				item.addEventListener('input', function (event) {
					me.filling = this.value;
					progressiveBackgroundGen(me, false);
				})
			});

			optionsDoc.getElementById('carpet-emphasis').addEventListener('input', function (event) {
				me.centreEmphasis = parseInt(this.value) - 1;
				progressiveBackgroundGen(me, false);
			});

			const colorControls = optionsDoc.querySelectorAll('input[type=color]');
			const opacitySliders = Array.from(optionsDoc.getElementsByClassName('carpet-opacity'));

			function changeColor(index, preview) {
				return function (event) {
					const [r, g, b] = hexToRGB(colorControls[index].value);
					const alpha = parseFloat(opacitySliders[index].value);
					me.colors[index] = rgba(r, g, b, alpha);
					progressiveBackgroundGen(me, preview);
				};
			}

			colorControls.forEach(function (item, index) {
				item.addEventListener('input', changeColor(index, false));
			});

			for (let i = 0; i < opacitySliders.length; i++) {
				opacitySliders[i].addEventListener('input', changeColor(i, true));
				opacitySliders[i].addEventListener('mouseup', function (event) {
					progressiveBackgroundGen(me, false);
				});
			};

			optionsDoc.getElementById('carpet-relative-spacing').addEventListener('input', function (event) {
				me.fgSpacingFraction = parseFloat(this.value);
				progressiveBackgroundGen(me, true);
			});

			return optionsDoc;
		});


		this.maxDepth = 4;
		this.patternDepth = 3;
		this.compositionOp = 'source-over';
		this.filling = 0;
		this.centreEmphasis = 0;

		this.fgSpacingFraction = 0.5;

		const colors = new Array(9);
		colors.fill('#ffffff80');
		colors[4] = 'black';

		/*
		colors[0] = 'hsla(330, 100%, 80%, 0.5)';
		colors[1] = 'hsla(240, 100%, 80%, 0.5)';
		colors[2] = 'hsla( 30, 100%, 80%, 0.5)';
		colors[3] = 'hsla(330, 90%, 50%, 0.5)';
		colors[4] = 'black';
		colors[5] = 'hsla( 30, 100%, 50%, 0.5)';
		colors[6] = 'hsla(330, 100%, 20%, 0.5)';
		colors[7] = 'hsla(  0, 100%, 20%, 0.5)';
		colors[8] = 'hsla( 120, 100%, 20%, 0.5)';
		*/

		this.colors = colors;
	}

	backgroundGenerators.set('sierpinski-carpet', new SierpinskiCarpet());

	function Tile(x, y, color) {
		this.x = x;
		this.y = y;
		this.color = color;
	}

	SierpinskiCarpet.prototype.generate = function* (beginTime, context, canvasWidth, canvasHeight, preview) {
		const outerSize = Math.min(canvasWidth, canvasHeight);
		const colors = this.colors;
		let queue = [new Tile(0, 0, 'transparent')];
		let nextQueue = [];
		let prevSideLength = outerSize;
		let numProcessed = 0;

		let maxDepth = this.maxDepth;
		if (preview && maxDepth > 3) {
			maxDepth = 3;
		}

		for (let depth = 0; depth <= maxDepth; depth++) {
			let sideLength = outerSize / 3 ** (depth + 1);
			if (sideLength < 1) {
				break;
			}
			const div = 3 ** depth;
			const combinedSpacing = Math.round(51 / div);
			let fgSpacing = Math.round(combinedSpacing * this.fgSpacingFraction);
			if (fgSpacing === 0) {
				fgSpacing = 1;
			}
			const bgSpacing = combinedSpacing - fgSpacing;
			for (let tile of queue) {
				const x = tile.x;
				const y = tile.y;
				context.fillStyle = tile.color;
				const roundedX = Math.round(x);
				const roundedY = Math.round(y);
				let roundedWidth = Math.round(prevSideLength + x - roundedX);
				let roundedHeight = Math.round(prevSideLength + y - roundedY);
				context.globalCompositeOperation = this.compositionOp;
				context.fillRect(roundedX, roundedY, roundedWidth, roundedHeight);

				const centreX = x + sideLength;
				const centreY = y + sideLength;
				const roundedCentreX = Math.round(centreX);
				const roundedCentreY = Math.round(centreY);
				roundedWidth = Math.round(sideLength + centreX - roundedCentreX);
				roundedHeight = Math.round(sideLength + centreY - roundedCentreY);
				if (roundedWidth <= 1 || roundedHeight <=1) {
					roundedWidth = 1;
					roundedHeight = 1;
				}
				context.fillStyle = colors[4];
				if (depth <= this.centreEmphasis) {
					context.globalCompositeOperation = 'source-over';
				}
				if (this.filling > 0 && depth <= this.patternDepth) {
					this.concentricSquares(context, roundedCentreX, roundedCentreY, roundedWidth,
						fgSpacing, Math.max(Math.round(9 / div), 1), bgSpacing);
				} else {
					context.fillRect(roundedCentreX, roundedCentreY, roundedWidth, roundedHeight);
				}

				nextQueue.push(new Tile(x, y, colors[0]));
				nextQueue.push(new Tile(x + sideLength, y, colors[1]));
				nextQueue.push(new Tile(x + 2 * sideLength, y, colors[2]));
				nextQueue.push(new Tile(x, y + sideLength, colors[3]));
				nextQueue.push(new Tile(x + 2 * sideLength, y + sideLength, colors[5]));
				nextQueue.push(new Tile(x, y + 2 * sideLength, colors[6]));
				nextQueue.push(new Tile(x + sideLength, y + 2 * sideLength, colors[7]));
				nextQueue.push(new Tile(x + 2 * sideLength, y + 2 * sideLength, colors[8]));

				numProcessed++;
				if ((numProcessed & 511) === 511 && performance.now() >= beginTime + 20) {
					yield;
				}

			}
			queue = nextQueue;
			nextQueue = [];
			prevSideLength = sideLength;
		}
	};

	SierpinskiCarpet.prototype.concentricSquares = function (context, x, y, size, fgSpacing, quadLength, bgSpacing) {
		let combinedSpacing;
		let currentSize = size;
		let leftX = x;
		let bottomY = y + size;
		let rightX, topY, prevSpacing, corner1, corner2;
		context.beginPath();
		while (currentSize >= 2 * fgSpacing) {
			combinedSpacing = fgSpacing + bgSpacing;
			rightX = leftX + currentSize;
			topY = bottomY - currentSize;
			context.moveTo(leftX, bottomY);
			context.lineTo(rightX, bottomY);
			context.lineTo(rightX, topY);
			context.lineTo(leftX, topY);
			context.lineTo(leftX, bottomY);
			context.lineTo(leftX + quadLength, bottomY);
			corner1 = topY + fgSpacing - Math.round(0.02 * fgSpacing * fgSpacing);
			context.lineTo(leftX + fgSpacing, corner1);
			context.lineTo(rightX - fgSpacing, topY + fgSpacing);
			corner2 = bottomY - Math.round(fgSpacing * 0.75);
			context.lineTo(rightX - fgSpacing, corner2);
			context.lineTo(leftX, bottomY - quadLength);
			currentSize -= 2 * combinedSpacing;

			prevSpacing = fgSpacing;
			if (fgSpacing > 1) {
				fgSpacing--;
				if (quadLength > fgSpacing) {
					quadLength = fgSpacing;
				}
			}
			leftX += combinedSpacing;
			bottomY -= combinedSpacing;
		}
		leftX -= combinedSpacing;
		bottomY += combinedSpacing;
		context.moveTo(rightX - prevSpacing, corner2);
		context.lineTo(leftX + prevSpacing, corner2);
		context.lineTo(leftX + prevSpacing, topY + prevSpacing);
		context.lineTo(rightX - prevSpacing, topY + prevSpacing);
		context.lineTo(leftX + prevSpacing, corner1);
		context.lineTo(leftX, bottomY);
		context.fill();
	};

}
