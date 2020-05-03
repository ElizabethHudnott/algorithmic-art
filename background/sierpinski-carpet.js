'use strict';

{

	function SierpinskiCarpet() {
		const me = this;
		this.title = 'Sierpinski Carpet';
		this.hasRandomness = false;

		this.optionsDocument = downloadDocument('sierpinski-carpet.html').then(function (optionsDoc) {

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

			optionsDoc.querySelectorAll('input[name=carpet-filling]').forEach(function (item) {
				item.addEventListener('input', setFilling);
			});

			optionsDoc.querySelectorAll('input[name=carpet-pattern-location]').forEach(function (item) {
				item.addEventListener('input', function (event) {
					const locations = parseInt(this.value);
					me.patternLocations = locations;
					progressiveBackgroundGen(me, 0);
				})
			});

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

	SierpinskiCarpet.prototype.animatable = [
		[
			'fgSpacingFraction', 'concentricDensity', 'lowerLeftCorner', 'lowerRightCorner',
			'topLeftCornerX', 'topLeftCornerY', 'colors', 'patternOpacities'
		],
		[
			'maxDepth', 'patternDepth', 'compositionOp', 'filling', 'patternLocations',
			'patternedCentre', 'centreEmphasis', 'bipartite'
		]
	];

	backgroundGenerators.set('sierpinski-carpet', new SierpinskiCarpet());

	function Tile(x, y, relationship) {
		this.x = x;
		this.y = y;
		this.relationship = relationship;
	}

	SierpinskiCarpet.prototype.generate = function* (context, canvasWidth, canvasHeight, preview) {
		const beginTime = performance.now();
		const outerSize = Math.min(canvasWidth, canvasHeight);
		const colors = this.colors;
		const filling = this.filling;
		let queue = [new Tile(0, 0, 12)];
		let nextQueue = [];
		let prevSideLength = outerSize;
		let numProcessed = 0;

		let maxDepth = this.maxDepth;
		if (preview > 0 && maxDepth > 3) {
			maxDepth = 3;
		}

		const spacingNumerator = (outerSize / 3) / this.concentricDensity;

		for (let depth = 0; depth <= maxDepth; depth++) {
			let sideLength = outerSize / 3 ** (depth + 1);
			if (sideLength < 1) {
				break;
			}
			const div = 3 ** depth;
			const emphasize = depth <= this.centreEmphasis;
			const drawPattern = filling !== 'b' && depth <= this.patternDepth && prevSideLength >= 2;
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
					context.fillStyle = colors[10 + bipartiteColoring];
				} else {
					context.fillStyle = colors[bipartiteColoring === 0 ? 9 : 4];
				}
				if (drawPattern && patternLocation) {
					if (filling === 'c') {
						this.concentricSquares(context, roundedCentreX, roundedCentreY, roundedWidth,
							fgSpacing, bgSpacing, lowerLeftCorner, lowerRightCorner, topLeftCornerX);
					} else {
						if (!emphasize) {
							context.globalAlpha = this.patternOpacities[bipartiteColoring];
						}
						context.drawImage(bgGeneratorImage, roundedCentreX, roundedCentreY, roundedWidth, roundedHeight);
						context.globalAlpha = 1;
					}
				} else if (relationship !== 12 || patternedCentre || this.bipartite || (filling !== 'b' && this.patternLocations !== 3)) {
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
					beginTime = performance.now();
				}

			}
			queue = nextQueue;
			nextQueue = [];
			prevSideLength = sideLength;
		}
	};

	SierpinskiCarpet.prototype.concentricSquares = function (context, x, y, size, fgSpacing, bgSpacing, lowerLeftCorner, lowerRightCorner, topLeftCornerX) {
		let combinedSpacing;
		let currentSize = size;
		let leftX = x;
		let bottomY = y + size;
		const originalLLCorner = lowerLeftCorner, originalLRCorner = lowerRightCorner;
		const originalTLCornerX = topLeftCornerX;
		let decrements = 0;
		let rightX, topY, prevSpacing, corner1X, corner1Y, corner2;
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
			context.lineTo(leftX + lowerLeftCorner, bottomY);
			corner1X = leftX + topLeftCornerX;
			corner1Y = topY + Math.max(fgSpacing - this.topLeftCornerY * fgSpacing * fgSpacing, 1);
			context.lineTo(corner1X, corner1Y);
			context.lineTo(rightX - fgSpacing, topY + fgSpacing);
			corner2 = bottomY - lowerRightCorner;
			context.lineTo(rightX - fgSpacing, corner2);
			context.lineTo(leftX, bottomY - lowerLeftCorner);
			currentSize -= 2 * combinedSpacing;

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

}
