function JuliaSet() {
	const me = this;
	this.title = 'Julia Set';
	this.hasRandomness = false;
	this.isShader = true;

	this.optionsDocument = downloadFile('julia-set.html', 'document').then(function (optionsDoc) {

		optionsDoc.getElementById('julia-type').addEventListener('input', function (event) {
			const mandelbrotSelected = this.value === 'mandelbrot';
			assignBgAttribute(me, 'mandelbrot', mandelbrotSelected);
			generateBackground(0);
		});

		optionsDoc.getElementById('julia-c3-real').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				const r = me.escapeRadius;
				if (value < -r) {
					value = -r;
					this.value = value;
				} else if (value > r) {
					value = r;
					this.value = value;
				}
				assignBgAttribute(me, 'finalRealConstant', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('julia-c3-im').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				const r = me.escapeRadius;
				if (value < -r) {
					value = -r;
					this.value = value;
				} else if (value > r) {
					value = r;
					this.value = value;
				}
				assignBgAttribute(me, 'finalImConstant', value);
				generateBackground(0);
			}
		});

		function updateConstant(event) {
			const constantType = this.id[6];
			let property;
			switch (constantType) {
			case 'm':
				property = 'numeratorCoefficients';
				break;
			case 'p':
				property = 'numeratorExponents';
				break;
			case 'n':
				property = 'denominatorCoefficients';
				break;
			case 'q':
				property = 'denominatorExponents';
				break;
			default:
				throw new Error('Missing case in switch statement');
			}
			let value;
			if (this.value.trim() === '') {
				value = 0;
			} else {
				value = parseFloat(this.value);
			}
			if (Number.isFinite(value)) {
				const arr = me[property];
				arr[parseInt(this.id[7]) - 1] = value;
				assignBgAttribute(me, property);
				generateBackground(0);
			}
		}

		for (let propertyType of ['m', 'p', 'n', 'q']) {
			for (let i = 1; i <= 4; i++) {
				optionsDoc.getElementById('julia-' + propertyType + i).addEventListener('input', updateConstant);
			}
		}

		function setAttribute(attributeName, text) {
			let value;
			if (text.trim() === '') {
				value = 0;
			} else {
				value = parseFloat(text);
			}
			if (Number.isFinite(value)) {
				assignBgAttribute(me, attributeName, value);
				generateBackground(0);
			}
		}

		optionsDoc.getElementById('julia-c1-real').addEventListener('input', function (event) {
			setAttribute('numeratorRealConstant', this.value);
		});

		optionsDoc.getElementById('julia-c1-im').addEventListener('input', function (event) {
			setAttribute('numeratorIm', this.value);
		});

		optionsDoc.getElementById('julia-c2-real').addEventListener('input', function (event) {
			setAttribute('denominatorRealConstant', this.value);
		});

		optionsDoc.getElementById('julia-c2-im').addEventListener('input', function (event) {
			setAttribute('denominatorIm', this.value);
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

	this.numeratorExponents = [2, 0, 0, 0];
	this.numeratorCoefficients = [1, 0, 0, 0];
	this.denominatorExponents = [0, 0, 0, 0];
	this.denominatorCoefficients = [0, 0, 0, 0];
	this.numeratorRealConstant = 0;
	this.numeratorImConstant = 0;
	this.denominatorRealConstant = 1;
	this.denominatorImConstant = 0;
	this.finalRealConstant = -0.4;
	this.finalImConstant = 0.6;
	this.mandelbrot = false;

	this.xRange = 3;
	this.xCentre = 0;
	this.yRange = 2;
	this.yCentre = 0;
	this.maxIterations = 80;
	this.escapeRadius = 4;

}

JuliaSet.prototype.animatable = {
	continuous: [
		'numeratorExponents', 'numeratorCoefficients', 'denominatorExponents', 'denominatorCoefficients',
		'xRange', 'xCentre', 'yRange', 'yCentre', 'escapeRadius',
	],
	xy: [
		['numeratorRealConstant', 'numeratorImConstant'],
		['denominatorRealConstant', 'denominatorImConstant'],
		['finalRealConstant', 'finalImConstant'],
	],
	stepped: [
		'maxIterations', 'mandelbrot'
	]
};

return JuliaSet;
