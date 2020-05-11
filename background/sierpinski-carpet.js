'use strict';

{

	function SierpinskiCarpet() {
		const me = this;
		this.title = 'Sierpinski Carpet';
		this.hasRandomness = false;

		this.optionsDocument = downloadFile('sierpinski-carpet.html', 'document').then(function (optionsDoc) {

			function fullRedraw() {
				progressiveBackgroundGen(me, 0);
			}

			const concentricOpts = optionsDoc.getElementById('carpet-concentric-opts');

			optionsDoc.getElementById('carpet-depth').addEventListener('input', function (event) {
				const value = parseInt(this.value);
				if (value >= 1) {
					me.maxDepth = value - 1;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('carpet-pattern-depth').addEventListener('input', function (event) {
				const value = parseInt(this.value);
				if (value >= 0) {
					me.patternDepth = value - 1;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('carpet-composition-op').addEventListener('input', function (event) {
				me.compositionOp = this.value;
				progressiveBackgroundGen(me, 0);
			});

			function setFilling(event) {
				const filling = this.value;
				me.filling = filling;
				const patternOptsSelector = '#carpet-pattern-opts, #carpet-pattern-location';
				$(patternOptsSelector).collapse(filling !== 'b' ? 'show' : 'hide');
				$(concentricOpts).collapse(filling === 'c' ? 'show' : 'hide');
				if (filling === 'i' && bgGeneratorImage.src === '') {
					document.getElementById('background-gen-image-upload').click();
				} else {
					progressiveBackgroundGen(me, 0);
				}
			}

			for (let item of optionsDoc.querySelectorAll('input[name=carpet-filling]')) {
				item.addEventListener('input', setFilling);
			};

			for (let item of optionsDoc.querySelectorAll('input[name=carpet-pattern-location]')) {
				item.addEventListener('input', function (event) {
					const locations = parseInt(this.value);
					me.patternLocations = locations;
					progressiveBackgroundGen(me, 0);
				});
			};

			optionsDoc.getElementById('carpet-patterned-centre').addEventListener('input', function (event) {
				me.patternedCentre = this.checked;
				progressiveBackgroundGen(me, 0);
			});

			optionsDoc.getElementById('carpet-emphasis').addEventListener('input', function (event) {
				const value = parseInt(this.value);
				if (value >= 0) {
					me.centreEmphasis = value - 1;
					progressiveBackgroundGen(me, 0);
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
						me.colors[11] = color;
						me.patternOpacities[1] = alpha;
					} else if (index === 9) {
						me.colors[10] = color;
						me.patternOpacities[0] = alpha;
					}
					progressiveBackgroundGen(me, preview);
				};
			}

			colorControls.forEach(function (item, index) {
				item.addEventListener('input', changeColor(index, 0));
			});

			for (let i = 0; i < opacitySliders.length; i++) {
				opacitySliders[i].addEventListener('input', changeColor(i, 1));
				opacitySliders[i].addEventListener('pointerup', fullRedraw);
				opacitySliders[i].addEventListener('keyup', fullRedraw);
			};

			optionsDoc.getElementById('carpet-bipartite').addEventListener('input', function (event) {
				me.bipartite = this.checked;
				progressiveBackgroundGen(me, 0);
			});

			optionsDoc.getElementById('carpet-concentric-density').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (value >= 2) {
					me.concentricDensity = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			const fgSpacingSlider = optionsDoc.getElementById('carpet-relative-spacing');
			fgSpacingSlider.addEventListener('input', function (event) {
				me.fgSpacingFraction = parseFloat(this.value);
				progressiveBackgroundGen(me, 1);
			});
			fgSpacingSlider.addEventListener('pointerup', fullRedraw);
			fgSpacingSlider.addEventListener('keyup', fullRedraw);

			const tlxCornerSlider = optionsDoc.getElementById('carpet-tlx-corner');
			tlxCornerSlider.addEventListener('input', function (event) {
				me.topLeftCornerX = parseFloat(this.value);
				progressiveBackgroundGen(me, 1);
			});
			tlxCornerSlider.addEventListener('pointerup', fullRedraw);
			tlxCornerSlider.addEventListener('keyup', fullRedraw);

			const tlyCornerSlider = optionsDoc.getElementById('carpet-tly-corner');
			tlyCornerSlider.addEventListener('input', function (event) {
				me.topLeftCornerY = parseFloat(this.max) - parseFloat(this.value);
				progressiveBackgroundGen(me, 1);
			});
			tlyCornerSlider.addEventListener('pointerup', fullRedraw);
			tlyCornerSlider.addEventListener('keyup', fullRedraw);

			const llCornerSlider = optionsDoc.getElementById('carpet-ll-corner');
			llCornerSlider.addEventListener('input', function (event) {
				me.lowerLeftCorner = parseFloat(this.value);
				progressiveBackgroundGen(me, 1);
			});
			llCornerSlider.addEventListener('pointerup', fullRedraw);
			llCornerSlider.addEventListener('keyup', fullRedraw);

			const lrCornerSlider = optionsDoc.getElementById('carpet-lr-corner');
			lrCornerSlider.addEventListener('input', function (event) {
				me.lowerRightCorner = parseFloat(this.value);
				progressiveBackgroundGen(me, 1);
			});
			lrCornerSlider.addEventListener('pointerup', fullRedraw);
			lrCornerSlider.addEventListener('keyup', fullRedraw);

			return optionsDoc;
		});

		this.size = 1;
		this.stretch = 0;
		this.lopsidednessX = 0;
		this.lopsidednessY = 0;
		this.middleWidth = 1;
		this.left = 0;
		this.top = 0;
		this.rotation = 0;

		this.maxDepth = 4;
		this.patternDepth = 3;
		this.compositionOp = 'source-over';
		this.filling = 'b';
		this.patternLocations = 3;
		this.patternedCentre = true;
		this.centreEmphasis = 0;

		this.fgSpacingFraction = 0.5;
		this.concentricDensity = 7;
		this.lowerLeftCorner = 0.35;
		this.lowerRightCorner = 0.75;
		this.topLeftCornerX = 0.5;
		this.topLeftCornerY = 0.02;

		const colors = new Array(13);
		colors.fill('#ffffff80');
		colors[4] = '#000000';		// centre
		colors[9] = '#000066';		// second centre color
		colors[10] = colors[9]		// second centre color with emphasis
		colors[11] = colors[4];		// centre with emphasis
		colors[12] = '#ffffff00';	// depth zero (transparent)
		this.patternOpacities = [1, 1];
		this.bipartite = false;

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
		 *  9	Second centre color
		 * 10	Second centre color (emphasis)
		 * 11	Centre (emphasis)
		 * 12	Centre (depth zero background)
		*/
		this.colors = colors;
	}

	SierpinskiCarpet.prototype.animatable = {
		continuous: [
			'fgSpacingFraction', 'concentricDensity', 'lowerLeftCorner', 'lowerRightCorner',
			'topLeftCornerX', 'topLeftCornerY', 'colors', 'patternOpacities', 'lopsidednessX'
		],
		stepped: [
			'maxDepth', 'patternDepth', 'compositionOp', 'filling', 'patternLocations',
			'patternedCentre', 'centreEmphasis', 'bipartite'
		]
	};

	function Tile(x, y, width, height, relationship) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.relationship = relationship;
	}

	SierpinskiCarpet.prototype.generate = function* (context, canvasWidth, canvasHeight, preview) {
		const beginTime = performance.now();
		const lopsidednessX = this.lopsidednessX + 1;
		const lopsidednessY = this.lopsidednessY + 1;
		const middleWidth = this.middleWidth / 3;
		const colors = this.colors;
		const filling = this.filling;

		const drawSize = this.size;
		const stretch = this.stretch;
		let drawWidth, drawHeight;
		if (canvasWidth >= canvasHeight) {
			drawWidth = drawSize * ((1 - stretch) * canvasHeight + stretch * canvasWidth);
			drawHeight = drawSize * canvasHeight;
			const idealWidth = drawWidth * (2 / 3 + middleWidth);
			drawWidth = Math.min(Math.max(idealWidth, drawWidth), canvasWidth);
		} else {
			drawWidth = drawSize * canvasWidth;
			drawHeight = drawSize * ((1 - stretch) * canvasWidth + stretch * canvasHeight);
			const idealHeight = drawHeight * (2 / 3 + 1 / middleWidth);
			drawHeight = Math.min(Math.max(idealHeight, drawHeight), canvasHeight);
		}

		const left = this.left * (canvasWidth - drawWidth);
		const top = this.top * (canvasHeight - drawHeight);
		context.translate(left + drawWidth / 2, top + drawHeight / 2);
		context.rotate(this.rotation);
		context.translate(-drawWidth / 2, -drawHeight / 2);

		let queue = [new Tile(0, 0, drawWidth, drawHeight, 12)];
		let nextQueue = [];
		let numProcessed = 0;

		let maxDepth = this.maxDepth;
		if (preview > 0 && maxDepth > 3) {
			maxDepth = 3;
		}

		const spacingNumerator = Math.min(drawWidth * middleWidth, drawHeight / 3) / this.concentricDensity;

		for (let depth = 0; depth <= maxDepth; depth++) {
			const div = 3 ** depth;
			const emphasize = depth <= this.centreEmphasis;
			const drawPattern = filling !== 'b' && depth <= this.patternDepth;
			const combinedSpacing = Math.round(spacingNumerator / div);
			let fgSpacing = Math.round(combinedSpacing * this.fgSpacingFraction);
			if (fgSpacing === 0) {
				fgSpacing = 1;
			}
			const bgSpacing = Math.max(combinedSpacing - fgSpacing, 1);
			const lowerRightCorner = Math.max(Math.round(this.lowerRightCorner * fgSpacing), 1);
			const lowerLeftCorner = Math.max(Math.round(this.lowerLeftCorner * lowerRightCorner), 1);
			const topLeftCornerX = Math.max(Math.round(this.topLeftCornerX * (combinedSpacing - 1)), 1);

			for (let tile of queue) {
				let width = tile.width;
				let height = tile.height;
				const x = tile.x;
				const y = tile.y;
				const relationship = tile.relationship;
				let bipartiteColoring = this.bipartite ? relationship % 2 : 1;
				let patternLocation = (this.patternLocations & (2 ** (relationship % 2))) !== 0;
				let patternedCentre;
				if (relationship === 12) {
					patternedCentre = this.patternedCentre
					if (this.bipartite) {
						if (this.patternLocations === 2) {
							bipartiteColoring = Number(patternedCentre);
						} else {
							bipartiteColoring = Number(!patternedCentre);
						}
					}
					patternLocation = patternedCentre;
				}

				const roundedX = Math.round(x);
				const roundedY = Math.round(y);
				let roundedWidth = Math.round(width + x - roundedX);
				let roundedHeight = Math.round(height + y - roundedY);
				context.fillStyle = colors[relationship];
				context.globalCompositeOperation = this.compositionOp;
				context.fillRect(roundedX, roundedY, roundedWidth, roundedHeight);

				const remainingWidth = width * (1 - middleWidth);
				width = width * middleWidth;
				const width1 = width;
				height = height / 3;
				const height1 = height;
				const width0 = remainingWidth / 2 * lopsidednessX;
				const height0 = height * lopsidednessY;
				const x1 = x + width0;
				const y1 = y + height0;

				if (width >= 1 || height >= 1) {
					if (width < 1) {
						width = 1;
					} else if (height < 1) {
						height = 1;
					}
					const roundedX1 = Math.round(x1);
					const roundedY1 = Math.round(y1);
					roundedWidth = Math.max(Math.round(width + x1 - roundedX1), 1);
					roundedHeight = Math.max(Math.round(height + y1 - roundedY1), 1);
					if (emphasize) {
						context.globalCompositeOperation = 'source-over';
						context.fillStyle = colors[10 + bipartiteColoring];
					} else {
						context.fillStyle = colors[bipartiteColoring === 0 ? 9 : 4];
					}
					if (drawPattern && patternLocation) {
						if (filling === 'c') {
							this.concentricSquares(context, roundedX1, roundedY1,
								roundedWidth, roundedHeight, fgSpacing, bgSpacing,
								lowerLeftCorner, lowerRightCorner, topLeftCornerX
							);
						} else {
							if (!emphasize) {
								context.globalAlpha = this.patternOpacities[bipartiteColoring];
							}
							context.drawImage(bgGeneratorImage, roundedX1, roundedY1, roundedWidth, roundedHeight);
							context.globalAlpha = 1;
						}
					} else if (relationship !== 12 || patternedCentre || this.bipartite || (filling !== 'b' && this.patternLocations !== 3)) {
						context.fillRect(roundedX1, roundedY1, roundedWidth, roundedHeight);
					}
				}

				const x2 = x1 + width;
				const y2 = y1 + height;
				const width2 = remainingWidth - width0;
				const height2 = 2 * height - height0;
				nextQueue.push(new Tile(x, y, width0, height0, 0));
				nextQueue.push(new Tile(x1, y, width, height0, 1));
				nextQueue.push(new Tile(x2, y, width2, height0, 2));
				nextQueue.push(new Tile(x, y1, width0, height, 3));
				nextQueue.push(new Tile(x2, y1, width2, height, 5));
				nextQueue.push(new Tile(x, y2, width0, height2, 6));
				nextQueue.push(new Tile(x1, y2, width, height2, 7));
				nextQueue.push(new Tile(x2, y2, width2, height2, 8));

				numProcessed++;
				if ((numProcessed & 500) === 499 && performance.now() >= beginTime + 20) {
					yield;
					beginTime = performance.now();
				}

			}
			queue = nextQueue;
			nextQueue = [];
		}
	};

	SierpinskiCarpet.prototype.concentricSquares = function (context, x, y, width, height, fgSpacing, bgSpacing, lowerLeftCorner, lowerRightCorner, topLeftCornerX) {
		let combinedSpacing;
		let leftX = x;
		let bottomY = y + height;
		const originalLLCorner = lowerLeftCorner, originalLRCorner = lowerRightCorner;
		const originalTLCornerX = topLeftCornerX;
		let decrements = 0;
		let rightX, topY, prevSpacing, corner1X, corner1Y, corner2;
		context.beginPath();
		while (Math.min(width, height) >= 2 * fgSpacing) {
			combinedSpacing = fgSpacing + bgSpacing;
			rightX = leftX + width;
			topY = bottomY - height;
			context.moveTo(leftX, bottomY);
			context.lineTo(rightX, bottomY);
			context.lineTo(rightX, topY);
			context.lineTo(leftX, topY);
			context.lineTo(leftX, bottomY);
			context.lineTo(leftX + lowerLeftCorner, bottomY);
			corner1X = leftX + topLeftCornerX;
			corner1Y = topY + Math.max(fgSpacing - this.topLeftCornerY * fgSpacing * fgSpacing, 1);
			context.lineTo(corner1X, corner1Y);
			context.lineTo(rightX - fgSpacing, topY + fgSpacing);
			corner2 = bottomY - lowerRightCorner;
			context.lineTo(rightX - fgSpacing, corner2);
			context.lineTo(leftX, bottomY - lowerLeftCorner);
			width -= 2 * combinedSpacing;
			height -= 2 * combinedSpacing;

			prevSpacing = fgSpacing;
			if (fgSpacing > 1) {
				fgSpacing--;
				decrements++;
				lowerLeftCorner = Math.max(originalLLCorner - decrements, 1);
				lowerRightCorner = Math.max(originalLRCorner - decrements, 1);
				topLeftCornerX = Math.max(originalTLCornerX - decrements, 1);
			}
			leftX += combinedSpacing;
			bottomY -= combinedSpacing;
		}
		leftX -= combinedSpacing;
		bottomY += combinedSpacing;
		context.moveTo(rightX - prevSpacing, corner2);
		context.lineTo(leftX + prevSpacing, corner2);
		context.lineTo(Math.max(leftX + prevSpacing, corner1X), topY + prevSpacing);
		context.lineTo(rightX - prevSpacing, topY + prevSpacing);
		context.lineTo(corner1X, corner1Y);
		context.lineTo(leftX, bottomY);
		context.fill();
	};

	addBgGenerator(SierpinskiCarpet);
}
