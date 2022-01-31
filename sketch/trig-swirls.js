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

		function updatePhase() {
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

		function setShapeFraction(event) {
			const index = parseInt(this.id.split('-')[2]);
			const integer = parseInt(document.getElementById('swirl-shape-' + index + '-int').value);
			const fraction = parseFloat(document.getElementById('swirl-shape-' + index + '-frac').value);
			setBgPropertyElement(me, 'waveforms', index, integer + fraction);
			generateBackground(0);
		}

		function setShapeInteger(event) {
			const value = parseInt(this.value);
			const nextOption = this.querySelector('option[value="' + String(value + 1) + '"]');
			const index = parseInt(this.id.split('-')[2]);
			let label
			if (nextOption === null) {
				label = index < 2 ? 'Sqr' : 'ExpSaw';
			} else {
				label = nextOption.innerHTML;
			}
			document.getElementById('swirl-shape-' + index + '-label').innerHTML = label;

			document.getElementById('swirl-shape-' + index + '-frac').value = 0;
			setBgPropertyElement(me, 'waveforms', index, parseInt(this.value));
			generateBackground(0);
		}

		for (let i = 0; i < 4; i++) {
			optionsDoc.getElementById('swirl-amplitude-' + i).addEventListener('input', numericElementInput);
			optionsDoc.getElementById('swirl-phase-' + i).addEventListener('input', updatePhase);
			optionsDoc.getElementById('swirl-phase-' + i + '-turns').addEventListener('input', updatePhase);
			optionsDoc.getElementById('swirl-shape-' + i + '-int').addEventListener('input', setShapeInteger);
			optionsDoc.getElementById('swirl-shape-' + i + '-frac').addEventListener('input', setShapeFraction);
		}

		optionsDoc.getElementById('swirl-sum-angle-0').addEventListener('input', updatePhase);
		optionsDoc.getElementById('swirl-sum-angle-0-turns').addEventListener('input', updatePhase);
		optionsDoc.getElementById('swirl-sum-angle-1').addEventListener('input', updatePhase);
		optionsDoc.getElementById('swirl-sum-angle-1-turns').addEventListener('input', updatePhase);

		optionsDoc.getElementById('swirl-looser').addEventListener('click', function (event) {
			me.amplitude[0] -= 0.05;
			me.amplitude[1] -= 0.05;
			document.getElementById('swirl-amplitude-0').value = me.amplitude[0].toFixed(2);
			document.getElementById('swirl-amplitude-1').value = me.amplitude[1].toFixed(2);
			setBgProperty(me, 'amplitude');
			generateBackground(0);
		});

		optionsDoc.getElementById('swirl-tighter').addEventListener('click', function (event) {
			me.amplitude[0] += 0.05;
			me.amplitude[1] += 0.05;
			document.getElementById('swirl-amplitude-0').value = me.amplitude[0].toFixed(2);
			document.getElementById('swirl-amplitude-1').value = me.amplitude[1].toFixed(2);
			setBgProperty(me, 'amplitude');
			generateBackground(0);
		});

		optionsDoc.getElementById('swirl-stretch-x').addEventListener('input', positiveInput);
		optionsDoc.getElementById('swirl-stretch-y').addEventListener('input', positiveInput);
		optionsDoc.getElementById('swirl-zoom').addEventListener('input', positiveInput);

		optionsDoc.getElementById('swirl-translate-x').addEventListener('input', numericInput);
		optionsDoc.getElementById('swirl-translate-y').addEventListener('input', numericInput);

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

		function setWeight(event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				const words = this.id.split('-');
				const channel = words[1];
				const bitplane = words[3];
				setBgPropertyElement(me, channel + 'Weight', bitplane, value);
				generateBackground(0);
			}
		}

		for (let quality of ['luminosity', 'red', 'blue']) {
			optionsDoc.getElementById('swirl-' + quality + '-depth').addEventListener('input', setDepth);
			for (let i = 0; i < 3; i++) {
				optionsDoc.getElementById('swirl-' + quality +'-modulus-' + i).addEventListener('input', setModulus);
				optionsDoc.getElementById('swirl-' + quality +'-shift-' + i).addEventListener('input', setShift);
				optionsDoc.getElementById('swirl-' + quality +'-threshold-' + i).addEventListener('input', setThreshold);
				optionsDoc.getElementById('swirl-' + quality +'-steps-' + i).addEventListener('input', setSteps);
				optionsDoc.getElementById('swirl-' + quality +'-weight-' + i).addEventListener('input', setWeight);
			}
			optionsDoc.getElementById('swirl-' + quality +'-offset').addEventListener('input', sliderInput);
		}

		optionsDoc.getElementById('swirl-green-chroma-threshold').addEventListener('input', sliderInput);
		optionsDoc.getElementById('swirl-green-luma-threshold').addEventListener('input', sliderInput);

		return optionsDoc;
	});

	this.zoom = 1.8;
	this.stretchX = 1;
	this.stretchY = 1;
	this.translateX = 0;
	this.translateY = 0;

	this.amplitude = [1, 1, 1, 1];
	this.frequency = [1, 1];
	this.phase = [0, 0.504 * Math.PI, 0, 0.504 * Math.PI];
	this.waveforms = [2, 2, 2, 2];

	this.sumMagnitude = [1.41, 1.41];
	this.sumAngle = [-Math.PI / 4, Math.PI / 4];


	this.luminosityWeight = [4, 2, 1];
	this.luminosityModulus = [90, 100, 100];
	this.luminosityShift = [0.63, 0.63, 0.63];
	this.luminosityThreshold = [0.1, 0.1, 0.1];
	this.luminosityDepth = 1;
	this.luminositySteps = [43, 1, 1];
	this.luminosityOffset = 0.332;

	this.redWeight = [4, 2, 1];
	this.redModulus = [110, 100, 100];
	this.redShift = [0.6175, 0.63, 0.63];
	this.redThreshold = [0.152, 0.1, 0.1];
	this.redDepth = 1;
	this.redSteps = [1, 1, 1];
	this.redOffset = 0;

	this.blueWeight = [4, 2, 1];
	this.blueModulus = [200, 100, 100];
	this.blueShift = [0.6275, 0.75, 0.75];
	this.blueThreshold = [0.112, 0.1, 0.1];
	this.blueDepth = 1;
	this.blueSteps = [1, 1, 1];
	this.blueOffset = 0;

	this.greenChromaThreshold = 0.5;
	this.greenLumaThreshold = 0.004;

}

TrigPatterns.prototype.animatable = {
	continuous: [
		'zoom', 'stretchX', 'stretchY', 'translateX', 'translateY',
		'amplitude', 'frequency', 'phase', 'sumMagnitude', 'sumAngle',
		'waveforms',

		'luminosityWeight', 'redWeight', 'blueWeight',
		'luminosityModulus', 'luminosityThreshold',
		'redModulus', 'redThreshold',
		'blueModulus', 'blueThreshold',
		'luminosityShift', 'redShift', 'blueShift',
		'luminositySteps', 'redSteps', 'blueSteps',
		'luminosityOffset', 'redOffset', 'blueOffset',

		'greenChromaThreshold', 'greenLumaThreshold',
	],
	stepped: [
		'luminosityDepth', 'redDepth', 'blueDepth',
	],
}
