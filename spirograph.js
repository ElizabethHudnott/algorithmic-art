'use strict';

const halfPI = Math.PI / 2;

let scale, width, height;
let toolsVisible = true;
let stator, rotor, numStatorTeeth, numRotorTeeth, savedStartTooth, initialRotationDist;
let inOut = document.getElementById('rotor-position-inside').checked ? -1 : 0;
let translationSteps = 0, translateX = 0, translateY = 0;
let currentDistance = 0;
let rotorX = 0;
let rotorY = 0;
let rotorAngle = 0;
let penX = 0;
let penY = 0;
let lineDash = [];
let maxHole, animSpeed, animController;
let isFilled = false;
let currentTool = 'fill';

function parseFraction(text) {
	const numerator = parseFloat(text);
	let denominator = 1;
	const slashPosition = text.indexOf('/');
	if (slashPosition !== -1) {
		denominator = parseInt(text.slice(slashPosition + 1));
	}
	return numerator / denominator;
}

const drawButton = document.getElementById('btn-draw');
const numPointsSpan = document.getElementById('num-points');
const numRevsSpan = document.getElementById('num-revolutions');
const lengthSpan = document.getElementById('length');
const statorTeethInput = document.getElementById('stator-teeth');
const statorAspectInput = document.getElementById('stator-aspect');
const incrementInput = document.getElementById('increment');
const rotorTeethInput = document.getElementById('rotor-teeth');
const statorRadiusInput = document.getElementById('stator-radius');
let statorRadius = parseFraction(statorRadiusInput.value);
if (!(statorRadius > 0)) {
	statorRadius = 1;
}
let maxRotationTime = 10000 * statorRadius;
const penXSlider = document.getElementById('pen-x');
let penOffsetX;
const penYSlider = document.getElementById('pen-y');
let penOffsetY = parseFloat(penYSlider.value);
const startToothInput = document.getElementById('start-tooth');
if (!Number.isFinite(startToothInput.value)) {
	startToothInput.value = 1;
}
const revolutionsInput = document.getElementById('revolutions');
const animSpeedSlider = document.getElementById('anim-speed');
setAnimSpeed(parseInt(animSpeedSlider.value));
const penWidthInput = document.getElementById('pen-width');
let lineWidth = parseInt(penWidthInput.value);
const lineDashInput = document.getElementById('line-dash');
const translationInput = document.getElementById('translation');
translationSteps = parseFloat(translationInput.value);
if (!Number.isFinite(translationSteps)) {
	translationSteps = 0;
}
const penSwatches = document.getElementsByName('pen-color');
const customPenInput = document.getElementById('custom-pen-color');
let customColor = customPenInput.value;
const paperSwatches = document.getElementsByName('paper-color');
const customPaperInput = document.getElementById('custom-paper-color');
const opacityInput = document.getElementById('outer-opacity');
const opacityInput2 = document.getElementById('inner-opacity');
const gradientToothInput = document.getElementById('gradient-tooth');


function hexToRGB(color) {
	const r = parseInt(color.slice(1, 3), 16);
	const g = parseInt(color.slice(3, 5), 16);
	const b = parseInt(color.slice(5, 7), 16);
	return [r, g, b];
}

function rgba(r, g, b, a) {
	return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function setFillStyle() {
	const [outerR, outerG, outerB] = hexToRGB(spiroContext.strokeStyle);
	const outerColor = rgba(outerR, outerG, outerB, parseFloat(opacityInput.value));

	let innerColor = outerColor;
	if (document.getElementsByClassName('inner-fill-controls')[0].classList.contains('show')) {
		innerColor = rgba(outerR, outerG, outerB, parseFloat(opacityInput2.value));

		let minRadius, maxRadius;
		const statorRadius = stator.radiusA;
		const penToEdge1 = rotor.radiusA * (1 - penOffsetX);
		const penToEdge2 = rotor.radiusB * (1 - penOffsetY);

		if (penToEdge1 <= penToEdge2) {
			// Calc using Radius A
			maxRadius = statorRadius - penToEdge1;
			minRadius = statorRadius - 2 * rotor.radiusA + penToEdge1;
		} else {
			// Calc using Radius B
			maxRadius = statorRadius - penToEdge2;
			minRadius = statorRadius - 2 * rotor.radiusB + penToEdge2;
		}
		minRadius = Math.abs(minRadius);

		const centreStyle = queryChecked(document.getElementById('gradient-centre'), 'gradient-centre').value;
		if (centreStyle == 'gradient') {
			minRadius = 0;
		}

		let gradient;
		if (queryChecked(document.getElementById('gradient-type'), 'gradient-type').value === 'radial') {
			gradient = spiroContext.createRadialGradient(translateX, translateY, minRadius, translateX, translateY, maxRadius);
			gradient.addColorStop(0, innerColor);
			gradient.addColorStop(1, outerColor);
		} else {
			const toothNum = parseFloat(gradientToothInput.value);
			if (!Number.isFinite(toothNum)) {
				gradientToothInput.setCustomValidity('Please fill in this field.');
				gradientToothInput.reportValidity();
				return false;
			}
			const theta = (stator.contactPoint((toothNum - 1) * stator.toothSize)[2] - halfPI) % Math.PI;
			const x1 = translateX - maxRadius * Math.cos(theta);
			const y1 = translateY - maxRadius * Math.sin(theta);
			const x2 = translateX + maxRadius * Math.cos(theta);
			const y2 = translateY + maxRadius * Math.sin(theta);
			gradient = spiroContext.createLinearGradient(x1, y1, x2, y2);
			gradient.addColorStop(0, outerColor);
			gradient.addColorStop(0.5 * (1 - minRadius / maxRadius), innerColor);
			gradient.addColorStop(0.5 * (1 + minRadius / maxRadius), innerColor);
			gradient.addColorStop(1, outerColor);
		}

		spiroContext.fillStyle = gradient;

	} else {

		spiroContext.fillStyle = outerColor;

	}
	return true;
}

function getInitialRotation() {
	const isInside = document.getElementById('rotor-position-inside').checked;
	const isInward = document.getElementById('orientation-inward').checked;
	if (isInside ^ isInward) {
		return rotor.numTeeth * rotor.toothSize / 2;
	} else {
		return 0;
	}
}

function setInitialRotation() {
	initialRotationDist = getInitialRotation();
	updateRotorPosition();
	if (!isAnimating()) {
		drawTools(stator, rotor, penX, penY);
	}
}

function changePenPosition(rotor, offsetX, offsetY) {
	penX = offsetX * rotor.radiusA;
	penY = offsetY * rotor.radiusB;
}

function isAnimating() {
	return animController && animController.status === 'running';
}

function setAnimSpeed(newSpeed) {
	animSpeed = newSpeed;
	if (isAnimating()) {
		animController.continue();
	}
}

class AnimationController {
	constructor(startDistance, longestTimeStep) {
		this.startDistance = startDistance;
		this.longestTimeStep = longestTimeStep;
		this.status = 'running';
	}

	setAbort(f) {
		const me = this;
		this.abort = function () {
			if (me.status === 'running') {
				me.status = 'aborted';
				f.call(me);
			}
		}
	}

	setContinue(f) {
		const me = this;
		this.continue = function () {
			if (me.status === 'running') {
				f.call(me);
			}
		}
	}

	finish() {
		this.status = 'finished';
	}
}

function saveCanvas() {
	saveContext.clearRect(0, 0, savedCanvas.width, savedCanvas.height);
	saveContext.drawImage(spiroCanvas, 0, 0);
}

function restoreCanvas() {
	spiroContext.setTransform(scale, 0, 0, scale, scale, scale);
	spiroContext.clearRect(-1, -1, width, height);
	spiroContext.drawImage(savedCanvas, -1, -1, width, height);
}

function placeRotor(stator, rotor, inOut, translateX, translateY, startDistance, distance, initialRotationDist) {
	const statorState = stator.contactPoint(distance);
	const statorAngle = statorState[2];	// Angle of the normal
	const contactPoint = rotor.contactPoint((distance - startDistance) * inOut + initialRotationDist);
	const rotorRadius = Math.sqrt(contactPoint[0] * contactPoint[0] + contactPoint[1] * contactPoint[1]);
	rotorX = statorState[0] + inOut * rotorRadius * Math.cos(statorAngle) + translateX;
	rotorY = statorState[1] + inOut * rotorRadius * Math.sin(statorAngle) + translateY;
	rotorAngle = contactPoint[2] + statorAngle;
	currentDistance = distance;
}

function updateRotorPosition() {
	placeRotor(stator, rotor, inOut, translateX, translateY, currentDistance, currentDistance, initialRotationDist);
}

function drawTools(stator, rotor, penX, penY) {
	if (toolsVisible) {
		toolContext.setTransform(scale, 0, 0, scale, scale, scale);
		toolContext.clearRect(-1, -1, width, height);
		stator.draw(toolContext, translateX, translateY);
		toolContext.translate(rotorX, rotorY);
		toolContext.rotate(rotorAngle);
		rotor.draw(toolContext, 0, 0);
		toolContext.arc(penX, penY, 5 / scale, 0, 2 * Math.PI);
		toolContext.fill('evenodd');
	}
}

function calcStepMultiplier(stator, rotor, penX, penY) {
	const maxRadius = Math.max(rotor.radiusA - penX, rotor.radiusB - penY);
	const maxAngle = stator.toothSize / stator.radiusB;
	const maxArc = maxAngle * maxRadius * scale;
	return Math.trunc(maxArc);
}

function drawSpirograph(stator, rotor, inOut, translateX, translateY, rotation, startDistance, endDistance, teethPerStep, penX, penY, initialRotationDist) {
	if (endDistance === undefined) {
		endDistance = startDistance + stator.toothSize * lcm(stator.numTeeth, rotor.numTeeth);
	}
	if (initialRotationDist === undefined) {
		initialRotationDist = getInitialRotation();
	}
	const increment = teethPerStep * stator.toothSize / calcStepMultiplier(stator, rotor, penX, penY);

	const numSteps = (endDistance - startDistance) / increment;
	const stepsPerRotation = (640 * Math.PI / scale) / increment;
	let stepNumber = 0;

	saveCanvas();
	spiroContext.setTransform(scale, 0, 0, scale, scale, scale);
	spiroContext.beginPath();
	const beginTime = performance.now();

	const newAnimController = new AnimationController(startDistance, maxRotationTime);
	let animFunction;

	const promise = new Promise(function (resolve, reject) {
		animFunction = function animate(time) {
			if (newAnimController.status === 'aborted') {
				reject();
				return;
			}
			if (animSpeed === 0) {
				return;
			}

			let maxStep;
			if (animSpeed < 100) {
				const stepsPerMilli = stepsPerRotation / (newAnimController.longestTimeStep / 100 * (101 - animSpeed));
				maxStep = Math.trunc((time - beginTime) * stepsPerMilli);
				if (maxStep > numSteps) {
					maxStep = numSteps;
				}
			} else {
				maxStep = numSteps;
			}

			let shift = 0;
			if (Math.abs(rotation) % halfPI === 0 && lineWidth % 2 === 1) {
				shift = 0.5 / scale;
			}
			spiroContext.rotate(rotation);

			while (stepNumber <= maxStep) {
				const distance = startDistance + stepNumber * increment;
				placeRotor(stator, rotor, inOut, translateX, translateY, startDistance, distance, initialRotationDist);
				const cos = Math.cos(rotorAngle);
				const sin = Math.sin(rotorAngle);
				let plotX = rotorX + penX * cos - penY * sin;
				let plotY = rotorY + penX * sin + penY * cos;
				if (lineWidth === 1) {
					plotX = Math.round(plotX * scale) / scale;
					plotY = Math.round(plotY * scale) / scale;
				}
				plotX += shift;
				plotY += shift;

				if (stepNumber === 0) {
					spiroContext.moveTo(plotX, plotY);
				} else {
					spiroContext.lineTo(plotX, plotY);
				}
				stepNumber++;
				if (stepNumber > numSteps && stepNumber < numSteps + 1) {
					stepNumber = numSteps;
				}
			}

			drawTools(stator, rotor, penX, penY);
			restoreCanvas();
			spiroContext.globalAlpha = parseFloat(opacityInput.value);
			spiroContext.stroke();
			spiroContext.globalAlpha = 1;

			if (stepNumber <= numSteps) {
				requestAnimationFrame(animate);
			} else {
				newAnimController.finish();
				resolve();
			}
		};
		requestAnimationFrame(animFunction);
	}); // end of Promise definition

	newAnimController.promise = promise;

	function requestAnim() {
		requestAnimationFrame(animFunction);
	}

	newAnimController.setContinue(requestAnim);
	newAnimController.setAbort(requestAnim);

	return newAnimController;
}

function gcd(a, b) {
	while (b !== 0) {
		const temp = b;
		b = a % b;
		a = temp;
	}
	return a;
}

function lcm(a, b) {
	return a / gcd(a, b) * b;
}

class Gear {
	constructor(numTeeth, arg2, aspectRatio) {
		this.numTeeth = numTeeth;
		if (arg2 instanceof Gear) {
			this.toothSize = arg2.toothSize;
			this.initialRotation = 0;
		} else {
			this.radiusA = arg2;
			this.radiusB = arg2 * aspectRatio;
			this.initialRotation = -halfPI;
		}
	}
}

class CircularGear extends Gear {

	constructor(numTeeth, arg2) {
		super(numTeeth, arg2, 1);
		if (arg2 instanceof Gear) {
			this.radiusA = numTeeth * arg2.toothSize / (2 * Math.PI);
			this.radiusB = this.radiusA;
		} else {
			this.toothSize = 2 * Math.PI * arg2 / numTeeth;
		}
	}

	contactPoint(distance) {
		const angle = (distance / this.radiusA) + this.initialRotation;
		return [
			this.radiusA * Math.cos(angle),	// x-coordinate
			this.radiusB * Math.sin(angle),	// y-coordinate
			angle
		];
	}

	draw(context, x, y) {
		context.beginPath();
		context.ellipse(x, y, this.radiusA, this.radiusB, 0, 0, 2 * Math.PI);
		context.stroke();
	}

	/**
	 * @param {number} x The proportional x-distance from the centre (0 <= x <= 1).
	 * @param {number} y The proportional y-distance from the centre (0 <= y <= 1).
	 */
	isPointInside(x, y) {
		return x * x + y * y <= 1;
	}

}

class RackGear extends Gear {

	constructor(numTeeth, arg2, aspectRatio) {
		super(numTeeth, arg2, aspectRatio);
		if (arg2 instanceof Gear) {
			this.radiusA = numTeeth / (4 * (1 - aspectRatio) + 2 * Math.PI * aspectRatio) * this.toothSize;
			this.radiusB = this.radiusA * aspectRatio;
		} else {
			this.toothSize = (4 * (arg2 - this.radiusB) + 2 * Math.PI * this.radiusB) / numTeeth;
		}
	}

	contactPoint(distance) {
		const rb = this.radiusB;
		const raMinusRb = this.radiusA - rb;
		const perimeter = this.numTeeth * this.toothSize;
		distance = distance % perimeter;
		if (distance < 0) {
			distance += perimeter;
		}
		if (distance <= raMinusRb) {
			return [distance, -rb, this.initialRotation];
		}
		distance -= raMinusRb;
		const arcLength = Math.PI * rb;
		if (distance <= arcLength) {
			const angle = distance / rb + this.initialRotation;
			return [
				raMinusRb + rb * Math.cos(angle),
				rb * Math.sin(angle),
				angle
			]
		}
		distance -= arcLength;
		if (distance <= 2 * raMinusRb) {
			return [raMinusRb - distance, rb, Math.PI + this.initialRotation];
		}
		distance -= 2 * raMinusRb;
		if (distance <= arcLength) {
			const angle = Math.PI + distance / rb + this.initialRotation;
			return [
				-raMinusRb + rb * Math.cos(angle),
				rb * Math.sin(angle),
				angle
			];
		}
		distance -= arcLength;
		return [-raMinusRb + distance, -rb, this.initialRotation];
	}

	draw(context, x, y) {
		const ra = this.radiusA;
		const rb = this.radiusB;
		context.beginPath();
		context.moveTo(-ra + rb, -rb);
		context.lineTo(ra - rb, -rb);
		context.arc(ra - rb, 0, rb, -halfPI, halfPI);
		context.lineTo(-ra + rb, rb);
		context.arc(-ra + rb, 0, rb, halfPI, -halfPI);
		context.stroke();
	}

	isPointInside(x, y) {
		const ra = this.radiusA;
		const rb = this.radiusB;
		const rectanglePart = (ra - rb) / ra;
		if (x <= rectanglePart) {
			return y <= 1;
		} else {
			const xDiff = x - rectanglePart;
			return xDiff * xDiff + y * y <= 1;
		}
	}

}

const gearConstructors = new Map();
gearConstructors.set('circle', CircularGear);
gearConstructors.set('rack', RackGear);

function calcMaxHole() {
	// Semi-arbitrary "Number of teeth" is modelled on the typical circular wheel.
	const numTeeth = 2 * Math.PI * rotor.radiusA / stator.toothSize;
	maxHole = Math.round(0.5 * numTeeth) - 6;
	if (maxHole < 0) {
		maxHole = 0;
	}
	penXSlider.max = maxHole;
}

const spiroCanvas = document.getElementById('spirograph-canvas');
const spiroContext = spiroCanvas.getContext('2d');
const toolCanvas = document.getElementById('tool-canvas');
const toolContext = toolCanvas.getContext('2d');
const savedCanvas = document.createElement('canvas');
const saveContext = savedCanvas.getContext('2d');
const toolColor = 'rgba(0, 64, 255, 0.5)';

function resizeCanvas(fitExact) {
	saveCanvas();
	const penColor = spiroContext.strokeStyle;
	let pixelWidth = document.getElementById('canvas-container').clientWidth;
	if (spiroCanvas < pixelWidth || fitExact) {
		spiroCanvas.width = pixelWidth;
		toolCanvas.width = pixelWidth;
	} else {
		pixelWidth = spiroCanvas.width;
	}
	let pixelHeight = spiroCanvas.height;
	if (fitExact && pixelHeight > pixelWidth) {
		pixelHeight = pixelWidth;
		spiroCanvas.height = pixelHeight;
		toolCanvas.height = pixelHeight;
	}
	scale = pixelWidth >= pixelHeight ? pixelHeight / 2 : pixelWidth / 2;
	width = pixelWidth / scale;
	height = pixelHeight / scale;
	spiroContext.setTransform(scale, 0, 0, scale, scale, scale);
	restoreCanvas();
	toolContext.setTransform(scale, 0, 0, scale, scale, scale);
	savedCanvas.width = pixelWidth;
	savedCanvas.height = pixelHeight;

	spiroContext.lineWidth = lineWidth / scale;
	toolContext.lineWidth = 2 / scale;
	spiroContext.strokeStyle = penColor;
	spiroContext.lineCap = 'round';
	spiroContext.lineJoin = 'round';
	toolContext.strokeStyle = toolColor;
	toolContext.fillStyle = toolColor;
}

resizeCanvas(true);

function updateNumberOfPoints() {
	const toothLength = lcm(stator.numTeeth, rotor.numTeeth);
	const numRevolutions = toothLength / stator.numTeeth;
	numRevsSpan.innerText = numRevolutions;
	const numPoints = toothLength / rotor.numTeeth;
	numPointsSpan.innerText = numPoints;
	const incrementSF = calcStepMultiplier(stator, rotor, penX, penY);
	const length = lcm(stator.numTeeth, rotor.numTeeth) * incrementSF;
	lengthSpan.innerText = length;
}

function randomizeSpirographForm() {
	const rotors = document.getElementById('rotor-teeth-list').children;
	const rotorIndex = Math.trunc(Math.random() * (rotors.length - 2));
	numRotorTeeth = parseInt(rotors[rotorIndex].innerText);
	document.getElementById('rotor-teeth').value = numRotorTeeth;
	numStatorTeeth = Math.random() < 0.5 ? 96 : 105;
	document.getElementById('stator-teeth').value = numStatorTeeth;
	stator = new CircularGear(numStatorTeeth, statorRadius);
	rotor = new CircularGear(numRotorTeeth, stator);
	calcMaxHole();
	const holeNumber = Math.round(maxHole / 4);
	penXSlider.value = holeNumber;
	document.getElementById('pen-x-readout').innerText = 'Hole ' + holeNumber;
	penOffsetX = 1 - holeNumber / maxHole;
	changePenPosition(rotor, penOffsetX, penOffsetY);
	setPenColor.call(penSwatches[Math.trunc(Math.random() * 5)].parentElement);
}

function drawingEnded() {
	initialRotationDist = animController.startDistance - currentDistance + initialRotationDist;
	const startTooth = parseFloat(startToothInput.value);
	if (Number.isFinite(startTooth)) {
		// Check if start tooth has been changed since drawing began
		const startDistance = (startTooth - 1) * stator.toothSize;
		if (startDistance !== animController.startDistance) {
			setInitialRotation();
		}
	}
	if (initialRotationDist !== 0) {
		const toothNumber = ((currentDistance / stator.toothSize) % stator.numTeeth) + 1;
		const roundedToothNum = Math.round(toothNumber * 1000) / 1000;
		startToothInput.value = roundedToothNum;
	}
	// TODO revise end distance
	updateRotorPosition();
	drawTools(stator, rotor, penX, penY);
	drawButton.classList.remove('btn-warning');
	drawButton.innerText = 'Draw Shape';
}

function calcTransform() {
	const length = translationSteps * stator.toothSize;
	if (width >= height) {
		translateX = length;
		translateY = 0;
	} else {
		translateX = 0;
		translateY = length;
	}
}

function drawSpirographAction() {
	drawButton.classList.add('btn-warning');
	drawButton.innerText = 'Stop';
	let startTooth = parseFloat(startToothInput.value);
	const startDistance = (startTooth - 1) * stator.toothSize;
	const increment = parseFloat(incrementInput.value);
	let endDistance;
	if (document.getElementById('end-point-numbered').checked) {
		const numRevolutions = parseFloat(revolutionsInput.value);
		endDistance = startDistance + stator.numTeeth * stator.toothSize * numRevolutions;
	}
	const rotationTooth = parseFloat(document.getElementById('rotation').value);
	const rotation = rotationTooth;
	spiroContext.globalCompositeOperation = 'multiply';
	isFilled = false;
	animController = drawSpirograph(stator, rotor, inOut, translateX, translateY, rotation, startDistance, endDistance, increment, penX, penY, initialRotationDist);
	animController.promise = animController.promise.then(drawingEnded, drawingEnded);
	updateNumberOfPoints();
}

randomizeSpirographForm();
calcTransform();
setInitialRotation();
parseLineDash();
drawSpirographAction();

animController.promise = animController.promise.then(function (event) {
	if (animController.status === 'finished') {
		document.getElementById('tool-canvas').classList.add('invisible');
		toolsVisible = false;
		document.getElementById('btn-toggle-tools').innerText = 'Show Gears';
	}
});

function queryChecked(ancestor, name) {
	return ancestor.querySelector(`:checked[name=${name}]`);
}

function checkInput(ancestor, name, value) {
	ancestor.querySelector(`[name=${name}][value=${value}]`).checked = true;
}

drawButton.addEventListener('click', function (event) {
	if (isAnimating()) {
		event.preventDefault();
		animController.abort();
	}
});

document.getElementById('spirograph-form').addEventListener('submit', function (event) {
	event.preventDefault();
	drawSpirographAction();
});

document.getElementById('btn-fill').addEventListener('click', function (event) {
	if (isFilled) {
		// TODO replace with an undo action
		spiroContext.globalCompositeOperation = 'color';
	}
	let success = setFillStyle();
	if (success) {
		spiroContext.fill('evenodd');
		isFilled = true;
	}
});

document.getElementById('btn-toggle-tools').addEventListener('click', function (event) {
	toolsVisible = !document.getElementById('tool-canvas').classList.toggle('invisible');
	if (toolsVisible) {
		drawTools(stator, rotor, penX, penY);
		this.innerText = 'Hide Gears';
	} else {
		this.innerText = 'Show Gears';
	}
});

/** Checks to see if the rotor is small enough to fit inside the stator.
 */
function checkRotorSize() {
	if (rotor.radiusA >= stator.radiusB) {
		document.getElementById('rotor-position-outside').checked = true;
		document.getElementById('rotor-position-inside').disabled = true;
		inOut = 1;
	} else {
		document.getElementById('rotor-position-inside').disabled = false;
	}
}

rotorTeethInput.addEventListener('change', function (event) {
	const numRotorTeethEntered = parseInt(this.value);
	if (numRotorTeethEntered >= 2) {
		numRotorTeeth = numRotorTeethEntered;
		let startDistance = currentDistance;
		let startTooth;
		if (savedStartTooth !== undefined) {
			startTooth = savedStartTooth;
			startToothInput.value = startTooth;
		} else {
			startTooth = parseFloat(startToothInput.value);
			if (Number.isFinite(startTooth)) {
				startTooth = Math.trunc(startTooth);
				startToothInput.value = startTooth;
			}
		}
		if (Number.isFinite(startTooth)) {
			startDistance = (startTooth - 1) * stator.toothSize;
		}
		rotor = new CircularGear(numRotorTeeth, stator);
		checkRotorSize();
		setInitialRotation();
		calcMaxHole();
		updatePenXReadout();
		changePenPosition(rotor, penOffsetX, penOffsetY);
		if (!isAnimating()) {
			placeRotor(stator, rotor, inOut, translateX, translateY, startDistance, startDistance, initialRotationDist);
			drawTools(stator, rotor, penX, penY);
		}
		updateNumberOfPoints();
	}
});

function makeStator() {
	const shape = document.getElementById('stator-shape').value;
	const aspectRatio = parseFloat(statorAspectInput.value);
	const constructor = gearConstructors.get(shape);
	stator = new constructor(numStatorTeeth, statorRadius, aspectRatio);
	rotor = new CircularGear(numRotorTeeth, stator);
	if (numRotorTeeth >= numStatorTeeth) {
		document.getElementById('rotor-position-outside').checked = true;
		document.getElementById('rotor-position-inside').disabled = true;
		inOut = 1;
	} else {
		document.getElementById('rotor-position-inside').disabled = false;
	}
	let startDistance = currentDistance;
	let startTooth = parseFloat(startToothInput.value);
	if (Number.isFinite(startTooth)) {
		startTooth = Math.trunc(startTooth);
		startToothInput.value = startTooth;
		startDistance = (startTooth - 1) * stator.toothSize;
	}
	calcTransform();
	setInitialRotation();
	changePenPosition(rotor, penOffsetX, penOffsetY);
	if (!isAnimating()) {
		placeRotor(stator, rotor, inOut, translateX, translateY, startDistance, startDistance, initialRotationDist);
		drawTools(stator, rotor, penX, penY);
	}
	updateNumberOfPoints();
}

statorTeethInput.addEventListener('change', function (event) {
	const numStatorTeethEntered = parseInt(this.value);
	if (numStatorTeethEntered >= 3) {
		numStatorTeeth = numStatorTeethEntered;
		startToothInput.value = 1;
		savedStartTooth = undefined;
		makeStator();
	}
});

document.getElementById('stator-shape').addEventListener('input', function (event) {
	if (savedStartTooth !== undefined) {
		startToothInput.value = savedStartTooth;
	} else {
		startToothInput.value = 1;
	}
	if (this.value === 'circle') {
		makeStator();
		statorAspectInput.disabled = true;
		statorAspectInput.setCustomValidity('');
	} else {
		statorAspectInput.disabled = false;
		if (parseFloat(statorAspectInput.value) > 0) {
			makeStator();
		} else {
			statorAspectInput.setCustomValidity('Please enter a positive number.');
		}
	}
	checkRotorSize();
	setInitialRotation();
});

document.getElementById('stator-aspect').addEventListener('input', function (event) {
	if (parseFloat(this.value) > 0) {
		makeStator();
		this.setCustomValidity('');
	} else {
		this.setCustomValidity('Please enter a positive number.');
	}
});

document.getElementById('rotor-position-inside').addEventListener('input', function (event) {
	inOut = -1;
	setInitialRotation();
});

document.getElementById('rotor-position-outside').addEventListener('input', function (event) {
	inOut = 1;
	setInitialRotation();
});

document.getElementById('orientation-inward').addEventListener('input', setInitialRotation);
document.getElementById('orientation-outward').addEventListener('input', setInitialRotation);

statorRadiusInput.addEventListener('change', function (event) {
	const statorRadiusEntered = parseFraction(this.value);
	if (statorRadiusEntered > 0) {
		this.setCustomValidity('');
		statorRadius = statorRadiusEntered;
		makeStator();
		maxRotationTime = 10000 * Math.sqrt(statorRadius);
	} else {
		this.setCustomValidity('Please enter a positive number.');
	}
});

startToothInput.addEventListener('change', function (event) {
	const startTooth = parseFloat(this.value);
	if (Number.isFinite(startTooth)) {
		savedStartTooth = startTooth;
		setInitialRotation();
		if (!isAnimating()) {
			const startDistance = (startTooth - 1) * stator.toothSize;
			placeRotor(stator, rotor, inOut, translateX, translateY, startDistance, startDistance, initialRotationDist);
			drawTools(stator, rotor, penX, penY);
		}
	}
});

document.getElementById('end-point-auto').addEventListener('input', function (event) {
	revolutionsInput.setCustomValidity('');
})

document.getElementById('end-point-numbered').addEventListener('input', function (event) {
	if (!(parseFloat(revolutionsInput.value) > 0)) {
		revolutionsInput.setCustomValidity('Please enter a positive number.');
	}
});

revolutionsInput.addEventListener('input', function (event) {
	if (parseFloat(this.value) > 0) {
		this.setCustomValidity('');
	} else {
		this.setCustomValidity('Please enter a positive number.');
	}
	document.getElementById('end-point-numbered').checked = true;
});

function updatePenXReadout() {
	const holeNumber = penXSlider.value;
	const newOffset = 1 - holeNumber / maxHole;
	if (rotor.isPointInside(newOffset, penOffsetY)) {
		document.getElementById('pen-x-readout').innerText = 'Hole ' + holeNumber;
		penOffsetX = newOffset;
		changePenPosition(rotor, penOffsetX, penOffsetY);
		if (!isAnimating()) {
			drawTools(stator, rotor, penX, penY);
		}
		updateNumberOfPoints();
	}
}
updatePenXReadout();
penXSlider.addEventListener('input', updatePenXReadout);
penXSlider.addEventListener('change', function (event) {
	const match = document.getElementById('pen-x-readout').innerText.match(/\d+$/);
	const holeNumber = parseInt(match[0]);
	if (holeNumber !== this.value) {
		this.value = holeNumber;
	}
});

function updatePenYReadout() {
	const newOffset = -parseFloat(penYSlider.value);
	if (rotor.isPointInside(penOffsetX, newOffset)) {
		penOffsetY = newOffset;
		document.getElementById('pen-y-readout').innerText = Math.round(-penOffsetY * 100) + '%';
		changePenPosition(rotor, penOffsetX, penOffsetY);
		if (!isAnimating()) {
			drawTools(stator, rotor, penX, penY);
		}
		updateNumberOfPoints();
	}
}
updatePenYReadout()
penYSlider.addEventListener('input', updatePenYReadout);
penYSlider.addEventListener('change', function (event) {
	if (parseFloat(this.value) !== -penOffsetY) {
		this.value = -penOffsetY;
	}
});

animSpeedSlider.addEventListener('input', function (event) {
	setAnimSpeed(parseInt(this.value));
});

penWidthInput.addEventListener('input', function (event) {
	if (this.value !== '') {
		lineWidth = parseInt(this.value);
		spiroContext.lineWidth =  lineWidth / scale;
		parseLineDash();
	}
});

function parseLineDash() {
	if (lineDashInput.checkValidity()) {
		const lengthStrs = lineDashInput.value.split(',');
		let numValues = lengthStrs.length;
		lineDash = new Array(numValues);
		for (let i = 0; i < numValues; i++) {
			lineDash[i] = parseInt(lengthStrs[i]);
		}
		if (numValues === 1) {
			if (lineDash[0] === 1) {
				lineDash = [];
			} else {
				lineDash[1] = lineDash[0];
			}
		} else if (numValues % 2 === 1) {
			for (let i = numValues - 2; i > 0; i--) {
				lineDash.push(lineDash[i]);
			}
		}
		const halfLineWidth = Math.ceil(lineWidth / 2);
		numValues = lineDash.length;
		for (let i = 0; i < numValues; i += 2) {
			lineDash[i] -= halfLineWidth;
			if (lineDash[i] < 1) {
				lineDash[i] = 1;
			}
		}
		for (let i = 1; i < numValues; i += 2) {
			lineDash[i] += halfLineWidth;
		}
		setLineDash();
	}
}

function setLineDash() {
	const lineWidth = spiroContext.lineWidth;
	const numValues = lineDash.length;
	const scaledLengths = new Array(numValues);
	for (let i = 0; i < numValues; i++) {
		scaledLengths[i] = lineDash[i] / scale;
	}
	spiroContext.setLineDash(scaledLengths);
}

lineDashInput.addEventListener('change', parseLineDash);

translationInput.addEventListener('change', function (event) {
	const amount = parseFloat(this.value);
	if (Number.isFinite(amount)) {
		translationSteps = amount;
		calcTransform();
		updateRotorPosition();
		if (!isAnimating()) {
			drawTools(stator, rotor, penX, penY);
		}
	}
});

function setPenColor() {
	const input = this.children[0];
	spiroContext.strokeStyle = input.value;

	for (let swatch of penSwatches) {
		if (swatch !== input) {
			swatch.parentElement.classList.remove('active');
		}
	}
	customPenInput.parentElement.classList.remove('active');
	this.classList.add('active');
}

penSwatches.forEach(function (item) {
	item.parentElement.addEventListener('click', setPenColor);
});

customPenInput.addEventListener('input', function (event) {
	spiroContext.strokeStyle = this.value;
	for (let swatch of penSwatches) {
		swatch.parentElement.classList.remove('active');
	}
	this.parentElement.classList.add('active');
	const customColorBoxes = this.parentElement.parentElement.children;
	const count = customColorBoxes.length - 2;
	let colorBox;
	for (let i = 0; i < count; i++) {
		colorBox = customColorBoxes[i];
		const color = customColorBoxes[i + 1].style.backgroundColor;
		colorBox.style.backgroundColor = color;
		colorBox.children[0].value = color;
	}
	colorBox = customColorBoxes[count];
	colorBox.style.backgroundColor = customColor;
	colorBox.children[0].value = customColor;
	customColor = this.value;
});


function setPaperColor() {
	spiroCanvas.style.backgroundColor = this.children[0].value;
	customPaperInput.parentElement.classList.remove('active');
}

paperSwatches.forEach(function (item) {
	item.parentElement.addEventListener('click', setPaperColor);
});

customPaperInput.addEventListener('input', function (event) {
	spiroCanvas.style.backgroundColor = this.value;
	for (let swatch of paperSwatches) {
		swatch.parentElement.classList.remove('active');
	}
	this.parentElement.classList.add('active');
});

function updateOpacityReadout() {
	const opacity = parseFloat(this.value);
	const readout = document.getElementById(this.getAttribute('aria-describedby'));
	readout.innerText = Math.round(opacity * 100) + '%';
}

updateOpacityReadout.call(opacityInput);
updateOpacityReadout.call(opacityInput2);
opacityInput.addEventListener('input', updateOpacityReadout);
opacityInput2.addEventListener('input', updateOpacityReadout);

document.getElementById('erase-form').addEventListener('submit', function(event) {
	event.preventDefault();
	function reset() {
		startToothInput.value = 1;
		savedStartTooth = undefined;
		setInitialRotation();
		translationInput.value = 0;
		translationSteps = 0;
		calcTransform();
		spiroContext.clearRect(-1, -1, width, height);
		placeRotor(stator, rotor, inOut, 0, 0, 0, 0, initialRotationDist);
		drawTools(stator, rotor, penX, penY);
	}
	if (isAnimating()) {
		animController.promise.then(reset);
		animController.abort();
	} else {
		reset();
	}
	$('#erase-modal').modal('hide');
});

function opacityPreset() {
	opacityInput.value = this.dataset.value;
	updateOpacityReadout.call(opacityInput);
}
document.getElementById('opacity-0').addEventListener('click', opacityPreset);
document.getElementById('opacity-50').addEventListener('click', opacityPreset);
document.getElementById('opacity-75').addEventListener('click', opacityPreset);
document.getElementById('opacity-100').addEventListener('click', opacityPreset);

gradientToothInput.addEventListener('input', function (event) {
	if (Number.isFinite(parseFloat(this.value))) {
		this.setCustomValidity('');
		document.getElementById('gradient-type-linear').checked = true;
	}
})

{
	function clear() {
		this.savedValue = this.value;
		this.value = '';
	}

	function restore() {
		if (this.value === '') {
			this.value = this.savedValue;
		}
	}

	const comboboxes = document.querySelectorAll('input[list]');
	for (let combobox of comboboxes) {
		combobox.addEventListener('focus', clear);
		combobox.addEventListener('blur', restore);
	}
}

$(function () {
	$('[data-toggle="tooltip"]').tooltip();
});

function floodFill(dataObj, startX, startY, newColor, transparency) {
	const [newR, newG, newB] = hexToRGB(newColor);
	const width = dataObj.width;
	const height = dataObj.height;
	const data = dataObj.data;
	let offset = (startY * width + startX) * 4;
	const targetR = data[offset];
	const targetG = data[offset + 1];
	const targetB = data[offset + 2];
	const fillTransparent = data[offset + 3] === 0;
	const filled = new Uint8Array(width * height); // Records which pixels we've filled
	const fillAlpha = Math.ceil(transparency * 255); // Used to fill areas with 0 alpha

	const tolerance = 0.1;
	const alphaThreshold = Math.min(fillAlpha - 1, Math.round(tolerance * 255));
	const divisor = 255 * Math.sqrt(3);
	function checkPixel(x, y) {
		offset = y * width + x;
		if (filled[offset]) {
			return false;
		}
		offset *= 4;
		if (fillTransparent) {
			return data[offset + 3] <= alphaThreshold;
		} else if (data[offset + 3] === 0) {
			return false;
		} else {
			const rDistance = data[offset] - targetR;
			const gDistance = data[offset + 1] - targetG;
			const bDistance = data[offset + 2] - targetB;
			const deviation = Math.sqrt(rDistance * rDistance + gDistance * gDistance + bDistance * bDistance) / divisor;
			return deviation <= tolerance;
		}
	}

	function fillPixel() {
		const maskOffset = offset / 4;
		if (filled[maskOffset]) {
			return;
		}
		filled[maskOffset] = 1;
		data[offset] = newR;
		data[offset + 1] = newG;
		data[offset + 2] = newB;
		let p;
		if (fillTransparent) {
			data[offset + 3] = fillAlpha;
		} else if (transparency >= 0.5) {
			p = (transparency - 0.5) * 2;
			data[offset + 3] = p * 255 + (1 - p) * data[offset + 3];
		} else {
			p = transparency * 2;
			data[offset + 3] = p * data[offset + 3];
		}
	}

	const stack = [startX, startY];
	let top = 2;
	function pushPixel(x, y) {
		stack[top] = x;
		top++;
		stack[top] = y;
		top++;
	}
	function pushPixels(x, y) {
		if (checkPixel(x, y)) {
			pushPixel(x, y);
		} else if (x > 0 && checkPixel(x - 1, y)) {
			pushPixel(x - 1, y);
		} else if (x < width - 1 && checkPixel(x + 1, y)) {
			pushPixel(x + 1, y);
		}
	}

	while (top > 0) {
		top -= 2;
		const x = stack[top];
		const y = stack[top + 1];
		offset = (y * width + x) * 4;
		fillPixel();

		// Check North pixels
		if (y > 0) {
			pushPixels(x, y - 1);
		}
		// Check South pixels
		if (y < height - 1) {
			pushPixels(x, y + 1);
		}

		// Move East
		let currentX = x;
		while (currentX > 0) {
			currentX--;
			if (!checkPixel(currentX, y)) {
				break;
			}
			fillPixel();
			// Check North pixels
			if (y > 0) {
				pushPixels(currentX, y - 1);
			}
			// Check South pixels
			if (y < height - 1) {
				pushPixels(currentX, y + 1);
			}
		}

		// Move West
		currentX = x;
		while (currentX < width - 1) {
			currentX++;
			if (!checkPixel(currentX, y)) {
				break;
			}
			fillPixel();
			// Check North pixels
			if (y > 0) {
				pushPixels(currentX, y - 1);
			}
			// Check South pixels
			if (y < height - 1) {
				pushPixels(currentX, y + 1);
			}
		}
	} // end while stack not empty
}

spiroCanvas.addEventListener('click', function (event) {
	if (isAnimating()) {
		return;
	}
	const x = Math.round(event.offsetX);
	const y = Math.round(event.offsetY);

	switch (currentTool) {
	case 'fill':
		const alphaChange = parseFloat(opacityInput.value);
		const dataObj = spiroContext.getImageData(0, 0, spiroCanvas.width, spiroCanvas.height);
		floodFill(dataObj, x, y, spiroContext.strokeStyle, alphaChange);
		spiroContext.clearRect(-1, -1, width, height);
		spiroContext.putImageData(dataObj, 0, 0);
		break;
	}
});
