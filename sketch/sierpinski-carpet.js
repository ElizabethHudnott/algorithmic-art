export default function SierpinskiCarpet() {
	const me = this;
	this.title = 'Sierpinski Carpet';
	this.hasRandomness = false;
	this.helpFile = 'help/sierpinski-carpet.html';

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
	 * 13	Top left emphasized
	 * ...
	 * 21	Bottom right emphasized
	 * (Only 0-3, 5-8 & 12 appear in the queue)
	*/
	const colors = new Array(25);
	this.colors = colors;
	let initialCentreOpacity;
	if (darkMode()) {
		colors.fill('#00000080', 0, 9);
		colors[4] = '#1a1a1ad3';		// centre
		colors[9] = '#000055d3';		// second centre color
		colors[10] = '#000055';			// second centre color with emphasis
		colors[11] = '#1a1a1a';			// centre with emphasis
		initialCentreOpacity = 211 / 255;

	} else {
		colors.fill('#ffffff80', 0, 9);
		colors[4] = '#000000';			// centre
		colors[9] = '#000066';			// second centre color
		colors[10] = colors[9];			// second centre color with emphasis
		colors[11] = colors[4];			// centre with emphasis
		initialCentreOpacity = 1;
	}

	colors[12] = '#ffffff00';	// depth zero (transparent)
	for (let i = 0; i < 12; i++) {
		const [r, g, b] = hexToRGBA(colors[i]);
		colors[i + 13] = rgba(r, g, b, 1);
	}
	this.patternOpacities = [initialCentreOpacity, initialCentreOpacity];	// [alternate, normal]
	this.bipartite = false;

	this.optionsDocument = downloadFile('sierpinski-carpet.html', 'document').then(function (optionsDoc) {

		const colorControlArea = optionsDoc.getElementById('carpet-colors');
		const colorControls = colorControlArea.querySelectorAll('input[type=color]');
		const opacitySliders = colorControlArea.querySelectorAll('input[type=range]');

		for (let i = 0; i < 10; i++) {
			colorControls[i].value = me.colors[i].slice(0, 7);
		}
		opacitySliders[4].value = me.patternOpacities[0];
		opacitySliders[9].value = me.patternOpacities[1];

		function fullRedraw() {
			generateBackground(0);
		}

		const concentricOpts = optionsDoc.getElementById('carpet-concentric-opts');

		optionsDoc.getElementById('carpet-pattern-depth').addEventListener('input', function (event) {
			const value = parseInt(this.value);
			if (value >= 0) {
				me.patternDepth = value - 1;
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('carpet-composition-op').addEventListener('input', function (event) {
			me.compositionOp = this.value;
			generateBackground(0);
		});

		optionsDoc.getElementById('carpet-blend-depth').addEventListener('input', function (event) {
			const value = parseInt(this.value);
			if (value >= 0) {
				const oldValue = me.blendDepth;
				const totalDepth = me.maxDepth;
				me.blendDepth = value;
				if (oldValue >= totalDepth && value >= totalDepth) {
					return;
				}
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('carpet-blend-filling').addEventListener('input', function (event) {
			me.blendFilling = this.checked;
			generateBackground(0);
		});

		function setOpacityEnable(event) {
			me.opacityEnable = parseInt(this.value);
			generateBackground(0);
		}

		for (let item of optionsDoc.querySelectorAll('input[name=carpet-opacity-enable]')) {
			item.addEventListener('input', setOpacityEnable);
		};

		function setFilling(event) {
			const filling = this.value;
			me.filling = filling;
			$('#carpet-pattern-opts').collapse(filling !== 'b' ? 'show' : 'hide');
			$(concentricOpts).collapse(filling === 'c' ? 'show' : 'hide');
			if (filling === 'i' && bgGeneratorImage.src === '') {
				document.getElementById('background-gen-image-upload').click();
			} else {
				generateBackground(0);
			}
		}

		for (let item of optionsDoc.querySelectorAll('input[name=carpet-filling]')) {
			item.addEventListener('input', setFilling);
		};

		for (let item of optionsDoc.querySelectorAll('input[name=carpet-pattern-location]')) {
			item.addEventListener('input', function (event) {
				const locations = parseInt(this.value);
				me.patternLocations = locations;
				generateBackground(0);
			});
		};

		optionsDoc.getElementById('carpet-patterned-centre').addEventListener('input', function (event) {
			me.patternedCentre = this.checked;
			generateBackground(0);
		});

		optionsDoc.getElementById('carpet-emphasis').addEventListener('input', function (event) {
			const value = parseInt(this.value);
			if (value >= 0) {
				me.centreEmphasis = value - 1;
				generateBackground(0);
			}
		});

		function changeColor(index, preview) {
			return function (event) {
				const color = colorControls[index].value;
				const [r, g, b] = hexToRGBA(color);
				const alpha = parseFloat(opacitySliders[index].value);
				me.colors[index] = rgba(r, g, b, alpha);
				if (index === 4) {
					me.colors[11] = color;
					me.patternOpacities[1] = alpha;
				} else if (index === 9) {
					me.colors[10] = color;
					me.patternOpacities[0] = alpha;
				} else {
					me.colors[index + 13] = color;
				}
				generateBackground(preview);
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
			generateBackground(0);
		});

		optionsDoc.getElementById('carpet-concentric-density').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 2) {
				me.concentricDensity = value;
				generateBackground(0);
			}
		});

		const fgSpacingSlider = optionsDoc.getElementById('carpet-relative-spacing');
		fgSpacingSlider.addEventListener('input', function (event) {
			me.fgSpacingFraction = parseFloat(this.value);
			generateBackground(1);
		});
		fgSpacingSlider.addEventListener('pointerup', fullRedraw);
		fgSpacingSlider.addEventListener('keyup', fullRedraw);

		const tlxCornerSlider = optionsDoc.getElementById('carpet-tlx-corner');
		tlxCornerSlider.addEventListener('input', function (event) {
			me.topLeftCornerX = parseFloat(this.value);
			generateBackground(1);
		});
		tlxCornerSlider.addEventListener('pointerup', fullRedraw);
		tlxCornerSlider.addEventListener('keyup', fullRedraw);

		const tlyCornerSlider = optionsDoc.getElementById('carpet-tly-corner');
		tlyCornerSlider.addEventListener('input', function (event) {
			me.topLeftCornerY = parseFloat(this.max) - parseFloat(this.value);
			generateBackground(1);
		});
		tlyCornerSlider.addEventListener('pointerup', fullRedraw);
		tlyCornerSlider.addEventListener('keyup', fullRedraw);

		const llCornerSlider = optionsDoc.getElementById('carpet-ll-corner');
		llCornerSlider.addEventListener('input', function (event) {
			me.lowerLeftCorner = parseFloat(this.value);
			generateBackground(1);
		});
		llCornerSlider.addEventListener('pointerup', fullRedraw);
		llCornerSlider.addEventListener('keyup', fullRedraw);

		const lrCornerSlider = optionsDoc.getElementById('carpet-lr-corner');
		lrCornerSlider.addEventListener('input', function (event) {
			me.lowerRightCorner = parseFloat(this.value);
			generateBackground(1);
		});
		lrCornerSlider.addEventListener('pointerup', fullRedraw);
		lrCornerSlider.addEventListener('keyup', fullRedraw);

		optionsDoc.getElementById('carpet-depth').addEventListener('input', function (event) {
			const value = parseInt(this.value);
			if (value >= 0) {
				me.maxDepth = value;
				generateBackground(0);
			}
		});

		const overlapInput = optionsDoc.getElementById('carpet-overlap');
		overlapInput.addEventListener('input', function (event) {
			me.overlap = parseFloat(this.value);
			generateBackground(1);
		});
		overlapInput.addEventListener('pointerup', fullRedraw);
		overlapInput.addEventListener('keyup', fullRedraw);

		function updateCheckboxArray(i) {
			return function (event) {
				const property = this.dataset.property;
				me[property][i] = this.checked;
				generateBackground(0);
			};
		}

		const recursiveInputs = optionsDoc.getElementById('carpet-recursive').querySelectorAll('input[data-property=recursive]');
		for (let i = 0; i < recursiveInputs.length; i++) {
			recursiveInputs[i].addEventListener('input', updateCheckboxArray(i));
		}

		const cutoutInputs = optionsDoc.getElementById('carpet-cutouts').querySelectorAll('input[data-property=cutouts]');
		for (let i = 0; i < cutoutInputs.length; i++) {
			cutoutInputs[i].addEventListener('input', updateCheckboxArray(i >= 4 ? i + 1 : i));
		}

		optionsDoc.getElementById('carpet-cutout-depth').addEventListener('input', function (event) {
			const value = parseInt(this.value);
			if (value >= 1) {
				me.cutoutDepth = value;
				generateBackground(0);
			}
		});

		const lopsidedXInput = optionsDoc.getElementById('carpet-lopsidedness-x');
		lopsidedXInput.addEventListener('input', function (event) {
			me.lopsidednessX = parseFloat(this.value);
			generateBackground(1);
		});
		lopsidedXInput.addEventListener('pointerup', fullRedraw);
		lopsidedXInput.addEventListener('keyup', fullRedraw);

		const lopsidedYInput = optionsDoc.getElementById('carpet-lopsidedness-y');
		lopsidedYInput.addEventListener('input', function (event) {
			me.lopsidednessY = parseFloat(this.value);
			generateBackground(1);
		});
		lopsidedYInput.addEventListener('pointerup', fullRedraw);
		lopsidedYInput.addEventListener('keyup', fullRedraw);

		const middleWidthInput = optionsDoc.getElementById('carpet-middle-width');
		middleWidthInput.addEventListener('input', function (event) {
			me.middleWidth = parseFloat(this.value);
			generateBackground(1);
		});
		middleWidthInput.addEventListener('pointerup', fullRedraw);
		middleWidthInput.addEventListener('keyup', fullRedraw);

		const middleHeightInput = optionsDoc.getElementById('carpet-middle-height');
		middleHeightInput.addEventListener('input', function (event) {
			me.middleHeight = parseFloat(this.value);
			generateBackground(1);
		});
		middleHeightInput.addEventListener('pointerup', fullRedraw);
		middleHeightInput.addEventListener('keyup', fullRedraw);

		const sizeInput = optionsDoc.getElementById('carpet-size');
		sizeInput.addEventListener('input', function (event) {
			me.size = parseFloat(this.value);
			generateBackground(1);
		});
		sizeInput.addEventListener('pointerup', fullRedraw);
		sizeInput.addEventListener('keyup', fullRedraw);

		const stretchInput = optionsDoc.getElementById('carpet-stretch');
		stretchInput.addEventListener('input', function (event) {
			me.stretch = parseFloat(this.value);
			generateBackground(1);
		});
		stretchInput.addEventListener('pointerup', fullRedraw);
		stretchInput.addEventListener('keyup', fullRedraw);

		optionsDoc.getElementById('carpet-left').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0 && value <= 100) {
				me.left = value / 100;
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('carpet-top').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0 && value <= 100) {
				me.top = value / 100;
				generateBackground(0);
			}
		});

		const rotationInput = optionsDoc.getElementById('carpet-rotation');
		rotationInput.addEventListener('input', function (event) {
			me.rotation = parseFloat(this.value) * TWO_PI;
			generateBackground(1);
		});
		rotationInput.addEventListener('pointerup', fullRedraw);
		rotationInput.addEventListener('keyup', fullRedraw);

		return optionsDoc;
	});

	this.size = 1;
	this.stretch = 0;
	this.lopsidednessX = 0;
	this.lopsidednessY = 0;
	this.middleWidth = 1;
	this.middleHeight = 1;
	this.overlap = 0;
	this.left = 0;
	this.top = 0;
	this.rotation = 0;
	const recursive= new Array(9);
	this.recursive = recursive;
	recursive.fill(true);
	recursive[4] = false;
	const cutouts = new Array(9);
	this.cutouts = cutouts;
	cutouts.fill(true);
	this.cutoutDepth = 1;

	this.maxDepth = 5;
	this.patternDepth = 3;
	this.filling = 'b';
	this.patternLocations = 3;
	this.patternedCentre = true;
	this.centreEmphasis = 0;

	this.compositionOp = 'source-over';
	this.blendDepth = 4;
	this.blendFilling = true;
	this.opacityEnable = 2;

	this.fgSpacingFraction = 0.5;
	this.concentricDensity = 7;
	this.lowerLeftCorner = 0.35;
	this.lowerRightCorner = 0.75;
	this.topLeftCornerX = 0.5;
	this.topLeftCornerY = 0.02;
}

SierpinskiCarpet.prototype.animatable = {
	continuous: [
		'size', 'stretch', 'lopsidednessX', 'lopsidednessY', 'middleWidth', 'middleHeight',
		'overlap', 'left', 'top', 'rotation', 'fgSpacingFraction', 'concentricDensity',
		'lowerLeftCorner', 'lowerRightCorner', 'topLeftCornerX', 'topLeftCornerY',
		'colors', 'patternOpacities'
	],
	stepped: [
		'recursive', 'cutouts', 'cutoutDepth', 'maxDepth',
		'patternDepth', 'compositionOp', 'blendDepth', 'filling', 'patternLocations',
		'patternedCentre', 'centreEmphasis', 'blendFilling', 'opacityEnable',
		'bipartite'
	]
};

class Tile {
	constructor(x, y, width, height, lx, ly, parent, relationship) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.parent = parent;
		this.relationship = relationship;

		if (relationship === 4) {
			this.clipPath = undefined;
			return;
		} else {
			this.clipPath = new Path2D();
		}
		const path = this.clipPath;
		const x1 = Math.round(x);
		const x2 = Math.round(x + width);
		const y1 = Math.round(y);
		const y2 = Math.round(y + height);

		switch (relationship) {
		case 0: 	// Top left
			path.moveTo(x1, y1);
			path.lineTo(x2, y1);
			path.lineTo(x2, ly);
			path.lineTo(lx, ly);
			path.lineTo(lx, y2);
			path.lineTo(x1, y2);
			break;

		case 1: 	// Top centre
			path.moveTo(x1, y1);
			path.lineTo(x2, y1);
			path.lineTo(x2, ly);
			path.lineTo(x1, ly);
			break;

		case 2: 	// Top right
			path.moveTo(x1, y1);
			path.lineTo(x2, y1);
			path.lineTo(x2, y2);
			path.lineTo(lx, y2);
			path.lineTo(lx, ly);
			path.lineTo(x1, ly);
			break;

		case 3: 	// Centre left
			path.moveTo(x1, y1);
			path.lineTo(lx, y1);
			path.lineTo(lx, y2);
			path.lineTo(x1, y2);
			break;

		case 5: 	// Centre right
			path.moveTo(lx, y1);
			path.lineTo(x2, y1);
			path.lineTo(x2, y2);
			path.lineTo(lx, y2);
			break;

		case 6: 	// Bottom left
			path.moveTo(x1, y1);
			path.lineTo(lx, y1);
			path.lineTo(lx, ly);
			path.lineTo(x2, ly);
			path.lineTo(x2, y2);
			path.lineTo(x1, y2);
			break;

		case 7: 	// Bottom centre
			path.moveTo(x1, ly);
			path.lineTo(x2, ly);
			path.lineTo(x2, y2);
			path.lineTo(x1, y2);
			break;

		case 8: 	// Bottom right
			path.moveTo(lx, y1);
			path.lineTo(x2, y1);
			path.lineTo(x2, y2);
			path.lineTo(x1, y2);
			path.lineTo(x1, ly);
			path.lineTo(lx, ly);
			break;

		case 12: 	// Whole image
			path.rect(x1, y1, x2 - x1, y2 - y1);
			break;
		}

	}

	clip(context) {
		const ancestors = [];
		let parent = this.parent;
		while (parent !== null) {
			ancestors.push(parent);
			parent = parent.parent;
		}
		for (let i = ancestors.length - 1; i >= 0; i--) {
			context.clip(ancestors[i].clipPath);
		}
		context.clip(this.clipPath);
	}
}

SierpinskiCarpet.prototype.generate = function* (context, canvasWidth, canvasHeight, preview) {
	let beginTime = performance.now();
	const stretch = this.stretch;
	if (stretch === -1) {
		return;
	}
	const permutations = new Array(9);
	permutations[0] = [6, 3, 0, 7, 4, 1, 8, 5, 2];
	permutations[1] = [8, 6, 7, 5, 4, 3, 0, 2, 1];
	permutations[2] = [8, 7, 6, 5, 4, 3, 2, 1, 0];
	permutations[3] = [7, 3, 1, 6, 4, 2, 8, 5, 0];
	permutations[4] = [0, 1, 2, 3, 4, 5, 6, 7, 8];
	permutations[5] = [0, 5, 8, 2, 4, 6, 1, 3, 7];
	permutations[6] = permutations[4];
	permutations[7] = [1, 2, 0, 3, 4, 5, 7, 6, 8];
	permutations[8] = [2, 5, 8, 1, 4, 7, 0, 3, 6];
	permutations[12] = permutations[4];
	const recursive = this.recursive;
	const cutouts = this.cutouts;
	const cutoutDepth = this.cutoutDepth - 1;
	const middleWidth = this.middleWidth / 3;
	const middleHeight = this.middleHeight / 3;
	const drawSize = this.size;

	let drawWidth, drawHeight;
	if (canvasWidth >= canvasHeight) {
		if (stretch > 0) {
			drawWidth = drawSize * ((1 - stretch) * canvasHeight + stretch * canvasWidth);
		} else {
			drawWidth = drawSize * (stretch + 1) * canvasHeight;
		}
		drawHeight = drawSize * canvasHeight;
		const idealWidth = drawWidth * (2 / 3 + middleWidth);
		drawWidth = Math.min(Math.max(idealWidth, drawWidth), canvasWidth);
	} else {
		drawWidth = drawSize * canvasWidth;
		if (stretch > 0) {
			drawHeight = drawSize * ((1 - stretch) * canvasWidth + stretch * canvasHeight);
		} else {
			drawHeight = drawSize * (stretch + 1) * canvasWidth;
		}
		const idealHeight = drawHeight * (2 / 3 + 1 / middleHeight);
		drawHeight = Math.min(Math.max(idealHeight, drawHeight), canvasHeight);
	}
	drawWidth = Math.round(drawWidth);
	drawHeight = Math.round(drawHeight);

	const lopsidednessX = this.lopsidednessX + 1;
	const lopsidednessY = this.lopsidednessY + 1;
	const overlap = this.overlap;
	const colors = this.colors;
	const blendDepth = this.blendDepth - 1;
	const filling = this.filling;

	const left = Math.round(this.left * (canvasWidth - drawWidth));
	const top = Math.round(this.top * (canvasHeight - drawHeight));
	context.translate(left + drawWidth / 2, top + drawHeight / 2);
	context.rotate(this.rotation);
	context.translate(-drawWidth / 2, -drawHeight / 2);
	context.save();

	let queue = [new Tile(0, 0, drawWidth, drawHeight, 0, 0, null, 12)];
	let numProcessed = 0;

	let maxDepth = this.maxDepth - 1;
	if (preview > 0 && maxDepth > 3) {
		maxDepth = 3;
	}

	let applyOpacity = true;
	const baseOpacity = context.globalAlpha;

	const spacingNumerator = Math.min(
		drawWidth * (1/3 + overlap / 6),
		drawHeight * (1/3 + overlap / 6),
	) / this.concentricDensity;

	for (let depth = 0; depth <= maxDepth; depth++) {
		const nextQueue = [];
		switch (depth) {
		case 1:
			applyOpacity = this.opacityEnable === 2;
			break;
		case 2:
			applyOpacity = applyOpacity || this.opacityEnable === 1;
			break;
		}
		const useCutouts = overlap > 0 && (overlap < 1 || depth === 0 || recursive[4]) && depth >= cutoutDepth;
		const emphasize = depth <= this.centreEmphasis;
		const drawPattern = filling !== 'b' && depth <= this.patternDepth;
		const combinedSpacing = Math.round(spacingNumerator * 3 ** -depth);
		let fgSpacing = Math.round(combinedSpacing * this.fgSpacingFraction);
		if (fgSpacing === 0) {
			fgSpacing = 1;
		}
		const bgSpacing = Math.max(combinedSpacing - fgSpacing, 1);
		const lowerRightCorner = Math.max(Math.round(this.lowerRightCorner * fgSpacing), 1);
		const lowerLeftCorner = Math.max(Math.round(this.lowerLeftCorner * lowerRightCorner), 1);
		const topLeftCornerX = Math.max(Math.round(this.topLeftCornerX * (combinedSpacing - 1)), 1);

		for (let tile of queue) {
			let {width, height} = tile;
			const {x, y, relationship} = tile;
			const permutation = permutations[relationship];
			if (overlap > 0) {
				context.restore();
				context.save();
				tile.clip(context);
			}
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

			let roundedX, roundedY, roundedWidth, roundedHeight;
			context.globalCompositeOperation = this.compositionOp;
			if (depth <= blendDepth && relationship !== 4) {
				roundedX = Math.round(x);
				roundedY = Math.round(y);
				roundedWidth = Math.round(width + x - roundedX);
				roundedHeight = Math.round(height + y - roundedY);
				let colorRelationship = relationship;
				context.fillStyle = colors[relationship + (applyOpacity ? 0 : 13)];
				context.fillRect(roundedX, roundedY, roundedWidth, roundedHeight);
			}

			const remainingWidth = width * (1 - middleWidth);
			width = width * middleWidth;
			const width1 = width;
			const remainingHeight = height * (1 - middleHeight);
			height = height * middleHeight;
			const height1 = height;
			const width0 = Math.round(remainingWidth / 2 * lopsidednessX);
			const height0 = Math.round(remainingHeight / 2 * lopsidednessY);
			const x1 = x + width0;
			const y1 = y + height0;

			if (middleWidth > 0 && middleHeight > 0) {
				if (width >= 1 || height >= 1) {
					if (width < 1) {
						width = 1;
					} else if (height < 1) {
						height = 1;
					}
				}
			}
			const x2 = x1 + width;
			const y2 = y1 + height;
			const width2 = remainingWidth - width0;
			const height2 = remainingHeight - height0;

			const leftOverlap = width0 * (1 - middleWidth) / 2 * (2 - lopsidednessX) * overlap;
			const rightOverlap = width2 * (1 - middleWidth) / 2 * lopsidednessX * overlap;
			const topOverlap = height0 * (1 - middleHeight) / 2 * (2 - lopsidednessY) * overlap;
			const bottomOverlap = height2 * (1 - middleHeight) / 2 * lopsidednessY * overlap;
			const centreX = x1 - leftOverlap;
			const centreY = y1 - topOverlap;
			let centreWidth = width + leftOverlap + rightOverlap;
			let centreHeight = height + topOverlap + bottomOverlap;
			roundedX = Math.round(centreX);
			roundedY = Math.round(centreY);

			if (centreWidth >= 1 || centreHeight >= 1) {
				if (centreWidth < 1) {
					centreWidth = 1;
				} else if (centreHeight < 1) {
					centreHeight = 1;
				}
				roundedWidth = Math.max(Math.round(centreWidth + centreX - roundedX), 1);
				roundedHeight = Math.max(Math.round(centreHeight + centreY - roundedY), 1);
				let clipPath;

				if (useCutouts) {
					const centreX2 = roundedX + roundedWidth;
					const centreY2 = roundedY + roundedHeight;
					const lx1 = roundedX + Math.round(leftOverlap);
					const lx2 = centreX2 - Math.round(rightOverlap);
					const ly1 = roundedY + Math.round(topOverlap);
					const ly2 = centreY2 - Math.round(bottomOverlap);
					clipPath = new Path2D();

					// Top left
					if (recursive[permutation[0]] || !cutouts[0]) {
						clipPath.moveTo(roundedX, ly1);
						clipPath.lineTo(roundedX, roundedY);
						clipPath.lineTo(lx1, roundedY);
					} else {
						clipPath.moveTo(lx1, ly1);
					}

					// Top centre
					if (recursive[permutation[1]] || !cutouts[1]) {
						clipPath.lineTo(lx1, roundedY);
						clipPath.lineTo(lx2, roundedY);
					} else {
						clipPath.lineTo(lx1, ly1);
						clipPath.lineTo(lx2, ly1);
					}

					// Top right
					if (recursive[permutation[2]] || !cutouts[2]) {
						clipPath.lineTo(lx2, roundedY);
						clipPath.lineTo(centreX2, roundedY);
						clipPath.lineTo(centreX2, ly1);
					} else {
						clipPath.lineTo(lx2, ly1);
					}

					// Centre right
					if (recursive[permutation[5]] || !cutouts[5]) {
						clipPath.lineTo(centreX2, ly1);
						clipPath.lineTo(centreX2, ly2);
					} else {
						clipPath.lineTo(lx2, ly1);
						clipPath.lineTo(lx2, ly2);
					}

					// Bottom right
					if (recursive[permutation[8]] || !cutouts[8]) {
						clipPath.lineTo(centreX2, ly2);
						clipPath.lineTo(centreX2, centreY2);
						clipPath.lineTo(lx2, centreY2);
					} else {
						clipPath.lineTo(lx2, ly2);
					}

					// Bottom centre
					if (recursive[permutation[7]] || !cutouts[7]) {
						clipPath.lineTo(lx2, centreY2);
						clipPath.lineTo(lx1, centreY2);
					} else {
						clipPath.lineTo(lx2, ly2);
						clipPath.lineTo(lx1, ly2);
					}

					// Bottom left
					if (recursive[permutation[6]] || !cutouts[6]) {
						clipPath.lineTo(lx1, centreY2);
						clipPath.lineTo(roundedX, centreY2);
						clipPath.lineTo(roundedX, ly2);
					} else {
						clipPath.lineTo(lx1, ly2);
					}

					// Centre Left
					if (recursive[permutation[3]] || !cutouts[3]) {
						clipPath.lineTo(roundedX, ly2);
						clipPath.lineTo(roundedX, ly1);
					} else {
						clipPath.lineTo(lx1, ly2);
						clipPath.lineTo(lx1, ly1);
					}
				}

				if (!recursive[4] || depth === maxDepth) {
					if (useCutouts && (!recursive[4] || maxDepth === 0)) {
						context.clip(clipPath);
					}
					if (emphasize) {
						context.globalCompositeOperation = 'source-over';
						context.fillStyle = colors[10 + bipartiteColoring];
					} else {
						context.fillStyle = colors[bipartiteColoring === 0 ? 9 : 4];
					}
					if (!this.blendFilling) {
						context.globalCompositeOperation = 'source-over';
					}
					if (drawPattern && patternLocation) {
						if (filling === 'c') {
							this.concentricSquares(context, roundedX, roundedY,
								roundedWidth, roundedHeight, fgSpacing, bgSpacing,
								lowerLeftCorner, lowerRightCorner, topLeftCornerX
							);
						} else {
							if (!emphasize) {
								context.globalAlpha = this.patternOpacities[bipartiteColoring] * baseOpacity;
							}
							context.drawImage(bgGeneratorImage, roundedX, roundedY, roundedWidth, roundedHeight);
							context.globalAlpha = baseOpacity;
						}
					} else if (relationship !== 12 || patternedCentre || this.bipartite || (filling !== 'b' && this.patternLocations !== 3)) {
						context.fillRect(roundedX, roundedY, roundedWidth, roundedHeight);
					}
				} else {
					const centreTile = new Tile(roundedX, roundedY, roundedWidth, roundedHeight, undefined, undefined, null, 4);
					if (!useCutouts) {
						clipPath = new Path2D();
						clipPath.rect(roundedX, roundedY, roundedWidth, roundedHeight);
					}
					centreTile.clipPath = clipPath;
					nextQueue.push(centreTile);
				}
			} else {
				roundedWidth = 0;
				roundedHeight = 0;
			}

			const overlapX2 = roundedX + roundedWidth;
			const overlapY2 = roundedY + roundedHeight;

			const haveColumn0 = width0 >= 1;
			const haveColumn2 = width2 >= 1;
			const haveRow0 = height0 >= 1;
			const haveRow2 = height2 >= 1;

			if (recursive[permutation[0]] && (haveColumn0 || haveRow0)) {
				const topLeftTile = new Tile(x, y, width0, height0, roundedX, roundedY, tile, 0);
				nextQueue.push(topLeftTile);
			}
			if (middleWidth > 0) {
				const haveColumn1 = width >= 1;
				if (recursive[permutation[1]] && (haveColumn1 || haveRow0)) {
					const topMiddleTile = new Tile(x1, y, width, height0, undefined, roundedY, tile, 1);
					nextQueue.push(topMiddleTile);
				}
				if (recursive[permutation[7]] && (haveColumn1 || haveRow2)) {
					const bottomMiddleTile = new Tile(x1, y2, width, height2, undefined, overlapY2, tile, 7);
					nextQueue.push(bottomMiddleTile);
				}
			}
			if (recursive[permutation[2]] && (haveColumn2 || haveRow0)) {
				const topRightTile = new Tile(x2, y, width2, height0, overlapX2, roundedY, tile, 2);
				nextQueue.push(topRightTile);
			}
			if (middleHeight > 0) {
				const haveRow1 = height >= 1;
				if (recursive[permutation[3]] && (haveColumn0 || haveRow1)) {
					const middleLeftTile = new Tile(x, y1, width0, height, roundedX, undefined, tile, 3);
					nextQueue.push(middleLeftTile);
				}
				if (recursive[permutation[5]] && (haveColumn2 || haveRow1)) {
					const middleRightTile = new Tile(x2, y1, width2, height, overlapX2, undefined, tile, 5);
					nextQueue.push(middleRightTile);
				}
			}
			if (recursive[permutation[6]] && (haveColumn0 || haveRow2)) {
				const bottomLeftTile = new Tile(x, y2, width0, height2, roundedX, overlapY2, tile, 6);
				nextQueue.push(bottomLeftTile);
			}
			if (recursive[permutation[8]] && (haveColumn2 || haveRow2)) {
				const bottomRightTile = new Tile(x2, y2, width2, height2, overlapX2, overlapY2, tile, 8);
				nextQueue.push(bottomRightTile);
			}

			numProcessed++;
			if ((numProcessed % 300) === 299 && performance.now() >= beginTime + 20) {
				context.restore();
				yield;
				beginTime = performance.now();
				context.save();
			}

		}
		queue = nextQueue;
	}
	context.restore();
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
