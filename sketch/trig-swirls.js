export default function TrigPatterns() {
	const me = this;
	this.title = 'Trigonometry Patterns';
	this.helpFile = 'help/trig-swirls.html';
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
	this.modulii = [90, 112, 200, 134];
	this.thresholds = [100, 587, 156, 412];
	this.bitDepth = 4;
}

TrigPatterns.prototype.animatable = {
	continuous: [
		'zoom', 'offsetX', 'offsetY', 'modulii', 'thresholds',
	],
	stepped: [
		'bitDepth',
	],
}
