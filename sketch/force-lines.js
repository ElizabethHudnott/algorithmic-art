export default function ForceLines() {
	const me = this;
	this.title = 'Force Lines';
	this.isShader = true;

	const numAttractors = 15;
	const positionX = [];
	const positionY = [];
	const strength = [];
	for (let i = 0; i < numAttractors; i++) {
		positionX[i] = Math.random();
		positionY[i] = Math.random();
		strength[i] = Math.random();
	}
	this.numAttractors = numAttractors;
	this.positionX = positionX;
	this.positionY = positionY;
	this.strength = strength;

	this.fieldConstant = 500;
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
