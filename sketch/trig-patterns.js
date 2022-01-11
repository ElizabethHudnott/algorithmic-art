export default function TrigPatterns() {
	const me = this;
	this.title = 'Trigonometry Patterns';
	this.isShader = true;

	this.optionsDocument = downloadFile('trig-patterns.html', 'document').then(function (optionsDoc) {

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
	this.zoom = 2;
	this.modulii = [90, 112, 200];
	this.thresholds = [1024, 2304, 5625];
}

TrigPatterns.prototype.animatable = {
	continuous: [
		'zoom', 'offsetX', 'offsetY', 'modulii', 'thresholds',
	],
}
