const AngularHueMode = Object.freeze({
	RED: 0,
	WHITE: 1,
	GRAY: 2,
	BLACK: 3,
});

export default function Phyllotaxis() {
	const me = this;
	this.title = 'Phyllotaxis';
	this.helpFile = 'help/phyllotaxis.html';

	const scaleFactor = Math.min(screen.width, screen.height) / 1080;
	this.scale = Math.round(scaleFactor * 20);
	this.petalSize = Math.round(scaleFactor * 30) / 2;

	this.optionsDocument = downloadFile('phyllotaxis.html', 'document').then(function (optionsDoc) {
		optionsDoc.getElementById('phyllotaxis-scale').value = me.scale;
		optionsDoc.getElementById('phyllotaxis-petal-size').value = me.petalSize;

		const colorFieldSelect = optionsDoc.getElementById('phyllotaxis-color-field');
		const angleModeSelect = optionsDoc.getElementById('phyllotaxis-angle-mode');
		const colorModInput = optionsDoc.getElementById('phyllotaxis-color-mod');
		const colorStepInput = optionsDoc.getElementById('phyllotaxis-color-step');
		const continuousColorInput = optionsDoc.getElementById('phyllotaxis-continuous-mod');

		function fullRedraw() {
			generateBackground(0);
		}

		function fullRecolor() {
			generateBackground(2);
		}

		const radiusSlider = optionsDoc.getElementById('phyllotaxis-radius');

		optionsDoc.getElementById('phyllotaxis-radius-preset').addEventListener('input', function (event) {
			const value = this.value;
			const isCustom = value === 'custom';
			$(radiusSlider).collapse(isCustom ? 'show' : 'hide');
			me.radiusPreset = value;
			if (isCustom) {
				me.radius = parseFloat(radiusSlider.value);
			}
			generateBackground(0);
		});

		radiusSlider.addEventListener('input', function (event) {
			me.radius = parseFloat(this.value);
			generateBackground(1);
		});
		radiusSlider.addEventListener('pointerup', fullRedraw);
		radiusSlider.addEventListener('keyup', fullRedraw);

		optionsDoc.getElementById('phyllotaxis-max-petals').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0) {
				me.maxPetals = value * 1000;
				generateBackground(0);
			}
		});

		const initialNumeratorsInput = optionsDoc.getElementById('phyllotaxis-initial-numerators');
		const initialDenominatorsInput = optionsDoc.getElementById('phyllotaxis-initial-denominators');
		const periodicNumeratorsInput = optionsDoc.getElementById('phyllotaxis-periodic-numerators');
		const periodicDenominatorsInput = optionsDoc.getElementById('phyllotaxis-periodic-denominators');

		function updateFraction(event) {
			const regExp = /,\s*/;
			if (initialNumeratorsInput.value.trim() === '') {
				me.initialNumerators = [];
			} else {
				me.initialNumerators = initialNumeratorsInput.value.split(regExp).map(parseFloat);
			}
			if (initialDenominatorsInput.value.trim() === '') {
				me.initialDenominators = [];
			} else {
				me.initialDenominators = initialDenominatorsInput.value.split(regExp).map(parseFloat);
			}
			if (periodicNumeratorsInput.value.trim() === '') {
				me.periodicNumerators = [];
			} else {
				me.periodicNumerators = periodicNumeratorsInput.value.split(regExp).map(parseFloat);
			}
			if (periodicDenominatorsInput.value.trim() === '') {
				me.periodicDenominators = [];
			} else {
				me.periodicDenominators = periodicDenominatorsInput.value.split(regExp).map(parseFloat);
			}
			me.normalizeFractions();
			if (!/,\s*$/.test(this.value)) {
				generateBackground(0);
			}
		}

		initialDenominatorsInput.addEventListener('input', updateFraction);
		initialDenominatorsInput.addEventListener('input', updateFraction);
		periodicNumeratorsInput.addEventListener('input', updateFraction);
		periodicDenominatorsInput.addEventListener('input', updateFraction);

		optionsDoc.getElementById('phyllotaxis-angle-offset').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				me.angleOffset = value / 100;
				generateBackground(0);
			}
		});

		const partialPetalsSlider = optionsDoc.getElementById('phyllotaxis-partial-petals');
		partialPetalsSlider.addEventListener('input', function (event) {
			me.partialPetals = parseFloat(this.value);
			generateBackground(2);
		});
		partialPetalsSlider.addEventListener('pointerup', fullRecolor);
		partialPetalsSlider.addEventListener('keyup', fullRecolor);

		optionsDoc.getElementById('phyllotaxis-direction').addEventListener('input', function (event) {
			me.direction = parseInt(this.value);
			generateBackground(0);
		});

		optionsDoc.getElementById('phyllotaxis-spread').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				me.spread = value;
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('phyllotaxis-exponent').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value > 0) {
				me.exponent = value;
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('phyllotaxis-scale').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value > 0) {
				me.scale = value;
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('phyllotaxis-aspect-ratio').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value > 0) {
				me.aspectRatio = value;
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('phyllotaxis-start').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0) {
				me.start = value;
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('phyllotaxis-skip').addEventListener('input', function (event) {
			const value = parseInt(this.value);
			if (value > 0) {
				me.skip = value;
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('phyllotaxis-wobble-size').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				me.wobbleSize = value;
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('phyllotaxis-wobble-frequency').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				me.wobbleFrequency = value;
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('phyllotaxis-petal-size').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value > 0) {
				me.petalSize = value;
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('phyllotaxis-petal-stretch').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value > 0) {
				me.petalStretch = value;
				generateBackground(0);
				const rotatable = value !== 1 || me.petalShape !== 'e';
				$('#phyllotaxis-rotation-row').collapse(rotatable ? 'show' : 'hide');
			}
		});

		optionsDoc.getElementById('phyllotaxis-petal-enlarge').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				me.petalEnlargement = parseFloat(this.value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('phyllotaxis-petal-variation').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value <= 100) {
				me.petalVariation = value;
				generateBackground(0);
				hasRandomness(me.hasRandomness());
			}
		});

		const petalRotationSlider = optionsDoc.getElementById('phyllotaxis-petal-rotation');
		petalRotationSlider.addEventListener('input', function (event) {
			me.petalRotation = parseFloat(this.value) * Math.PI;
			generateBackground(1);
		});
		petalRotationSlider.addEventListener('pointerup', fullRecolor);
		petalRotationSlider.addEventListener('keyup', fullRecolor);

		optionsDoc.getElementById('phyllotaxis-stack-increasing').addEventListener('input', function (event) {
			me.stackIncreasing = this.checked;
			generateBackground(2);
		});

		colorFieldSelect.addEventListener('input', function (event) {
			const field = this.value;
			if (field === 'all') {
				me.angleMode.fill(angleModeSelect.value);
				for (let i = 1; i <= 3; i++) {
					if (me.colorMod[i] !== me.colorMod[0]) {
						colorModInput.value = '';
						break;
					}
				}
				for (let i = 1; i <= 3; i++) {
					if (me.colorStep[i] !== me.colorStep[0]) {
						colorStepInput.value = '';
						break;
					}
				}
				me.continuousMod.fill(Number(continuousColorInput.checked));
			} else {
				const fieldNum = parseInt(field);
				angleModeSelect.value = me.angleMode[fieldNum];
				colorModInput.value = me.colorMod[fieldNum];
				colorStepInput.value = me.colorStep[fieldNum];
				continuousColorInput.checked = Boolean(me.continuousMod[fieldNum]);
			}
		});

		angleModeSelect.addEventListener('input', function (event) {
			const value = this.value;
			const field = colorFieldSelect.value;
			if (field === 'all') {
				me.angleMode.fill(value);
			} else {
				me.angleMode[parseInt(field)] = value;
			}
			generateBackground(2);
		});

		colorModInput.addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value > 0) {
				const field = colorFieldSelect.value;
				if (field === 'all') {
					me.colorMod.fill(value);
				} else {
					me.colorMod[parseInt(field)] = value;
				}
				generateBackground(2);
			}
		});

		colorStepInput.addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value > 0) {
				const field = colorFieldSelect.value;
				if (field === 'all') {
					me.colorStep.fill(value);
				} else {
					me.colorStep[parseInt(field)] = value;
				}
				generateBackground(2);
			}
		});

		continuousColorInput.addEventListener('input', function (event) {
			const value = Number(this.checked);
			const field = colorFieldSelect.value;
			if (field === 'all') {
				me.continuousMod.fill(value);
			} else {
				me.continuousMod[parseInt(field)] = value;
			}
			generateBackground(2);
		});

		const hueMinInput = optionsDoc.getElementById('phyllotaxis-hue-min');
		const hueMaxInput = optionsDoc.getElementById('phyllotaxis-hue-max');
		const hueModeInput = optionsDoc.getElementById('phyllotaxis-hue-mode');

		hueMinInput.addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			me.hueMin = value;
			if (hueModeInput.value === 'c') {
				me.hueMax = value;
				hueMaxInput.value = value;
			}
			if (me.petalShape !== 'i') {
				generateBackground(3);
			}
		});
		hueMinInput.addEventListener('pointerup', fullRecolor);
		hueMinInput.addEventListener('keyup', fullRecolor);

		hueMaxInput.addEventListener('input', function (event) {
			me.hueMax = parseFloat(this.value);
			if (me.petalShape !== 'i') {
				generateBackground(3);
			}
		});
		hueMaxInput.addEventListener('pointerup', fullRecolor);
		hueMaxInput.addEventListener('keyup', fullRecolor);


		const hueModSplitInput = optionsDoc.getElementById('phyllotaxis-hue-mod-split');
		const hueModeIntensityInput = optionsDoc.getElementById('phyllotaxis-hue-mode-intensity');

		hueModeInput.addEventListener('input', function (event) {
			const mode = this.value;
			const isConstant = mode === 'c';
			const isImage = mode === 'i';
			$('#phyllotaxis-hue-min').collapse(isImage ? 'hide' : 'show');
			$('#phyllotaxis-hue-max').collapse(isConstant || isImage ? 'hide' : 'show');
			let showAdvanced = false;
			if (mode[0] === 'a') {
				me.hueMode = mode[0];
				const angularMode = parseInt(mode[1]);
				if (angularMode > 0) {
					const modeNames = ['Red', 'Pale', 'Grey', 'Dark'];
					hueModSplitInput.labels[0].children[0].innerHTML = modeNames[angularMode];
					hueModeIntensityInput.labels[0].children[0].innerHTML = modeNames[angularMode];
					showAdvanced = true;
				}
				me.angularHueMode = angularMode;
			} else if (isConstant) {
				me.hueMax = me.hueMin;
				hueMaxInput.value = me.hueMin;
			} else {
				me.hueMode = mode;
			}
			if (!isConstant && !isImage && me.hueMin === me.hueMax) {
				me.hueMax = 360;
				hueMaxInput.value = 360;
			}
			$(hueModSplitInput.parentElement.parentElement).collapse(showAdvanced ? 'show' : 'hide');
			generateBackground(2);
			hasRandomness(me.hasRandomness());
		});


		hueModSplitInput.addEventListener('input', function (event) {
			me.hueModSplit = parseFloat(this.value);
			if (me.petalShape !== 'i') {
				generateBackground(3);
			}
		});
		hueModSplitInput.addEventListener('pointerup', fullRecolor);
		hueModSplitInput.addEventListener('keyup', fullRecolor);

		hueModeIntensityInput.addEventListener('input', function (event) {
			me.hueModeIntensity = parseFloat(this.value);
			if (me.petalShape !== 'i') {
				generateBackground(3);
			}
		});
		hueModeIntensityInput.addEventListener('pointerup', fullRecolor);
		hueModeIntensityInput.addEventListener('keyup', fullRecolor);

		const saturationMinInput = optionsDoc.getElementById('phyllotaxis-saturation-min');
		const saturationMaxInput = optionsDoc.getElementById('phyllotaxis-saturation-max');
		const saturationModeInput = optionsDoc.getElementById('phyllotaxis-saturation-mode');

		saturationMinInput.addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			me.saturationMin = value;
			if (saturationModeInput.value === 'c') {
				me.saturationMax = value;
				saturationMaxInput.value = value;
			}
			if (me.petalShape !== 'i') {
				generateBackground(3);
			}
		});
		saturationMinInput.addEventListener('pointerup', fullRecolor);
		saturationMinInput.addEventListener('keyup', fullRecolor);

		saturationMaxInput.addEventListener('input', function (event) {
			me.saturationMax = parseFloat(this.value);
			if (me.petalShape !== 'i') {
				generateBackground(3);
			}
		});
		saturationMaxInput.addEventListener('pointerup', fullRecolor);
		saturationMaxInput.addEventListener('keyup', fullRecolor);

		saturationModeInput.addEventListener('input', function (event) {
			const value = this.value;
			const isConstant = value === 'c';
			const isImage = value === 'i';
			$('#phyllotaxis-saturation-min').collapse(isImage ? 'hide' : 'show');
			$('#phyllotaxis-saturation-max').collapse(isConstant || isImage ? 'hide' : 'show');
			if (isConstant) {
				me.saturationMax = me.saturationMin;
				saturationMaxInput.value = me.saturationMin;
			} else {
				me.saturationMode = value;
				if (!isImage && me.saturationMin === me.saturationMax) {
					me.saturationMax = 0;
					saturationMaxInput.value = 0;
				}
			}
			generateBackground(2);
			hasRandomness(me.hasRandomness());
		});

		const lightnessMinInput = optionsDoc.getElementById('phyllotaxis-lightness-min');
		const lightnessMaxInput = optionsDoc.getElementById('phyllotaxis-lightness-max');
		const lightnessModeInput = optionsDoc.getElementById('phyllotaxis-lightness-mode');

		lightnessMinInput.addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			me.lightnessMin = value;
			if (lightnessModeInput.value === 'c') {
				me.lightnessMax = value;
				lightnessMaxInput.value = value;
			}
			if (me.petalShape !== 'i') {
				generateBackground(3);
			}
		});
		lightnessMinInput.addEventListener('pointerup', fullRecolor);
		lightnessMinInput.addEventListener('keyup', fullRecolor);

		lightnessMaxInput.addEventListener('input', function (event) {
			me.lightnessMax = parseFloat(this.value);
			if (me.petalShape !== 'i') {
				generateBackground(3);
			}
		});
		lightnessMaxInput.addEventListener('pointerup', fullRecolor);
		lightnessMaxInput.addEventListener('keyup', fullRecolor);

		lightnessModeInput.addEventListener('input', function (event) {
			const value = this.value;
			const isConstant = value === 'c';
			const isImage = value === 'i';
			$('#phyllotaxis-lightness-min').collapse(isImage ? 'hide' : 'show');
			$('#phyllotaxis-lightness-max').collapse(isConstant || isImage ? 'hide' : 'show');
			if (isConstant) {
				me.lightnessMax = me.lightnessMin;
				lightnessMaxInput.value = me.lightnessMin;
			} else {
				me.lightnessMode = value;
				if (!isImage && me.lightnessMin === me.lightnessMax) {
					me.lightnessMax = 0;
					lightnessMaxInput.value = 0;
				}
			}
			generateBackground(2);
			hasRandomness(me.hasRandomness());
		});

		const opacityMinInput = optionsDoc.getElementById('phyllotaxis-opacity-min');
		opacityMinInput.addEventListener('input', function (event) {
			me.opacityMin = parseFloat(this.value);
			generateBackground(3);
		});
		opacityMinInput.addEventListener('pointerup', fullRecolor);
		opacityMinInput.addEventListener('keyup', fullRecolor);

		const opacityMaxInput = optionsDoc.getElementById('phyllotaxis-opacity-max');
		opacityMaxInput.addEventListener('input', function (event) {
			me.opacityMax = parseFloat(this.value);
			generateBackground(3);
		});
		opacityMaxInput.addEventListener('pointerup', fullRecolor);
		opacityMaxInput.addEventListener('keyup', fullRecolor);

		optionsDoc.getElementById('phyllotaxis-opacity-mode').addEventListener('input', function (event) {
			const value = this.value;
			const isConstant = value === 'c';
			if (isConstant) {
				me.opacityMin = 1;
				me.opacityMax = 1;
			} else {
				me.opacityMode = value;
				if (me.opacityMin === me.opacityMax) {
					me.opacityMax = 0;
					opacityMaxInput.value = 0;
				}
			}
			$('#phyllotaxis-opacity-min, #phyllotaxis-opacity-max').collapse(isConstant ? 'hide' : 'show');
			generateBackground(2);
			hasRandomness(me.hasRandomness());
		});

		const polygonOptions = optionsDoc.querySelectorAll('.phyllotaxis-polygon-opts');
		function setShape(event) {
			const shape = this.value;
			const shapeIsImage = shape === 'i';
			if (me.petalShape === 'i' && !shapeIsImage) {
				if (me.hueMode === 'i') {
					me.hueMode = 'rad';
					me.hueMax = me.hueMin;
					hueModeInput.value = 'c';
					hueMaxInput.value = me.hueMin;
				}
				if (me.saturationMode === 'i') {
					me.saturationMode = 'rad';
					me.saturationMax = me.saturationMin;
					saturationModeInput.value = 'c';
					saturationMaxInput.value = me.saturationMin;
				}
				if (me.lightnessMode === 'i') {
					me.lightnessMode = 'rad';
					me.lightnessMax = me.lightnessMin;
					lightnessModeInput.value = 'c';
					lightnessMaxInput.value = me.lightnessMin;
				}
			}

			const rotatable = me.petalStretch !== 1 || shape !== 'e';
			$('#phyllotaxis-rotation-row').collapse(rotatable ? 'show' : 'hide');

			$('#phyllotaxis-hue-min, #phyllotaxis-saturation-min, #phyllotaxis-lightness-min').collapse(shapeIsImage ? 'hide' : 'show');
			for (let element of polygonOptions) {
				element.hidden = shapeIsImage;
			};
			hueModeInput.querySelector('[value="i"]').hidden = !shapeIsImage;
			saturationModeInput.querySelector('[value="i"]').hidden = !shapeIsImage;
			lightnessModeInput.querySelector('[value="i"]').hidden = !shapeIsImage;

			me.petalShape = shape;
			if (shapeIsImage) {
				$('#phyllotaxis-hue-max, #phyllotaxis-saturation-max, #phyllotaxis-lightness-max').collapse('hide');
				me.hueMode = 'i';
				hueModeInput.value = 'i';
				me.saturationMode = 'i';
				saturationModeInput.value = 'i';
				me.lightnessMode = 'i';
				lightnessModeInput.value = 'i';
				if (bgGeneratorImage.src === '') {
					document.getElementById('background-gen-image-upload').click();
				} else {
					generateBackground(2);
				}
			} else {
				generateBackground(2);
			}
		}

		for (let item of optionsDoc.querySelectorAll('input[name=phyllotaxis-petal-shape]')) {
			item.addEventListener('input', setShape);
		};

		const lightingInput = optionsDoc.getElementById('phyllotaxis-lighting');
		lightingInput.addEventListener('input', function (event) {
			me.lighting = parseFloat(this.value);
			generateBackground(3);
		});
		lightingInput.addEventListener('pointerup', fullRecolor);
		lightingInput.addEventListener('keyup', fullRecolor);

		const contrastInput = optionsDoc.getElementById('phyllotaxis-contrast');
		contrastInput.addEventListener('input', function (event) {
			me.contrast = Math.sqrt(parseFloat(this.value));
			generateBackground(3);
		});
		contrastInput.addEventListener('pointerup', fullRecolor);
		contrastInput.addEventListener('keyup', fullRecolor);

		const shadowAngleInput = optionsDoc.getElementById('phyllotaxis-shadow-angle');
		shadowAngleInput.addEventListener('input', function (event) {
			me.shadowAngle = (parseFloat(this.value) - 0.5) * Math.PI;
			generateBackground(3);
		});
		shadowAngleInput.addEventListener('pointerup', fullRecolor);
		shadowAngleInput.addEventListener('keyup', fullRecolor);

		const shadowBlurInput = optionsDoc.getElementById('phyllotaxis-shadow-blur');
		shadowBlurInput.addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0) {
				me.shadowBlur = value;
				generateBackground(3);
			}
		});
		shadowBlurInput.addEventListener('pointerup', fullRecolor);
		shadowBlurInput.addEventListener('keyup', fullRecolor);

		const shadowOffsetInput = optionsDoc.getElementById('phyllotaxis-shadow-offset');
		shadowOffsetInput.addEventListener('input', function (event) {
			me.shadowOffset = parseFloat(this.value);
			generateBackground(3);
		});
		shadowOffsetInput.addEventListener('pointerup', fullRecolor);
		shadowOffsetInput.addEventListener('keyup', fullRecolor);

		const spotOffsetInput = optionsDoc.getElementById('phyllotaxis-spot-offset');
		spotOffsetInput.addEventListener('input', function (event) {
			me.spotOffset = parseFloat(this.value);
			generateBackground(3);
		});
		spotOffsetInput.addEventListener('pointerup', fullRecolor);
		spotOffsetInput.addEventListener('keyup', fullRecolor);

		const shadowColorInput = optionsDoc.getElementById('phyllotaxis-shadow-color');
		shadowColorInput.addEventListener('input', function (event) {
			me.shadowIntensity = parseFloat(this.value);
			generateBackground(3);
		});
		shadowColorInput.addEventListener('pointerup', fullRecolor);
		shadowColorInput.addEventListener('keyup', fullRecolor);

		const outlineInput = optionsDoc.getElementById('phyllotaxis-outline');
		outlineInput.addEventListener('input', function (event) {
			me.strokeStyle = 'rgba(0, 0, 0, ' + this.value + ')';
			generateBackground(3);
		});
		outlineInput.addEventListener('pointerup', fullRecolor);
		outlineInput.addEventListener('keyup', fullRecolor);

		const centerInnerRadiusInput = optionsDoc.getElementById('phyllotaxis-center-inner-radius');
		centerInnerRadiusInput.addEventListener('input', function (event) {
			me.centerInnerRadius = parseFloat(this.value);
			generateBackground(3);
		});
		centerInnerRadiusInput.addEventListener('pointerup', fullRecolor);
		centerInnerRadiusInput.addEventListener('keyup', fullRecolor);

		const centerMidRadiusInput = optionsDoc.getElementById('phyllotaxis-center-mid-radius');
		centerMidRadiusInput.addEventListener('input', function (event) {
			me.centerMidRadius = parseFloat(this.value);
			generateBackground(3);
		});
		centerMidRadiusInput.addEventListener('pointerup', fullRecolor);
		centerMidRadiusInput.addEventListener('keyup', fullRecolor);

		const centerOuterRadiusInput = optionsDoc.getElementById('phyllotaxis-center-outer-radius');
		centerOuterRadiusInput.addEventListener('input', function (event) {
			me.centerOuterRadius = parseFloat(this.value);
			generateBackground(3);
		});
		centerOuterRadiusInput.addEventListener('pointerup', fullRecolor);
		centerOuterRadiusInput.addEventListener('keyup', fullRecolor);

		optionsDoc.getElementById('phyllotaxis-center-inner-color').addEventListener('input', function (event) {
			me.centerInnerColor = this.value;
			generateBackground(2);
		});

		optionsDoc.getElementById('phyllotaxis-center-mid-color').addEventListener('input', function (event) {
			me.centerMidColor = this.value;
			generateBackground(2);
		});

		return optionsDoc;
	});

	this.centerInnerRadius = 0.10;
	this.centerMidRadius = 0.4;
	this.centerOuterRadius = 0;
	this.centerInnerColor = '#003300';
	this.centerMidColor = '#008800';

	this.points = undefined;
	this.lastFullPetalR = undefined;
	this.radiusPreset = 'min';
	this.radius = 1;
	this.aspectRatio = 1;
	this.partialPetals = 0;
	this.direction = 1;

	this.exponent = 0.5;
	this.initialNumerators = [];
	this.initialDenominators = [];
	this.periodicNumerators = [1];
	this.periodicDenominators = [1];
	this.angleOffset = 0;
	this.spread = 1;
	this.start = 1;
	this.skip = 0;
	this.wobbleSize = 0;
	this.wobbleFrequency = 100;
	this.stackIncreasing = false;
	this.petalShape = 'e';
	this.petalEnlargement = 0;
	this.petalVariation = 0;
	this.petalStretch = 1;
	this.petalRotation = 0;
	this.maxPetals = 10000;
	this.strokeStyle = 'rgba(0, 0, 0, 0)';

	this.angleMode = new Array(4);
	this.angleMode.fill('t');
	this.colorMod = new Array(4);
	this.colorMod.fill(256);
	this.colorStep = new Array(4);
	this.colorStep.fill(1);
	this.continuousMod = new Array(4);
	this.continuousMod.fill(1);
	this.angularHueMode = AngularHueMode.RED;
	this.hueModeIntensity = 0.9;
	this.hueModSplit = 0.25;

	this.hueMin = 30;
	this.hueMax = 30;
	this.hueMode = 'c';	// constant

	this.saturationMin = 1;
	this.saturationMax = 1;
	this.saturationMode = 'c';

	this.lightnessMin = 0.5;
	this.lightnessMax = 0.5;
	this.lightnessMode = 'c';

	this.opacityMin = 1;
	this.opacityMax = 1;
	this.opacityMode = 'c';

	this.lighting = 0;
	this.contrast = 0;
	this.shadowIntensity = 1;
	this.shadowAngle = 0.25 * Math.PI;
	this.shadowBlur = 0;
	this.shadowOffset = 0;
	this.spotOffset = 0;

	this.spriteSheet = document.createElement('CANVAS');
}

Phyllotaxis.prototype.animatable = {
	continuous: [
		'angleOffset', 'radius', 'aspectRatio', 'partialPetals', 'exponent', 'spread',
		'scale', 'wobbleSize', 'wobbleFrequency',
		'petalSize', 'petalEnlargement', 'petalVariation', 'petalStretch', 'petalRotation',
		'colorMod', 'hueMin', 'hueMax', 'saturationMin',
		'saturationMax', 'lightnessMin', 'lightnessMax', 'opacityMin', 'opacityMax',
		'angularHueMode', 'continuousMod', 'hueModeIntensity', 'hueModSplit', 'colorStep',
		'lighting', 'contrast', 'shadowIntensity', 'shadowAngle', 'shadowBlur',
		'shadowOffset', 'spotOffset', 'strokeStyle', 'centerInnerRadius',
		'centerMidRadius', 'centerOuterRadius', 'centerInnerColor', 'centerMidColor'
	],
	stepped: [
		'initialNumerators', 'initialDenominators', 'periodicNumerators', 'periodicDenominators',
		'direction', 'skip', 'stackIncreasing', 'petalShape', 'angleMode',
		'hueMode', 'saturationMode', 'lightnessMode', 'opacityMode'
	],
	pairedStepped: [
		['maxPetals', 'start']	// start moves towards maxPetals
	]
};


function continuedFraction(numerators, denominators) {
	let value = 0;
	for (let i = denominators.length - 1; i >= 0; i--) {
		value = numerators[i] / (denominators[i] + value);
	}
	return value;
}

function periodicContinuedFraction(initialNumerators, initialDenominators, periodicNumerators, periodicDenominators) {
	const maxError = 1e-15;
	periodicNumerators = periodicNumerators.slice();
	periodicDenominators = periodicDenominators.slice();
	let period = periodicDenominators.length;

	// Collapse Zero rule http://www.maths.surrey.ac.uk/hosted-sites/R.Knott/Fibonacci/cfINTRO.html#section14.1.4
	while (period >= 2 && periodicDenominators[period - 1] === 0) {
		periodicNumerators.splice(period - 2, 2);
		periodicDenominators.splice(period - 2, 2);
		period -= 2;
	}

	let value;
	let newValue = continuedFraction(initialNumerators, initialDenominators);
	if (period == 0) {
		return newValue;
	}

	const numerators = initialNumerators.slice();
	const denominators = initialDenominators.slice();
	let i = 0;
	let j = 0;
	do {
		value = newValue;
		const newNumerator = periodicNumerators[i];
		if (newNumerator === 0) {
			break;
		}
		numerators.push(newNumerator);
		denominators.push(periodicDenominators[i]);
		j++
		i = j % period;
		newValue = continuedFraction(numerators, denominators);
	} while (!Number.isNaN(newValue) && Math.abs(newValue - value) >= maxError && j < 5000);
	return newValue;
}

Phyllotaxis.prototype.normalizeFractions = function () {
	const numInitialNum = this.initialNumerators.length;
	let numInitialDenom = this.initialDenominators.length;
	// Pad arrays
	if (numInitialDenom >= numInitialNum) {
		for (let i = numInitialNum; i < numInitialDenom; i++) {
			this.initialNumerators.push(1);
		}
	} else {
		for (let i = numInitialDenom; i < numInitialNum; i++) {
			this.initialDenominators.push(1);
		}
		numInitialDenom = numInitialNum;
	}
	// Remove NaNs
	let i = 0;
	while (i < numInitialDenom) {
		if (
			!Number.isFinite(this.initialNumerators[i]) ||
			!Number.isFinite(this.initialDenominators[i])
		) {
			this.initialNumerators.splice(i, 1);
			this.initialDenominators.splice(i, 1);
			numInitialDenom--;
		} else {
			i++;
		}
	}

	const numNumerators = this.periodicNumerators.length;
	let numDenominators = this.periodicDenominators.length;
	// Pad arrays
	if (numDenominators >= numNumerators) {
		for (let i = numNumerators; i < numDenominators; i++) {
			this.periodicNumerators.push(1);
		}
	} else {
		for (let i = numDenominators; i < numNumerators; i++) {
			this.periodicDenominators.push(1);
		}
		numDenominators = numNumerators;
	}
	// Remove NaNs
	i = 0;
	while (i < numDenominators) {
		if (
			!Number.isFinite(this.periodicNumerators[i]) ||
			!Number.isFinite(this.periodicDenominators[i])
		) {
			this.periodicNumerators.splice(i, 1);
			this.periodicDenominators.splice(i, 1);
			numDenominators--;
		} else {
			i++;
		}
	}
}

class Petal {
	constructor(r, theta, petalSize, n) {
		this.r = r;
		this.theta = theta;
		this.radius = petalSize;
		this.n = n;
	}
}

Phyllotaxis.prototype.angularColor = function (r, degrees, n, property, range, min) {
	const angleMode = this.angleMode[property];
	let mod = this.colorMod[property];
	let value;
	switch (angleMode) {
	case 't': 	// Theta
		value = degrees;
		break;
	case 'n': 	// n
		const step = this.colorStep[property];
		value = (n + this.start + mod * step - 1) / step;
		break;
	case 'd': 	// Difference
		value = degrees - r;
		break;
	}

	const hueMode = this.angularHueMode;
	const stepped = angleMode === 'n' || !this.continuousMod[property];
	let extraColors = 0;

	if (property === 0 &&  hueMode !== AngularHueMode.RED) {
		extraColors = this.hueModSplit * mod;
		if (extraColors > 509) {
			extraColors = 509;
		} else if (stepped) {
			extraColors = Math.round(extraColors);
		}
	}
	if (angleMode !== 'n') {
		mod = mod - extraColors;
	}

	let split1 = mod;
	value = value % (mod + extraColors);
	const step = 1 - this.continuousMod[property];
	value = step * Math.trunc(value) + (1 - step) * value;

	let length1 = extraColors / 2;
	let length2 = length1;
	let split2;
	if (stepped && (property !== 0 || hueMode !== AngularHueMode.RED)) {
		if (mod <= 1 && value < mod) {
			return [min, 0];
		}
		split1--;
		if (extraColors % 2 === 1) {
			length1 -= 0.5;
			length2 += 0.5;
		}
		split2 = split1 + length1;
		length1++;
		length2++;
	} else {
		split2 = split1 + length1;
	}
	if (value < mod) {
		return [min + value / split1 * range, 0];
	}

	let output, modification;
	if (value <= split2) {
		output = min + range;
		modification = (value - split1) / length1;
	} else {
		output = min;
		modification = 1 - (value - split2) / length2;
	}
	return [output, modification * this.hueModeIntensity];
};

Phyllotaxis.prototype.steppedColor = function (property, value) {
	if (this.continuousMod[property]) {
		return value;
	} else {
		const steps = this.colorMod[property];
		if (steps <= 1) {
			return 0;
		} else {
			return Math.trunc(value * steps) / (steps - 1);
		}
	}
}

/**
 *	Preview levels:
 *		0	Produce a full and accurate drawing.
 *		1	Draw only a limited number of petals.
 *		2	Don't recalculate the petal positions and sizes but redraw all of them.
 *		3	Don't recalculate the petal positions and sizes and redraw only a limited number of them.
 */
Phyllotaxis.prototype.generate = function* (context, canvasWidth, canvasHeight, preview) {
	const aspectRatio = this.aspectRatio;
	const hypotenuse = Math.hypot(canvasWidth / aspectRatio, canvasHeight) / 2;
	let maxR;
	if (this.radiusPreset === 'custom') {
		maxR = this.radius * hypotenuse;
	} else {
		maxR = Math[this.radiusPreset](canvasWidth / aspectRatio, canvasHeight) / 2;
	}

	const petalStretch = this.petalStretch;
	const petalDistortion = aspectRatio >= 1 ? petalStretch : 1 / petalStretch;

	if (preview < 2 || this.points === undefined) {
		let angleFraction = periodicContinuedFraction(
			this.initialNumerators, this.initialDenominators,
			this.periodicNumerators, this.periodicDenominators
		);
		angleFraction += this.angleOffset;
		const angle = angleFraction * TWO_PI;
		const exponent = this.exponent;
		const scale = this.scale ** (exponent / 0.5) / (maxR ** (2 * exponent - 1));
		const petalSize = this.petalSize;
		const petalEnlargement = this.petalEnlargement;
		const petalVariation = this.petalVariation * this.petalVariation / 10000;
		const bidirectional = this.direction === 0;
		const direction = bidirectional ? 1 : this.direction;
		const maxPetals = preview === 1 ? Math.min(benchmark / 2, this.maxPetals) : this.maxPetals;

		this.points = [];
		let n = this.start;
		let numPetals = n;
		let r = scale * n ** exponent;
		let skip = this.skip;
		if (skip === 1) {
			skip = 0;
		}

		let currentPetalSize;
		if (petalEnlargement >= 0) {
			currentPetalSize = Math.max(petalSize, petalEnlargement * Math.sqrt(r));
		} else {
			currentPetalSize = Math.max(0.5, petalSize + petalEnlargement * Math.sqrt(r));
		}

		while (numPetals < maxPetals && r < maxR) {
			const phi = direction * n * angle;
			if (numPetals % skip !== skip - 1) {
				let thisPetalSize = currentPetalSize;
				if (petalVariation !== 0) {
					thisPetalSize = thisPetalSize * (1 - petalVariation * random.next());
				}
				if (thisPetalSize >= 0.5) {
					if (r + thisPetalSize * petalDistortion <= maxR) {
						this.lastFullPetalR = r;
					}
					this.points.push(new Petal(r, phi, thisPetalSize, n));
					if (bidirectional) {
						this.points.push(new Petal(r, -phi, thisPetalSize, n));
					}
				}
			}
			unitsProcessed++;
			numPetals++;
			const inc = r === 0 ? 1 : 1 / ((r / TWO_PI) ** (1 - this.spread));
			n += inc;
			r = scale * n ** exponent;
			if (petalEnlargement >= 0) {
				currentPetalSize = Math.max(petalSize, petalEnlargement * Math.sqrt(r));
			} else {
				currentPetalSize = Math.max(0.5, petalSize + petalEnlargement * Math.sqrt(r));
			}
		}
	}

	let numPoints = this.points.length;
	if (numPoints === 0) {
		return;
	}
	if (preview >= 3) {
		numPoints = Math.min(numPoints, benchmark);
	}
	const lastR = this.points[numPoints - 1].r;
	const zoom = (preview & 1) === 0 ? 1 : maxR / lastR;
	const lastRSquared = lastR === 0 ? 1 : lastR * lastR;
	const wobbleSize = this.wobbleSize * canvasHeight / 1000;
	const stacking = this.stackIncreasing ? 1 : -1;

	const petalShape = this.petalShape;
	const strokeStyle = this.strokeStyle;
	const fillRadius = petalShape === 'r' ? Math.SQRT2 : 1;

	const hueRange = this.hueMax - this.hueMin;
	const hueMode = this.angularHueMode;
	let hueModeFraction = hueMode % 1;
	if (hueModeFraction === 0 && hueMode > 0) {
		hueModeFraction = 1;
	}
	const saturationRange = this.saturationMax - this.saturationMin;
	const lightnessRange = this.lightnessMax - this.lightnessMin;
	const baseOpacity = context.globalAlpha;
	const opacityRange = this.opacityMax - this.opacityMin;
	const contrast = this.lighting === 1  || petalShape === 'i' ? 0 : this.contrast;
	const shadowOffset = this.shadowOffset * (petalStretch >= 1 ? 1 : petalStretch);
	const shadowAngle = this.shadowAngle;
	let cosShadowAngle = 0, sinShadowAngle = 0;
	if (shadowOffset > 0) {
		cosShadowAngle = Math.cos(shadowAngle);
		sinShadowAngle = Math.sin(shadowAngle);
	}
	const spotOffset = this.spotOffset;

	let image, imageAspect, applyFilters, hueVaries, saturationVaries, lightnessVaries;
	if (petalShape === 'i') {
		const imageWidth = bgGeneratorImage.width;
		const imageHeight = bgGeneratorImage.height;
		imageAspect = imageHeight / imageWidth;
		applyFilters = preview === 0 || preview === 2;
		hueVaries = this.hueMode !== 'i';
		saturationVaries = this.saturationMode !== 'i';
		lightnessVaries = this.lightnessMode !== 'i';
		if (hueVaries) {
			this.spriteSheet.width = imageWidth;
			this.spriteSheet.height = imageHeight;
			const spriteContext = this.spriteSheet.getContext('2d');
			spriteContext.filter = 'url("filters.svg#green")';
			spriteContext.drawImage(bgGeneratorImage, 0, 0);
			image = this.spriteSheet;
		} else {
			image = bgGeneratorImage;
		}
	}

	context.translate(canvasWidth / 2, canvasHeight / 2);

	const centerOuterRadius = this.centerOuterRadius * hypotenuse;
	if (centerOuterRadius > 0) {
		context.save();
		context.scale(aspectRatio, 1);
		context.beginPath();
		context.arc(0, 0, centerOuterRadius, 0, TWO_PI);
		const gradient = context.createRadialGradient(0, 0, 0, 0, 0, centerOuterRadius);
		const innnerColor = this.centerInnerColor;
		gradient.addColorStop(0, innnerColor);
		const midRadius = this.centerMidRadius;
		const innerRadius = this.centerInnerRadius * midRadius;
		gradient.addColorStop(innerRadius, innnerColor);
		const midColor = this.centerMidColor;
		gradient.addColorStop(midRadius, midColor);
		const [r, g, b] = parseColor(midColor)[1];
		gradient.addColorStop(1, rgba(r, g, b, 0));
		context.fillStyle = gradient;
		context.fill();
		context.restore();
	}

	const stroke = petalShape !== 'i' && strokeStyle !== 'rgba(0, 0, 0, 0)';
	context.strokeStyle = strokeStyle;
	context.shadowColor = rgba(0, 0, 0, this.shadowIntensity);
	context.shadowBlur = this.shadowBlur;
	const partialPetals = this.partialPetals;
	const lastFullPetalR = this.lastFullPetalR;
	const maxDrawnR = lastR * partialPetals + lastFullPetalR * (1 - partialPetals);

	for (let i = stacking > 0 ? 0 : numPoints - 1; i >= 0 && i < numPoints; i += stacking) {
		const point = this.points[i];
		const r = point.r;
		let fade = 1;
		if (r > lastFullPetalR) {
			if (r >= maxDrawnR) {
				// opacity = 0
				continue;
			}
			fade = 1 - (r - lastFullPetalR) / (maxDrawnR - lastFullPetalR);
			context.shadowColor = rgba(0, 0, 0, this.shadowIntensity * fade);
		}
		const theta = point.theta;
		const petalSize = zoom * point.radius;
		const x = zoom * r * aspectRatio * Math.cos(theta);
		const y = zoom * r * Math.sin(theta) +
			wobbleSize * Math.sin(point.n * this.wobbleFrequency / 100);

		const degrees = Math.abs(theta) / Math.PI * 180;
		const radialValue = (r / maxDrawnR + (r * r) / lastRSquared) / 2;
		let hue = this.hueMin;
		let saturation = this.saturationMin;
		let lightness = this.lightnessMin;
		let opacity = this.opacityMin;
		let colorModification = 0;

		switch (this.hueMode) {
		case 'a':
			[hue, colorModification] = this.angularColor(r, degrees, i, 0, hueRange, this.hueMin);
			break;
		case 'rad':
			hue = this.hueMin + hueRange * this.steppedColor(0, radialValue);
			break;
		case 'rnd':
			hue = this.hueMin + hueRange * this.steppedColor(0, random.next());
			break;
		}

		switch (this.saturationMode) {
		case 'a':
			saturation = this.angularColor(r, degrees, i, 1, saturationRange, this.saturationMin)[0];
			break;
		case 'rad':
			saturation = this.saturationMin + saturationRange * this.steppedColor(1, radialValue);
			break;
		case 'rnd':
			saturation = this.saturationMin + saturationRange * this.steppedColor(1, random.next());
			break;
		}

		switch (this.lightnessMode) {
		case 'a':
			lightness = this.angularColor(r, degrees, i, 2, lightnessRange, this.lightnessMin)[0];
			break;
		case 'rad':
			lightness = this.lightnessMin + lightnessRange * this.steppedColor(2, radialValue);
			break;
		case 'rnd':
			lightness = this.lightnessMin + lightnessRange * this.steppedColor(2, random.next());
			break;
		}

		switch (this.opacityMode) {
		case 'a':
			opacity = this.angularColor(r, degrees, i, 3, opacityRange, this.opacityMin)[0];
			break;
		case 'rad':
			opacity = this.opacityMin + opacityRange * this.steppedColor(3, radialValue);
			break;
		case 'rnd':
			opacity = this.opacityMin + opacityRange * this.steppedColor(3, random.next());
			break;
		}

		if (this.hueMode === 'a') {
			if (hueMode <= AngularHueMode.WHITE) {

				lightness =
					(colorModification + (1 - colorModification) * lightness) * hueModeFraction +
					lightness * (1 - hueModeFraction);

			} else if (hueMode <= AngularHueMode.GRAY) {

				saturation =
					saturation * (1 - colorModification) * hueModeFraction +
					saturation * (1 - hueModeFraction);

				lightness =
					lightness * hueModeFraction +
					(colorModification + (1 - colorModification) * lightness) * (1 - hueModeFraction);

			} else {	// Black

				saturation =
					saturation * hueModeFraction +
					saturation * (1 - colorModification) * (1 - hueModeFraction);

				lightness =
					lightness * (1 - colorModification) * hueModeFraction +
					lightness * (1 - hueModeFraction);

			}
		}

		const petalRotation = theta + HALF_PI + this.petalRotation;
		const shadowR = petalSize * shadowOffset;
		context.shadowOffsetX = shadowR * cosShadowAngle;
		context.shadowOffsetY = shadowR * sinShadowAngle;

		const innerColor = hsla(hue, saturation, lightness, opacity * fade);
		if (contrast === 0) {
			context.fillStyle = innerColor;
		} else {
			let spotX = 0, spotY = 0;
			if (spotOffset > 0) {
				spotX = spotOffset * petalSize * Math.cos(-HALF_PI - shadowAngle - petalRotation);
				spotY = spotOffset * petalSize * Math.sin(-HALF_PI - shadowAngle - petalRotation);
			}
			const gradient = context.createRadialGradient(spotX, spotY, 0, 0, 0, petalSize * fillRadius);
			const outerColor = hsla(hue, saturation, lightness * (1 - this.contrast), opacity * fade);
			gradient.addColorStop(1, outerColor);
			gradient.addColorStop(this.lighting, innerColor);
			context.fillStyle = gradient;
		}

		context.save();
		context.translate(x, y);
		context.rotate(petalRotation);

		switch (petalShape) {
		case 'e':	// Ellipse
			context.scale(1, petalStretch);
			context.beginPath();
			context.arc(0, 0, petalSize, 0, TWO_PI);
			context.fill();
			break;
		case 'r': // Rectangle
			context.scale(1, petalStretch);
			context.beginPath();
			context.rect(-petalSize, -petalSize, petalSize * 2, petalSize * 2);
			context.fill();
			break;
		case 'i':	// Image
			const imageResizedWidth = 2 * petalSize;
			const imageResizedHeight = 2 * petalSize * petalStretch * imageAspect;
			let filter = '';
			if (applyFilters) {
				if (hueVaries) {
					filter += 'hue-rotate(' + (hue - 120) + 'deg) ';
				}
				if (saturationVaries) {
					filter += 'saturate(' + saturation + ') ';
				}
				if (lightnessVaries) {
					const brightness = lightness * 2;
					filter += 'brightness(' + brightness + ') ';
				}
			}
			if (filter !== '') {
				context.filter = filter;
			}
			context.globalAlpha = baseOpacity * opacity * fade;
			context.drawImage(image, -imageResizedWidth / 2, -imageResizedHeight / 2, imageResizedWidth, imageResizedHeight);
		}
		if (stroke) {
			context.shadowOffsetX = 0;
			context.shadowOffsetY = 0;
			context.stroke();
		}
		context.restore();
		if (preview < 3) {
			unitsProcessed++;
			if (unitsProcessed >= benchmark) {
				yield;
			}
		}
	}
};


Phyllotaxis.prototype.hasRandomness = function () {
	return this.petalVariation > 0 ||
		this.hueMode === 'rnd' || this.saturationMode === 'rnd' ||
		this.lightnessMode === 'rnd' || this.opacityMode === 'rnd';
}
