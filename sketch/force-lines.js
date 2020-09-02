export default function FieldLines() {
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
	this.fieldConstant = 300;
	this.hueFrequency = 1;
	this.saturation = 1;
	this.maxLightness = 0.85;
	this.fieldExponent = 2;
}

FieldLines.prototype.animatable = {
	continuous: [
		'positionX', 'positionY', 'strength', 'fieldConstant', 'fieldExponent',
		'hueFrequency', 'saturation', 'maxLightness',
	],
	stepped: [
		'numAttractors',
	],
}
