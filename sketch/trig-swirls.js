export default function TrigPatterns() {
	const me = this;
	this.title = 'Trigonometry Swirls';
	this.helpFile = 'help/trig-swirls.html';
	this.backgroundColor = [0, 0, 0];
	this.isShader = true;

	this.optionsDocument = downloadFile('trig-swirls.html', 'document').then(function (optionsDoc) {

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

		optionsDoc.getElementById('swirl-zoom').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value > 0) {
				setBgProperty(me, 'zoom', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('swirl-translate-x').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				setBgProperty(me, 'translateX', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('swirl-translate-y').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				setBgProperty(me, 'translateY', value);
				generateBackground(0);
			}
		});

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

		optionsDoc.getElementById('swirl-luminosity-modulus-0').addEventListener('input', setModulus);
		optionsDoc.getElementById('swirl-luminosity-shift-0').addEventListener('input', setShift);
		optionsDoc.getElementById('swirl-luminosity-threshold-0').addEventListener('input', setThreshold);

		return optionsDoc;
	});

	this.phaseX = 0;
	this.phaseY = 0;
	this.zoom = 1.8;
	this.translateX = 0;
	this.translateY = 0;

	this.luminosityModulus = [90, 100, 100];
	this.luminosityShift = [0.63, 0.63, 0.63];
	this.luminosityThreshold = [0.1, 0.1, 0.1];
	this.luminosityDepth = 1;
	this.luminositySteps = [171, 1, 1];
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
		'phaseX', 'phaseY', 'zoom', 'translateX', 'translateY',
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
