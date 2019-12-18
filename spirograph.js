let animationSpeed = 30;
let maxIncrement = Math.PI / 96;
let timer;

function drawSpirograph(stator, rotor, startDistance, endDistance, penX, penY) {
	if (endDistance === undefined) {
		endDistance = startDistance + stator.toothSize * lcm(stator.numTeeth, rotor.numTeeth);
	}
	let increment = stator.toothSize;
	if (increment > maxIncrement) {
		const multiple = Math.ceil(increment / maxIncrement);
		increment = increment / multiple;
	}
	let delay = Math.round(50 * (100 - animationSpeed) / (2 * Math.PI / increment));
	penX = penX * rotor.radiusA;
	penY = penY * rotor.radiusB;

	let distance = startDistance - increment;
	let statorState = stator.calc(distance);
	spiroContext.beginPath();
	let begin = true;
	timer = setInterval(function () {
		if (distance < endDistance) {
			distance += increment;
			statorState = stator.calc(distance);
			const statorAngle = statorState[2];
			const contactPoint = rotor.contactPoint(-distance);
			const rotorAngle = Math.atan2(contactPoint[1], contactPoint[0]) + statorAngle + Math.PI;
			const rotorRadius = Math.sqrt(contactPoint[0] * contactPoint[0] + contactPoint[1] * contactPoint[1]);
			const rotorX = statorState[0] + rotorRadius * Math.cos(statorAngle);
			const rotorY = statorState[1] + rotorRadius * Math.sin(statorAngle);
			const cos = Math.cos(rotorAngle);
			const sin = Math.sin(rotorAngle);
			const plotX = rotorX + penX * cos - penY * sin;
			const plotY = rotorY + penX * sin + penY * cos;

			toolContext.save();
			toolContext.clearRect(-1, -1, width, height);
			stator.draw(toolContext);
			toolContext.translate(rotorX, rotorY);
			toolContext.rotate(rotorAngle);
			rotor.draw(toolContext);
			toolContext.arc(penX, penY, 5 / scale, 0, 2 * Math.PI);
			toolContext.fill('evenodd');

			spiroContext.clearRect(-1, -1, width, height);
			if (begin) {
				spiroContext.moveTo(plotX, plotY);
				begin = false;
			} else {
				spiroContext.lineTo(plotX, plotY);
			}
			spiroContext.stroke();
			toolContext.restore();
		} else {
			clearInterval(timer);
		}
	}, delay);
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
		//context.fill();
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
const toolCanvas = document.getElementById('tool-canvas');
const toolContext = toolCanvas.getContext('2d');
const toolColor = 'rgba(0, 64, 255, 0.5)';
toolContext.strokeStyle = toolColor;
toolContext.fillStyle = toolColor;
let scale = spiroCanvas.width >= spiroCanvas.height ? spiroCanvas.height / 2: spiroCanvas.width / 2;
let width = spiroCanvas.width / scale;
let height = spiroCanvas.height / scale;
spiroContext.scale(scale, scale);
spiroContext.translate(1, 1);
spiroContext.lineWidth = 2 / scale;
toolContext.scale(scale, scale);
toolContext.translate(1, 1);
toolContext.lineWidth = 2 / scale;

let stator = new InnerCircleStator(96, 1);
let rotor = new CircleRotor(stator, 52);
drawSpirograph(stator, rotor, 0, undefined, 0.7, 0);

function queryChecked(ancestor, name) {
	return ancestor.querySelector(`:checked[name=${name}]`);
}

function checkInput(ancestor, name, value) {
	ancestor.querySelector(`[name=${name}][value=${value}]`).checked = true;
}

document.getElementById('pen-x').addEventListener('input', function (event) {
	document.getElementById('pen-x-readout').innerText = Math.round(parseFloat(this.value) * 100) + '%';
});

document.getElementById('pen-y').addEventListener('input', function (event) {
	document.getElementById('pen-y-readout').innerText = Math.round(parseFloat(this.value) * 100) + '%';
});

document.getElementById('paper-color').addEventListener('input', function (event) {
	spiroCanvas.style.backgroundColor = this.value;
});

document.getElementById('btn-toggle-tools').addEventListener('click', function (event) {
	const invisible = document.getElementById('tool-canvas').classList.toggle('invisible');
	if (invisible) {
		this.innerText = 'Show Gears';
	} else {
		this.innerText = 'Hide Gears';
	}
});

document.getElementById('erase-form').addEventListener('submit', function(event) {
	event.preventDefault();
	clearInterval(timer);
	spiroContext.clearRect(-1, -1, width, height);
	$('#erase-modal').modal('hide');
});

$(function () {
  $('[data-toggle="tooltip"]').tooltip()
});
