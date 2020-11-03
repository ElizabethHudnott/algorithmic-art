export default function SierpinskiCarpet() {
	const me = this;
	this.title = 'Sierpinski Carpet';
	this.helpFile = 'help/sierpinski-carpet.html';
	this.backgroundColor = [255, 255, 255];

	/*
	 *	0-9	Backgrounds
	 *	0	Top left
	 *	1	Top centre
	 *	2	Top right
	 *	3	Middle left
	 *	4	Centre
	 *	5	Middle right
	 *	6	Bottom left
	 *	7	Bottom centre
	 *	8	Bottom right
	 * 	9	Root
	 *
	 *	+10 Backgrounds, emphasized
	 *	+20	Foregrounds
	 *	+30 Foregrounds, emphasized
	 *	Only 0-9 appear in the queue.
	*/
	const colors = new Array(40);
	this.colors = colors;
	this.foreOpacities = new Array(10);
	if (darkMode()) {
		colors.fill('#00000080', 0, 9); 	// Backgrounds (0-8)
		colors.fill('#000000', 10, 19);		// Backgrounds with emphasis (10-18)
		colors.fill('#1a1a1ad3', 20, 30)	// Foregrounds (20-29)
		colors.fill('#1a1a1a', 30, 40);		// Foregrounds with emphasis (30-39)
		this.foreOpacities.fill(211 / 255);

	} else {
		colors.fill('#ffffff80', 0, 9);		// Backgrounds (0-8)
		colors.fill('#ffffff', 10, 19);		// Backgrounds with emphasis (10-18)
		colors.fill('#00000080', 20, 30);	// Foregrounds (20-29)
		colors.fill('#000000', 30, 40);		// Foregrounds with emphasis (30-39)
		this.foreOpacities.fill(1);
	}
	colors[9] = '#ffffff00';				// Depth zero background (transparent)
	colors[19] = '#ffffff00';				// Depth zero background (transparent)

	this.optionsDocument = downloadFile('sierpinski-carpet.html', 'document').then(function (optionsDoc) {

		const colorControlArea = optionsDoc.getElementById('carpet-colors');
		const colorControls = colorControlArea.querySelectorAll('input[type=color]');
		const opacitySliders = colorControlArea.querySelectorAll('input[type=range]');

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

		const blendDepthInput = optionsDoc.getElementById('carpet-blend-depth');
		blendDepthInput.addEventListener('input', function (event) {
			const value = parseInt(this.value);
			if (value >= 0) {
				me.blendDepth = value;
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

		const colorSetInput = optionsDoc.getElementById('carpet-color-set');

		colorSetInput.addEventListener('input', function (event) {
			const offset = this.value === 'b' ? 0 : 20;
			for (let i = 0; i <= 9; i++) {
				const [r, g, b, a] = parseColor(me.colors[offset + i])[1];
				colorControls[i].value = rgbToHex(r, g, b);
				opacitySliders[i].value = a;
			}
		});

		const editModeInput = optionsDoc.getElementById('carpet-edit-mode');
		// Maps and edit mode to an array (one element per colour control) of array of affect colour indicies
		const editModes = new Array(editModeInput.children.length);
		{
			for (let i = 0; i < editModes.length; i++) {
				editModes[i] = new Array(10);
			}
			for (let i = 0; i <= 9; i++) {
				editModes[0][i] = [i];	// All independent colours
			}
			editModes[1].fill([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);	// All same colour

			const partitions = [];
			partitions[0] = [[0, 2, 4, 6, 8, 9], [1, 3, 5, 7]];	// Corners & Middles 1
			partitions[1] = [[0, 2, 6, 8], [1, 3, 4, 5, 7, 9]];	// Corners & Middles 2
			partitions[2] = [[0, 1, 2, 3, 5, 6, 7, 8], [4, 9]];	// Inner & Outer
			partitions[3] = [[0, 1, 3], [2, 6], [5, 7, 8], [4,9]]; // Two L-Shapes
			partitions[4] = [[0, 1, 3, 5, 7, 8], [2, 6], [4,9]]; // Matching L-Shapes
			for (let i = 0; i < partitions.length; i++) {
				const editMode = editModes[i + 2];
				for (let j = 0; j < editMode.length; j++) {
					editMode[j] = [];
				}
				const partition = partitions[i];
				for (let j = 0; j < partition.length; j++) {
					const list = partition[j];
					for (let item of list) {
						editMode[item] = list;
					}
				}
			}
		}

		editModeInput.addEventListener('input', function (event) {
			const editMode = editModes[parseInt(this.value)];
			const done = [];
			const colors = [];
			for (let i = 0; i <= 9; i++) {
				const indicies = editMode[i];
				let index = indicies[0];
				if (!done.includes(index)) {
					const numLocations = indicies.length;
					let color, representative;
					for (let j = 0; j < numLocations; j++) {
						representative = indicies[j];
						color = colorControls[representative].value;
						if (!colors.includes(color)) {
							colors.push(color);
							break;
						}
					}
					const opacity = parseFloat(opacitySliders[representative].value);
					const [r, g, b] = hexToRGBA(color);
					const colorWithAlpha = rgba(r, g, b, opacity);
					done.push(index);
					for (let j = 0; j < numLocations; j++) {
						index = indicies[j];
						colorControls[index].value = color;
						opacitySliders[index].value = opacity;
						if (colorSetInput.value === 'f') {
							me.foreOpacities[index] = alpha;
							index += 20;
						}
						me.colors[index] = colorWithAlpha;
						me.colors[index + 10] = color;	// emphasized version
					}
				}
			}
			generateBackground(0);
		});

		function changeColor(index, preview) {
			return function (event) {
				const color = colorControls[index].value;
				const [r, g, b] = hexToRGBA(color);
				const alpha = parseFloat(opacitySliders[index].value);
				const colorWithAlpha = rgba(r, g, b, alpha);
				const indicies = editModes[parseInt(editModeInput.value)][index];
				for (let colorIndex of indicies) {
					colorControls[colorIndex].value = color;
					opacitySliders[colorIndex].value = alpha;
					if (colorSetInput.value === 'f') {
						me.foreOpacities[index] = alpha;
						colorIndex += 20;
					}
					me.colors[colorIndex] = colorWithAlpha;
					me.colors[colorIndex + 10] = color;	// emphasized version
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

		$(optionsDoc.getElementById('carpet-structure-tab')).on('show.bs.tab', function (event) {
			const hasMiddleX = me.middleWidth > 0;
			const hasMiddleY = me.middleHeight > 0;
			const numPieces = 5 + (hasMiddleX ? 2 : 0) + (hasMiddleY ? 2 : 0);
			const button = layoutsDiv.querySelector(`input[name="carpet-layout"][value="${numPieces}"]`);
			button.checked = true;
			$(button.parentElement).button('toggle');
		});

		const maxDepthInput = optionsDoc.getElementById('carpet-depth');
		const centreDepthInput = optionsDoc.getElementById('carpet-centre-depth');
		const globalCentreDepthInput = optionsDoc.getElementById('carpet-global-centre-depth');

		function limitCentreDepth() {
			const max = me.maxDepth;
			const minLimit = Math.min(max, 2);
			me.centreDepth = Math.max(Math.min(me.centreDepth, max), minLimit);
			me.globalCentreDepth = Math.max(Math.min(me.globalCentreDepth, max), 1);
			centreDepthInput.min = Math.min(max, 2);
			centreDepthInput.max = max;
			globalCentreDepthInput.min = Math.min(max, 1);
			globalCentreDepthInput.max = max;
			centreDepthInput.value = me.centreDepth;
			globalCentreDepthInput.value = me.globalCentreDepth;
		}

		maxDepthInput.addEventListener('input', function (event) {
			const value = parseInt(this.value);
			if (value >= 0) {
				me.maxDepth = value;
				limitCentreDepth();
				generateBackground(0);
				blendDepthInput.max = value;
			}
		});

		const cutoutFields = optionsDoc.getElementById('carpet-cutouts');

		function setCutoutVisibility() {
			let hasCutouts = me.overlap > 0;
			if (hasCutouts) {
				const recursive = me.recursive;
				hasCutouts =
					!recursive[0] || !recursive[2] ||
					!recursive[6] || !recursive[8];

				if (me.middleWidth > 0 || me.middleHeight > 0) {
					hasCutouts =
						hasCutouts ||
						!recursive[1] || !recursive[7] ||
						!recursive[3] || !recursive[5]
				}
			}
			cutoutFields.classList.toggle('show', hasCutouts);
		}

		const overlapInput = optionsDoc.getElementById('carpet-overlap');
		overlapInput.addEventListener('input', function (event) {
			me.overlap = parseFloat(this.value);
			generateBackground(1);
		});
		function applyOverlap() {
			setCutoutVisibility();
			fullRedraw();
		}
		overlapInput.addEventListener('pointerup', applyOverlap);
		overlapInput.addEventListener('keyup', applyOverlap);

		const middleWidthInput = optionsDoc.getElementById('carpet-middle-width');
		const middleHeightInput = optionsDoc.getElementById('carpet-middle-height');

		function calcComplexity() {
			const hasMiddleX = me.middleWidth > 0;
			const hasMiddleY = me.middleHeight > 0;
			let numPieces = 0;
			for (let i = 0; i < 9; i++) {
				if (!me.recursive[i]) {
					continue;
				}
				if (i === 4 && me.overlap > 0) {
					numPieces++;
					continue;
				}
				if (!hasMiddleX && i % 3 === 1) {
					continue;
				}
				if (!hasMiddleY && i >= 3 && i <= 5) {
					continue;
				}
				numPieces++;
			}
			return numPieces;
		}

		function limitWork(currentComplexity) {
			currentComplexity = Math.max(currentComplexity, 2);
			const work = (currentComplexity ** me.maxDepth - 1) / (currentComplexity - 1);

			const newComplexity = calcComplexity();
			let newDepth = Math.round(
				Math.log2(work * (newComplexity - 1) + 1) /
				Math.log2(newComplexity)
			);
			newDepth = Math.max(newDepth, 5);

			if (newDepth < me.maxDepth) {
				me.maxDepth = newDepth;
				maxDepthInput.value = newDepth;
				limitCentreDepth();
				if (me.blendDepth > newDepth) {
					me.blendDepth = newDepth;
					blendDepthInput.value = newDepth;
				}
				blendDepthInput.max = newDepth;
			}
		}

		function selectLayout(event) {
			const oldComplexity = calcComplexity();
			const value = parseInt(this.value);
			const hasMiddleX = value === 9;
			const hasMiddleY = value >= 7;

			if (!hasMiddleX) {
				me.middleWidth = 0;
			} else if (me.middleWidth === 0) {
				me.middleWidth = 1;
			}
			middleWidthInput.value = me.middleWidth;

			if (!hasMiddleY) {
				me.middleHeight = 0;
			} else if (me.middleHeight === 0) {
				me.middleHeight = 1;
			}
			middleHeightInput.value = me.middleHeight;

			if (value === 9) {
				me.overlap = 0;
			} else if (me.overlap === 0) {
				me.overlap = 0.5;
			}
			overlapInput.value = me.overlap;
			setCutoutVisibility();
			limitWork(oldComplexity);
			generateBackground(0);
		}

		const layoutsDiv = optionsDoc.getElementById('carpet-layouts')
		for (let button of layoutsDiv.getElementsByTagName('INPUT')) {
			button.addEventListener('click', selectLayout);
		}

		const recursiveInputs = Array.from(optionsDoc.getElementById('carpet-recursion').querySelectorAll('input[name="carpet-recursive"]'));

		function changeRecursion(event) {
			const index = recursiveInputs.indexOf(this);
			const recurse = this.checked;
			me.recursive[index] = recurse;
			if (index === 4) {
				let row = centreDepthInput.parentElement.parentElement;
				row.classList.toggle('show', recurse);
				row = globalCentreDepthInput.parentElement.parentElement;
				row.classList.toggle('show', recurse);
				if (recurse) {
					let depth = Math.max(me.centreDepth, parseInt(centreDepthInput.value), 2);
					me.centreDepth = depth;
					centreDepthInput.value = depth;
					depth = Math.max(me.globalCentreDepth, parseInt(globalCentreDepthInput.value), 2);
					me.globalCentreDepth = depth;
					globalCentreDepthInput.value = depth;
				} else {
					me.centreDepth = 2;
					me.globalCentreDepth = 1;
				}
			}
			setCutoutVisibility();
			generateBackground(0);
		}

		for (let i = 0; i < recursiveInputs.length; i++) {
			recursiveInputs[i].addEventListener('input', changeRecursion);
		}

		centreDepthInput.addEventListener('input', function (event) {
			const value = parseInt(this.value);
			if (value >= 0) {
				me.centreDepth = value;
				generateBackground(0);
			}
		});

		globalCentreDepthInput.addEventListener('input', function (event) {
			const value = parseInt(this.value);
			if (value >= 0) {
				me.globalCentreDepth = value;
				generateBackground(0);
			}
		});

		const cutoutInputs = Array.from(cutoutFields.querySelectorAll('input[name="carpet-cutouts"]'));

		function changeCutout(event) {
			let index = cutoutInputs.indexOf(this);
			if (index >= 4) {
				index++;
			}
			me.cutouts[index] = this.checked;
			generateBackground(0);
		}

		for (let i = 0; i < cutoutInputs.length; i++) {
			cutoutInputs[i].addEventListener('input', changeCutout);
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

		middleWidthInput.addEventListener('input', function (event) {
			me.middleWidth = parseFloat(this.value);
			generateBackground(1);
		});
		middleWidthInput.addEventListener('pointerup', fullRedraw);
		middleWidthInput.addEventListener('keyup', fullRedraw);

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
	this.centreDepth = 2;
	this.globalCentreDepth = 1;
	this.blendDepth = 4;
	this.patternDepth = 3;

	this.filling = 'b';
	this.patternLocations = 3;
	this.patternedCentre = true;
	this.centreEmphasis = 3;

	this.compositionOp = 'source-over';
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
		'colors', 'foreOpacities'
	],
	stepped: [
		'recursive', 'cutouts', 'cutoutDepth', 'maxDepth', 'centreDepth', 'globalCentreDepth',
		'patternDepth', 'compositionOp', 'blendDepth', 'filling', 'patternLocations',
		'patternedCentre', 'centreEmphasis', 'blendFilling', 'opacityEnable'
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
			this.deadCentre = parent.deadCentre;
			this.central = parent.central || parent.relationship === 9;
			return;
		}

		this.clipPath = new Path2D();
		this.deadCentre = false;
		this.central = relationship !== 9 && parent.central;
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

		case 9: 	// Whole image
			path.rect(x1, y1, x2 - x1, y2 - y1);
			this.deadCentre = true;
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
	permutations[9] = permutations[4];
	const recursive = this.recursive;
	recursive[4] = this.centreDepth > 2 || this.globalCentreDepth > 1;
	const cutouts = this.cutouts;
	const cutoutDepth = this.cutoutDepth - 1;
	const middleWidth = this.middleWidth / 3;
	const middleHeight = this.middleHeight / 3;
	const drawSize = this.size;

	const canvas = context.canvas;
	const rawWidth = canvas.width;
	const rawHeight = canvas.height;
	const aspectRatio = rawWidth / rawHeight;
	let drawWidth, drawHeight;
	if (canvasWidth >= canvasHeight) {
		if (stretch > 0) {
			drawWidth = ((1 - stretch) + stretch * aspectRatio) * drawSize * canvasHeight;
		} else {
			drawWidth = drawSize * (stretch + 1) * canvasHeight;
		}
		drawHeight = drawSize * canvasHeight;
		const idealWidth = drawWidth * (2 / 3 + middleWidth);
		drawWidth = Math.min(Math.max(idealWidth, drawWidth), Math.max(rawWidth, canvasWidth));
		if (drawWidth > canvasWidth) {
			drawHeight *= canvasWidth / drawWidth;
			drawWidth = canvasWidth;
		}
	} else {
		drawWidth = drawSize * canvasWidth;
		if (stretch > 0) {
			drawHeight = ((1 - stretch) + stretch / aspectRatio) * drawSize * canvasWidth;
		} else {
			drawHeight = drawSize * (stretch + 1) * canvasWidth;
		}
		const idealHeight = drawHeight * (2 / 3 + 1 / middleHeight);
		drawHeight = Math.min(Math.max(idealHeight, drawHeight), Math.max(rawHeight, canvasHeight));
		if (drawHeight > canvasHeight) {
			drawWidth *= canvasHeight / drawHeight;
			drawHeight = canvasHeight;
		}
	}
	drawWidth = Math.round(drawWidth);
	drawHeight = Math.round(drawHeight);

	const lopsidednessX = this.lopsidednessX + 1;
	const lopsidednessY = this.lopsidednessY + 1;
	const overlap = this.overlap;
	const colors = this.colors;
	const blendDepth = this.blendDepth - 1;
	const filling = this.filling;
	const bipartitePattern = middleWidth === 0 && middleHeight === 0 ? 8 : 2;

	const left = Math.round(this.left * (canvasWidth - drawWidth));
	const top = Math.round(this.top * (canvasHeight - drawHeight));
	context.translate(left + drawWidth / 2, top + drawHeight / 2);
	context.rotate(this.rotation);
	context.translate(-drawWidth / 2, -drawHeight / 2);
	context.save();

	let queue = [new Tile(0, 0, drawWidth, drawHeight, 0, 0, null, 9)];

	let maxDepth = this.maxDepth - 1;
	if (preview > 0 && maxDepth > 3) {
		maxDepth = 3;
	}
	const centreDepth = Math.min(maxDepth, this.centreDepth - 1);
	const globalCentreDepth = Math.min(maxDepth, this.globalCentreDepth - 1);

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
		const useCutouts = overlap > 0 && depth >= cutoutDepth;
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
			const {x, y, parent, relationship} = tile;
			const relationshipPrime = relationship === 4 && tile.central ? 9 : relationship;
			let permutationSource = tile;
			while (permutationSource.relationship === 4) {
				permutationSource = permutationSource.parent;
			}
			const permutation = permutations[permutationSource.relationship];
			if (overlap > 0) {
				context.restore();
				context.save();
				tile.clip(context);
			}
			let patternLocation = (this.patternLocations & (2 ** (relationship % bipartitePattern))) !== 0;
			if (relationship === 9) {
				patternLocation = this.patternedCentre;
			}

			let roundedX, roundedY, roundedWidth, roundedHeight;
			context.globalCompositeOperation = this.compositionOp;
			if (depth <= blendDepth && relationship !== 9) {
				roundedX = Math.round(x);
				roundedY = Math.round(y);
				roundedWidth = Math.round(width + x - roundedX);
				roundedHeight = Math.round(height + y - roundedY);
				context.fillStyle = colors[relationshipPrime + (applyOpacity ? 0 : 10)];
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

				let recurse = recursive[4];
				if (recurse) {
					if (tile.deadCentre) {
						recurse = depth < globalCentreDepth;
					} else {
						recurse = depth < centreDepth;
					}
				}

				if (!recurse) {
					if (useCutouts) {
						context.clip(clipPath);
					}
					if (emphasize) {
						context.globalCompositeOperation = 'source-over';
						context.fillStyle = colors[30 + relationshipPrime];
					} else {
						context.fillStyle = colors[20 + relationshipPrime];
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
							context.fillRect(roundedX, roundedY, roundedWidth, roundedHeight);
							if (!emphasize) {
								context.globalAlpha = this.foreOpacities[relationship] * baseOpacity;
							}
							context.drawImage(bgGeneratorImage, roundedX, roundedY, roundedWidth, roundedHeight);
							context.globalAlpha = baseOpacity;
						}
					} else {
						context.fillRect(roundedX, roundedY, roundedWidth, roundedHeight);
					}
				} else {
					const centreTile = new Tile(roundedX, roundedY, roundedWidth, roundedHeight, undefined, undefined, tile, 4);
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

			unitsProcessed++;
			if (unitsProcessed >= benchmark) {
				const now = calcBenchmark();
				if (now >= yieldTime) {
					context.restore();
					yield;
					context.save();
				}
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
