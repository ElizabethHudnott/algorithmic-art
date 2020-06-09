function JuliaSet() {
	const me = this;
	this.title = 'Julia Set';
	this.hasRandomness = false;
	this.isShader = true;

	this.optionsDocument = downloadFile('julia-set.html', 'document').then(function (optionsDoc) {
		const constantRow = optionsDoc.getElementById('julia-constant');
		const c3RealInput = optionsDoc.getElementById('julia-c3-real');
		const c3ImInput = optionsDoc.getElementById('julia-c3-im');
		const z0Row = optionsDoc.getElementById('julia-z0');
		const z0RealInput = optionsDoc.getElementById('julia-z0-real');
		const z0ImInput = optionsDoc.getElementById('julia-z0-im');

		optionsDoc.getElementById('julia-type').addEventListener('input', function (event) {
			const isMandelbrot = this.value === '1';
			assignBgAttribute(me, 'mandelbrot', isMandelbrot);
			if (isMandelbrot) {
				setAttribute('finalRealConstant', z0RealInput.value, false);
				setAttribute('finalImConstant', z0ImInput.value, false);
			} else {
				setAttribute('finalRealConstant', c3RealInput.value, false);
				setAttribute('finalImConstant', c3ImInput.value, false);
			}
			constantRow.hidden = isMandelbrot;
			z0Row.hidden = !isMandelbrot;
			generateBackground(0);
		});

		optionsDoc.getElementById('julia-pre-operation').addEventListener('input', function (event) {
			assignBgAttribute(me, 'preOperation', parseInt(this.value));
			generateBackground(0);
		});

		function setAttribute(attributeName, text, redraw) {
			let value;
			if (text.trim() === '') {
				value = 0;
			} else {
				value = parseFloat(text);
			}
			if (Number.isFinite(value)) {
				assignBgAttribute(me, attributeName, value);
				if (redraw) {
					generateBackground(0);
				}
			}
		}

		optionsDoc.getElementById('julia-inverse').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0 && value <= 1) {
				assignBgAttribute(me, 'inverse', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('julia-mu-translation').addEventListener('input', function (event) {
			setAttribute('muTranslation', this.value, true);
		});

		optionsDoc.getElementById('julia-c1-real').addEventListener('input', function (event) {
			setAttribute('numeratorRealConstant', this.value, true);
		});

		optionsDoc.getElementById('julia-c1-im').addEventListener('input', function (event) {
			setAttribute('numeratorImConstant', this.value, true);
		});

		optionsDoc.getElementById('julia-c2-real').addEventListener('input', function (event) {
			setAttribute('denominatorRealConstant', this.value, true);
		});

		optionsDoc.getElementById('julia-c2-im').addEventListener('input', function (event) {
			setAttribute('denominatorImConstant', this.value, true);
		});

		c3RealInput.addEventListener('input', function (event) {
			setAttribute('finalRealConstant', this.value, true);
		});

		c3ImInput.addEventListener('input', function (event) {
			setAttribute('finalImConstant', this.value, true);
		});

		z0RealInput.addEventListener('input', function (event) {
			setAttribute('finalRealConstant', this.value, true);
		});

		z0ImInput.addEventListener('input', function (event) {
			setAttribute('finalImConstant', this.value, true);
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

	this.numeratorExponents = [2, 3, 4, 5];
	this.numeratorCoefficients = [1, 0, 0, 0];
	this.denominatorExponents = [2, 3, 4, 5];
	this.denominatorCoefficients = [0, 0, 0, 0];
	this.numeratorRealConstant = 0;
	this.numeratorImConstant = 0;
	this.denominatorRealConstant = 1;
	this.denominatorImConstant = 0;
	this.finalRealConstant = -0.4;
	this.finalImConstant = 0.6;
	this.mandelbrot = false;
	// 0 = normal, 1 = conjugate, 2 = burning ship
	this.preOperation = 0;
	this.inverse = 0;
	this.muTranslation = 0;

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
		'inverse', 'muTranslation', 'xRange', 'xCentre', 'yRange', 'yCentre', 'escapeRadius',
	],
	xy: [
		['numeratorRealConstant', 'numeratorImConstant'],
		['denominatorRealConstant', 'denominatorImConstant'],
		['finalRealConstant', 'finalImConstant'],
	],
	stepped: [
		'maxIterations', 'mandelbrot', 'preOperation'
	]
};

return JuliaSet;
