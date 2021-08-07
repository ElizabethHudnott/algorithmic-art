const MAX_ATTRACTORS = 50;

export default function Contours() {
	const me = this;
	this.title = 'Contours';
	this.isShader = true;
	this.helpFile = 'help/contours.html';
	this.backgroundColor = [0, 0, 0];
	this.tween = 0;

	this.numAttractors = Math.min(Math.round((window.innerWidth * window.innerHeight) / (800 * 600) * 10), MAX_ATTRACTORS);

	this.optionsDocument = downloadFile('contours.html', 'document').then(function (optionsDoc) {
		function fullRedraw() {
			generateBackground(0);
		}

		function setNumericProperty(name) {
			return function(event) {
				const value = parseFloat(this.value);
				if (Number.isFinite(value) && value !== me[name]) {
					setBgProperty(me, name, value);
					generateBackground(0);
				}
			}
		}

		function setNumericPropertyElement(name, index) {
			return function(event) {
				const value = parseFloat(this.value);
				if (Number.isFinite(value) && value !== me[name][index]) {
					setBgPropertyElement(me, name, index, value);
					generateBackground(0);
				}
			}
		}

		function setSliderProperty(name) {
			return function(event) {
				const value = parseFloat(this.value);
				setBgProperty(me, name, value);
				generateBackground(1);
			}
		}

		optionsDoc.getElementById('force-field-constant').addEventListener('input', setNumericProperty('fieldConstant'));
		optionsDoc.getElementById('force-divisor').addEventListener('input', setNumericProperty('divisor'));
		optionsDoc.getElementById('force-base').addEventListener('input', setNumericProperty('base'));
		optionsDoc.getElementById('force-field-exponent').addEventListener('input', setNumericProperty('fieldExponent'));
		optionsDoc.getElementById('force-minkowski-order').addEventListener('input', setNumericProperty('minkowskiOrder'));

		optionsDoc.getElementById('force-minkowski-finite').addEventListener('input', function (event) {
			const numberInput = document.getElementById('force-minkowski-order');
			numberInput.disabled = false;
			const value = parseFloat(numberInput.value);
			if (Number.isFinite(value)) {
				setBgProperty(me, 'minkowskiOrder', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('force-minkowski-infinite').addEventListener('input', function (event) {
			document.getElementById('force-minkowski-order').disabled = true;
			setBgProperty(me, 'minkowskiOrder', 13);
			generateBackground(0);
		});

		optionsDoc.getElementById('force-distance-weight').addEventListener('input', setNumericProperty('distanceWeight'));

		optionsDoc.getElementById('force-hue-frequency').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0) {
				setBgProperty(me, 'hueFrequency', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('force-wave-hue').addEventListener('input', setNumericProperty('waveHue'));

		const hueRotationTurnsInput = optionsDoc.getElementById('force-hue-rotation-turns');
		const hueRotationFracInput = optionsDoc.getElementById('force-hue-rotation-fraction');

		function setHueRotation() {
			let turns = parseFloat(hueRotationTurnsInput.value);
			if (!Number.isFinite(turns)) {
				turns = Math.trunc(me.hueRotation);
			}
			const value = turns + parseFloat(hueRotationFracInput.value);
			setBgProperty(me, 'hueRotation', value);
			const preview = event.target === hueRotationFracInput ? 1 : 0;
			generateBackground(preview);
		}

		hueRotationTurnsInput.addEventListener('input', setHueRotation);
		hueRotationFracInput.addEventListener('input', setHueRotation);
		hueRotationFracInput.addEventListener('pointerup', fullRedraw);
		hueRotationFracInput.addEventListener('keyup', fullRedraw);

		optionsDoc.getElementById('force-color-portion').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0) {
				setBgProperty(me, 'colorPortion', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('force-sharpness').addEventListener('input', function (event) {
			let value = parseFloat(this.value);
			if (value >= 0 && value <= 1) {
				value = Math.min(value, 0.94);
				setBgProperty(me, 'sharpness', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('force-min-saturation').addEventListener('input', setNumericProperty('minSaturation'));
		optionsDoc.getElementById('force-max-saturation').addEventListener('input', setNumericProperty('maxSaturation'));

		optionsDoc.getElementById('force-lighting').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0) {
				setBgProperty(me, 'lighting', value);
				generateBackground(0);
			}
		});

		const minLightnessInput = optionsDoc.getElementById('force-min-lightness');
		const maxLightnessInput = optionsDoc.getElementById('force-max-lightness');

		minLightnessInput.addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0 && value <= 1) {
				setBgProperty(me, 'minLightness', value);
				if (value > me.maxLightness) {
					maxLightnessInput.value = value;
					setBgProperty(me, 'maxLightness', value);
				}
				generateBackground(0);
			}
		});

		maxLightnessInput.addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0 && value <= 1) {
				setBgProperty(me, 'maxLightness', value);
				if (value < me.minLightness) {
					minLightnessInput.value = value;
					setBgProperty(me, 'minLightness', value);
				}
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('force-wave-lightness').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= -2 && value <= 2) {
				setBgProperty(me, 'waveLightness', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('force-contrast').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0 && value <= 1) {
				setBgProperty(me, 'contrast', value);
				generateBackground(0);
			}
		});

		const bgSaturationInput = optionsDoc.getElementById('force-background-saturation');
		const flipHueCheckbox = optionsDoc.getElementById('force-flip-hue');

		bgSaturationInput.addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0 && value <= 1) {
				const flipped = flipHueCheckbox.checked ? -1 : 1;
				setBgProperty(me, 'backgroundSaturation', flipped * value);
				generateBackground(0)
			}
		});

		flipHueCheckbox.addEventListener('input', function (event) {
			const value = me.backgroundSaturation * -1;
			setBgProperty(me, 'backgroundSaturation', value);
			generateBackground(0);
		});

		const coloringInput = optionsDoc.getElementById('force-base-intensity');
		coloringInput.addEventListener('input', setSliderProperty('baseIntensity'));
		coloringInput.addEventListener('pointerup', fullRedraw);
		coloringInput.addEventListener('keyup', fullRedraw);

		const opacityInput = optionsDoc.getElementById('force-background-opacity');
		opacityInput.addEventListener('input', setSliderProperty('backgroundOpacity'));
		opacityInput.addEventListener('pointerup', fullRedraw);
		opacityInput.addEventListener('keyup', fullRedraw);

		optionsDoc.getElementById('force-base-color').addEventListener('input', setNumericProperty('baseColor'));

		optionsDoc.getElementById('force-sine-frequency').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0) {
				setBgProperty(me, 'sineFrequency', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('force-base-scale').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0) {
				setBgProperty(me, 'baseScale', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('force-base-saturation').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0 && value <= 1) {
				setBgProperty(me, 'baseSaturation', value);
				generateBackground(0);
			}
		});

		Array.from(optionsDoc.querySelectorAll('input[name="force-brightness"]')).forEach(function (element, index) {
			element.addEventListener('input', setNumericPropertyElement('baseBrightness', index));
		});

		const numAttractorsInput = optionsDoc.getElementById('force-num-attractors');
		numAttractorsInput.value = me.numAttractors;
		numAttractorsInput.addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0 && value <= MAX_ATTRACTORS) {
				setBgProperty(me, 'numAttractors', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('force-explosion').addEventListener('input', setNumericProperty('explosion'));

		optionsDoc.getElementById('force-step').addEventListener('input', function (event) {
			const value = parseInt(this.value);
			if (value >=1 && value < MAX_ATTRACTORS) {
				setBgProperty(me, 'step', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('force-min-strength').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0 && value <= 1 && value !== me.minStrength) {
				me.minStrength = value;
				me.randomize();
				setBgProperty(me, 'strength');
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('force-repel-probability').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0 && value <= 1) {
				me.repelProbability = value;
				me.randomize();
				setBgProperty(me, 'strength');
				generateBackground(0);
			}
		});

		const distributionLabels = new Map();
		distributionLabels.set('positionX', ['Left', 'Centre-Left', 'Centre', 'Centre-Right', 'Right']);
		distributionLabels.set('positionY', ['Bottom', 'Middle', 'Top']);
		distributionLabels.set('strength', ['Weak', 'Medium Weak', 'Medium', 'Medium Strong', 'Strong']);
		distributionLabels.set('saturations', ['Low', 'Medium Low', 'Medium', 'Medium High', 'High']);
		distributionLabels.set('displaceAmount', ['Small', 'Medium Small', 'Medium', 'Large', 'Largest']);
		distributionLabels.set('displaceAngle', ['Right', 'Up &amp; Right', 'Up &amp; Left', 'Left', 'Down &amp; Left', 'Down &amp; Right']);

		const distributionSelect = optionsDoc.getElementById('force-distribution');
		const distributionFields = optionsDoc.getElementById('force-distribution-values');
		distributionSelect.addEventListener('input', function (event) {
			const varName = this.value;
			const labels = distributionLabels.get(varName);
			const values = me[varName + 'Dist'];
			for (let i = 0; i < labels.length; i++) {
				const row = distributionFields.children[i];
				const label = row.children[0];
				label.innerHTML = labels[i];
				const input = row.children[1].children[0];
				input.value = values[i];
				row.hidden = false;
			}
			for (let i = labels.length; i < distributionFields.children.length; i++) {
				const row = distributionFields.children[i];
				row.hidden = true;
			}
		});

		function updateDistribution(index) {
			return function (event) {
				const varName = distributionSelect.value;
				const distribution = me[varName + 'Dist'];
				let value;
				if (this.value.trim() === '') {
					value = 0;
				} else {
					value = parseFloat(this.value);
				}
				if (value >= 0 && value !== distribution[index]) {
					distribution[index] = value;
					me.randomize();
					switch (varName) {
					case 'displaceAmount':
					case 'displaceAngle':
						setBgProperty(me, 'displaceAmount');
						setBgProperty(me, 'displaceGradient');
						break;

					default:
						setBgProperty(me, varName);
					}
					generateBackground(0);
				}
			};
		}

		for (let i = 0; i < distributionFields.children.length; i++) {
			const row = distributionFields.children[i];
			row.children[1].children[0].addEventListener('input', updateDistribution(i));
		}

		optionsDoc.getElementById('force-displace-linear').addEventListener('input', function (event) {
			me.displaceLinear = parseFloat(this.value);
			me.randomize()
			generateBackground(0);
		});

		optionsDoc.getElementById('force-displace-power').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value) && value !== me.displacePower) {
				me.displacePower = value;
				me.randomize();
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('force-displace-max').addEventListener('input', setNumericProperty('displaceMax'));

		const minDotInput = optionsDoc.getElementById('force-min-dot-size');
		const maxDotInput = optionsDoc.getElementById('force-max-dot-size');

		minDotInput.addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0) {
				setBgProperty(me, 'minDotSize', value);
				if (value > me.maxDotSize) {
					maxDotInput.value = value;
					setBgProperty(me, 'maxDotSize', value);
				}
				generateBackground(0);
			}
		});

		maxDotInput.addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0) {
				setBgProperty(me, 'maxDotSize', value);
				if (value < me.minDotSize) {
					minDotInput.value = value;
					setBgProperty(me, 'minDotSize', value);
				}
				generateBackground(0);
			}
		});

		const dotPalette = optionsDoc.getElementById('force-dot-color');

		function updateDotColor(component) {
			return function (event) {
				const colorIndex = parseInt(queryChecked(dotPalette, 'force-dot-color').value);
				me.dotColors[colorIndex][component] = parseFloat(this.value);
				setBgPropertyElement(me, 'dotColors', colorIndex);
				generateBackground(1);
			}
		}

		const dotHueInput = optionsDoc.getElementById('force-dot-hue');
		dotHueInput.addEventListener('input', updateDotColor(0));
		dotHueInput.addEventListener('pointerup', fullRedraw);
		dotHueInput.addEventListener('keyup', fullRedraw);

		const dotSaturationInput = optionsDoc.getElementById('force-dot-saturation');
		dotSaturationInput.addEventListener('input', updateDotColor(1));
		dotSaturationInput.addEventListener('pointerup', fullRedraw);
		dotSaturationInput.addEventListener('keyup', fullRedraw);

		const dotLightnessInput = optionsDoc.getElementById('force-dot-lightness');
		dotLightnessInput.addEventListener('input', updateDotColor(2));
		dotLightnessInput.addEventListener('pointerup', fullRedraw);
		dotLightnessInput.addEventListener('keyup', fullRedraw);

		const dotOpacityInput = optionsDoc.getElementById('force-dot-opacity');
		dotOpacityInput.addEventListener('input', updateDotColor(3));
		dotOpacityInput.addEventListener('pointerup', fullRedraw);
		dotOpacityInput.addEventListener('keyup', fullRedraw);

		function switchColor(event) {
			const colorIndex = parseInt(this.value);
			const color = me.dotColors[colorIndex];
			dotHueInput.value = color[0];
			dotSaturationInput.value = color[1];
			dotLightnessInput.value = color[2];
			dotSaturationInput.value = color[3];
		}

		for (let radio of dotPalette.getElementsByTagName('INPUT')) {
			radio.addEventListener('input', switchColor);
		}

		return optionsDoc;
	});

	this.positionX = new Array(MAX_ATTRACTORS);
	this.positionY = new Array(MAX_ATTRACTORS);
	this.strength = new Array(MAX_ATTRACTORS);
	this.saturations = new Array(MAX_ATTRACTORS);
	this.displaceAmount = new Array(MAX_ATTRACTORS);
	this.displaceGradient = new Array(MAX_ATTRACTORS);
	this.positionXDist = [1, 1, 1, 1, 1];
	this.positionYDist = [1, 1, 1];
	this.strengthDist = [1, 1, 1, 1, 1];
	this.minStrength = 0.1;
	this.repelProbability = 0;
	this.saturationsDist = [0, 0, 0, 0, 1];
	this.displaceAmountDist = [1, 0, 0, 0, 0];
	this.displaceAngleDist = [1, 1, 1, 1, 1, 1];
	this.displaceLinear = 0.2;
	this.displacePower = 2;
	this.displaceMax = 1;
	this.explosion = 1;
	this.step = 23;

	this.fieldConstant = 100;
	this.fieldExponent = 2;
	this.divisor = 100;
	this.base = 2.8;
	this.sineFrequency = 1;

	this.minkowskiOrder = 2;
	this.distanceWeight = 0; // Canberra distance

	this.hueFrequency = 0;
	this.hueRotation = 0;
	this.waveHue = 0;

	this.minSaturation = 0.5;
	this.maxSaturation = 1;
	this.lighting = 0.5;
	this.backgroundSaturation = 1;

	this.maxLightness = 0.4;
	this.minLightness = 0;
	this.waveLightness = 2;
	this.contrast = 0;

	this.colorPortion = 0.5;
	this.sharpness = 0.5;

	this.baseColor = 0;
	this.baseIntensity = 0;
	this.baseScale = 20;
	this.backgroundOpacity = 0;
	this.baseBrightness = [1, 1, 1, 1];
	this.baseSaturation = 1;

	this.minDotSize = 6;
	this.maxDotSize = this.minDotSize;
	this.dotColors = [
		[0.1665, 1, 0.5, 1],	// Attractive points (HSLA)
		[0.4, 1, 0.45, 1]		// Repulsive points
	];

	this.randomize();
}

Contours.prototype.randomize = function () {
	random.reset();
	const positionX = this.positionX;
	const positionY = this.positionY;
	const strength = this.strength;
	const saturations = this.saturations;
	const displaceAmount = this.displaceAmount;
	const displaceGradient = this.displaceGradient;

	const NUM_COLUMNS = 5;
	const NUM_ROWS = 3;
	const NUM_STRENGTHS = 5;
	const NUM_SATURATIONS = 5;
	const NUM_DISPLACEMENTS = 5;
	const NUM_ANGLES = 6;

	const xDist = new Array(NUM_COLUMNS);
	const yDist = new Array(NUM_ROWS);
	const strengthDist = new Array(NUM_STRENGTHS);
	const saturationsDist = new Array(NUM_SATURATIONS);
	const displaceDist = new Array(NUM_DISPLACEMENTS);
	const displaceAngleDist = new Array(NUM_ANGLES);
	let xDistTotal = 0, yDistTotal = 0, strengthDistTotal = 0, saturationsDistTotal = 0;
	let displaceDistTotal = 0, displaceAngleDistTotal = 0;

	for (let i = 0; i < NUM_COLUMNS; i++) {
		xDistTotal += this.positionXDist[i];
		xDist[i] = xDistTotal;
	}
	for (let i = 0; i < NUM_ROWS; i++) {
		yDistTotal += this.positionYDist[i];
		yDist[i] = yDistTotal;
	}
	for (let i = 0; i < NUM_STRENGTHS; i++) {
		strengthDistTotal += this.strengthDist[i];
		strengthDist[i] = strengthDistTotal;
	}
	for (let i = 0; i < NUM_SATURATIONS; i++) {
		saturationsDistTotal += this.saturationsDist[i];
		saturationsDist[i] = saturationsDistTotal;
	}
	for (let i = 0; i < NUM_DISPLACEMENTS; i++) {
		displaceDistTotal += this.displaceAmountDist[i];
		displaceDist[i] = displaceDistTotal;
	}
	for (let i = 0; i < NUM_ANGLES; i++) {
		displaceAngleDistTotal += this.displaceAngleDist[i];
		displaceAngleDist[i] = displaceAngleDistTotal;
	}

	const grid = new Array(NUM_COLUMNS);
	for (let i = 0; i < NUM_COLUMNS; i++) {
		const arr = new Array(NUM_ROWS);
		grid[i] = arr;
		for (let j = 0; j < NUM_ROWS; j++) {
			arr[j] = [];
		}
	}

	let {displaceLinear, displacePower} = this;
	displaceLinear = displaceLinear * displaceLinear * displaceLinear;
	if (Math.abs(displacePower) < 0.0625) {
		displacePower = 0.0625;
	}
	const displaceK = displaceLinear === 0 ? 1 :
		(displaceLinear - 1) / (displaceLinear ** displacePower - 1);

	for (let i = 0; i < MAX_ATTRACTORS; i++) {
		let x, y, column, row, pointStrength, bin;

		// X-position
		let p = random.next() * xDistTotal;
		let offset = random.next();
		if (xDistTotal === 0) {
			// Fixed position in centre
			x = 0.5;
			column = Math.trunc(NUM_COLUMNS / 2);
		} else {
			// Randomized x-position
			column = NUM_COLUMNS - 1;
			while (column > 0 && xDist[column - 1] >= p) {
				column--;
			}
			x = (column + offset) / NUM_COLUMNS;
		}

		// Y-position
		p = random.next() * yDistTotal;
		offset = random.next();
		if (yDistTotal === 0) {
			// Fixed position in centre
			y = 0.5;
			row = Math.trunc(NUM_ROWS / 2);
		} else {
			// Randomized y-position
			row = NUM_ROWS - 1;
			while (row > 0 && yDist[row - 1] >= p) {
				row--;
			}
			y = (row + offset) / NUM_ROWS;
		}
		grid[column][row].push(x, y);

		// Strength
		p = random.next() * strengthDistTotal;
		offset = random.next();
		if (strengthDistTotal === 0) {
			// Fixed strength, all points equal
			pointStrength = 0.5;
		} else {
			// Randomized strength
			bin = NUM_STRENGTHS - 1;
			while (bin > 0 && strengthDist[bin - 1] >= p) {
				bin--;
			}
			pointStrength = (bin + offset) / NUM_STRENGTHS;
		}
		pointStrength = Math.max(pointStrength, this.minStrength);
		if (random.next() < this.repelProbability) {
			pointStrength = -pointStrength;
		}
		strength[i] = pointStrength;

		// Saturation
		p = random.next() * saturationsDistTotal;
		offset = random.next();
		if  (saturationsDistTotal === 0) {
			// Fixed saturation, fully saturated
			saturations[i] = 1;
		} else {
			// Random saturation
			bin = NUM_SATURATIONS - 1;
			while (bin > 0 && saturationsDist[bin - 1] >= p) {
				bin--;
			}
			saturations[i] = (bin + offset) / NUM_SATURATIONS;
		}

		// Displacement amount
		p = random.next() * displaceDistTotal;
		offset = random.next();
		if (displaceDistTotal === 0) {
			// Fixed displacement amount
			displaceAmount[i] = 0.15;
		} else {
			// Randomized displacement amount
			bin = NUM_DISPLACEMENTS - 1;
			while (bin > 0 && displaceDist[bin - 1] >= p) {
				bin--;
			}
			let displacePortion = (bin + offset) / NUM_DISPLACEMENTS;
			if (displacePortion > displaceLinear) {
				displacePortion = displaceK * displacePortion ** displacePower + 1 - displaceK;
			}
			displaceAmount[i] = displacePortion;
		}

		// Displacement angle
		if (displaceAngleDistTotal === 0) {
			// Fixed angles, horizontal left or right
			displaceGradient[i] = 0;
			if (random.next() >= 0.5) {
				displaceAmount[i] *= -1;
			}
		} else {
			// Randomized angles
			p = random.next() * displaceAngleDistTotal;
			bin = NUM_ANGLES - 1;
			while (bin > 0 && displaceAngleDist[bin - 1] >= p) {
				bin--;
			}
			let displaceAngle = (bin + random.next()) / NUM_ANGLES;
			displaceAngle = displaceAngle * TWO_PI - Math.PI / 6;
			displaceGradient[i] = Math.tan(displaceAngle);
			if (displaceAngle > Math.PI / 2 && displaceAngle < 1.5 * Math.PI) {
				displaceAmount[i] *= -1;
			}
		}
	}

	let n = 0;
	for (let i = 0; i < NUM_COLUMNS; i++) {
		for (let j = 0; j < NUM_ROWS; j++) {
			const jPrime = i % 2 === 0 ? j : NUM_ROWS - 1 - j;
			const cell = grid[i][jPrime];
			for (let k = 0; k < cell.length; k += 2) {
				positionX[n] = cell[k];
				positionY[n] = cell[k + 1];
				n++;
			}
		}
	}
}

Contours.prototype.animatable = {
	continuous: [
		'positionX', 'positionY', 'strength', 'fieldConstant', 'fieldExponent',
		'sineFrequency', 'divisor', 'base', 'saturations', 'minSaturation',
		'maxSaturation', 'lighting', 'backgroundSaturation', 'contrast', 'baseColor',
		'baseIntensity', 'baseScale', 'baseBrightness', 'baseSaturation', 'minkowskiOrder',
		'distanceWeight', 'hueFrequency', 'hueRotation', 'waveHue', 'waveLightness',
		'minLightness', 'maxLightness', 'backgroundOpacity', 'colorPortion', 'sharpness',
		'numAttractors', 'explosion', 'minDotSize', 'maxDotSize', 'dotColors',
		'displaceAmount', 'displaceGradient', 'displaceMax'
	],
	stepped: [
		'step',
	]
}
