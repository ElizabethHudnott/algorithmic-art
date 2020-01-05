'use strict';

let maxIncrement = Math.PI / 48;

let scale, width, height;
let toolsVisible = true;
let stator, rotor, numStatorTeeth, numRotorTeeth, savedStartTooth;
let translationSteps = 0, translateX = 0, translateY = 0;
let currentDistance = 0;
let initialRotationDist = 0;
let rotorX = 0;
let rotorY = 0;
let rotorAngle = 0;
let penX = 0;
let penY = 0;
let lineDash = [];
let maxHole, animSpeed, animController;
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
const statorTeethInput = document.getElementById('stator-teeth');
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
const animSpeedSlider = document.getElementById('anim-speed');
setAnimSpeed(parseInt(animSpeedSlider.value));
const penWidthInput = document.getElementById('pen-width');
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
const opacityInput = document.getElementById('opacity');

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
	spiroContext.clearRect(-1, -1, width, height);
	spiroContext.drawImage(savedCanvas, -1, -1, width, height);
}

function placeRotor(stator, rotor, translateX, translateY, startDistance, distance, initialRotationDist) {
	const statorState = stator.calc(distance);
	const statorAngle = statorState[2];	// Angle of the normal
	const contactPoint = rotor.contactPoint(startDistance - distance + initialRotationDist);
	const rotorRadius = Math.sqrt(contactPoint[0] * contactPoint[0] + contactPoint[1] * contactPoint[1]);
	rotorX = statorState[0] + rotorRadius * Math.cos(statorAngle) + translateX;
	rotorY = statorState[1] + rotorRadius * Math.sin(statorAngle) + translateY;
	rotorAngle = Math.atan2(contactPoint[1], contactPoint[0]) + statorAngle + Math.PI;
	currentDistance = distance;
}

function updateRotorPosition() {
	let startDistance = currentDistance;
	if (animController && animController.status !== 'aborted') {
		startDistance = animController.startDistance;
	}
	placeRotor(stator, rotor, translateX, translateY, startDistance, currentDistance, initialRotationDist);
}

function drawTools(stator, rotor, penX, penY) {
	if (toolsVisible) {
		toolContext.setTransform(scale, 0, 0, scale, scale, scale);
		toolContext.clearRect(-1, -1, width, height);
		stator.draw(toolContext, translateX, translateY);
		toolContext.translate(rotorX, rotorY);
		toolContext.rotate(rotorAngle);
		rotor.draw(toolContext);
		toolContext.arc(penX, penY, 5 / scale, 0, 2 * Math.PI);
		toolContext.fill('evenodd');
	}
}

function drawSpirograph(stator, rotor, translateX, translateY, startDistance, endDistance, penX, penY, initialRotationDist) {
	if (endDistance === undefined) {
		endDistance = startDistance + stator.toothSize * lcm(stator.numTeeth, rotor.numTeeth);
	}
	if (initialRotationDist === undefined) {
		initialRotationDist = 0;
	}
	let increment = stator.toothSize;
	if (increment > maxIncrement) {
		const multiple = Math.ceil(increment / maxIncrement);
		increment = increment / multiple;
	}
	const numSteps = Math.ceil((endDistance - startDistance) / increment);
	const stepsPerRotation = 2 * Math.PI / increment;
	let stepNumber = 0;

	saveCanvas();
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
				maxStep = (time - beginTime) * stepsPerMilli;
				if (maxStep > numSteps) {
					maxStep = numSteps;
				}
			} else {
				maxStep = numSteps;
			}

			while (stepNumber <= maxStep) {
				const distance = startDistance + stepNumber * increment;
				placeRotor(stator, rotor, translateX, translateY, startDistance, distance, initialRotationDist);
				const cos = Math.cos(rotorAngle);
				const sin = Math.sin(rotorAngle);
				const plotX = rotorX + penX * cos - penY * sin;
				const plotY = rotorY + penX * sin + penY * cos;

				if (stepNumber === 0) {
					spiroContext.moveTo(plotX, plotY);
				} else {
					spiroContext.lineTo(plotX, plotY);
				}
				stepNumber++;
			}

			drawTools(stator, rotor, penX, penY);
			restoreCanvas();
			spiroContext.stroke();

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

class InnerCircleStator {

	constructor(numTeeth, radius) {
		this.numTeeth = numTeeth;
		this.radius = radius;		// private
		this.toothSize = 2 * Math.PI * radius / numTeeth;
	}

	calc(distance) {
		const radius = this.radius;
		const angle = (distance / radius) - Math.PI / 2;
		return [
			radius * Math.cos(angle),	// x-coordinate
			radius * Math.sin(angle), 	// y-coordinate
			angle + Math.PI				// angle of the normal in radians
		];
	}

	draw(context, x, y) {
		context.beginPath();
		context.arc(x, y, this.radius, 0, 2 * Math.PI);
		context.stroke();
	}

}

class CircleRotor {
	constructor(stator, numTeeth) {
		this.numTeeth = numTeeth;
		this.radiusA = numTeeth * stator.toothSize / (2 * Math.PI); // "Longest" radius
		this.radiusB = this.radiusA;
	}

	draw(context) {
		context.beginPath();
		context.arc(0, 0, this.radiusA, 0, 2 * Math.PI);
	}

	contactPoint(distance) {
		const angle = distance / this.radiusA;
		return [
			this.radiusA * Math.cos(angle),
			this.radiusB * Math.sin(angle)
		];
	}
}

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

	let lineWidth = parseInt(penWidthInput.value);
	if (!(lineWidth >= 1)) {
		lineWidth = 2;
	}
	spiroContext.lineWidth = lineWidth / scale;
	toolContext.lineWidth = 2 / scale;
	spiroContext.globalCompositeOperation = 'multiply';
	spiroContext.strokeStyle = penColor;
	spiroContext.lineCap = 'round';
	spiroContext.lineJoin = 'round';
	toolContext.strokeStyle = toolColor;
	toolContext.fillStyle = toolColor;
}

resizeCanvas(true);

function updateNumberOfPoints() {
	const numPoints = lcm(stator.numTeeth, rotor.numTeeth) / rotor.numTeeth;
	numPointsSpan.innerText = numPoints;
}

function randomizeSpirographForm() {
	const rotors = document.getElementById('rotor-teeth-list').children;
	const rotorIndex = Math.trunc(Math.random() * rotors.length);
	numRotorTeeth = rotors[rotorIndex].innerText;
	document.getElementById('rotor-teeth').value = numRotorTeeth;
	numStatorTeeth = Math.random() < 0.5 ? 96 : 105;
	document.getElementById('stator-teeth').value = numStatorTeeth;
	stator = new InnerCircleStator(numStatorTeeth, statorRadius);
	rotor = new CircleRotor(stator, numRotorTeeth);
	calcMaxHole();
	const holeNumber = Math.round(maxHole / 4);
	penXSlider.value = holeNumber;
	document.getElementById('pen-x-readout').innerText = 'Hole ' + holeNumber;
	penOffsetX = 1 - holeNumber / maxHole;
	changePenPosition(rotor, penOffsetX, penOffsetY);
}

function abortDrawing() {
	initialRotationDist = animController.startDistance - currentDistance + initialRotationDist;
	const startTooth = parseFloat(startToothInput.value);
	if (Number.isFinite(startTooth)) {
		// Check if start tooth has been changed since drawing began
		const startDistance = (startTooth - 1) * stator.toothSize;
		if (startDistance !== animController.startDistance) {
			initialRotationDist = 0;
		}
	}
	if (initialRotationDist !== 0) {
		startToothInput.value = ((currentDistance / stator.toothSize) % stator.numTeeth) + 1;
	}
	// TODO revise end distance
}

function drawingEnded() {
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
	spiroContext.globalAlpha = 1;
	animController = drawSpirograph(stator, rotor, translateX, translateY, startDistance, undefined, penX, penY, initialRotationDist);
	animController.promise = animController.promise.catch(abortDrawing).then(drawingEnded);
	updateNumberOfPoints();
}

randomizeSpirographForm();
calcTransform();
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
	spiroContext.fillStyle = spiroContext.strokeStyle;
	spiroContext.globalAlpha = parseFloat(opacityInput.value);
	spiroContext.fill('evenodd');
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

rotorTeethInput.addEventListener('change', function (event) {
	const numRotorTeethEntered = parseInt(this.value);
	if (numRotorTeethEntered >= 2) {
		numRotorTeeth = numRotorTeethEntered;
		if (numRotorTeeth >= numStatorTeeth) {
			document.getElementById('rotor-position-outside').checked = true;
			document.getElementById('rotor-position-inside').disabled = true;
			//TODO implement rotations outside the stator
		} else {
			document.getElementById('rotor-position-inside').disabled = false;
		}
		let startDistance = currentDistance;
		let startTooth;	// Here can be a fraction less than one or an integer
		if (savedStartTooth) {
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
		initialRotationDist = 0;
		rotor = new CircleRotor(stator, numRotorTeeth);
		placeRotor(stator, rotor, translateX, translateY, startDistance, startDistance, 0);
		calcMaxHole();
		updatePenXReadout();
		changePenPosition(rotor, penOffsetX, penOffsetY);
		drawTools(stator, rotor, penX, penY);
		updateNumberOfPoints();
	}
});

function makeNewStator() {
	stator = new InnerCircleStator(numStatorTeeth, statorRadius);
	rotor = new CircleRotor(stator, numRotorTeeth);
	if (numRotorTeeth >= numStatorTeeth) {
		document.getElementById('rotor-position-outside').checked = true;
		document.getElementById('rotor-position-inside').disabled = true;
		//TODO implement rotations outside the stator
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
	initialRotationDist = 0;
	placeRotor(stator, rotor, translateX, translateY, startDistance, startDistance, 0);
	changePenPosition(rotor, penOffsetX, penOffsetY);
	drawTools(stator, rotor, penX, penY);
}

statorTeethInput.addEventListener('change', function (event) {
	const numStatorTeethEntered = parseInt(this.value);
	if (numStatorTeethEntered >= 3) {
		numStatorTeeth = numStatorTeethEntered;
		startToothInput.value = 1;
		savedStartTooth = undefined;
		makeNewStator();
		updateNumberOfPoints();
	}
});

statorRadiusInput.addEventListener('change', function (event) {
	const statorRadiusEntered = parseFraction(this.value);
	if (statorRadiusEntered > 0) {
		this.setCustomValidity('');
		statorRadius = statorRadiusEntered;
		makeNewStator();
		maxRotationTime = 10000 * statorRadius;
	} else {
		this.setCustomValidity('Please enter a positive number.');
	}
});

startToothInput.addEventListener('change', function (event) {
	const startTooth = parseFloat(this.value);
	if (Number.isFinite(startTooth)) {
		savedStartTooth = startTooth;
		initialRotationDist = 0;
		const startDistance = (startTooth - 1) * stator.toothSize;
		placeRotor(stator, rotor, translateX, translateY, startDistance, startDistance, 0);
		drawTools(stator, rotor, penX, penY);
	}
});

function updatePenXReadout() {
	const holeNumber = penXSlider.value;
	document.getElementById('pen-x-readout').innerText = 'Hole ' + holeNumber;
	penOffsetX = 1 - holeNumber / maxHole;
	changePenPosition(rotor, penOffsetX, penOffsetY);
	drawTools(stator, rotor, penX, penY);
}
updatePenXReadout();
penXSlider.addEventListener('input', updatePenXReadout);

function updatePenYReadout() {
	penOffsetY = -parseFloat(penYSlider.value);
	document.getElementById('pen-y-readout').innerText = Math.round(-penOffsetY * 100) + '%';
	changePenPosition(rotor, penOffsetX, penOffsetY);
	drawTools(stator, rotor, penX, penY);
}
updatePenYReadout()
penYSlider.addEventListener('input', updatePenYReadout);

animSpeedSlider.addEventListener('input', function (event) {
	setAnimSpeed(parseInt(this.value));
});

penWidthInput.addEventListener('input', function (event) {
	spiroContext.lineWidth = parseInt(this.value) / scale;
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
		numValues = lineDash.length;
		for (let i = 0; i < numValues; i += 2) {
			if (lineDash[i] > 1) {
				lineDash[i]--;
			}
		}
		for (let i = 1; i < numValues; i += 2) {
			lineDash[i]++;
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
		drawTools(stator, rotor, penX, penY);
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

function updateOpacityReadout(event) {
	const opacity = parseFloat(opacityInput.value);
	document.getElementById('opacity-readout').innerText = Math.round(opacity * 100) + '%';
}
updateOpacityReadout();
opacityInput.addEventListener('input', updateOpacityReadout);

document.getElementById('erase-form').addEventListener('submit', function(event) {
	event.preventDefault();
	function reset() {
		startToothInput.value = 1;
		savedStartTooth = undefined;
		translationInput.value = 0;
		translationSteps = 0;
		calcTransform();
		spiroContext.clearRect(-1, -1, width, height);
		placeRotor(stator, rotor, 0, 0, 0, 0, 0);
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

$(function () {
  $('[data-toggle="tooltip"]').tooltip()
});

function floodFill(canvas, startX, startY, newColor, transparency) {
	const newR = parseInt(newColor.slice(1, 3), 16);
	const newG = parseInt(newColor.slice(3, 5), 16);
	const newB = parseInt(newColor.slice(5, 7), 16);
	const fillAlpha = Math.round(transparency * 255); // Used to fill areas with 0 alpha
	const width = canvas.width;
	const height = canvas.height;
	const context = canvas.getContext('2d');
	const dataObj = context.getImageData(0, 0, width, height);
	const data = dataObj.data;
	let offset = (startY * width + startX) * 4;
	const targetR = data[offset];
	const targetG = data[offset + 1];
	const targetB = data[offset + 2];
	const fillTransparent = data[offset + 3] === 0;
	const sameColor = !fillTransparent && targetR === newR && targetG === newG && targetB === newB;
	if (sameColor) { // TODO make it work with a lesser constraint about opacity here instead
		return;
	}

	const tolerance = 0.05;
	const divisor = 256 * Math.sqrt(3);
	function checkPixel() {
		if (fillTransparent) {
			return data[offset + 3] <= 115; // tolerance = 0.45
		} else if (data[offset + 3] === 0) {
			return false;
		} else {
			const rDistance = data[offset] - targetR;
			const gDistance = data[offset + 1] - targetG;
			const bDistance = data[offset + 2] - targetB;
			return (rDistance * rDistance + gDistance * gDistance + bDistance * bDistance) / divisor <= tolerance;
		}
	}

	function fillPixel() {
		let x;
		data[offset] = newR;
		data[offset + 1] = newG;
		data[offset + 2] = newB;
		if (fillTransparent) {
			data[offset + 3] = fillAlpha;
		} else if (transparency >= 0.5) {
			x = (transparency - 0.5) * 2;
			data[offset + 3] = x * 255 + (1 - x) * data[offset + 3];
		} else {
			x = transparency * 2;
			data[offset + 3] = x * data[offset + 3];
		}
	}
	const stack = [startX, startY];
	let top = 2;
	while (top > 0) {
		top -= 2;
		let x = stack[top];
		let y = stack[top + 1];
		offset = (y * width + x) * 4;
		fillPixel();

		// Check North pixel
		if (y > 0) {
			offset = ((y - 1) * width + x) * 4;
			if (checkPixel()) {
				stack[top + 1] = y - 1;
				top += 2;
			}
		}
		// Check South pixel
		if (y < height - 1) {
			offset = ((y + 1) * width + x) * 4;
			if (checkPixel()) {
				stack[top] = x;
				stack[top + 1] = y + 1;
				top += 2;
			}
		}

		// Move East
		let currentX = x;
		while (currentX > 0) {
			currentX--;
			offset = (y * width + currentX) * 4;
			if (!checkPixel()) {
				break;
			}
			fillPixel();
			// Check North pixel
			if (y > 0) {
				offset = ((y - 1) * width + currentX) * 4;
				if (checkPixel()) {
					stack[top] = currentX;
					stack[top + 1] = y - 1;
					top += 2;
				}
			}
			// Check South pixel
			if (y < height - 1) {
				offset = ((y + 1) * width + currentX) * 4;
				if (checkPixel()) {
					stack[top] = currentX;
					stack[top + 1] = y + 1;
					top += 2;
				}
			}
		}

		// Move West
		currentX = x;
		while (currentX < width - 1) {
			currentX++;
			offset = (y * width + currentX) * 4;
			if (!checkPixel()) {
				break;
			}
			fillPixel();
			// Check North pixel
			if (y > 0) {
				offset = ((y - 1) * width + currentX) * 4;
				if (checkPixel()) {
					stack[top] = currentX;
					stack[top + 1] = y - 1;
					top += 2;
				}
			}
			// Check South pixel
			if (y < height - 1) {
				offset = ((y + 1) * width + currentX) * 4;
				if (checkPixel()) {
					stack[top] = currentX;
					stack[top + 1] = y + 1;
					top += 2;
				}
			}
		}
	} // end while stack not empty
	context.putImageData(dataObj, 0, 0);
}

spiroCanvas.addEventListener('click', function (event) {
	const x = Math.round(event.offsetX);
	const y = Math.round(event.offsetY);

	switch (currentTool) {
	case 'fill':
		const alphaThreshold = parseFloat(opacityInput.value);
		floodFill(spiroCanvas, x, y, spiroContext.strokeStyle, alphaThreshold);
		break;
	}
});
