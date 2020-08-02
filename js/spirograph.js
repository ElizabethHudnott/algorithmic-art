'use strict';

const hole1Distance = 0.1;
const pointerSize = 4;
const defaultCompositioOp = 'multiply';

let rawScale, fixedScale, scale, width, height;
let fixedSwirlRotation, fixedSwirlRadius;
let gearsVisible = true;
let stator, rotor, numStatorTeeth, numRotorTeeth, savedStartTooth, initialRotationDist;
let inOut = document.getElementById('rotor-position-inside').checked ? -1 : 1;
let translationStepsX = 0, translationStepsY = 0, translateX = 0, translateY = 0, offset;
let currentDistance = 0;
let rotorX = 0;
let rotorY = 0;
let rotorAngle = 0;
let penX = 0;
let penY = 0;
let lineDash = [];
let maxHole, animSpeed, animController;
let isFilled = false;
let currentTool = queryChecked(document.getElementById('tools'), 'tool').value;
let currentClickX, currentClickY, mouseClickedX, mouseClickedY, mouseClickedR, mouseClickedTheta;
let currentPath = new Path2D();
let lastPath, currentPathIsEmpty, nextPath;
let mouseX = 0, mouseY = 0, mouseR = 0, mouseTheta = 0, prevMouseR = 0, prevMouseTheta = 0;
let mirrorAngle, mirrorMouseAngle, onMirrorLine, clickedOnMirrorLine;
let mirrorSymmetry = false;
let drawingMouseDown = false; // When true then we draw while mouse button is held down.
let numPointsInPath = 0; // Number of points in the current freehand path
let compositionOp = 'multiply';

const drawButton = document.getElementById('btn-draw');
const symmetryInput = document.getElementById('symmetry');
let symmetry = parseInt(symmetryInput.value);
if (!Number.isFinite(symmetry)) {
	symmetry = 1;
}
let symmetryAngle = TWO_PI / symmetry;
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
	startToothInput.value = 0;
}
const revolutionsInput = document.getElementById('revolutions');
const animSpeedSlider = document.getElementById('anim-speed');
setAnimSpeed(parseInt(animSpeedSlider.value));
const penWidthInput = document.getElementById('pen-width');
let lineWidth = parseInt(penWidthInput.value);
const lineDashInput = document.getElementById('line-dash');
const translationXInput = document.getElementById('translation-x');
const translationYInput = document.getElementById('translation-y');
translationStepsX = parseFloat(translationXInput.value);
if (!Number.isFinite(translationStepsX)) {
	translationStepsX = 0;
}
translationStepsY = parseFloat(translationYInput.value);
if (!Number.isFinite(translationStepsY)) {
	translationStepsY = 0;
}
const penSwatches = document.getElementsByName('pen-color');
const customPenInput = document.getElementById('custom-pen-color');
let customColor = customPenInput.value;
const paperSwatches = document.getElementsByName('paper-color');
const customPaperInput = document.getElementById('custom-paper-color');
const paperImageInput = document.getElementById('paper-image');
const opacityInput = document.getElementById('outer-opacity');
const opacityInput2 = document.getElementById('inner-opacity');
const gradientDirectionInput = document.getElementById('gradient-direction');


function maxLength(rotor, penX, penY) {
	if (penY === 0) {
		return rotor.radiusA + penX;
	}
	const distanceFromCentre = Math.hypot(penX, penY);
	// Sort of assume a rectangular bounding box but no chord through the shape can be longer than radiusA.
	const distanceFromEdge = Math.min(rotor.radiusB / penY * distanceFromCentre, rotor.radiusA);
	return distanceFromCentre + distanceFromEdge;
}

function minLength(rotor, penX, penY) {
	if (penY === 0) {
		return rotor.radiusA - penX;
	}
	const distanceFromCentre = Math.hypot(penX, penY);
	return Math.min(rotor.radiusB / penY * distanceFromCentre, rotor.radiusA) - distanceFromCentre;
}

function maxRadii(stator, rotor, inOut, penX, penY, lineWidth) {
	const halfLineWidth = lineWidth / 2;
	let maxRadiusA, maxRadiusB;
	if (inOut === -1) {
		const length = minLength(rotor, penX, penY) - halfLineWidth;
		maxRadiusA = stator.radiusA - length;
		maxRadiusB = stator.radiusB - length;
	} else {
		const length = maxLength(rotor, penX, penY) - halfLineWidth;
		maxRadiusA = stator.radiusA + length;
		maxRadiusB = stator.radiusB + length;
	}
	return [maxRadiusA, maxRadiusB];
}

function setFillStyle() {
	const [outerR, outerG, outerB] = hexToRGBA(spiroContext.strokeStyle);
	const outerColor = rgba(outerR, outerG, outerB, parseFloat(opacityInput.value));

	let innerColor = outerColor;
	if (document.getElementsByClassName('inner-fill-controls')[0].classList.contains('show')) {
		innerColor = rgba(outerR, outerG, outerB, parseFloat(opacityInput2.value));

		const [maxRadiusA, maxRadiusB] = maxRadii(stator, rotor, inOut, penX, penY, spiroContext.lineWidth);
		let minRadius = 0;
		const centreStyle = queryChecked(document.getElementById('gradient-centre'), 'gradient-centre').value;
		if (centreStyle !== 'gradient') {
			const halfLineWidth = spiroContext.lineWidth / 2;
			if (inOut === -1) {
				minRadius = Math.abs(stator.radiusB - maxLength(rotor, penX, penY)) + halfLineWidth;
			} else {
				minRadius = stator.radiusB + minLength(rotor, penX, penY) + halfLineWidth;
			}
		}

		let gradient;
		if (queryChecked(document.getElementById('gradient-type'), 'gradient-type').value === 'radial') {
			gradient = spiroContext.createRadialGradient(translateX, translateY, minRadius, translateX, translateY, maxRadiusA);
			gradient.addColorStop(0, innerColor);
			gradient.addColorStop(1, outerColor);
		} else {
			const direction = parseFraction(gradientDirectionInput.value);
			if (!Number.isFinite(direction)) {
				gradientDirectionInput.setCustomValidity('Please fill in this field.');
				gradientDirectionInput.reportValidity();
				return false;
			}
			const theta = TWO_PI * direction - HALF_PI;
			const xDistance = maxRadiusA * Math.cos(theta);
			const yDistance = maxRadiusB * Math.sin(theta);
			const x1 = translateX - xDistance;
			const y1 = translateY - yDistance;
			const x2 = translateX + xDistance;
			const y2 = translateY + yDistance;
			gradient = spiroContext.createLinearGradient(x1, y1, x2, y2);
			gradient.addColorStop(0, outerColor);
			gradient.addColorStop(0.5 * (1 - minRadius / maxRadiusA), innerColor);
			gradient.addColorStop(0.5 * (1 + minRadius / maxRadiusA), innerColor);
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
	return animController && animController.status === AnimationController.Status.RUNNING;
}

function setAnimSpeed(newSpeed) {
	animSpeed = newSpeed;
	if (isAnimating()) {
		animController.continue();
	}
}

function saveCanvas() {
	saveContext.clearRect(0, 0, savedCanvas.width, savedCanvas.height);
	saveContext.drawImage(spiroCanvas, 0, 0);
}

function restoreCanvas() {
	spiroContext.setTransform(scale, 0, 0, scale, scale, scale);
	spiroContext.globalCompositeOperation = 'source-over';
	spiroContext.clearRect(-1, -1, width, height);
	spiroContext.drawImage(savedCanvas, -1, -1, width, height);
	spiroContext.globalCompositeOperation = compositionOp;
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

function eraseTools() {
	toolContext.setTransform(scale, 0, 0, scale, scale, scale);
	toolContext.clearRect(-1, -1, width, height);
}

function drawTools(stator, rotor, penX, penY) {
	eraseTools();
	if (gearsVisible) {
		toolContext.lineWidth = 2 / scale;
		toolContext.strokeStyle = toolColor;
		stator.draw(toolContext, translateX, translateY);
		toolContext.strokeStyle = toolColor;
		toolContext.translate(rotorX, rotorY);
		toolContext.rotate(rotorAngle);
		rotor.draw(toolContext, 0, 0);
		toolContext.arc(penX, penY, Math.max(lineWidth / 2, 5) / scale, 0, TWO_PI);
		toolContext.fill('evenodd');
		toolContext.setTransform(scale, 0, 0, scale, scale, scale);
	}
	drawMousePointers();
}

function drawMousePointers() {
	if (mouseR === undefined) {
		return;
	}
	const numPointers = Math.abs(mouseR) < 1 / scale ? 1 : symmetry;
	toolContext.lineWidth = 1 / scale;
	let color = 'red';

	if (mirrorSymmetry) {

		for (let i = 0; i < numPointers; i++) {
			const thisMirrorAngle = mirrorAngle + i * symmetryAngle;
			let angle = thisMirrorAngle + mirrorMouseAngle;
			drawMousePointer(mouseR, angle, color);
			color = 'black';
			if (!onMirrorLine) {
				angle = thisMirrorAngle - mirrorMouseAngle;
				drawMousePointer(mouseR, angle, 'black');
			}
		}

	} else {

		for (let i = 0; i < numPointers; i++) {
			const angle = mouseTheta + i * symmetryAngle;
			drawMousePointer(mouseR, angle, color);
			color = 'black';
		}

	}
}

function drawMousePointer(r, theta, color) {
	const x = Math.round((translateX + mouseR * Math.cos(theta)) * scale) / scale + 0.5 / scale;
	const y = Math.round((translateY + mouseR * Math.sin(theta)) * scale) / scale + 0.5 / scale;

	// Shadow
	toolContext.beginPath();
	toolContext.moveTo(x + 1 / scale, y - pointerSize / scale);
	toolContext.lineTo(x + 1 / scale, y + pointerSize / scale);
	toolContext.strokeStyle = 'white';
	toolContext.stroke();
	toolContext.beginPath();
	// Top line
	toolContext.moveTo(x, y - pointerSize / scale);
	toolContext.lineTo(x, y - 1 / scale);
	// Bottom line
	toolContext.moveTo(x, y + 1 / scale);
	toolContext.lineTo(x, y + pointerSize / scale);
	// Left line
	toolContext.moveTo(x - pointerSize / scale, y);
	toolContext.lineTo(x - 1 / scale, y);
	// Right line
	toolContext.moveTo(x + 1 / scale, y);
	toolContext.lineTo(x + pointerSize / scale, y);
	toolContext.strokeStyle = color;
	toolContext.stroke();
}

function stepMultiplier(stator, rotor, penX, penY) {
	const maxRadius = maxLength(rotor, penX, penY) + spiroContext.lineWidth / 2;
	const maxAngle = stator.toothSize / stator.radiusB; // As if it had a circular part with a radius of radiusB
	const maxArc = maxAngle * maxRadius * scale;
	return maxArc < 1 ? 1 : Math.trunc(maxArc);
}

class SpiroDescription {
	constructor(stator, rotor) {
		this.stator = stator;
		this.rotor = rotor;
		this.inOut = -1;
		this.translateX = 0;
		this.translateY = 0;
		this.rotation = 0;
		this.startDistance = 0;
		this.endDistance = undefined;
		this.teethPerStep = 1;
		this.penX = rotor.radiusA;
		this.penY = 0;
		this.initialRotationDist = 0;
		this.swirlAmount = 0;
		this.swirlRate = 1;
		this.swirlCompensation = 0;
		this.swirlRadius = 1;
	}
}

function drawSpirograph(description) {
	const stator = description.stator;
	const rotor = description.rotor;
	const inOut = description.inOut;
	const translateX = description.translateX;
	const translateY = description.translateY;
	const rotation = description.rotation;
	const startDistance = description.startDistance;
	let endDistance = description.endDistance;
	const teethPerStep = description.teethPerStep;
	const penX = description.penX;
	const penY = description.penY;
	let initialRotationDist = description.initialRotationDist;
	const swirlAmount = description.swirlAmount;
	const swirlRate = description.swirlRate;
	const swirlCompensation = description.swirlCompensation;
	const swirlRadius = description.swirlRadius;

	if (endDistance === undefined) {
		endDistance = startDistance + stator.toothSize * lcm(stator.numTeeth, rotor.numTeeth);
	}
	if (initialRotationDist === undefined) {
		initialRotationDist = getInitialRotation();
	}
	const increment = teethPerStep * stator.toothSize / stepMultiplier(stator, rotor, penX, penY);

	const numSteps = (endDistance - startDistance) / increment;
	const stepsPerRotation = (640 * Math.PI / scale) / increment;
	let stepNumber = 0;

	saveCanvas();
	spiroContext.setTransform(scale, 0, 0, scale, scale, scale);
	currentPath = new Path2D();

	const newAnimController = new AnimationController({
		startDistance: startDistance,
		longestTimeStep: maxRotationTime,
	});

	const promise = new Promise(function (resolve, reject) {
		function animate(time) {
			if (newAnimController.status === AnimationController.Status.ABORTED || animSpeed === 0) {
				return;
			}
			let beginTime = newAnimController.beginTime;
			if (beginTime === undefined) {
				newAnimController.setup(animate, reject, time);
				beginTime = time;
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
			if (Math.abs(rotation) % HALF_PI === 0 && lineWidth % 2 === 1) {
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

				if (swirlAmount !== 0) {
					const dx = plotX - translateX;
					const dy = plotY - translateY;
					const r = Math.hypot(dx, dy);
					let theta = Math.atan2(dy, dx);
					theta -= swirlCompensation;
					if (swirlRate === 1) {
						theta += swirlAmount * r / swirlRadius;
					} else {
						theta += swirlAmount / (swirlRate - 1) * (swirlRate ** (r / swirlRadius) - 1);
					}
					plotX = r * Math.cos(theta) + translateX;
					plotY = r * Math.sin(theta) + translateY;
				}

				if (lineWidth === 1) {
					plotX = Math.round(plotX * scale) / scale + shift;
					plotY = Math.round(plotY * scale) / scale + shift;
				}

				if (stepNumber === 0) {
					currentPath.moveTo(plotX, plotY);
				} else {
					currentPath.lineTo(plotX, plotY);
				}
				stepNumber++;
				if (stepNumber > numSteps && stepNumber < numSteps + 1) {
					stepNumber = numSteps;
				}
			}

			drawTools(stator, rotor, penX, penY);
			restoreCanvas();
			spiroContext.globalAlpha = parseFloat(opacityInput.value);
			spiroContext.stroke(currentPath);
			spiroContext.globalAlpha = 1;

			if (stepNumber <= numSteps) {
				requestAnimationFrame(animate);
			} else {
				newAnimController.finish(resolve);
			}
		};
		requestAnimationFrame(animate);
	}); // end of Promise definition

	newAnimController.promise = promise;

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
			this.initialRotation = -HALF_PI;
		}
	}
}

class CircularGear extends Gear {

	constructor(numTeeth, arg2) {
		super(numTeeth, arg2, 1);
		if (arg2 instanceof Gear) {
			this.radiusA = numTeeth * arg2.toothSize / (TWO_PI);
			this.radiusB = this.radiusA;
		} else {
			this.toothSize = TWO_PI * arg2 / numTeeth;
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
		context.ellipse(x, y, this.radiusA, this.radiusB, 0, 0, TWO_PI);
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
			this.radiusA = numTeeth / (4 * (1 - aspectRatio) + TWO_PI * aspectRatio) * this.toothSize;
			this.radiusB = this.radiusA * aspectRatio;
		} else {
			this.toothSize = (4 * (arg2 - this.radiusB) + TWO_PI * this.radiusB) / numTeeth;
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
		context.moveTo(x - ra + rb, y - rb);
		context.lineTo(x + ra - rb, y - rb);
		context.arc(x + ra - rb, y, rb, -HALF_PI, HALF_PI);
		context.lineTo(x - ra + rb, y + rb);
		context.arc(x - ra + rb, y, rb, HALF_PI, -HALF_PI);
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
	const numTeeth = TWO_PI * rotor.radiusA / stator.toothSize;
	maxHole = Math.max(Math.round(0.5 * numTeeth) - 6, 2);
	penXSlider.max = maxHole;
	const hole1Fraction = 1 - hole1Distance / rotor.radiusA;
	penXSlider.min = Math.trunc(maxHole - 1 / hole1Fraction * (maxHole - 1));
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
	rawScale = pixelWidth >= pixelHeight ? pixelHeight / 2 : pixelWidth / 2;
	calcScale();
	restoreCanvas();
	savedCanvas.width = pixelWidth;
	savedCanvas.height = pixelHeight;

	spiroContext.strokeStyle = penColor;
	spiroContext.lineCap = 'round';
	spiroContext.lineJoin = 'round';
	toolContext.strokeStyle = toolColor;
	toolContext.fillStyle = toolColor;
}

function updateNumberOfPoints() {
	const toothLength = lcm(stator.numTeeth, rotor.numTeeth);
	const numRevolutions = toothLength / stator.numTeeth;
	numRevsSpan.innerText = numRevolutions;
	const numPoints = toothLength / rotor.numTeeth;
	numPointsSpan.innerText = numPoints;
	const incrementSF = stepMultiplier(stator, rotor, penX, penY);
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
	makeStator();
	rotor = new CircularGear(numRotorTeeth, stator);
	penYSlider.value = 0;
	updatePenYReadout();
	calcMaxHole();
	penXSlider.value = Math.trunc(Math.random() * maxHole);
	updatePenXReadout();
	setPenColor.call(penSwatches[Math.trunc(Math.random() * 9)].parentElement);
}

function drawingEnded() {
	initialRotationDist = animController.startDistance - currentDistance + initialRotationDist;
	const startTooth = parseFloat(startToothInput.value);
	if (Number.isFinite(startTooth)) {
		// Check if start tooth has been changed since drawing began
		const startDistance = startTooth * stator.toothSize;
		if (startDistance !== animController.startDistance) {
			setInitialRotation();
		}
	}
	if (initialRotationDist !== 0) {
		const toothNumber = (currentDistance / stator.toothSize) % stator.numTeeth;
		const roundedToothNum = Math.round(toothNumber * 1000) / 1000;
		startToothInput.value = roundedToothNum;
	}
	// TODO revise end distance
	updateRotorPosition();
	drawTools(stator, rotor, penX, penY);
	const img = drawButton.children[0];
	img.src = 'img/spirograph.png';
	img.alt = 'Draw shape';
	img.title = 'Draw pattern';
}

function calcScale() {
	if (fixedScale !== undefined) {
		scale = fixedScale;
	} else if (inOut === 1) {
		scale = rawScale / (stator.radiusA + maxLength(rotor, penX, penY)) - lineWidth / 2;
	} else {
		scale = rawScale;
	}
	width = spiroCanvas.width / scale;
	height = spiroCanvas.height / scale;
	spiroContext.lineWidth = lineWidth / scale;
}

function calcOffset() {
	if (offset !== undefined) {
		return offset;
	} else if (inOut === 1) {
		return stator.radiusA + maxLength(rotor, penX, penY) + spiroContext.lineWidth / 2 - 1;
	} else if (stator.radiusA > 1) {
		return stator.radiusA - minLength(rotor, penX, penY) + spiroContext.lineWidth / 2 - 1;
	} else {
		return stator.radiusA - 1 + spiroContext.lineWidth / 2;
	}
}

function calcTransform() {
	calcScale();
	let xUnit = 2, yUnit = 2;
	if (document.getElementById('translation-x-units').value === 'teeth') {
		xUnit = stator.toothSize;
	}
	if (document.getElementById('translation-y-units').value === 'teeth') {
		yUnit = stator.toothSize;
	}
	translateX = translationStepsX * xUnit * rawScale / scale;
	translateY = translationStepsY * yUnit * rawScale / scale;
	let extraSpace = calcOffset();
	translateX += extraSpace;
	translateY += extraSpace;
}

function drawSpirographAction() {
	const img = drawButton.children[0];
	img.src = 'img/control_stop_blue.png';
	img.alt = 'Stop';
	img.title = 'Stop drawing';
	cancelDrawing();
	let startTooth = parseFloat(startToothInput.value);
	const startDistance = startTooth * stator.toothSize;
	const increment = parseFloat(incrementInput.value);
	let endDistance;
	if (document.getElementById('end-point-numbered').checked) {
		const numRevolutions = parseFloat(revolutionsInput.value);
		endDistance = startDistance + stator.numTeeth * stator.toothSize * numRevolutions;
	}
	const rotationTooth = parseFloat(document.getElementById('rotation').value);
	const rotation = rotationTooth;
	offset = calcOffset();
	fixedScale = scale;
	isFilled = false;

	const description = new SpiroDescription(stator, rotor);
	description.inOut = inOut;
	description.translateX = translateX;
	description.translateY = translateY;
	description.rotation = rotation;
	description.startDistance = startDistance;
	description.endDistance = endDistance;
	description.teethPerStep = increment;
	description.penX = penX;
	description.penY = penY;
	description.initialRotationDist = initialRotationDist;
	description.swirlAmount = parseFloat(document.getElementById('swirl-amount').value) * Math.PI / 180;
	description.swirlRate = 2 ** (parseFloat(document.getElementById('swirl-rate').value) - 1);
	if (document.getElementById('swirl-rotate').checked) {
		description.swirlCompensation = description.swirlAmount;
		if (fixedSwirlRotation === undefined) {
			fixedSwirlRotation = description.swirlAmount;
		}
	} else if (fixedSwirlRotation !== undefined) {
		description.swirlCompensation = fixedSwirlRotation;
	} else {
		fixedSwirlRotation = 0;
	}
	if (document.getElementById('swirl-radius-fix').checked) {
		if (fixedSwirlRadius === undefined) {
			fixedSwirlRadius = Math.max(...maxRadii(stator, rotor, inOut, penX, penY, spiroContext.lineWidth));
		}
		description.swirlRadius = fixedSwirlRadius;
	} else {
		description.swirlRadius = Math.max(...maxRadii(stator, rotor, inOut, penX, penY, spiroContext.lineWidth));
	}

	animController = drawSpirograph(description);
	animController.promise = animController.promise.then(drawingEnded, drawingEnded);
	updateNumberOfPoints();
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

document.getElementById('btn-hamburger').addEventListener('click', function (event) {
	document.getElementById('spirograph-form').classList.toggle('collapsed-horizontal');
});

document.getElementById('btn-fill').addEventListener('click', function (event) {
	cancelDrawing();
	if (isFilled && compositionOp !== 'destination-out') {
		// TODO replace with an undo action
		spiroContext.globalCompositeOperation = 'color';
	}
	let success = setFillStyle();
	if (success) {
		spiroContext.fill(currentPath, 'evenodd');
		isFilled = true;
		spiroContext.globalCompositeOperation = compositionOp;
	}
});

document.getElementById('btn-randomize').addEventListener('click', function (event) {
	randomizeSpirographForm();
	calcTransform();
	setInitialRotation();
});

for (const item of document.getElementById('tools').children) {
	item.addEventListener('click', function (event) {
		currentTool = this.querySelector('input').value;
		const imgFilename = this.querySelector('img').src.slice(0, -4) + '_32.png';
		document.getElementById('btn-tools').children[0].src = imgFilename;
	});
}

document.getElementById('btn-toggle-gears').addEventListener('click', function (event) {
	gearsVisible = !gearsVisible;
	if (gearsVisible) {
		drawTools(stator, rotor, penX, penY);
	} else {
		eraseTools();
	}
});

/** Checks to see if the rotor is small enough to fit inside the stator. */
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
			startDistance = startTooth * stator.toothSize;
		}
		rotor = new CircularGear(numRotorTeeth, stator);
		checkRotorSize();
		setInitialRotation();
		calcMaxHole();
		updatePenXReadout();
		changePenPosition(rotor, penOffsetX, penOffsetY);
		calcTransform();
		if (!isAnimating()) {
			placeRotor(stator, rotor, inOut, translateX, translateY, startDistance, startDistance, initialRotationDist);
			drawTools(stator, rotor, penX, penY);
		}
		updateNumberOfPoints();
	}
});

function makeStator() {
	const shape = document.getElementById('stator-shape').value;
	let aspectRatio = parseFloat(statorAspectInput.value);
	if (aspectRatio <= 0 || aspectRatio > 1) {
		aspectRatio = stator.radiusB / stator.radiusA;
	}
	const constructor = gearConstructors.get(shape);
	stator = new constructor(numStatorTeeth, statorRadius, aspectRatio);
	rotor = new CircularGear(numRotorTeeth, stator);
	if (rotor.radiusA >= stator.radiusB) {
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
		startDistance = startTooth * stator.toothSize;
	}
	setInitialRotation();
	changePenPosition(rotor, penOffsetX, penOffsetY);
	calcTransform();
	if (!isAnimating()) {
		placeRotor(stator, rotor, inOut, translateX, translateY, startDistance, startDistance, initialRotationDist);
		drawTools(stator, rotor, penX, penY);
	}
	updateNumberOfPoints();

	if (numStatorTeeth >= 105) {
		document.getElementById('start-position-multiple').value = 7;
	} else if (numStatorTeeth >= 96) {
		document.getElementById('start-position-multiple').value = 8;
	}
	document.getElementById('start-position').value = 1;
}

statorTeethInput.addEventListener('change', function (event) {
	const numStatorTeethEntered = parseInt(this.value);
	if (numStatorTeethEntered >= 3) {
		numStatorTeeth = numStatorTeethEntered;
		startToothInput.value = 0;
		savedStartTooth = undefined;
		makeStator();
	}
});

document.getElementById('stator-shape').addEventListener('input', function (event) {
	if (savedStartTooth !== undefined) {
		startToothInput.value = savedStartTooth;
	} else {
		startToothInput.value = 0;
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
	calcTransform();
	setInitialRotation();
});

document.getElementById('stator-aspect').addEventListener('input', function (event) {
	const newValue = parseFloat(this.value);
	if (newValue > 0 && newValue <= 1) {
		makeStator();
		this.setCustomValidity('');
	} else {
		this.setCustomValidity('Please enter any positive decimal up to 1.');
	}
});

document.getElementById('rotor-position-inside').addEventListener('input', function (event) {
	inOut = -1;
	calcTransform();
	setInitialRotation();
});

document.getElementById('rotor-position-outside').addEventListener('input', function (event) {
	inOut = 1;
	calcTransform();
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

function updateStartTooth() {
	const startTooth = parseFloat(startToothInput.value);
	if (Number.isFinite(startTooth)) {
		savedStartTooth = startTooth;
		setInitialRotation();
		if (!isAnimating()) {
			const startDistance = startTooth * stator.toothSize;
			placeRotor(stator, rotor, inOut, translateX, translateY, startDistance, startDistance, initialRotationDist);
			drawTools(stator, rotor, penX, penY);
		}
	}
}

startToothInput.addEventListener('change', updateStartTooth);

document.getElementById('start-position-form').addEventListener('submit', function (event) {
	event.preventDefault();
	const markNumber = parseInt(document.getElementById('start-position').value);
	const teethPerMark = parseInt(document.getElementById('start-position-multiple').value);
	startToothInput.value = Math.round((markNumber - 1) * teethPerMark);
	updateStartTooth();
	$('#start-position-modal').modal('hide');
});

$('#start-position-modal').on('shown.bs.modal', focusFirst);

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
	const holeNumber = parseInt(penXSlider.value);
	const newOffset = (maxHole - holeNumber) / (maxHole - 1) * (1 - hole1Distance / rotor.radiusA);

	if (rotor.isPointInside(newOffset, penOffsetY)) {
		document.getElementById('pen-x-readout').innerText = 'Hole ' + holeNumber;
		penOffsetX = newOffset;
		changePenPosition(rotor, penOffsetX, penOffsetY);
		calcTransform();
		updateRotorPosition();
		if (!isAnimating()) {
			drawTools(stator, rotor, penX, penY);
		}
		updateNumberOfPoints();
	}
}
penXSlider.addEventListener('input', updatePenXReadout);
penXSlider.addEventListener('change', function (event) {
	const match = document.getElementById('pen-x-readout').innerText.match(/-?\d+$/);
	const holeNumber = parseInt(match[0]);
	if (holeNumber !== this.value) {
		this.value = holeNumber;
	}
});

function updatePenYReadout() {
	const newOffset = parseFloat(penYSlider.value);
	if (rotor.isPointInside(penOffsetX, newOffset)) {
		penOffsetY = newOffset;
		document.getElementById('pen-y-readout').innerText = Math.round(penOffsetY * 100) + '%';
		changePenPosition(rotor, penOffsetX, penOffsetY);
		calcTransform();
		updateRotorPosition();
		if (!isAnimating()) {
			drawTools(stator, rotor, penX, penY);
		}
		updateNumberOfPoints();
	}
}
penYSlider.addEventListener('input', updatePenYReadout);
penYSlider.addEventListener('change', function (event) {
	if (parseFloat(this.value) !== penOffsetY) {
		this.value = penOffsetY;
	}
});

animSpeedSlider.addEventListener('input', function (event) {
	setAnimSpeed(parseInt(this.value));
});

penWidthInput.addEventListener('input', function (event) {
	if (this.value !== '') {
		lineWidth = parseInt(this.value);
		spiroContext.lineWidth =  lineWidth / scale;
		parseAndTrimLineDash();
		calcTransform();
		if (!isAnimating()) {
			updateRotorPosition();
			drawTools(stator, rotor, penX, penY);
		}
	}
});

function parseAndTrimLineDash() {
	if (lineDashInput.checkValidity()) {
		lineDash = parseLineDash(lineDashInput.value);
		adjustLineDash(lineDash, lineWidth);
		setLineDash();
	}
}

function setLineDash() {
	const numValues = lineDash.length;
	const scaledLengths = new Array(numValues);
	for (let i = 0; i < numValues; i++) {
		scaledLengths[i] = lineDash[i] / scale;
	}
	spiroContext.setLineDash(scaledLengths);
}

lineDashInput.addEventListener('change', parseAndTrimLineDash);

translationXInput.addEventListener('change', function (event) {
	const amount = parseFloat(this.value);
	if (Number.isFinite(amount)) {
		translationStepsX = amount;
		calcTransform();
		updateRotorPosition();
		if (!isAnimating()) {
			drawTools(stator, rotor, penX, penY);
		}
	}
});

translationYInput.addEventListener('change', function (event) {
	const amount = parseFloat(this.value);
	if (Number.isFinite(amount)) {
		translationStepsY = amount;
		calcTransform();
		updateRotorPosition();
		if (!isAnimating()) {
			drawTools(stator, rotor, penX, penY);
		}
	}
});

document.getElementById('translation-x-units').addEventListener('input', function (event) {
	calcTransform();
	if (translateX - stator.radiusA >= width - 1) {
		translationXInput.value = 0;
		translationStepsX = 0;
		calcTransform();
	}
	updateRotorPosition();
	if (!isAnimating()) {
		drawTools(stator, rotor, penX, penY);
	}
});

document.getElementById('translation-y-units').addEventListener('input', function (event) {
	calcTransform();
	if (translateY - stator.radiusA >= height - 1) {
		translationYInput.value = 0;
		translationStepsY = 0;
		calcTransform();
	}
	updateRotorPosition();
	if (!isAnimating()) {
		drawTools(stator, rotor, penX, penY);
	}
});

function setPenColor() {
	spiroContext.strokeStyle = this.children[0].value;
	for (let swatch of penSwatches) {
		swatch.parentElement.classList.remove('active');
	}
	customPenInput.parentElement.classList.remove('active');
	this.classList.add('active');
}

for (let swatch of penSwatches) {
	swatch.parentElement.addEventListener('click', setPenColor);
};

customPenInput.addEventListener('click', function (event) {
	spiroContext.strokeStyle = this.value;
	this.parentElement.classList.add('active');
	for (let swatch of penSwatches) {
		swatch.parentElement.classList.remove('active');
	}
});

customPenInput.addEventListener('input', function (event) {
	spiroContext.strokeStyle = this.value;
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

function setCompositionOp() {
	compositionOp = this.value;
	spiroContext.globalCompositeOperation = compositionOp;
}

for (let item of document.getElementsByName('composition')) {
	item.addEventListener('input', setCompositionOp);
};


function setPaperColor() {
	spiroCanvas.style.backgroundColor = this.children[0].value;
	spiroCanvas.style.backgroundImage = 'none';
	for (let swatch of paperSwatches) {
		swatch.parentElement.classList.remove('active');
	}
	customPaperInput.parentElement.classList.remove('active');
	this.classList.add('active');
}

for (let swatch of paperSwatches) {
	swatch.parentElement.addEventListener('click', setPaperColor);
};

customPaperInput.addEventListener('click', function (event) {
	spiroCanvas.style.backgroundColor = this.value;
	spiroCanvas.style.backgroundImage = 'none';
	this.parentElement.classList.add('active');
	for (let swatch of paperSwatches) {
		swatch.parentElement.classList.remove('active');
	}
	paperImageInput.parentElement.classList.remove('active');
});

customPaperInput.addEventListener('input', function (event) {
	spiroCanvas.style.backgroundColor = this.value;
});

let paperImageURL;

paperImageInput.addEventListener('click', function (event) {
	if (paperImageURL) {
		spiroCanvas.style.backgroundImage = `url("${paperImageURL}")`;
	}
});

paperImageInput.addEventListener('input', function (event) {
	const file = this.files[0];
	if (file) {
		if (paperImageURL !== undefined) {
			URL.revokeObjectURL(paperImageURL);
		}
		paperImageURL = URL.createObjectURL(file);
		spiroCanvas.style.backgroundImage = `url("${paperImageURL}")`;
	}
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

document.getElementById('btn-fastforward').addEventListener('click', function (event) {
	setAnimSpeed(100);
	animSpeedSlider.value = 100;
});

document.getElementById('erase-form').addEventListener('submit', function(event) {
	event.preventDefault();
	function reset() {
		startToothInput.value = 0;
		savedStartTooth = undefined;
		setInitialRotation();
		translationXInput.value = 0;
		translationStepsX = 0;
		translationYInput.value = 0;
		translationStepsY = 0;
		offset = undefined;
		fixedScale = undefined;
		fixedSwirlRotation = undefined;
		calcTransform();
		if (compositionOp === 'destination-out') {
			spiroContext.globalCompositeOperation = defaultCompositioOp;
			compositionOp = defaultCompositioOp;
			document.getElementById('composition-' + defaultCompositioOp).checked = true;
		}
		spiroContext.clearRect(-1, -1, width, height);
		saveContext.clearRect(0, 0, savedCanvas.width, savedCanvas.height);
		placeRotor(stator, rotor, inOut, translateX, translateY, 0, 0, initialRotationDist);
		drawTools(stator, rotor, penX, penY);
	}
	document.getElementById('start-position').value = 1;
	if (isAnimating()) {
		animController.promise.then(reset);
		animController.abort();
	} else {
		cancelDrawing();
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

gradientDirectionInput.addEventListener('input', function (event) {
	if (Number.isFinite(parseFraction(this.value))) {
		this.setCustomValidity('');
		document.getElementById('gradient-type-linear').checked = true;
	}
})

clearComboboxesOnFocus();

function floodFill(width, height, data, filled, startX, startY, newColor, transparency) {
	[startX, startY] = untransformPoint(startX, startY);
	if (startX < 0 || startY < 0 || startX >= width || startY >= height) {
		return;
	}

	const [newR, newG, newB] = hexToRGBA(newColor);
	let offset = (startY * width + startX) * 4;
	const targetR = data[offset];
	const targetG = data[offset + 1];
	const targetB = data[offset + 2];
	const fillTransparent = data[offset + 3] === 0;
	if (filled === undefined) {
		// Records which pixels we've filled
		filled = new Uint8Array(width * height);
	}
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
	return filled;
}

symmetryInput.addEventListener('input', function (event) {
	if (this.value !== '') {
		symmetry = parseInt(this.value);
		symmetryAngle = TWO_PI / symmetry;
	}
});

document.getElementById('btn-mirror').addEventListener('click', function (event) {
	mirrorSymmetry = !mirrorSymmetry;
});

function transformPoint(mouseX, mouseY) {
	const x = (mouseX - scale) / scale;
	const y = (mouseY - scale) / scale;
	return [x, y];
}

function untransformPoint(x, y) {
	return [
		Math.round(x * scale + scale),
		Math.round(y * scale + scale),
	]
}

function rectToPolar(x, y) {
	const dx = x - translateX;
	const dy = y - translateY;
	const r = Math.hypot(dx, dy);
	const theta = Math.atan2(dy, dx);
	return [r, theta];
}

function twoClickLogicRepeat() {
	if (mouseClickedX === undefined) {
		mouseClickedX = currentClickX;
		mouseClickedY = currentClickY;
		mouseClickedR = mouseR;
		mouseClickedTheta = mouseTheta;
		clickedOnMirrorLine = onMirrorLine;
		lastPath = currentPath;
		currentPath = new Path2D();
		currentPathIsEmpty = true;
	} else {
		currentPath.addPath(nextPath);
		currentPathIsEmpty = false;
	}
	saveCanvas();
}

function twoClickLogic() {
	if (mouseClickedX === undefined) {
		twoClickLogicRepeat();
	} else {
		mouseClickedX = undefined;
	}
}

function mouseDownLogic() {
	saveCanvas();
	nextPath = new Path2D();
	numPointsInPath = 0;
	drawingMouseDown = true;
}

spiroCanvas.addEventListener('contextmenu', function (event) {
	if (mouseClickedX !== undefined || drawingMouseDown) {
		event.preventDefault();
		restoreCanvas();
		if (currentPathIsEmpty) {
			currentPath = lastPath;
		}
		mouseClickedX = undefined;
		drawingMouseDown = false;
	}
});

function cancelDrawing() {
	if (mouseClickedX !== undefined) {
		restoreCanvas();
		if (currentPathIsEmpty) {
			currentPath = lastPath;
		}
		mouseClickedX = undefined;
	}
}

spiroCanvas.addEventListener('pointerdown', function (event) {
	if (event.button !== 0 || isAnimating()) {
		return;
	}
	[currentClickX, currentClickY] = transformPoint(event.offsetX, event.offsetY);

	switch (currentTool) {
	case 'fill':
		const pixelWidth = spiroCanvas.width;
		const pixelHeight = spiroCanvas.height;
		const dataObj = spiroContext.getImageData(0, 0, pixelWidth, pixelHeight);
		const data = dataObj.data;
		const strokeStyle = spiroContext.strokeStyle;
		const opacity = parseFloat(opacityInput.value);
		let filledPixels;
		if (mirrorSymmetry) {
			for (let i = 0; i < symmetry; i++) {
				const thisMirrorAngle = mirrorAngle + i * symmetryAngle;
				let angle = thisMirrorAngle + mirrorMouseAngle;
				let fillX = translateX + mouseR * Math.cos(angle);
				let fillY = translateY + mouseR * Math.sin(angle);
				filledPixels = floodFill(pixelWidth, pixelHeight, data, filledPixels, fillX, fillY, strokeStyle, opacity);
				if (!onMirrorLine) {
					angle = thisMirrorAngle - mirrorMouseAngle;
					fillX = translateX + mouseR * Math.cos(angle);
					fillY = translateY + mouseR * Math.sin(angle);
					filledPixels = floodFill(pixelWidth, pixelHeight, data, filledPixels, fillX, fillY, strokeStyle, opacity);
				}
			}
		} else {
			for (let i = 0; i < symmetry; i++) {
				const angle = mouseTheta + i * symmetryAngle;
				const fillX = translateX + mouseR * Math.cos(angle);
				const fillY = translateY + mouseR * Math.sin(angle);
				filledPixels = floodFill(pixelWidth, pixelHeight, data, filledPixels, fillX, fillY, strokeStyle, opacity);
			}
		}
		spiroContext.clearRect(-1, -1, width, height);
		spiroContext.putImageData(dataObj, 0, 0);
		break;

	case 'line':
		twoClickLogic();
		break;

	case 'circle':
		twoClickLogicRepeat();
		break;

	case 'freehand':
		mouseDownLogic();
		break;

	}
});

spiroCanvas.addEventListener('pointerup', function (event) {
	if (event.button !== 0 || nextPath === undefined) {
		return;
	}
	if (mouseClickedX !== undefined) {
		const dx = mouseX - currentClickX;
		const dy = mouseY - currentClickY;
		const distance = Math.hypot(dx, dy);
		if (distance > 10 / scale) {
			mouseClickedX = undefined;
			currentPath = nextPath;
		}
	} else {
		currentPath = nextPath;
		drawingMouseDown = false;
	}
});

function drawWithMouse(event) {
	if (!document.hasFocus()) {
		return;
	}

	[mouseX, mouseY] = transformPoint(event.offsetX, event.offsetY);
	prevMouseR = mouseR;
	prevMouseTheta = mouseTheta;
	[mouseR, mouseTheta] = rectToPolar(mouseX, mouseY);
	if (mouseClickedX === undefined) {
		mirrorAngle = Math.round((mouseTheta + HALF_PI) / symmetryAngle) * symmetryAngle - HALF_PI;
	}
	mirrorMouseAngle = mouseTheta - mirrorAngle;

	// TODO This needs elaborating on further to handle other cases
	const mirrorMouseDistance = mouseR * Math.sin(mirrorMouseAngle);
	onMirrorLine = Math.abs(mirrorMouseDistance) < 1 / scale;


	// Draw mouse pointer
	drawTools(stator, rotor, penX, penY);

	let startR, startTheta, dTheta, mirrorMouseStartAngle;
	if (drawingMouseDown) {
		startR = prevMouseR;
		startTheta = prevMouseTheta;
		dTheta = mouseTheta - prevMouseTheta;
		mirrorMouseStartAngle = prevMouseTheta - mirrorAngle;
	} else if (mouseClickedX === undefined) {
		return;
	} else {
		startR = mouseClickedR;
		startTheta = mouseClickedTheta;
		dTheta = mouseTheta - mouseClickedTheta;
		mirrorMouseStartAngle = mouseClickedTheta - mirrorAngle;
	}

	const dx = mouseX - mouseClickedX;
	const dy = mouseY - mouseClickedY;
	const distance = Math.hypot(dx, dy);

	const numPoints = Math.abs(mouseClickedR) < 1 / scale ? 1 : symmetry;

	restoreCanvas();
	spiroContext.globalAlpha = parseFloat(opacityInput.value);

	switch (currentTool) {
	case 'line':
	case 'freehand':
		if (!drawingMouseDown) {
			nextPath = new Path2D();
		}
		if (mirrorSymmetry) {
			numPointsInPath += numPoints * 2;
			for (let i = 0; i < numPoints; i++) {
				const thisMirrorAngle = mirrorAngle + i * symmetryAngle;
				let startAngle = thisMirrorAngle + mirrorMouseStartAngle;
				let startX = translateX + startR * Math.cos(startAngle);
				let startY = translateY + startR * Math.sin(startAngle);
				let endAngle = thisMirrorAngle + mirrorMouseAngle;
				let endX = translateX + mouseR * Math.cos(endAngle);
				let endY = translateY + mouseR * Math.sin(endAngle);
				nextPath.moveTo(startX, startY);
				nextPath.lineTo(endX, endY);
				if (!onMirrorLine || !clickedOnMirrorLine) {
					startAngle = thisMirrorAngle - mirrorMouseStartAngle;
					startX = translateX + startR * Math.cos(startAngle);
					startY = translateY + startR * Math.sin(startAngle);
					endAngle = thisMirrorAngle - mirrorMouseAngle;
					endX = translateX + mouseR * Math.cos(endAngle);
					endY = translateY + mouseR * Math.sin(endAngle);
					nextPath.moveTo(startX, startY);
					nextPath.lineTo(endX, endY);
				}
			}
		} else {
			numPointsInPath += symmetry;
			for (let i = 0; i < symmetry; i++) {
				const startAngle = startTheta + i * symmetryAngle;
				const startX = translateX + startR * Math.cos(startAngle);
				const startY = translateY + startR * Math.sin(startAngle);
				const endAngle = startAngle + dTheta;
				const endX = translateX + mouseR * Math.cos(endAngle);
				const endY = translateY + mouseR * Math.sin(endAngle);
				nextPath.moveTo(startX, startY);
				nextPath.lineTo(endX, endY);
			}
		}
		spiroContext.stroke(nextPath);
		if (drawingMouseDown && numPointsInPath > 3000) {
			mouseDownLogic();
		}
		break;

	case 'circle':
		nextPath = new Path2D();
		if (mirrorSymmetry) {
			for (let i = 0; i < numPoints; i++) {
				const thisMirrorAngle = mirrorAngle + i * symmetryAngle;
				let angle = thisMirrorAngle + mirrorMouseStartAngle;
				let centreX = translateX + mouseClickedR * Math.cos(angle);
				let centreY = translateY + mouseClickedR * Math.sin(angle);
				nextPath.moveTo(centreX + distance, centreY);
				nextPath.arc(centreX, centreY, distance, 0, TWO_PI);
				if (!clickedOnMirrorLine) {
					angle = thisMirrorAngle - mirrorMouseStartAngle;
					centreX = translateX + mouseClickedR * Math.cos(angle);
					centreY = translateY + mouseClickedR * Math.sin(angle);
					nextPath.moveTo(centreX + distance, centreY);
					nextPath.arc(centreX, centreY, distance, 0, TWO_PI);
				}
			}
		} else {
			for (let i = 0; i < numPoints; i++) {
				const angle = mouseClickedTheta + i * symmetryAngle;
				const centreX = translateX + mouseClickedR * Math.cos(angle);
				const centreY = translateY + mouseClickedR * Math.sin(angle);
				nextPath.moveTo(centreX + distance, centreY);
				nextPath.arc(centreX, centreY, distance, 0, TWO_PI);
			}
		}
		spiroContext.stroke(nextPath);
		break;
	}
	spiroContext.globalAlpha = 1;
}

spiroCanvas.addEventListener('pointermove', drawWithMouse);

spiroCanvas.addEventListener('pointerenter', function (event) {
	if (event.buttons === 1 || mouseClickedX) {
		drawWithMouse(event);
	} else {
		drawingMouseDown = false;
	}
});

spiroCanvas.addEventListener('pointerleave', function (event) {
	if (!drawingMouseDown) {
		mouseR = undefined;
		if (!isAnimating()) {
			drawTools(stator, rotor, penX, penY);
		}
	}
});

window.addEventListener('blur', function (event) {
	spiroCanvas.style.cursor = 'default';
	mouseR = undefined;
	if (!isAnimating()) {
		drawTools(stator, rotor, penX, penY);
	}
});

window.addEventListener('focus', function (event) {
	spiroCanvas.style.cursor = null;
});

// Initial actions

resizeCanvas(true);
randomizeSpirographForm();
updatePenXReadout();
updatePenYReadout();
setInitialRotation();
parseAndTrimLineDash();
drawSpirographAction();
animController.promise = animController.promise.then(function (event) {
	if (animController.status === AnimationController.Status.FINISHED) {
		eraseTools();
		gearsVisible = false;
		const button = document.getElementById('btn-toggle-gears');
		button.classList.remove('active');
		button.setAttribute('aria-pressed', 'false');
	}
});


$(function () {
	$('[data-toggle="tooltip"]').tooltip();
});
