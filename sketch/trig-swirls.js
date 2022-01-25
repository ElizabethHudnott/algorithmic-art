export default function TrigPatterns() {
	const me = this;
	this.title = 'Trigonometry Swirls';
	this.helpFile = 'help/trig-swirls.html';
	this.backgroundColor = [0, 0, 0];
	this.isShader = true;

	this.optionsDocument = downloadFile('trig-swirls.html', 'document').then(function (optionsDoc) {

		function sliderInput(event) {
			const property = idToProperty(this.id, true);
			const value = parseFloat(this.value);
			setBgProperty(me, property, value);
			generateBackground(0);
		}

		function numericInput(event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				const property = idToProperty(this.id, true);
				setBgProperty(me, property, value);
				generateBackground(0);
			}
		}

		function numericElementInput(event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				let id = this.id;
				const strIndex = id.lastIndexOf('-');
				const index = id.slice(strIndex + 1);
				id = id.slice(0, strIndex);
				const property = idToProperty(id, true);
				setBgPropertyElement(me, property, index, value);
				generateBackground(0);
			}
		}

		function positiveInput(event) {
			const value = parseFloat(this.value);
			if (value > 0) {
				const property = idToProperty(this.id, true);
				setBgProperty(me, property, value);
				generateBackground(0);
			}
		}

		function updatePhaseX() {
			const turns = parseInt(document.getElementById('swirl-phase-x-turns').value) || 0;
			let sign = Math.sign(turns);
			if (sign === 0) {
				sign = 1;
			}
			const fraction = parseFloat(document.getElementById('swirl-phase-x').value);
			const value = sign * (Math.abs(turns) + fraction) * TWO_PI;
			setBgProperty(me, 'phaseX', value);
			generateBackground(0);
		}

		optionsDoc.getElementById('swirl-phase-x').addEventListener('input', updatePhaseX);
		optionsDoc.getElementById('swirl-phase-x-turns').addEventListener('input', updatePhaseX);

		function updatePhaseY() {
			const turns = parseInt(document.getElementById('swirl-phase-y-turns').value) || 0;
			let sign = Math.sign(turns);
			if (sign === 0) {
				sign = 1;
			}
			const fraction = parseFloat(document.getElementById('swirl-phase-y').value);
			const value = sign * (Math.abs(turns) + fraction) * TWO_PI;
			setBgProperty(me, 'phaseY', value);
			generateBackground(0);
		}

		optionsDoc.getElementById('swirl-phase-y').addEventListener('input', updatePhaseY);
		optionsDoc.getElementById('swirl-phase-y-turns').addEventListener('input', updatePhaseY);

		function updatePhaseElement() {
			let id = this.id;
			let strIndex;
			if (id.slice(-6) === '-turns') {
				strIndex = id.lastIndexOf('-', id.length - 7);
			} else {
				strIndex = id.lastIndexOf('-');
			}
			const index = parseInt(id.slice(strIndex + 1));
			id = id.slice(0, strIndex);

			const turns = parseInt(document.getElementById(id + '-' + index + '-turns').value) || 0;
			let sign = Math.sign(turns);
			if (sign === 0) {
				sign = 1;
			}
			const fraction = parseFloat(document.getElementById(id + '-' + index).value);
			const value = sign * (Math.abs(turns) + fraction) * TWO_PI;
			const property = idToProperty(id, true);
			setBgPropertyElement(me, property, index, value);
			generateBackground(0);
		}

		optionsDoc.getElementById('swirl-phase-0').addEventListener('input', updatePhaseElement);
		optionsDoc.getElementById('swirl-phase-0-turns').addEventListener('input', updatePhaseElement);
		optionsDoc.getElementById('swirl-phase-1').addEventListener('input', updatePhaseElement);
		optionsDoc.getElementById('swirl-phase-1-turns').addEventListener('input', updatePhaseElement);
		optionsDoc.getElementById('swirl-sum-angle-0').addEventListener('input', updatePhaseElement);
		optionsDoc.getElementById('swirl-sum-angle-0-turns').addEventListener('input', updatePhaseElement);
		optionsDoc.getElementById('swirl-sum-angle-1').addEventListener('input', updatePhaseElement);
		optionsDoc.getElementById('swirl-sum-angle-1-turns').addEventListener('input', updatePhaseElement);

		optionsDoc.getElementById('swirl-amplitude-x').addEventListener('input', numericInput);
		optionsDoc.getElementById('swirl-amplitude-y').addEventListener('input', numericInput);

		optionsDoc.getElementById('swirl-looser').addEventListener('click', function (event) {
			me.amplitudeX -= 0.05;
			me.amplitudeY -= 0.05;
			document.getElementById('swirl-amplitude-x').value = me.amplitudeX.toFixed(2);
			document.getElementById('swirl-amplitude-y').value = me.amplitudeY.toFixed(2);
			setBgProperty(me, 'amplitudeX');
			setBgProperty(me, 'amplitudeY');
			generateBackground(0);
		});

		optionsDoc.getElementById('swirl-tighter').addEventListener('click', function (event) {
			me.amplitudeX += 0.05;
			me.amplitudeY += 0.05;
			document.getElementById('swirl-amplitude-x').value = me.amplitudeX.toFixed(2);
			document.getElementById('swirl-amplitude-y').value = me.amplitudeY.toFixed(2);
			setBgProperty(me, 'amplitudeX');
			setBgProperty(me, 'amplitudeY');
			generateBackground(0);
		});

		optionsDoc.getElementById('swirl-stretch-x').addEventListener('input', positiveInput);
		optionsDoc.getElementById('swirl-stretch-y').addEventListener('input', positiveInput);
		optionsDoc.getElementById('swirl-zoom').addEventListener('input', positiveInput);

		optionsDoc.getElementById('swirl-translate-x').addEventListener('input', numericInput);
		optionsDoc.getElementById('swirl-translate-y').addEventListener('input', numericInput);

		optionsDoc.getElementById('swirl-amplitude-0').addEventListener('input', numericElementInput);
		optionsDoc.getElementById('swirl-amplitude-1').addEventListener('input', numericElementInput);
		optionsDoc.getElementById('swirl-frequency-0').addEventListener('input', numericElementInput);
		optionsDoc.getElementById('swirl-frequency-1').addEventListener('input', numericElementInput);
		optionsDoc.getElementById('swirl-sum-magnitude-0').addEventListener('input', numericElementInput);
		optionsDoc.getElementById('swirl-sum-magnitude-1').addEventListener('input', numericElementInput);

		function setDepth(event) {
			const value = parseFloat(this.value);
			if (value >= 0 && Math.ceil(value) <= 3) {
				const words = this.id.split('-');
				const channel = words[1];
				let row = $('#swirl-' + channel + '-headings');
				row.children().children().collapse(value > 0 ? 'show' : 'hide');
				for (let i = 0; i < 3; i++) {
					row = $('#swirl-' + channel + '-plane-' + i);
					row.children().children().collapse(value > i ? 'show' : 'hide');
				}
				setBgProperty(me, channel + 'Depth', value);
				generateBackground(0);
			}
		}

		function setModulus(event) {
			const value = parseFloat(this.value);
			if (value > 0) {
				const words = this.id.split('-');
				const channel = words[1];
				const bitplane = words[3];
				setBgPropertyElement(me, channel + 'Modulus', bitplane, value);
				generateBackground(0);
			}
		}

		function setShift(event) {
			const value = parseFloat(this.value);
			const words = this.id.split('-');
			const channel = words[1];
			const bitplane = words[3];
			setBgPropertyElement(me, channel + 'Shift', bitplane, value);
			generateBackground(0);
		}

		function setThreshold(event) {
			const value = parseFloat(this.value);
			const words = this.id.split('-');
			const channel = words[1];
			const bitplane = words[3];
			setBgPropertyElement(me, channel + 'Threshold', bitplane, value);
			generateBackground(0);
		}

		function setSteps(event) {
			const value = parseFloat(this.value);
			if (value > 0) {
				const words = this.id.split('-');
				const channel = words[1];
				const bitplane = words[3];
				setBgPropertyElement(me, channel + 'Steps', bitplane, value);
				generateBackground(0);
			}
		}

		optionsDoc.getElementById('swirl-luminosity-depth').addEventListener('input', setDepth);
		for (let i = 0; i < 3; i++) {
			optionsDoc.getElementById('swirl-luminosity-modulus-' + i).addEventListener('input', setModulus);
			optionsDoc.getElementById('swirl-luminosity-shift-' + i).addEventListener('input', setShift);
			optionsDoc.getElementById('swirl-luminosity-threshold-' + i).addEventListener('input', setThreshold);
			optionsDoc.getElementById('swirl-luminosity-steps-' + i).addEventListener('input', setSteps);
		}
		optionsDoc.getElementById('swirl-luminosity-offset').addEventListener('input', sliderInput);

		return optionsDoc;
	});

	this.amplitudeX = 1;
	this.amplitudeY = 1;
	this.phaseX = 0;
	this.phaseY = 0;
	this.zoom = 1.8;
	this.stretchX = 1;
	this.stretchY = 1;
	this.translateX = 0;
	this.translateY = 0;

	this.amplitude = [1, 1];
	this.frequency = [1, 1];
	this.phase = [0, 0];
	this.sumMagnitude = [1.41, 1.41];
	this.sumAngle = [-Math.PI / 4, Math.PI / 4];

	this.luminosityModulus = [90, 100, 100];
	this.luminosityShift = [0.63, 0.63, 0.63];
	this.luminosityThreshold = [0.1, 0.1, 0.1];
	this.luminosityDepth = 1;
	this.luminositySteps = [43, 1, 1];
	this.luminosityOffset = 0;

	this.redModulus = [110, 100, 100];
	this.redShift = [0.6175, 0.63, 0.63];
	this.redThreshold = [0.152, 0.1, 0.1];
	this.redDepth = 1;
	this.redSteps = [1, 1, 1];
	this.redOffset = 0;

	this.blueModulus = [200, 100, 100];
	this.blueShift = [0.6275, 0.75, 0.75];
	this.blueThreshold = [0.112, 0.1, 0.1];
	this.blueDepth = 1;
	this.blueSteps = [1, 1, 1];
	this.blueOffset = 0;

	this.alphaThreshold = 0;
}

TrigPatterns.prototype.animatable = {
	continuous: [
		'amplitudeX', 'amplitudeY', 'phaseX', 'phaseY',
		'zoom', 'stretchX', 'stretchY', 'translateX', 'translateY',
		'amplitude', 'frequency', 'phase', 'sumMagnitude', 'sumAngle',

		'luminosityModulus', 'luminosityThreshold',
		'redModulus', 'redThreshold',
		'blueModulus', 'blueThreshold',
		'luminosityShift', 'redShift', 'blueShift',
		'luminositySteps', 'redSteps', 'blueSteps',
		'luminosityOffset', 'redOffset', 'blueOffset',
		'alphaThreshold',
	],
	stepped: [
		'luminosityDepth', 'redDepth', 'blueDepth',
	],
}
