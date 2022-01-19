export default function TrigPatterns() {
	const me = this;
	this.title = 'Trigonometry Swirls';
	this.helpFile = 'help/trig-swirls.html';
	this.backgroundColor = [0, 0, 0];
	this.isShader = true;

	this.optionsDocument = downloadFile('trig-swirls.html', 'document').then(function (optionsDoc) {

		optionsDoc.getElementById('swirl-offset-x').addEventListener('input', function (event) {
			setBgProperty(me, 'offsetX', parseFloat(this.value) * TWO_PI);
			generateBackground(0);
		});

		optionsDoc.getElementById('swirl-offset-y').addEventListener('input', function (event) {
			setBgProperty(me, 'offsetY', parseFloat(this.value) * TWO_PI);
			generateBackground(0);
		});

		optionsDoc.getElementById('swirl-zoom').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value > 0) {
				setBgProperty(me, 'zoom', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('swirl-translate-x').addEventListener('input', function (event) {
			setBgProperty(me, 'translateX', parseFloat(this.value) / 1.8);
			generateBackground(0);
		});

		optionsDoc.getElementById('swirl-translate-y').addEventListener('input', function (event) {
			setBgProperty(me, 'translateY', parseFloat(this.value) / 1.8);
			generateBackground(0);
		});

		return optionsDoc;
	});

	this.offsetX = 0;
	this.offsetY = 0;
	this.zoom = 1.8;
	this.translateX = 0;
	this.translateY = 0;

	this.luminosityModulii = [90, 2, 2];
	this.luminosityShift = [0.75, 0.75, 0.75];	// 0..1
	this.luminosityThresholds = [0.1011, 0.1, 0.1];
	this.luminosityDepth = 1;
	this.luminositySteps = [171, 1, 1];	// 1..171
	this.luminosityOffset = 0;			// -1/2..29/31

	this.redModulii = [115, 2, 2];
	this.redShift = [0.75, 0.75, 0.75];	 // 0..1
	this.redThresholds = [0.1469, 0.1, 0.1];
	this.redDepth = 1;
	this.redSteps = [1, 1, 1];			// 1..255
	this.redOffset = 0;					// -0.5..0.5

	this.blueModulii = [200, 2, 2];
	this.blueShift = [0.75, 0.75, 0.75]; // 0..1
	this.blueThresholds = [0.1125, 0.1, 0.1];
	this.blueDepth = 1;
	this.blueSteps = [1, 1, 1];			// 1..255
	this.blueOffset = 0;				// -0.5..0.5
}

TrigPatterns.prototype.animatable = {
	continuous: [
		'offsetX', 'offsetY', 'zoom', 'translateX', 'translateY',
		'luminosityModulii', 'luminosityThresholds',
		'redModulii', 'redThresholds',
		'blueModulii', 'blueThresholds',
		'luminosityOffset', 'redOffset', 'blueOffset',
		'luminosityShift', 'redShift', 'blueShift',
	],
	stepped: [
		'luminosityDepth', 'redDepth', 'blueDepth',
		'luminositySteps', 'redSteps', 'blueSteps',
	],
}
