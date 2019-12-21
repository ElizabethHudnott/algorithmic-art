let maxRotationTime = 10000;
let maxIncrement = Math.PI / 96;
let animFunction;


const statorTeethInput = document.getElementById('stator-teeth');
const rotorTeethInput = document.getElementById('rotor-teeth');
const penXSlider = document.getElementById('pen-x');
const penYSlider = document.getElementById('pen-y');
const animSpeedSlider = document.getElementById('anim-speed');
setAnimSpeed(parseInt(animSpeedSlider.value));
const penWidthInput = document.getElementById('pen-width');

function setAnimSpeed(newSpeed) {
	animSpeed = newSpeed;
	if (animFunction) {
		requestAnimationFrame(animFunction);
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

function drawSpirograph(stator, rotor, startDistance, endDistance, penX, penY) {
	if (endDistance === undefined) {
		endDistance = startDistance + stator.toothSize * lcm(stator.numTeeth, rotor.numTeeth);
	}
	let increment = stator.toothSize;
	if (increment > maxIncrement) {
		const multiple = Math.ceil(increment / maxIncrement);
		increment = increment / multiple;
	}
	const numSteps = Math.ceil((endDistance - startDistance) / increment);
	const stepsPerRotation = 2 * Math.PI / increment;
	let stepNumber = 0;
	penX = penX * rotor.radiusA;
	penY = penY * rotor.radiusB;

	saveCanvas();
	spiroContext.beginPath();
	const beginTime = performance.now();

	animFunction = function animate(time) {
		if (animFunction !== animate || animSpeed === 0) {
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

		let rotorX, rotorY, rotorAngle;
		while (stepNumber <= maxStep) {
			const distance = startDistance + stepNumber * increment;
			const statorState = stator.calc(distance);
			const statorAngle = statorState[2];
			const contactPoint = rotor.contactPoint(-distance);
			const rotorRadius = Math.sqrt(contactPoint[0] * contactPoint[0] + contactPoint[1] * contactPoint[1]);
			rotorX = statorState[0] + rotorRadius * Math.cos(statorAngle);
			rotorY = statorState[1] + rotorRadius * Math.sin(statorAngle);
			rotorAngle = Math.atan2(contactPoint[1], contactPoint[0]) + statorAngle + Math.PI;
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

		if (rotorX !== undefined) {
			toolContext.setTransform(scale, 0, 0, scale, scale, scale);
			toolContext.clearRect(-1, -1, width, height);
			stator.draw(toolContext);
			toolContext.translate(rotorX, rotorY);
			toolContext.rotate(rotorAngle);
			rotor.draw(toolContext);
			toolContext.arc(penX, penY, 5 / scale, 0, 2 * Math.PI);
			toolContext.fill('evenodd');
			spiroContext.clearRect(-1, -1, width, height);
			spiroContext.drawImage(savedCanvas, -1, -1, width, height);
			spiroContext.stroke();
		}

		if (stepNumber <= numSteps) {
			requestAnimationFrame(animate);
		} else {
			animFunction = undefined;
		}
	}
	requestAnimationFrame(animFunction);
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
		return [
			radius * Math.cos(distance),	// x-coordinate
			radius * Math.sin(distance), 	// y-coordinate
			distance + Math.PI				// angle of the normal in radians
		];
	}

	draw(context) {
		context.beginPath();
		context.arc(0, 0, 1, 0, 2 * Math.PI);
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
spiroContext.globalCompositeOperation = 'hue';
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

function randomizeSpirographForm() {
	const rotors = document.getElementById('rotor-size-list').children;
	const rotorIndex = Math.trunc(Math.random() * rotors.length);
	const rotorTeeth = rotors[rotorIndex].innerText;
	document.getElementById('rotor-teeth').value = rotorTeeth;
	const stators = document.getElementById('stator-size-list').children;
	const statorIndex = Math.trunc(Math.random() * stators.length);
	const statorTeeth = stators[statorIndex].innerText;
	document.getElementById('stator-teeth').value = statorTeeth;
}

function drawSpirographFromForm() {
	const stator = new InnerCircleStator(parseInt(statorTeethInput.value), 1);
	const rotor = new CircleRotor(stator, parseInt(rotorTeethInput.value));
	drawSpirograph(stator, rotor, 0, undefined, 0.7, 0);
}

randomizeSpirographForm();
drawSpirographFromForm();

function queryChecked(ancestor, name) {
	return ancestor.querySelector(`:checked[name=${name}]`);
}

function checkInput(ancestor, name, value) {
	ancestor.querySelector(`[name=${name}][value=${value}]`).checked = true;
}

document.getElementById('spirograph-form').addEventListener('submit', function (event) {
	event.preventDefault();
	drawSpirographFromForm();
});

document.getElementById('btn-fill').addEventListener('click', function (event) {
	spiroContext.fillStyle = spiroContext.strokeStyle;
	spiroContext.fill('evenodd');
});

document.getElementById('btn-toggle-tools').addEventListener('click', function (event) {
	const invisible = document.getElementById('tool-canvas').classList.toggle('invisible');
	if (invisible) {
		this.innerText = 'Show Gears';
	} else {
		this.innerText = 'Hide Gears';
	}
});

penXSlider.addEventListener('input', function (event) {
	document.getElementById('pen-x-readout').innerText = Math.round(parseFloat(this.value) * 100) + '%';
});

penYSlider.addEventListener('input', function (event) {
	document.getElementById('pen-y-readout').innerText = Math.round(parseFloat(this.value) * 100) + '%';
});

animSpeedSlider.addEventListener('input', function (event) {
	setAnimSpeed(parseInt(this.value));
});

document.getElementById('custom-pen-color').addEventListener('input', function (event) {
	spiroContext.strokeStyle = this.value;
});

penWidthInput.addEventListener('input', function (event) {
	spiroContext.lineWidth = parseInt(this.value) / scale;
});

document.getElementById('paper-color').addEventListener('input', function (event) {
	spiroCanvas.style.backgroundColor = this.value;
});

document.getElementById('erase-form').addEventListener('submit', function(event) {
	event.preventDefault();
	animFunction = undefined;
	spiroContext.clearRect(-1, -1, width, height);
	$('#erase-modal').modal('hide');
});

$(function () {
  $('[data-toggle="tooltip"]').tooltip()
});
