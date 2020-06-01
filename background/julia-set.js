function JuliaSet() {
	const me = this;
	this.title = 'Julia Set';
	this.hasRandomness = false;
	this.isShader = true;

	this.optionsDocument = downloadFile('julia-set.html', 'document').then(function (optionsDoc) {

		optionsDoc.getElementById('julia-c-real').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value > -1 && value < 1) {
				assignBgAttribute(me, 'cReal', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('julia-c-im').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value > -1 && value < 1) {
				assignBgAttribute(me, 'cIm', value);
				generateBackground(0);
			}
		});

		return optionsDoc;
	});

	this.xRange = 3;
	this.xCentre = 0;
	this.yRange = 2;
	this.yCentre = 0;
	this.maxIterations = 80;
	this.escapeRSquared = 4;

	this.cReal = -0.4;
	this.cIm = 0.6;
}

JuliaSet.prototype.animatable = {
	continuous: [
		'xRange', 'xCentre', 'yRange', 'yCentre', 'escapeRSquared',
		'cReal', 'cIm',
	],
	stepped: [
		'maxIterations'
	]
};

return JuliaSet;
