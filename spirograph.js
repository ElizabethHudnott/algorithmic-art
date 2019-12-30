'use strict';

let maxRotationTime = 10000;
let maxIncrement = Math.PI / 48;

let toolsVisible = true;
let stator, rotor, numStatorTeeth, numRotorTeeth, savedStartTooth;
let currentDistance = 0;
let initialRotationDist = 0;
let rotorX = 0;
let rotorY = 0;
let rotorAngle = 0;
let penX = 0;
let penY = 0;
let animSpeed, animController;

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
const penXSlider = document.getElementById('pen-x');
let penOffsetX = parseFloat(penXSlider.value);
const penYSlider = document.getElementById('pen-y');
let penOffsetY = parseFloat(penYSlider.value);
const startToothInput = document.getElementById('start-tooth');
const animSpeedSlider = document.getElementById('anim-speed');
setAnimSpeed(parseInt(animSpeedSlider.value));
const penSwatches = document.getElementsByName('pen-color');
const customPenInput = document.getElementById('custom-pen-color');
let customColor = customPenInput.value;
const paperSwatches = document.getElementsByName('paper-color');
const customPaperInput = document.getElementById('custom-paper-color');
const penWidthInput = document.getElementById('pen-width');
const opacityInput = document.getElementById('opacity');

function changePenPosition(rotor, offsetX, offsetY) {
	penX = offsetX * rotor.radiusA;
	penY = offsetY * rotor.radiusB;
}

function setAnimSpeed(newSpeed) {
	animSpeed = newSpeed;
	if (animController) {
		animController.continue();
	}
}

class AnimationController {
	constructor(promise, continueFunc, cancelFunc, startDistance) {
		this.promise = promise;
		this.continue = continueFunc;
		this.cancel = cancelFunc;
		this.startDistance = startDistance;
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

function placeRotor(stator, rotor, startDistance, distance, initialRotationDist) {
	const statorState = stator.calc(distance);
	const statorAngle = statorState[2];
	const contactPoint = rotor.contactPoint(startDistance - distance + initialRotationDist);
	const rotorRadius = Math.sqrt(contactPoint[0] * contactPoint[0] + contactPoint[1] * contactPoint[1]);
	rotorX = statorState[0] + rotorRadius * Math.cos(statorAngle);
	rotorY = statorState[1] + rotorRadius * Math.sin(statorAngle);
	rotorAngle = Math.atan2(contactPoint[1], contactPoint[0]) + statorAngle + Math.PI;
	currentDistance = distance;
}

function drawTools(stator, rotor, penX, penY) {
	toolContext.setTransform(scale, 0, 0, scale, scale, scale);
	toolContext.clearRect(-1, -1, width, height);
	stator.draw(toolContext);
	toolContext.translate(rotorX, rotorY);
	toolContext.rotate(rotorAngle);
	rotor.draw(toolContext);
	toolContext.arc(penX, penY, 5 / scale, 0, 2 * Math.PI);
	toolContext.fill('evenodd');
}

function drawSpirograph(stator, rotor, startDistance, endDistance, penX, penY, initialRotationDist) {
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

	let animFunction;
	const promise = new Promise(function (resolve, reject) {
		animFunction = function (time) {
			if (animFunction === undefined) {
				reject();
				return;
			}
			if (animSpeed === 0) {
				return;
			}

			let maxStep;
			if (animSpeed < 100) {
				const stepsPerMilli = stepsPerRotation / (maxRotationTime / 100 * (101 - animSpeed));
				maxStep = (time - beginTime) * stepsPerMilli;
				if (maxStep > numSteps) {
					maxStep = numSteps;
				}
			} else {
				maxStep = numSteps;
			}

			while (stepNumber <= maxStep) {
				const distance = startDistance + stepNumber * increment;
				placeRotor(stator, rotor, startDistance, distance, initialRotationDist);
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

			if (toolsVisible) {
				drawTools(stator, rotor, penX, penY);
			}
			restoreCanvas();
			spiroContext.stroke();

			if (stepNumber <= numSteps) {
				requestAnimationFrame(animFunction);
			} else {
				resolve();
			}
		};
		requestAnimationFrame(animFunction);
	}); // end of Promise definition

	function continueAnim() {
		if (stepNumber <= numSteps) {
			requestAnimationFrame(animFunction);
		}
	};

	function cancelAnim() {
		if (animFunction) {
			requestAnimationFrame(animFunction);
			animFunction = undefined;
		}
	};

	return new AnimationController(promise, continueAnim, cancelAnim, startDistance);
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
		const angle = distance / radius;
		return [
			radius * Math.cos(angle),	// x-coordinate
			radius * Math.sin(angle), 	// y-coordinate
			angle + Math.PI				// angle of the normal in radians
		];
	}

	draw(context) {
		context.beginPath();
		context.arc(0, 0, this.radius, 0, 2 * Math.PI);
		context.stroke();
	}

}

class CircleRotor {
	constructor(stator, numTeeth) {
		this.numTeeth = numTeeth;
		this.radiusA = numTeeth * stator.toothSize / (2 * Math.PI);
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
			this.radiusA * Math.sin(angle)
		];
	}
}

const spiroCanvas = document.getElementById('spirograph-canvas');
const spiroContext = spiroCanvas.getContext('2d');
spiroContext.globalCompositeOperation = 'multiply';
spiroContext.lineCap = 'round';
spiroContext.lineJoin = 'round';
const toolCanvas = document.getElementById('tool-canvas');
const toolContext = toolCanvas.getContext('2d');
const savedCanvas = document.createElement('canvas');
savedCanvas.width = spiroCanvas.width;
savedCanvas.height = spiroCanvas.height;
const saveContext = savedCanvas.getContext('2d');
const toolColor = 'rgba(0, 64, 255, 0.5)';
toolContext.strokeStyle = toolColor;
toolContext.fillStyle = toolColor;
let scale = spiroCanvas.width >= spiroCanvas.height ? spiroCanvas.height / 2: spiroCanvas.width / 2;
let width = spiroCanvas.width / scale;
let height = spiroCanvas.height / scale;
spiroContext.scale(scale, scale);
spiroContext.translate(1, 1);
spiroContext.lineWidth = parseInt(penWidthInput.value) / scale;
toolContext.scale(scale, scale);
toolContext.translate(1, 1);
toolContext.lineWidth = 2 / scale;

function updateNumberOfPoints() {
	const numPoints = lcm(stator.numTeeth, rotor.numTeeth) / rotor.numTeeth;
	numPointsSpan.innerText = numPoints;
}

function randomizeSpirographForm() {
	const rotors = document.getElementById('rotor-teeth-list').children;
	const rotorIndex = Math.trunc(Math.random() * rotors.length);
	const rotorTeeth = rotors[rotorIndex].innerText;
	document.getElementById('rotor-teeth').value = rotorTeeth;
	const statorTeeth = Math.random() < 0.5 ? 96 : 105;
	document.getElementById('stator-teeth').value = statorTeeth;
}

function cancelDrawing() {
	initialRotationDist = animController.startDistance - currentDistance + initialRotationDist;
	const startTooth = parseFloat(startToothInput.value);
	if (startTooth >= 1) {
		// Check if start tooth has been changed since drawing began
		const startDistance = (startTooth - 1) * stator.toothSize;
		if (startDistance !== animController.startDistance) {
			initialRotationDist = 0;
		}
	}
	if (initialRotationDist !== 0) {
		startToothInput.value = ((currentDistance / stator.toothSize) % stator.numTeeth) + 1;
	}
	drawingEnded();
	// TODO revise end distance
}

function drawingEnded() {
	drawButton.classList.remove('btn-warning');
	drawButton.innerText = 'Draw Shape';
	animController = undefined;
}

function drawSpirographFromForm() {
	drawButton.classList.add('btn-warning');
	drawButton.innerText = 'Stop';
	numStatorTeeth = parseInt(statorTeethInput.value);
	statorRadius = parseFraction(statorRadiusInput.value);
	stator = new InnerCircleStator(numStatorTeeth, statorRadius);
	numRotorTeeth = parseInt(rotorTeethInput.value);
	rotor = new CircleRotor(stator, numRotorTeeth);
	changePenPosition(rotor, penOffsetX, penOffsetY);
	const startTooth = parseFloat(startToothInput.value);
	const startDistance = (startTooth - 1) * stator.toothSize;
	spiroContext.globalAlpha = 1;
	animController = drawSpirograph(stator, rotor, startDistance, undefined, penX, penY, initialRotationDist);
	animController.promise = animController.promise.catch(cancelDrawing).then(drawingEnded);
	updateNumberOfPoints();
}

randomizeSpirographForm();
drawSpirographFromForm();
animController.promise = animController.promise.then(function (event) {
	document.getElementById('tool-canvas').classList.add('invisible');
	toolsVisible = false;
	document.getElementById('btn-toggle-tools').innerText = 'Show Gears';
});

function queryChecked(ancestor, name) {
	return ancestor.querySelector(`:checked[name=${name}]`);
}

function checkInput(ancestor, name, value) {
	ancestor.querySelector(`[name=${name}][value=${value}]`).checked = true;
}

drawButton.addEventListener('click', function (event) {
	if (animController) {
		event.preventDefault();
		animController.cancel();
	}
});

document.getElementById('spirograph-form').addEventListener('submit', function (event) {
	event.preventDefault();
	drawSpirographFromForm();
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
		let startDistance = currentDistance;
		let startTooth;	// Here can be a fraction less than one or an integer
		if (savedStartTooth) {
			startTooth = savedStartTooth;
			startToothInput.value = startTooth;
		} else {
			startTooth = parseFloat(startToothInput.value);
		}
		if (startTooth >= 1) {
			startTooth = Math.trunc(startTooth);
			startToothInput.value = startTooth;
			startDistance = (startTooth - 1) * stator.toothSize;
		}
		initialRotationDist = 0;
		rotor = new CircleRotor(stator, numRotorTeeth);
		if (toolsVisible) {
			placeRotor(stator, rotor, startDistance, startDistance, 0);
			changePenPosition(rotor, penOffsetX, penOffsetY);
			drawTools(stator, rotor, penX, penY);
		}
		updateNumberOfPoints();
	}
});

function makeNewStator() {
	stator = new InnerCircleStator(numStatorTeeth, statorRadius);
	rotor = new CircleRotor(stator, numRotorTeeth);
	let startDistance = currentDistance;
	let startTooth = parseFloat(startToothInput.value);
	if (startTooth >= 1) {
		startTooth = Math.trunc(startTooth);
		startToothInput.value = startTooth;
		startDistance = (startTooth - 1) * stator.toothSize;
	}
	initialRotationDist = 0;
	if (toolsVisible) {
		placeRotor(stator, rotor, startDistance, startDistance, 0);
		changePenPosition(rotor, penOffsetX, penOffsetY);
		drawTools(stator, rotor, penX, penY);
	}
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
	} else {
		this.setCustomValidity('Please enter a positive number.');
	}
});

startToothInput.addEventListener('change', function (event) {
	const startTooth = parseFloat(this.value);
	if (startTooth >= 1) {
		savedStartTooth = startTooth;
		initialRotationDist = 0;
		if (toolsVisible) {
			const startDistance = (startTooth - 1) * stator.toothSize;
			placeRotor(stator, rotor, startDistance, startDistance, 0);
			drawTools(stator, rotor, penX, penY);
		}
	}
});

function updatePenXReadout(event) {
	penOffsetX = parseFloat(penXSlider.value);
	document.getElementById('pen-x-readout').innerText = Math.round(penOffsetX * 100) + '%';
	changePenPosition(rotor, penOffsetX, penOffsetY);
	if (toolsVisible) {
		drawTools(stator, rotor, penX, penY);
	}
}
updatePenXReadout();
penXSlider.addEventListener('input', updatePenXReadout);

function updatePenYReadout(event) {
	penOffsetY = -parseFloat(penYSlider.value);
	document.getElementById('pen-y-readout').innerText = Math.round(-penOffsetY * 100) + '%';
	changePenPosition(rotor, penOffsetX, penOffsetY);
	if (toolsVisible) {
		drawTools(stator, rotor, penX, penY);
	}
}
updatePenYReadout()
penYSlider.addEventListener('input', updatePenYReadout);

animSpeedSlider.addEventListener('input', function (event) {
	setAnimSpeed(parseInt(this.value));
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

penWidthInput.addEventListener('input', function (event) {
	spiroContext.lineWidth = parseInt(this.value) / scale;
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
		spiroContext.clearRect(-1, -1, width, height);
		if (toolsVisible) {
			placeRotor(stator, rotor, 0, 0, 0);
			drawTools(stator, rotor, penX, penY);
		}
		startToothInput.value = 1;
		savedStartTooth = undefined;
	}
	if (animController) {
		animController.promise.then(reset);
		animController.cancel();
	} else {
		reset();
	}
	$('#erase-modal').modal('hide');
});

$(function () {
  $('[data-toggle="tooltip"]').tooltip()
});
