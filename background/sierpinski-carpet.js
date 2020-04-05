'use strict';

{

	function SierpinskiCarpet() {
		const me = this;
		this.title = 'Sierpinski Carpet';
		this.hasRandomness = false;
		this.hasCustomImage = true;

		this.optionsDocument = downloadDocument('sierpinski-carpet.html').then(function (optionsDoc) {

			function fullRedraw() {
				progressiveBackgroundGen(me, false);
			}

			const concentricOpts = optionsDoc.getElementById('carpet-concentric-opts');

			optionsDoc.getElementById('carpet-depth').addEventListener('input', function (event) {
				const value = parseInt(this.value);
				if (value >= 1) {
					me.maxDepth = value - 1;
					progressiveBackgroundGen(me, false);
				}
			});

			optionsDoc.getElementById('carpet-pattern-depth').addEventListener('input', function (event) {
				const value = parseInt(this.value);
				if (value >= 1) {
					me.patternDepth = value - 1;
					progressiveBackgroundGen(me, false);
				}
			});

			optionsDoc.getElementById('carpet-composition-op').addEventListener('input', function (event) {
				me.compositionOp = this.value;
				progressiveBackgroundGen(me, false);
			});

			optionsDoc.querySelectorAll('input[name=carpet-filling]').forEach(function (item) {
				item.addEventListener('input', function (event) {
					const filling = parseInt(this.value);
					me.filling = filling;
					const patternOptsSelector = '#carpet-pattern-opts, #carpet-pattern-location';
					$(patternOptsSelector).collapse(filling > 0 ? 'show' : 'hide');
					$(concentricOpts).collapse(filling === 1 ? 'show' : 'hide');
					progressiveBackgroundGen(me, false);
				})
			});

			optionsDoc.querySelectorAll('input[name=carpet-pattern-location]').forEach(function (item) {
				item.addEventListener('input', function (event) {
					const locations = parseInt(this.value);
					me.patternLocations = locations;
					progressiveBackgroundGen(me, false);
				})
			});

			optionsDoc.getElementById('carpet-patterned-centre').addEventListener('input', function (event) {
				me.patternedCentre = this.checked;
				progressiveBackgroundGen(me, false);
			});

			optionsDoc.getElementById('carpet-emphasis').addEventListener('input', function (event) {
				const value = parseInt(this.value);
				if (value >= 1) {
					me.centreEmphasis = value - 1;
					progressiveBackgroundGen(me, false);
				}
			});

			const colorControls = optionsDoc.querySelectorAll('input[type=color]');
			const opacitySliders = Array.from(optionsDoc.getElementsByClassName('carpet-opacity'));

			function changeColor(index, preview) {
				return function (event) {
					const color = colorControls[index].value;
					const [r, g, b] = hexToRGB(color);
					const alpha = parseFloat(opacitySliders[index].value);
					me.colors[index] = rgba(r, g, b, alpha);
					if (index === 4) {
						me.colors[9] = color;
					}
					progressiveBackgroundGen(me, preview);
				};
			}

			colorControls.forEach(function (item, index) {
				item.addEventListener('input', changeColor(index, false));
			});

			for (let i = 0; i < opacitySliders.length; i++) {
				opacitySliders[i].addEventListener('input', changeColor(i, true));
				opacitySliders[i].addEventListener('mouseup', fullRedraw);
			};

			const fgSpacingSlider = optionsDoc.getElementById('carpet-relative-spacing');
			fgSpacingSlider.addEventListener('input', function (event) {
				me.fgSpacingFraction = parseFloat(this.value);
				progressiveBackgroundGen(me, true);
			});
			fgSpacingSlider.addEventListener('mouseup', fullRedraw);

			return optionsDoc;
		});


		this.maxDepth = 4;
		this.patternDepth = 3;
		this.compositionOp = 'source-over';
		this.filling = 0;
		this.patternLocations = 3;
		this.patternedCentre = true;
		this.centreEmphasis = 0;

		this.fgSpacingFraction = 0.5;

		const colors = new Array(11);
		colors.fill('#ffffff80');
		colors[4] = 'black';
		colors[9] = colors[4];
		colors[10] = 'transparent';
		colors[11] = colors[10];


		/*
		 *	0	Top left
		 *	1	Top centre
		 *	2	Top right
		 *	3	Middle left
		 *	4	Centre
		 *	5	Middle right
		 *	6	Bottom left
		 *	7	Bottom centre
		 *	8	Bottom right
		 *	9	Centre (emphasis)
		 *	10	Centre (depth zero background)
		*/

		this.colors = colors;
	}

	backgroundGenerators.set('sierpinski-carpet', new SierpinskiCarpet());

	function Tile(x, y, relationship) {
		this.x = x;
		this.y = y;
		this.relationship = relationship;
	}

	SierpinskiCarpet.prototype.generate = function* (beginTime, context, canvasWidth, canvasHeight, preview) {
		const outerSize = Math.min(canvasWidth, canvasHeight);
		const colors = this.colors;
		const filling = this.filling;
		let queue = [new Tile(0, 0, 10)];
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
			const emphasize = depth <= this.centreEmphasis;
			const drawPattern = filling > 0 && depth <= this.patternDepth && prevSideLength >= 2;
			const combinedSpacing = Math.round(51 / div);
			let fgSpacing = Math.round(combinedSpacing * this.fgSpacingFraction);
			if (fgSpacing === 0) {
				fgSpacing = 1;
			}
			const bgSpacing = Math.max(combinedSpacing - fgSpacing, 0);
			for (let tile of queue) {
				const x = tile.x;
				const y = tile.y;
				const relationship = tile.relationship;
				context.fillStyle = colors[relationship];
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
				if (emphasize) {
					context.globalCompositeOperation = 'source-over';
					context.fillStyle = colors[9];
				} else {
					context.fillStyle = colors[4];
				}
				const patternLocation = relationship === 10 ? this.patternedCentre :
					(this.patternLocations & (2 ** (relationship % 2))) !== 0;
				if (drawPattern && patternLocation) {
					if (filling === 1) {
						this.concentricSquares(context, roundedCentreX, roundedCentreY, roundedWidth,
							fgSpacing, Math.max(Math.round(9 / div), 1), bgSpacing);
					} else {
						context.drawImage(bgGeneratorImage, roundedCentreX, roundedCentreY, roundedWidth, roundedHeight);
					}
				} else {
					context.fillRect(roundedCentreX, roundedCentreY, roundedWidth, roundedHeight);
				}

				nextQueue.push(new Tile(x, y, 0));
				nextQueue.push(new Tile(x + sideLength, y, 1));
				nextQueue.push(new Tile(x + 2 * sideLength, y, 2));
				nextQueue.push(new Tile(x, y + sideLength, 3));
				nextQueue.push(new Tile(x + 2 * sideLength, y + sideLength, 5));
				nextQueue.push(new Tile(x, y + 2 * sideLength, 6));
				nextQueue.push(new Tile(x + sideLength, y + 2 * sideLength, 7));
				nextQueue.push(new Tile(x + 2 * sideLength, y + 2 * sideLength, 8));

				numProcessed++;
				if ((numProcessed & 500) === 499 && performance.now() >= beginTime + 20) {
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
