export default function Contours() {
	const me = this;
	this.title = 'Contours';
	this.isShader = true;
	this.helpFile = 'help/contours.html';
	this.backgroundColor = [0, 0, 0];

	const maxAttractors = 50;
	this.numAttractors = Math.min(Math.round((window.innerWidth * window.innerHeight) / (800 * 600) * 10), maxAttractors);

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

		optionsDoc.getElementById('force-overall-saturation').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0 && value <= 1) {
				setBgProperty(me, 'overallSaturation', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('force-sine-power').addEventListener('input', setNumericProperty('sinePower'));

		optionsDoc.getElementById('force-hue-frequency').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0) {
				setBgProperty(me, 'hueFrequency', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('force-wave-hue').addEventListener('input', setNumericProperty('waveHue'));

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
				if (value === 1) {
					value = 0.99;
				}
				setBgProperty(me, 'sharpness', value);
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
			if (value <= 1) {
				setBgProperty(me, 'waveLightness', value);
				generateBackground(0);
			}
		});

		const coloringInput = optionsDoc.getElementById('force-base-intensity');
		coloringInput.addEventListener('input', setSliderProperty('baseIntensity'));
		coloringInput.addEventListener('pointerup', fullRedraw);
		coloringInput.addEventListener('keyup', fullRedraw);

		const opacityInput = optionsDoc.getElementById('force-background-opacity');
		opacityInput.addEventListener('input', setSliderProperty('backgroundOpacity'));
		opacityInput.addEventListener('pointerup', fullRedraw);
		opacityInput.addEventListener('keyup', fullRedraw);

		const baseColorInput = optionsDoc.getElementById('force-base-color');
		baseColorInput.addEventListener('input', setSliderProperty('baseColor'));
		baseColorInput.addEventListener('pointerup', fullRedraw);
		baseColorInput.addEventListener('keyup', fullRedraw);

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

		const numAttractorsInput = optionsDoc.getElementById('force-num-attractors');
		numAttractorsInput.value = me.numAttractors;
		numAttractorsInput.addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0 && value <= maxAttractors) {
				setBgProperty(me, 'numAttractors', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('force-explosion').addEventListener('input', setNumericProperty('explosion'));

		return optionsDoc;
	});

	const positionX = new Array(maxAttractors);
	const positionY = new Array(maxAttractors);
	const strength = new Array(maxAttractors);
	const saturations = new Array(maxAttractors);
	saturations.fill(1);
	for (let i = 0; i < maxAttractors; i++) {
		positionX[i] = Math.random();
		positionY[i] = Math.random();
		strength[i] = Math.random();
	}
	this.explosion = 1;
	this.positionX = positionX;
	this.positionY = positionY;
	this.strength = strength;
	this.saturations = saturations;

	this.fieldConstant = 100;
	this.fieldExponent = 2;
	this.divisor = 100;
	this.base = 2.8;
	this.sineFrequency = 1;
	this.sinePower = 1;	// Multiplied by 2 in WebGL

	this.minkowskiOrder = 2;
	this.distanceWeight = 0; // Canberra distance

	this.hueFrequency = 0;
	this.hueRotation = 0;
	this.waveHue = 0;

	this.overallSaturation = 1;
	this.backgroundSaturation = 1;

	this.maxLightness = 0.4;
	this.minLightness = 0;
	this.waveLightness = 1;
	this.contrast = 0;

	this.colorPortion = 0.5;
	this.sharpness = 0;

	this.baseColor = 0;
	this.baseIntensity = 0;
	this.baseScale = 20;
	this.backgroundOpacity = 0;
	this.baseBrightness = [1, 1, 1, 1];

	this.minDotSize = 5;
	this.maxDotSize = this.minDotSize;
	this.dotColor = [1/6, 1, 0.5, 1];	// HSLA
}

Contours.prototype.animatable = {
	continuous: [
		'positionX', 'positionY', 'strength', 'fieldConstant', 'fieldExponent',
		'sinePower', 'sineFrequency',
		'divisor', 'base', 'saturations', 'overallSaturation', 'backgroundSaturation',
		'contrast', 'baseColor', 'baseIntensity', 'baseScale', 'baseBrightness',
		'minkowskiOrder', 'distanceWeight',
		'hueFrequency', 'hueRotation', 'waveHue',
		'waveLightness', 'minLightness', 'maxLightness', 'backgroundOpacity',
		'colorPortion', 'sharpness', 'numAttractors', 'explosion',
		'minDotSize', 'maxDotSize', 'dotColor',
	],
}
