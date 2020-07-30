export default function JuliaSet() {
	const me = this;
	this.title = 'Julia Set';
	this.hasRandomness = false;
	this.isShader = true;
	this.helpFile = 'help/julia-set.html';

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

		const colorVariableInput = optionsDoc.getElementById('julia-color-variable');
		const colorMultipleIntInput = optionsDoc.getElementById('julia-color-multiple-int');
		const colorMultipleFracInput = optionsDoc.getElementById('julia-color-multiple-frac');
		const colorPowerInput = optionsDoc.getElementById('julia-color-power');
		const paletteFields = optionsDoc.getElementById('julia-palette-fields');
		const paletteUI = optionsDoc.getElementById('julia-palette');
		const hueSlider = optionsDoc.getElementById('julia-hue');
		const saturationSlider = optionsDoc.getElementById('julia-saturation');
		const lightnessSlider = optionsDoc.getElementById('julia-lightness');
		const opacitySlider = optionsDoc.getElementById('julia-opacity');
		const colorComponentInput = optionsDoc.getElementById('julia-color-component');
		const colorHelpElement = optionsDoc.getElementById('julia-palette-help');

		const colorHelpMsgNormal = 'Use the Shift key, a right mouse click, or tap and hold to copy, swap, randomize or flip the brightness of multiple colours.';
		const colorHelpMsgSelectDest = 'Now select the destination color.';
		colorHelpElement.innerHTML = colorHelpMsgNormal;

		function setColorMultiple() {
			let multiple = parseFloat(colorMultipleIntInput.value);
			if (Number.isNaN(multiple)) {
				multiple = Math.floor(me.colorMultiple);
			}
			multiple += parseInt(colorMultipleFracInput.value) / me.numColors;
			setBgProperty(me, 'colorMultiple', multiple);
			generateBackground(0);
		}
		colorMultipleIntInput.addEventListener('input', setColorMultiple);
		colorMultipleFracInput.addEventListener('input', setColorMultiple);

		let colorSelectionStart = 0;
		let colorSelectionEnd = 0;
		const ColorOperation = Object.freeze({
			'SELECT': 0,
			'COPY': 1,
			'SWAP': 2,
			'SPREAD': 3,
			'REVERSE': 4,
			'SHUFFLE': 5,
			'RANDOMIZE': 6,
			'INVERT': 7,
			'SELECT_ALL': 8,
		});
		const ColorComponents = Object.freeze({
			'HUE': 0,
			'SATURATION': 1,
			'LIGHTNESS': 2,
			'OPACITY': 3,
			'ALL': 4,
		});
		let paletteProperty = 'palette';
		let colorOperation = ColorOperation.SELECT;

		function updateSwatch(i) {
			const activePalette = me[paletteProperty];
			const color = activePalette[i];
			const swatch = paletteUI.children[i].children[0];
			swatch.style.backgroundColor = hsla(color[0] * 360, color[1], color[2], color[3]);
		}

		function updateColorSliders() {
			const activePalette = me[paletteProperty];
			const color = activePalette[colorSelectionStart];
			hueSlider.value = color[0];
			saturationSlider.value = color[1];
			lightnessSlider.value = color[2];
			opacitySlider.value = color[3];
		}

		function selectColor(event) {
			const shift = event.shiftKey || event.longPress;
			const activePalette = me[paletteProperty];
			const sourceColor = activePalette[colorSelectionStart];
			const colorComponent = parseInt(colorComponentInput.value);
			const clickIndex = parseInt(event.target.dataset.index);

			switch (colorOperation) {
			case ColorOperation.COPY:
				if (colorSelectionStart === colorSelectionEnd) {
					// Copy a single colour, possibly multiple times.
					let destRangeStart, destRangeEnd;
					if (shift) {
						if (clickIndex < colorSelectionStart) {
							destRangeStart = clickIndex;
							destRangeEnd = colorSelectionStart - 1;
						} else {
							destRangeStart = colorSelectionStart + 1;
							destRangeEnd = clickIndex;
						}
					} else {
						destRangeStart = clickIndex;
						destRangeEnd = clickIndex;
					}
					if (colorComponent === ColorComponents.ALL) {
						for (let i = destRangeStart; i <= destRangeEnd; i++) {
							activePalette[i] = sourceColor.slice();
							updateSwatch(i);
							setBgPropertyElement(me, paletteProperty, i);
						}
					} else {
						for (let i = destRangeStart; i <= destRangeEnd; i++) {
							activePalette[i][colorComponent] = sourceColor[colorComponent];
							updateSwatch(i);
							setBgPropertyElement(me, paletteProperty, i);
						}
					}
				} else {
					// Copy multiple colours once
					for (let i = colorSelectionStart; i <= colorSelectionEnd; i++) {
						const destIndex = clickIndex + i - colorSelectionStart;
						if (destIndex >= me.numColors) {
							break;
						}
						if (colorComponent === ColorComponents.ALL) {
							activePalette[destIndex] = activePalette[i].slice();
						} else {
							activePalette[destIndex][colorComponent] = activePalette[i][colorComponent];
						}
						updateSwatch(destIndex);
						setBgPropertyElement(me, paletteProperty, destIndex);
					}
				}
				generateBackground(0);
				break;

			case ColorOperation.SWAP:
				for (let i = colorSelectionStart; i <= colorSelectionEnd; i++) {
						const destIndex = clickIndex + i - colorSelectionStart;
						if (destIndex >= me.numColors) {
							break;
						}
						if (colorComponent === ColorComponents.ALL) {
							const temp = activePalette[i];
							activePalette[i] = activePalette[destIndex];
							activePalette[destIndex] = temp;
						} else {
							const temp = activePalette[i][colorComponent];
							activePalette[i][colorComponent] = activePalette[destIndex][colorComponent];
							activePalette[destIndex][colorComponent] = temp;
						}
						updateSwatch(i);
						updateSwatch(destIndex);
						setBgPropertyElement(me, paletteProperty, i);
						setBgPropertyElement(me, paletteProperty, destIndex);
				}
				generateBackground(0);
				break;

			case ColorOperation.SELECT_ALL:
				colorSelectionStart = 0;
				colorSelectionEnd = me.numColors - 1;
				break;

			default:
				// Spread, reverse or shuffle
				let rangeStart, rangeEnd;
				if (clickIndex < colorSelectionStart) {
					rangeStart = clickIndex;
					rangeEnd = colorSelectionStart;
				} else {
					rangeStart = colorSelectionStart;
					rangeEnd = clickIndex;
				}
				colorRangeOperation(colorOperation, rangeStart, rangeEnd);

			}

			for (let i = colorSelectionStart; i <= colorSelectionEnd; i++) {
				paletteUI.children[i].children[0].classList.remove('active');
			}
			if (shift && colorOperation === ColorOperation.SELECT) {
				if (clickIndex < colorSelectionStart) {
					colorSelectionEnd = colorSelectionStart;
					colorSelectionStart = clickIndex;
				} else {
					colorSelectionEnd = clickIndex;
				}
			} else if (colorOperation !== ColorOperation.SELECT_ALL) {
				colorSelectionStart = clickIndex;
				colorSelectionEnd = clickIndex;
			}
			for (let i = colorSelectionStart; i <= colorSelectionEnd; i++) {
				paletteUI.children[i].children[0].classList.add('active');
			}
			updateColorSliders();
			colorOperation = ColorOperation.SELECT;
			colorHelpElement.innerHTML = colorHelpMsgNormal;
		}

		function colorRangeOperation(operation, rangeStart, rangeEnd) {
			const activePalette = me[paletteProperty];
			const colorComponent = parseInt(colorComponentInput.value);
			const rangeLength = rangeEnd - rangeStart + 1;
			switch (operation) {
			case ColorOperation.SPREAD:
				if (colorComponent === ColorComponents.ALL) {
					for (let j = 0; j < 3; j++) {
						const startValue = activePalette[rangeStart][j];
						const endValue = activePalette[rangeEnd][j];
						const spreadRange = endValue - startValue;
						for (let i = rangeStart + 1; i < rangeEnd; i++) {
							const step = i - rangeStart;
							activePalette[i][j] = startValue + step * spreadRange / rangeLength;
						}
					}
				} else {
					const startValue = activePalette[rangeStart][colorComponent];
					const endValue = activePalette[rangeEnd][colorComponent];
					const spreadRange = endValue - startValue;
					for (let i = rangeStart + 1; i < rangeEnd; i++) {
						const step = i - rangeStart;
						activePalette[i][colorComponent] = startValue + step * spreadRange / rangeLength;
					}
				}
				break;

			case ColorOperation.REVERSE:
				let start = rangeStart, end = rangeEnd;
				while (end - start > 1) {
					if (colorComponent === ColorComponents.ALL) {
						const temp = activePalette[start];
						activePalette[start] = activePalette[end];
						activePalette[end] = temp;
					} else {
						const temp = activePalette[start][colorComponent];
						activePalette[start][colorComponent] = activePalette[end][colorComponent];
						activePalette[end][colorComponent] = temp;
					}
					start++;
					end--;
				}
				break;

			case ColorOperation.SHUFFLE:
				const colors = activePalette.slice(rangeStart, rangeEnd + 1);
				if (colorComponent === ColorComponents.ALL) {
					for (let i = rangeStart; i < rangeEnd; i++) {
						const index = Math.trunc(Math.random() * colors.length);
						activePalette[i] = colors[index];
						colors.splice(index, 1);
					}
					activePalette[rangeEnd] = colors[0];
				} else {
					for (let i = rangeStart; i <= rangeEnd; i++) {
						const index = Math.trunc(Math.random() * colors.length);
						const color = activePalette[i].slice();
						color[colorComponent] = colors[index][colorComponent];
						activePalette[i] = color;
						colors.splice(index, 1);
					}
				}
				break;

			case ColorOperation.RANDOMIZE:
				if (colorComponent === ColorComponents.ALL) {
					for (let i = rangeStart; i <= rangeEnd; i++) {
						for (let j = 0; j < 3; j++) {
							activePalette[i][j] = Math.random();
						}
					}
				} else {
					for (let i = rangeStart; i <= rangeEnd; i++) {
						activePalette[i][colorComponent] = Math.random();
					}
				}
				break;

			case ColorOperation.INVERT:
				for (let i = colorSelectionStart; i <= colorSelectionEnd; i++) {
					const color = activePalette[i];
					let saturation = color[ColorComponents.SATURATION];
					let lightness = color[ColorComponents.LIGHTNESS];
					/* Convert HSL to HSV and back.
					 * https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_HSV
					 */
					let brightness = lightness + saturation * Math.min(lightness, 1 - lightness);
					if (brightness === 0) {
						saturation = 0;
					} else {
						saturation = 2 * (1 - lightness / brightness);
					}
					if (saturation === 0) {
						brightness = 1 - brightness;
					} else if (brightness <= 0.5) {
						brightness = brightness * 2;
					} else {
						brightness = brightness / 2;
					}
					lightness = brightness * (1 - saturation / 2);
					if (lightness === 0 || lightness === 1) {
						saturation = 0;
					} else {
						saturation = (brightness - lightness) / Math.min(lightness, 1 - lightness);
					}
					color[ColorComponents.SATURATION] = saturation;
					color[ColorComponents.LIGHTNESS] = lightness;
					const opacity = color[ColorComponents.OPACITY];
					if (opacity < 0.5) {
						color[ColorComponents.OPACITY] = 1 - opacity;
					}
					updateSwatch(i);
					setBgPropertyElement(me, paletteProperty, i);
				}
				break;

			case ColorOperation.SELECT_ALL:
				selectColor(event);
				return;

			}

			for (let i = rangeStart; i <= rangeEnd; i++) {
				updateSwatch(i);
				setBgPropertyElement(me, paletteProperty, i);
			}
			generateBackground(0);
			updateColorSliders();
		}

		function colorAction(event) {
			colorOperation = parseInt(this.dataset.colorOp);
			if (colorOperation >= ColorOperation.RANDOMIZE ||
				(colorOperation >= ColorOperation.SPREAD && colorSelectionStart !== colorSelectionEnd)
			) {
				colorRangeOperation(colorOperation, colorSelectionStart, colorSelectionEnd);
				colorOperation = ColorOperation.SELECT;
				colorHelpElement.innerHTML = colorHelpMsgNormal;
			} else {
				colorHelpElement.innerHTML = colorHelpMsgSelectDest;
			}
		}

		function multipartBlur(event) {
			if (!paletteFields.contains(event.relatedTarget)) {
				colorOperation = ColorOperation.SELECT;
				colorHelpElement.innerHTML = colorHelpMsgNormal;
			}
		}

		for (let element of optionsDoc.querySelectorAll('button[data-color-op]')) {
			element.addEventListener('click', colorAction);
			element.addEventListener('blur', multipartBlur);
		}

		function rightClickColor(event) {
			event.preventDefault();
			event.longPress = true;
			selectColor(event);
		}

		for (let i = 0; i < 256; i++) {
			const div = optionsDoc.createElement('DIV');
			div.hidden = i >= me.numColors;
			const button = optionsDoc.createElement('BUTTON');
			div.appendChild(button);
			button.type = 'button';
			button.name = 'julia-swatch';
			button.dataset.index = i;
			button.classList.add('btn');
			button.addEventListener('click', selectColor);
			button.addEventListener('contextmenu', rightClickColor);
			const color = palette[i];
			paletteUI.appendChild(div);
			updateSwatch(i);
		}
		paletteUI.children[0].children[0].classList.add('active');

		let redrawTimeout;
		function previewColor() {
			updateSwatch(colorSelectionStart);
			if (redrawTimeout === undefined) {
				redrawTimeout = setTimeout(setColor, 100);
			}
		}
		function setColor() {
			setBgPropertyElement(me, paletteProperty, colorSelectionStart);
			generateBackground(0);
			redrawTimeout = undefined;
		}
		{
			const activePalette = me[paletteProperty];
			hueSlider.value = activePalette[0][ColorComponents.HUE];
			hueSlider.addEventListener('input', function (event) {
				activePalette[colorSelectionStart][ColorComponents.HUE] = parseFloat(this.value) % 1;
				previewColor();
			});
			hueSlider.addEventListener('pointerup', setColor);
			hueSlider.addEventListener('keyup', setColor);

			saturationSlider.value = activePalette[0][ColorComponents.SATURATION];
			saturationSlider.addEventListener('input', function (event) {
				activePalette[colorSelectionStart][ColorComponents.SATURATION] = parseFloat(this.value);
				previewColor();
			});
			saturationSlider.addEventListener('pointerup', setColor);
			saturationSlider.addEventListener('keyup', setColor);

			lightnessSlider.value = activePalette[0][ColorComponents.LIGHTNESS];
			lightnessSlider.addEventListener('input', function (event) {
				activePalette[colorSelectionStart][ColorComponents.LIGHTNESS] = parseFloat(this.value);
				previewColor();
			});
			lightnessSlider.addEventListener('pointerup', setColor);
			lightnessSlider.addEventListener('keyup', setColor);

			opacitySlider.value = activePalette[0][ColorComponents.OPACITY];
			opacitySlider.addEventListener('input', function (event) {
				activePalette[colorSelectionStart][ColorComponents.OPACITY] = parseFloat(this.value);
				previewColor();
			});
			opacitySlider.addEventListener('pointerup', setColor);
			opacitySlider.addEventListener('keyup', setColor);
		}

		optionsDoc.getElementById('julia-num-colors').addEventListener('input', function (event) {
			let value = parseInt(this.value);
			if (value > 0) {
				if (value > 256) {
					value = 256;
				}
				const divs = paletteUI.children;
				if (value > me.numColors) {
					for (let i = me.numColors; i < value; i++) {
						divs[i].hidden = false;
					}
				} else {
					for (let i = value; i < me.numColors; i++) {
						divs[i].hidden = true;
					}
				}
				setBgProperty(me, 'numColors', value);
				colorMultipleFracInput.max = value - 1;
				setColorMultiple();
				generateBackground(0);
				colorSelectionEnd = Math.min(colorSelectionEnd, value - 1);
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

		function setNonNegativeProperty(attributeName, text, redraw) {
			const value = parseFloat(text);
			if (value >= 0) {
				setBgProperty(me, attributeName, value);
				if (redraw) {
					generateBackground(0);
				}
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
			setNonNegativeProperty('escapeValue', this.value, false);
			me.calcMaxTrapDistance();
			generateBackground(0);
		});

		optionsDoc.getElementById('julia-iterations').addEventListener('input', function (event) {
			setNonNegativeProperty('maxIterations', this.value, true);
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

		optionsDoc.getElementById('julia-rotation').addEventListener('input', function (event) {
			setBgProperty(me, 'rotation', parseFloat(this.value) * Math.PI);
			generateBackground(0);
		})

		colorVariableInput.addEventListener('input', function (event) {
			setBgProperty(me, 'colorVariable', parseInt(this.value));
			generateBackground(0);
		});

		optionsDoc.getElementById('julia-color-power-preset').addEventListener('input', function (event) {
			const valueStr = this.value;
			if (valueStr === 'c') {
				colorPowerInput.disabled = false;
				return;
			}

			colorPowerInput.disabled = true;
			const value = parseFloat(valueStr);
			colorPowerInput.value = value;
			setBgProperty(me, 'colorPower', value);
			generateBackground(0);
		});

		colorPowerInput.addEventListener('input', function (event) {
			setNonNegativeProperty('colorPower', this.value, true);
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

		optionsDoc.getElementById('julia-trap-distance').addEventListener('input', function (event) {
			setBgProperty(me, 'trapDistanceFunc', parseInt(this.value));
			if (me.numTrapPoints + me.numTrapLines > 1) {
				generateBackground(0);
			}
		});


		const pointTrapInputs = optionsDoc.getElementById('julia-point-traps');

		optionsDoc.getElementById('julia-gaussian').addEventListener('input', function (event) {
			const gaussian = this.checked;
			setBgProperty(me, 'gaussian', gaussian);
			if (gaussian && me.numTrapPoints === 0) {
				setBgPropertyElement(me, 'trapPoints', 0, [0.5, 0.5]);
				setBgProperty(me, 'numTrapPoints', 1);
				updateColorVariableOpts();
				pointTrapInputs.querySelector('#julia-ptrap1-x').value = 0.5;
				pointTrapInputs.querySelector('#julia-ptrap1-y').value = 0.5;
			}
			generateBackground(0);
		});

		const pTrapScaleXInput = optionsDoc.getElementById('julia-ptrap-scale-x');
		const pTrapScaleYInput = optionsDoc.getElementById('julia-ptrap-scale-y');

		function updateColorVariableOpts() {
			const hasTraps = me.numTrapPoints > 0 || me.numTrapLines > 0;
			colorVariableInput.children[0].innerHTML = hasTraps ? 'Distance' : 'Iteration Number';
		}

		function updatePointTraps() {
			let scaleX = parseFloat(pTrapScaleXInput.value);
			if (!Number.isFinite(scaleX)) {
				scaleX = 1;
			}
			let scaleY = parseFloat(pTrapScaleYInput.value);
			if (!Number.isFinite(scaleY)) {
				scaleY = 1;
			}
			let numTraps = 0;
			for (let i = 1; i <= 4; i++) {
				const xStr = pointTrapInputs.querySelector('#julia-ptrap' + i + '-x').value.trim();
				const yStr = pointTrapInputs.querySelector('#julia-ptrap' + i + '-y').value.trim();
				if (xStr === '' || yStr === '') {
					break;
				}
				const x = parseFloat(xStr);
				const y = parseFloat(yStr);
				if (!Number.isFinite(x) || !Number.isFinite(y)) {
					// invalid value entered
					return;
				}
				me.trapPoints[numTraps] = [x * scaleX, y * scaleY];
				numTraps++;
			}
			setBgProperty(me, 'trapPoints');
			setBgProperty(me, 'numTrapPoints', numTraps);
			updateColorVariableOpts();
			me.calcMaxTrapDistance();
			generateBackground(0);
		}

		pTrapScaleXInput.addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				updatePointTraps();
			}
		});

		pTrapScaleYInput.addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				updatePointTraps();
			}
		});

		for (let coord of ['x', 'y']) {
			for (let i = 1; i <= 4; i++) {
				const input = optionsDoc.getElementById('julia-ptrap' + i + '-' + coord);
				input.addEventListener('input', updatePointTraps);
			}
		}

		const lineTrapInputs = optionsDoc.getElementById('julia-line-traps');

		function updateLineTraps() {
			let numTraps = 0;
			for (let i = 1; i <= 4; i++) {
				const x1Str = lineTrapInputs.querySelector('#julia-ltrap' + i + '-x1').value.trim();
				const y1Str = lineTrapInputs.querySelector('#julia-ltrap' + i + '-y1').value.trim();
				const x2Str = lineTrapInputs.querySelector('#julia-ltrap' + i + '-x2').value.trim();
				const y2Str = lineTrapInputs.querySelector('#julia-ltrap' + i + '-y2').value.trim();
				if (x1Str === '' || y1Str === '' || x2Str === '' || y2Str === '') {
					break;
				}
				const x1 = parseFloat(x1Str);
				const y1 = parseFloat(y1Str);
				const x2 = parseFloat(x2Str);
				const y2 = parseFloat(y2Str);
				if (!Number.isFinite(x1) || !Number.isFinite(y1) ||
					!Number.isFinite(x2) || !Number.isFinite(y2)
				) {
					// invalid value entered
					return;
				}
				me.trapLineStart[numTraps] = [x1, y1];
				me.trapLineEnd[numTraps] = [x2, y2];
				numTraps++;
			}
			setBgProperty(me, 'trapLineStart');
			setBgProperty(me, 'trapLineEnd');
			setBgProperty(me, 'numTrapLines', numTraps);
			updateColorVariableOpts();
			generateBackground(0);
		}

		for (let coord of ['x1', 'y1', 'x2', 'y2']) {
			for (let i = 1; i <= 4; i++) {
				const input = optionsDoc.getElementById('julia-ltrap' + i + '-' + coord);
				input.addEventListener('input', updateLineTraps);
			}
		}

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
	this.rotation = 0;
	this.maxIterations = 150;
	this.escapeValue = 2;
	this.maxTrapDistance = this.escapeValue;
	this.escapeType = 0; // 0 = circular, 1 = use y-coordinate only

	this.innerColor = [0, 0, 0, 0];
	this.colorVariable = 0; // Use the iteration count or distance to a trap
	this.colorMultiple = 1;
	this.colorPower = 1;
	this.colorOffset = 0;
	this.wrapPalette = true;
	this.interpolation = 1;
	this.trapPoints = [[0, 0], [0, 0], [0, 0], [0, 0]];
	this.numTrapPoints = 0;
	this.trapLineStart = [[0, -1], [-1, 0], [0, 0], [0, 0]];
	this.trapLineEnd = [[0, 1], [1, 0], [0, 0], [0, 0]];
	this.numTrapLines = 0;
	this.trapDistanceFunc = 0; // 0 = min, 1 = max
	this.gaussian = false;
}

JuliaSet.prototype.calcMaxTrapDistance = function () {
	const numTrapPoints = this.numTrapPoints;
	const r = this.escapeValue;
	let trapDistance = 0;
	if (numTrapPoints === 1 || (numTrapPoints > 1 && this.trapDistanceFunc === 1)) {
		for (let i = 0; i < numTrapPoints; i++) {
			const point = this.trapPoints[i];
			const x = point[0];
			const y = point[1];
			trapDistance = Math.max(trapDistance, Math.sqrt(x * x + y * y) + r);
		}
	} else if (numTrapPoints > 0) {
		trapDistance = 0;
		for (let i = 0; i < numTrapPoints; i++) {
			for (let j = 0; j < Math.ceil(numTrapPoints / 2); j++) {
				if (i === j) {
					continue;
				}
				const point1 = this.trapPoints[i];
				const point2 = this.trapPoints[j];
				const x1 = point1[0];
				const y1 = point1[1];
				const x2 = point2[0];
				const y2 = point2[1];
				let x3 = (x1 + x2) / 2;
				let y3 = (y1 + y2) / 2;
				const newDistance1 = computeDistance(x1, y1, x2, y2, x3, y3, true, r);
				const newDistance2 = computeDistance(x1, y1, x2, y2, x1, y1, false, r);
				trapDistance = Math.max(trapDistance, newDistance1, newDistance2);
			}
		}
	} else {
		trapDistance = r;
	}
	setBgProperty(this, 'maxTrapDistance', trapDistance);
}

function computeDistance(x1, y1, x2, y2, x3, y3, perpendicular, r) {
	let dx, dy, m;
	if (perpendicular) {
		dy = y2 - y1;
		if (dy === 0) {
			return computeDistance(y1, x1, y2, x2, y3, x3, true, r);
		}
		m = (x1 - x2) / dy;
	} else {
		dx = x2 - x1;
		if (dx === 0) {
			return computeDistance(y1, x1, y2, x2, y3, x3, false, r);
		}
		m = (y2 - y1) / dx;
	}
	const k = y3 - m * x3;
	const a = 1 + m * m;
	const b = 2 * k * m;
	const rSquared = r * r;
	const c = k * k - rSquared;
	const discriminant = b * b - 4 * a * c;
	let distance = 0;
	if (discriminant >= 0) {
		const root = Math.sqrt(discriminant);
		const xs1 = (-b + root) / (2 * a);
		const xs2 = (-b - root) / (2 * a);
		const ys1 = m * xs1 + k;
		const ys2 = m * xs2 + k;
		if (perpendicular) {
			dx = xs1 - x1;
			dy = ys1 - y1;
			distance = Math.hypot(dx, dy);
			dx = xs2 - x1;
			dy = ys2 - y1;
			distance = Math.max(distance, Math.hypot(dx, dy));
		} else {
			if (x1 <= x2) {
				if (xs1 <= x1) {
					// s2, s1, p1, p2
					// Both points outside the circle
					distance = Math.hypot(x1, y1) + r;
				} else if (xs2 >= x2) {
					// p1, p2, s2, s1
					// Both points outside the circle
					distance = Math.hypot(x2, y2) + r;
				} else {
					if (xs2 < x1) {
						// s2, p1, p2
						// Find distance from p1 to the circle (on the left)
						dx = x1 - xs2;
						dy = y1 - ys2;
						distance = Math.hypot(dx, dy);
					}
					if (x2 < xs1) {
						// p1, p2, s1
						// Find distance from p2 to the circle (on the right)
						dx = xs1 - x2;
						dy = ys1 - y2;
						distance = Math.max(distance, Math.hypot(dx, dy));
					}
				}
			} else {
				if (xs1 <= x2) {
					// s2, s1, p2, p1
					// Both points outside the circle
					distance = Math.hypot(x2, y2) + r;
				} else if (xs2 >= x1) {
					// p2, p1, s2, s1
					// Both points outside the circle
					distance = Math.hypot(x1, y1) + r;
				} else {
					if (xs2 < x2) {
						// s2, p2, p1
						// Find distance from p2 to the circle (on the left)
						dx = x2 - xs2;
						dy = y2 - ys2;
						distance = distance, Math.hypot(dx, dy);
					}
					if (x1 < xs1) {
						// p2, p1, s1
						// Find distance from p1 to the circle (on the right)
						dx = xs1 - x1;
						dy = ys1 - y1;
						distance = Math.max(distance, Math.hypot(dx, dy));
					}
				}
			}
		}
	} else {
		// Unable to solve quadratic equation. Line between the points doesn't intersect the circle.
		if (perpendicular) {
			if (x1 * x1 + y1 * y1 < rSquared) {
				distance = computeDistance(x1, y1, x2, y2, x1, y1, true, r);
			} else if (x2 * x2 + y2 * y2 < rSquared) {
				distance = computeDistance(x1, y1, x2, y2, x2, y2, true, r);
			}
		}
	}
	return distance;
}

JuliaSet.prototype.animatable = {
	continuous: [
		'numeratorExponents', 'numeratorCoefficients', 'denominatorExponents', 'denominatorCoefficients',
		'numeratorConstant', 'denominatorConstant', 'extraTermCoefficient', 'feedback', 'feedback2',
		'inverse', 'muTranslation',
		'xRange', 'xCentre', 'yRange', 'yCentre', 'rotation', 'escapeValue',
		'innerColor', 'interpolation', 'colorMultiple', 'colorPower', 'colorOffset',
		'palette', 'trapPoints', 'trapLineStart', 'trapLineEnd', 'maxTrapDistance'
	],
	xy: [
		['finalRealConstant', 'finalImConstant'],
	],
	stepped: [
		'numeratorFunction', 'denominatorFunction', 'extraTermFunction', 'finalFunction',
		'maxIterations', 'escapeType', 'mandelbrot', 'preOperation', 'colorVariable',
		'numColors', 'wrapPalette', 'numTrapPoints', 'numTrapLines', 'trapDistanceFunc',
		'gaussian'
	]
};
