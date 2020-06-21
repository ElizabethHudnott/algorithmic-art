function JuliaSet() {
	const me = this;
	this.title = 'Julia Set';
	this.hasRandomness = false;
	this.isShader = true;

	const palette = new Array(256);
	this.palette = palette;
	for (let i = 6; i < 256; i++) {
		palette[i] = [0, 0, 0, 1];
	}
	palette[0] = [2/6, 1, 0.2, 1];
	palette[1] = [1/6, 1, 0.5, 1];
	palette[2] = [2/6, 1, 0.5, 1];
	palette[3] = [3/6, 1, 0.5, 1];
	palette[4] = [4/6, 1, 0.5, 1];
	palette[5] = [5/6, 1, 0.5, 1];
	this.numColors = 7;

	this.optionsDocument = downloadFile('julia-set.html', 'document').then(function (optionsDoc) {
		const inversionRow = optionsDoc.getElementById('julia-inversion');
		const z0Row = optionsDoc.getElementById('julia-z0');
		const z0RealInput = optionsDoc.getElementById('julia-z0-real');
		const z0ImInput = optionsDoc.getElementById('julia-z0-im');
		const constantRow = optionsDoc.getElementById('julia-constant');
		const c3RealInput = optionsDoc.getElementById('julia-c3-real');
		const c3ImInput = optionsDoc.getElementById('julia-c3-im');

		const colorMultipleIntInput = optionsDoc.getElementById('julia-color-multiple-int');
		const colorMultipleFracInput = optionsDoc.getElementById('julia-color-multiple-frac');
		const paletteUI = optionsDoc.getElementById('julia-palette');
		const hueSlider = optionsDoc.getElementById('julia-hue');
		const saturationSlider = optionsDoc.getElementById('julia-saturation');
		const lightnessSlider = optionsDoc.getElementById('julia-lightness');

		function setColorMultiple() {
			let multiple = parseFloat(colorMultipleIntInput.value);
			if (Number.isNaN(multiple)) {
				multiple = Math.floor(me.colorMultiple);
			}
			multiple += parseInt(colorMultipleFracInput.value) / me.numColors;

			if (multiple > 0) {
				setBgProperty(me, 'colorMultiple', multiple);
				generateBackground(0);
			}
		}
		colorMultipleIntInput.addEventListener('input', setColorMultiple);
		colorMultipleFracInput.addEventListener('input', setColorMultiple);

		let selectedColorIndex = 0;
		function selectColor(event) {
			selectedColorIndex = parseInt(this.dataset.index);
			const color = me.palette[selectedColorIndex];
			hueSlider.value = color[0];
			saturationSlider.value = color[1];
			lightnessSlider.value = color[2];
		}

		for (let i = 0; i < 256; i++) {
			const label = optionsDoc.createElement('LABEL');
			label.classList.add('btn');
			const span = optionsDoc.createElement('SPAN');
			span.classList.add('sr-only');
			span.innerHTML = 'Colour ' + String(i + 1);
			label.appendChild(span);
			const button = optionsDoc.createElement('INPUT');
			label.appendChild(button);
			button.type = 'radio';
			button.name = 'julia-swatch';
			button.dataset.index = i;
			button.addEventListener('click', selectColor);
			label.hidden = i >= me.numColors;
			const color = palette[i];
			label.style.backgroundColor = hsla(color[0] * 360, color[1], color[2], 1);
			paletteUI.appendChild(label);
		}
		paletteUI.children[0].classList.add('active');
		paletteUI.children[0].children[1].checked = true;

		let redrawTimeout;
		function previewColor() {
			const color = me.palette[selectedColorIndex];
			const swatch = paletteUI.children[selectedColorIndex];
			swatch.style.backgroundColor = hsla(color[0] * 360, color[1], color[2], 1);
			if (redrawTimeout === undefined) {
				redrawTimeout = setTimeout(setColor, 50);
			}
		}
		function setColor() {
			setBgPropertyElement(me, 'palette', selectedColorIndex);
			generateBackground(0);
			redrawTimeout = undefined;
		}
		hueSlider.value = me.palette[0][0];
		hueSlider.addEventListener('input', function (event) {
			me.palette[selectedColorIndex][0] = parseFloat(this.value) % 1;
			previewColor();
		});
		hueSlider.addEventListener('pointerup', setColor);
		hueSlider.addEventListener('keyup', setColor);

		saturationSlider.value = me.palette[0][1];
		saturationSlider.addEventListener('input', function (event) {
			me.palette[selectedColorIndex][1] = parseFloat(this.value);
			previewColor();
		});
		saturationSlider.addEventListener('pointerup', setColor);
		saturationSlider.addEventListener('keyup', setColor);

		lightnessSlider.value = me.palette[0][2];
		lightnessSlider.addEventListener('input', function (event) {
			me.palette[selectedColorIndex][2] = parseFloat(this.value);
			previewColor();
		});
		lightnessSlider.addEventListener('pointerup', setColor);
		lightnessSlider.addEventListener('keyup', setColor);

		optionsDoc.getElementById('julia-num-colors').addEventListener('input', function (event) {
			const value = parseInt(this.value);
			if (value > 0 && value <= 256) {
				const buttons = paletteUI.children;
				if (value > me.numColors) {
					for (let i = me.numColors; i < value; i++) {
						buttons[i].hidden = false;
					}
				} else {
					for (let i = value; i < me.numColors; i++) {
						buttons[i].hidden = true;
					}
				}
				setBgProperty(me, 'numColors', value);
				colorMultipleFracInput.max = value - 1;
				setColorMultiple();
				generateBackground(0);
			}
		})

		optionsDoc.getElementById('julia-type').addEventListener('input', function (event) {
			const isMandelbrot = this.value === '1';
			setBgProperty(me, 'mandelbrot', isMandelbrot);
			if (isMandelbrot) {
				setProperty('finalRealConstant', z0RealInput.value, false);
				setProperty('finalImConstant', z0ImInput.value, false);
			} else {
				setProperty('finalRealConstant', c3RealInput.value, false);
				setProperty('finalImConstant', c3ImInput.value, false);
			}
			constantRow.hidden = isMandelbrot;
			inversionRow.hidden = !isMandelbrot;
			z0Row.hidden = !isMandelbrot;
			generateBackground(0);
		});

		optionsDoc.getElementById('julia-pre-operation').addEventListener('input', function (event) {
			setBgProperty(me, 'preOperation', parseInt(this.value));
			generateBackground(0);
		});

		function setProperty(attributeName, text, redraw) {
			let value;
			if (text.trim() === '') {
				value = 0;
			} else {
				value = parseFloat(text);
			}
			if (Number.isFinite(value) && value !== me[attributeName]) {
				setBgProperty(me, attributeName, value);
				if (redraw) {
					generateBackground(0);
				}
			}
		}

		function setPropertyElement(attributeName, index, text) {
			let value;
			if (text.trim() === '') {
				value = 0;
			} else {
				value = parseFloat(text);
			}
			if (Number.isFinite(value) && value !== me[attributeName][index]) {
				setBgPropertyElement(me, attributeName, index, value);
				generateBackground(0);
			}
		}

		function setNonNegativeProperty(attributeName, text) {
			const value = parseFloat(text);
			if (value >= 0) {
				setBgProperty(me, attributeName, value);
				generateBackground(0);
			}
		}

		optionsDoc.getElementById('julia-inverse').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0 && value <= 1) {
				setBgProperty(me, 'inverse', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('julia-feedback-real').addEventListener('input', function (event) {
			setPropertyElement('feedback', 0, this.value);
		});

		optionsDoc.getElementById('julia-feedback-im').addEventListener('input', function (event) {
			setPropertyElement('feedback', 1, this.value);
		});

		optionsDoc.getElementById('julia-feedback2-real').addEventListener('input', function (event) {
			setPropertyElement('feedback2', 0, this.value);
		});

		optionsDoc.getElementById('julia-feedback2-im').addEventListener('input', function (event) {
			setPropertyElement('feedback2', 1, this.value);
		});

		optionsDoc.getElementById('julia-mu-translation').addEventListener('input', function (event) {
			setProperty('muTranslation', this.value, true);
		});

		optionsDoc.getElementById('julia-c1-real').addEventListener('input', function (event) {
			setPropertyElement('numeratorConstant', 0, this.value);
		});

		optionsDoc.getElementById('julia-c1-im').addEventListener('input', function (event) {
			setPropertyElement('numeratorConstant', 1, this.value);
		});

		optionsDoc.getElementById('julia-c2-real').addEventListener('input', function (event) {
			setPropertyElement('denominatorConstant', 0, this.value);
		});

		optionsDoc.getElementById('julia-c2-im').addEventListener('input', function (event) {
			setPropertyElement('denominatorConstant', 1, this.value);
		});

		optionsDoc.getElementById('julia-extra-multiple').addEventListener('input', function (event) {
			setProperty('extraTermCoefficient', this.value, true);
		});

		optionsDoc.getElementById('julia-extra-function').addEventListener('input', function (event) {
			setBgProperty(me, 'extraTermFunction', parseInt(this.value));
			generateBackground(0);
		});

		c3RealInput.addEventListener('input', function (event) {
			setProperty('finalRealConstant', this.value, true);
		});

		c3ImInput.addEventListener('input', function (event) {
			setProperty('finalImConstant', this.value, true);
		});

		optionsDoc.getElementById('julia-c1-function').addEventListener('input', function (event) {
			setBgProperty(me, 'numeratorFunction', parseInt(this.value));
			generateBackground(0);
		});

		optionsDoc.getElementById('julia-c2-function').addEventListener('input', function (event) {
			setBgProperty(me, 'denominatorFunction', parseInt(this.value));
			generateBackground(0);
		});

		optionsDoc.getElementById('julia-c3-function').addEventListener('input', function (event) {
			setBgProperty(me, 'finalFunction', parseInt(this.value));
			generateBackground(0);
		});

		z0RealInput.addEventListener('input', function (event) {
			setProperty('finalRealConstant', this.value, true);
		});

		z0ImInput.addEventListener('input', function (event) {
			setProperty('finalImConstant', this.value, true);
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
				setBgPropertyElement(me, property, parseInt(this.id[7]) - 1, value);
				generateBackground(0);
			}
		}

		for (let propertyType of ['m', 'p', 'n', 'q']) {
			for (let i = 1; i <= 4; i++) {
				optionsDoc.getElementById('julia-' + propertyType + i).addEventListener('input', updateConstant);
			}
		}

		optionsDoc.getElementById('julia-escape-type').addEventListener('input', function (event) {
			setBgProperty(me, 'escapeType', parseInt(this.value));
			generateBackground(0);
		});

		optionsDoc.getElementById('julia-escape-value').addEventListener('input', function (event) {
			setNonNegativeProperty('escapeValue', this.value);
		});

		optionsDoc.getElementById('julia-iterations').addEventListener('input', function (event) {
			setNonNegativeProperty('maxIterations', this.value);
		});

		optionsDoc.getElementById('julia-centre-x').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				setBgProperty(me, 'xCentre', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('julia-centre-y').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				setBgProperty(me, 'yCentre', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('julia-range-x').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value > 0) {
				setBgProperty(me, 'xRange', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('julia-range-y').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value > 0) {
				setBgProperty(me, 'yRange', value);
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('julia-color-power').addEventListener('input', function (event) {
			setNonNegativeProperty('colorPower', this.value);
		});

		optionsDoc.getElementById('julia-color-offset').addEventListener('input', function (event) {
			setProperty('colorOffset', this.value, true);
		});

		optionsDoc.getElementById('julia-color-interpolation').addEventListener('input', function (event) {
			let value = parseFloat(this.value);
			value = Math.pow(value, 0.15);
			setBgProperty(me, 'interpolation', value);
			generateBackground(0);
		});

		optionsDoc.getElementById('julia-color-wrap').addEventListener('input', function (event) {
			setBgProperty(me, 'wrapPalette', this.checked);
			generateBackground(0);
		});

		return optionsDoc;
	});

	this.numeratorExponents = [2, 0, 0, 0];
	this.numeratorCoefficients = [1, 0, 0, 0];
	this.denominatorExponents = [0, 0, 0, 0];
	this.denominatorCoefficients = [0, 0, 0, 0];
	this.numeratorConstant = [0, 0];
	this.denominatorConstant = [1, 0];
	this.extraTermCoefficient = 0;
	this.finalRealConstant = -0.4;
	this.finalImConstant = 0.6;
	this.numeratorFunction = 0; // identity function
	this.denominatorFunction = 0;
	this.extraTermFunction = 3; // sin(z)
	this.finalFunction = 0;
	this.feedback = [0, 0];
	this.feedback2 = [0, 0];
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
	this.escapeValue = 2;
	this.escapeType = 0; // 0 = circular, 1 = use y-coordinate only

	this.innerColor = [0, 0, 0, 0];
	this.colorMultiple = 1;
	this.colorPower = 1;
	this.colorOffset = 0;
	this.wrapPalette = true;
	this.interpolation = 1;
}

JuliaSet.prototype.animatable = {
	continuous: [
		'numeratorExponents', 'numeratorCoefficients', 'denominatorExponents', 'denominatorCoefficients',
		'numeratorConstant', 'denominatorConstant', 'extraTermCoefficient', 'feedback', 'feedback2',
		'inverse', 'muTranslation',
		'xRange', 'xCentre', 'yRange', 'yCentre', 'escapeValue',
		'innerColor', 'interpolation', 'colorMultiple', 'colorPower', 'colorOffset',
		'palette'
	],
	xy: [
		['finalRealConstant', 'finalImConstant'],
	],
	stepped: [
		'numeratorFunction', 'denominatorFunction', 'extraTermFunction', 'finalFunction',
		'maxIterations', 'escapeType', 'mandelbrot', 'preOperation',
		'numColors', 'wrapPalette'
	]
};

return JuliaSet;
