export default function ForceLines() {
	const me = this;
	this.title = 'Force Lines';
	this.isShader = true;

	const maxAttractors = 20;

	this.optionsDocument = downloadFile('force-lines.html', 'document').then(function (optionsDoc) {

		optionsDoc.getElementById('force-field-constant').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				setBgProperty(me, 'fieldConstant', value);
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

		optionsDoc.getElementById('force-num-attractors').addEventListener('input', function (event) {
			const value = parseInt(this.value);
			if (value >= 0 && value <= maxAttractors) {
				setBgProperty(me, 'numAttractors', value);
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

		optionsDoc.getElementById('force-wave-lightness').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				setBgProperty(me, 'waveLightness', value);
				generateBackground(0);
			}
		});
		return optionsDoc;
	});

	const numAttractors = 15;
	const positionX = new Array(maxAttractors);
	const positionY = new Array(maxAttractors);
	const strength = new Array(maxAttractors);
	for (let i = 0; i < numAttractors; i++) {
		positionX[i] = Math.random();
		positionY[i] = Math.random();
		strength[i] = Math.random();
	}
	this.numAttractors = numAttractors;
	this.positionX = positionX;
	this.positionY = positionY;
	this.strength = strength;

	this.fieldConstant = 300;
	this.fieldExponent = 2;

	this.hueFrequency = 1;
	this.hueRotation = 0;
	this.waveHue = 0;

	this.saturation = 1;

	this.maxLightness = 0.85;
	this.minLightness = 0;
	this.waveLightness = 1;

	this.colorPortion = 0.5;
	this.sharpness = 0;
	this.antialiasing = 2;
}

ForceLines.prototype.animatable = {
	continuous: [
		'positionX', 'positionY', 'strength', 'fieldConstant', 'fieldExponent',
		'hueFrequency', 'hueRotation', 'waveHue','saturation',
		'waveLightness', 'minLightness', 'maxLightness',
		'colorPortion', 'sharpness',
	],
	stepped: [
		'numAttractors', 'antialiasing',
	],
}
