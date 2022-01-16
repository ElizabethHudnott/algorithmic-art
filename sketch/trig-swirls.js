export default function TrigPatterns() {
	const me = this;
	this.title = 'Trigonometry Swirls';
	this.helpFile = 'help/trig-swirls.html';
	this.backgroundColor = [0, 0, 0];
	this.isShader = true;

	this.optionsDocument = downloadFile('trig-swirls.html', 'document').then(function (optionsDoc) {

		optionsDoc.getElementById('trig-offset-x').addEventListener('input', function (event) {
			setBgProperty(me, 'offsetX', parseFloat(this.value) * TWO_PI);
			generateBackground(0);
		});

		optionsDoc.getElementById('trig-offset-y').addEventListener('input', function (event) {
			setBgProperty(me, 'offsetY', parseFloat(this.value) * TWO_PI);
			generateBackground(0);
		});

		optionsDoc.getElementById('trig-zoom').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value > 0) {
				setBgProperty(me, 'zoom', value);
				generateBackground(0);
			}
		});

		return optionsDoc;
	});

	this.offsetX = 0;
	this.offsetY = 0;
	this.zoom = 1.8;
	this.luminosityModulii = [90, 1];
	this.luminosityThresholds = [0.1264, 1];	// [0..1] / 10 + 0.125
	this.luminosityDepth = 1;
	this.luminositySteps = [170, 170];	// 1..170

	this.redModulii = [112, 1];
	this.redThresholds = [0.1837, 1];
	this.redDepth = 1;
	this.redSteps = [1, 1];		// 1..255

	this.blueModulii = [200, 1];
	this.blueThresholds = [0.1406, 1];
	this.blueDepth = 1;
	this.blueSteps = [1, 1];	// 1..255
}

TrigPatterns.prototype.animatable = {
	continuous: [
		'offsetX', 'offsetY', 'zoom',
		'luminosityModulii', 'luminosityThresholds',
		'redModulii', 'redThresholds',
		'blueModulii', 'blueThresholds',
	],
	stepped: [
		'luminosityDepth', 'redDepth', 'blueDepth',
		'luminositySteps', 'redSteps', 'blueSteps',
	],
}
