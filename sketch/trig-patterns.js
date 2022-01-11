export default function TrigPatterns() {
	const me = this;
	this.title = 'Trigonometry Patterns';
	this.isShader = true;

/*
	this.optionsDocument = downloadFile('webgl-demo.html', 'document').then(function (optionsDoc) {
		optionsDoc.getElementById('gldemo-red').addEventListener('input', function (event) {
			setBgProperty(me, 'red', parseFloat(this.value));
			generateBackground(0);
		});

		return optionsDoc;
	});
*/
	this.offsetX = 0;
	this.offsetY = 0;
	this.zoom = 2.4;
	this.divisor = 40;
	this.modulii = [90, 112, 200];
	this.thresholds = [1024, 2304, 5625];
	this.tween = 0;
}

TrigPatterns.prototype.animatable = {
	continuous: [
		'zoom', 'divisor', 'offsetX', 'offsetY', 'modulii', 'thresholds',
	],
}
