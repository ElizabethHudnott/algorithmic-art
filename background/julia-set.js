function JuliaSet() {
	const me = this;
	this.title = 'Julia Set';
	this.hasRandomness = false;
	this.isShader = true;

	this.optionsDocument = downloadFile('julia-set.html', 'document').then(function (optionsDoc) {

		optionsDoc.getElementById('julia-c-real').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				const r = Math.sqrt(me.escapeRSquared);
				if (value < -r) {
					value = -r;
					this.value = value;
				} else if (value > r) {
					value = r;
					this.value = value;
				}
				assignBgAttribute(me, 'cReal', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('julia-c-im').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				const r = Math.sqrt(me.escapeRSquared);
				if (value < -r) {
					value = -r;
					this.value = value;
				} else if (value > r) {
					value = r;
					this.value = value;
				}
				assignBgAttribute(me, 'cIm', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('julia-centre-x').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				assignBgAttribute(me, 'xCentre', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('julia-centre-y').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				assignBgAttribute(me, 'yCentre', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('julia-range-x').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value > 0) {
				assignBgAttribute(me, 'xRange', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('julia-range-y').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value > 0) {
				assignBgAttribute(me, 'yRange', value);
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
	],
	xy: [
		['cReal', 'cIm'],
	],
	stepped: [
		'maxIterations'
	]
};

return JuliaSet;
