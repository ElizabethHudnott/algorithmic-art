export default function ForceLines() {
	const me = this;
	this.title = 'Force Lines';
	this.isShader = true;

	const maxAttractors = 30;

	this.optionsDocument = downloadFile('force-lines.html', 'document').then(function (optionsDoc) {

		optionsDoc.getElementById('force-field-constant').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				setBgProperty(me, 'fieldConstant', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('force-divisor').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				setBgProperty(me, 'divisor', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('force-base').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				setBgProperty(me, 'base', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('force-field-exponent').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				setBgProperty(me, 'fieldExponent', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('force-sine-power').addEventListener('input', function (event) {
			const value = parseInt(this.value);
			if (Number.isFinite(value)) {
				setBgProperty(me, 'sinePower', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('force-hue-frequency').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0) {
				setBgProperty(me, 'hueFrequency', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('force-wave-hue').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				setBgProperty(me, 'waveHue', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('force-color-portion').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0) {
				setBgProperty(me, 'colorPortion', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('force-sharpness').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value <= 1) {
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
			if (Number.isFinite(value)) {
				setBgProperty(me, 'waveLightness', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('force-num-attractors').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0 && value <= maxAttractors) {
				setBgProperty(me, 'numAttractors', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('force-explosion').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				setBgProperty(me, 'explosion', value);
				generateBackground(0);
			}
		});

		return optionsDoc;
	});

	const positionX = new Array(maxAttractors);
	const positionY = new Array(maxAttractors);
	const strength = new Array(maxAttractors);
	for (let i = 0; i < maxAttractors; i++) {
		positionX[i] = Math.random();
		positionY[i] = Math.random();
		strength[i] = Math.random();
	}
	this.numAttractors = 10;
	this.explosion = 1;
	this.positionX = positionX;
	this.positionY = positionY;
	this.strength = strength;

	this.fieldConstant = 100;
	this.fieldExponent = 2;
	this.divisor = 100;
	this.base = 2.8;
	this.sinePower = 1;	// Multiplied by 2 in WebGL

	this.minkowskiOrder = 2;
	this.distanceWeight = 0; // Canberra distance

	this.hueFrequency = 0;
	this.hueRotation = 0;
	this.waveHue = 0;

	this.saturation = 1;

	this.maxLightness = 0.4;
	this.minLightness = 0;
	this.waveLightness = 1;

	this.colorPortion = 1;
	this.sharpness = 0;
	this.antialiasing = 2;
}

ForceLines.prototype.animatable = {
	continuous: [
		'positionX', 'positionY', 'strength', 'fieldConstant', 'fieldExponent',
		'divisor', 'base',
		'minkowskiOrder', 'distanceWeight',
		'hueFrequency', 'hueRotation', 'waveHue','saturation',
		'waveLightness', 'minLightness', 'maxLightness',
		'colorPortion', 'sharpness', 'numAttractors', 'explosion'
	],
	stepped: [
		'antialiasing', 'sinePower',
	],
}
