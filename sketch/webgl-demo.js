export default function WebGLDemo() {
	const me = this;
	this.title = 'WebGL Demo Sketch';
	this.isShader = true;

	this.optionsDocument = downloadFile('webgl-demo.html', 'document').then(function (optionsDoc) {
		optionsDoc.getElementById('gldemo-red').addEventListener('input', function (event) {
			setBgProperty(me, 'red', parseFloat(this.value));
			generateBackground(0);
		});

		return optionsDoc;
	});

	this.red = 0;
	this.tween = 0;
}

WebGLDemo.prototype.animatable = {
	continuous: [
		'red'
	],
}
