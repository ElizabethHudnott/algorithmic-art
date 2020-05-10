'use strict';

{

	class ParametricEquation {
		constructor(xFormula, yFormula) {
			this.xFormula = xFormula;
			this.yFormula = yFormula;
		}

		draw(context, variables, firstSegment, min, max, step, yScale, stretch, shearX, shearY) {
			const xFormula = this.xFormula, yFormula = this.yFormula;
			const xScale = yScale * stretch;
			let i = 0;
			let t;
			do {
				t = min + i * step;
				if (t > max) {
					t = max;
				}
				variables.set('t', t);
				const initialX = xScale * xFormula.eval(variables);
				const initialY = yScale * yFormula.eval(variables);
				const x = initialX + stretch * shearX * initialY;
				const y = initialY + shearY * initialX;
				if (i === 0 && firstSegment) {
					context.moveTo(x, y);
				} else {
					context.lineTo(x, y);
				}
				i++;
			} while (t < max);
		}

		getBoundingBox(variables, min, max, step) {
			const xFormula = this.xFormula, yFormula = this.yFormula;
			variables.set('t', min);
			let minX = xFormula.eval(variables);
			let minY = yFormula.eval(variables);
			let maxX = minX, maxY = minY;
			let i = 1;
			let t;
			do {
				t = min + i * step;
				if (t > max) {
					t = max;
				}
				variables.set('t', t);
				const x = xFormula.eval(variables);
				const y = yFormula.eval(variables);
				if (x < minX) {
					minX = x;
				} else if (x > maxX) {
					maxX = x;
				}
				if (y < minY) {
					minY = y;
				} else if (y > maxY) {
					maxY = y;
				}
				i++;
			} while (t < max);
			return new BoundingBox(minX, maxX, minY, maxY);
		}

	}

	function GraphingCalculator() {
		const me = this;
		this.title = 'Graphing Calculator';
		this.hasRandomness = false;
		this.optionsDocument = downloadFile('graphing-calculator.html', 'document').then(function (optionsDoc) {
			const shapeSelection = optionsDoc.getElementById('calc-shape-selection');
			const subpathSelection = optionsDoc.getElementById('calc-subpath-selection');
			const pieceSelection = optionsDoc.getElementById('calc-piece-selection');
			const pieceInput = optionsDoc.getElementById('calc-piece');
			const equationXInput = optionsDoc.getElementById('calc-equation-x');
			const equationYInput = optionsDoc.getElementById('calc-equation-y');
			const minInput = optionsDoc.getElementById('calc-min');
			const maxInput = optionsDoc.getElementById('calc-max');
			const rangeUnitsInput = optionsDoc.getElementById('calc-range-units');
			const unitDisplays = optionsDoc.querySelectorAll('.calc-units');
			const errorBox = optionsDoc.getElementById('calc-error');
			let shapeNum = 0, pathNum = 0, pieceNum = 0;

			$(optionsDoc.getElementById('calc-paths-tab')).on('show.bs.tab', function (event) {
				shapeSelection.hidden = false;
				subpathSelection.hidden = false;
				pieceSelection.hidden = false;
			});

			$(optionsDoc.getElementById('calc-shapes-tab')).on('show.bs.tab', function (event) {
				shapeSelection.hidden = false;
				subpathSelection.hidden = true;
				pieceSelection.hidden = true;
			});

			$(optionsDoc.getElementById('calc-axes-tab')).on('show.bs.tab', function (event) {
				shapeSelection.hidden = true;
				subpathSelection.hidden = true;
				pieceSelection.hidden = true;
			});

			optionsDoc.getElementById('calc-repeat').addEventListener('input', function (event) {
				const value = parseInt(this.value);
				me.minRepeat[shapeNum][pathNum] = 0;
				if (value >= 0) {
					me.maxRepeat[shapeNum][pathNum] = value;
					progressiveBackgroundGen(me, 0);
				}
			})

			function compileEquationX() {
				const formulaText = equationXInput.value;
				try {
					me.equations[shapeNum][pathNum][pieceNum].xFormula = realParser.parse(formulaText);
					errorBox.innerHTML = '';
					progressiveBackgroundGen(me, 0);
				} catch (e) {
					errorBox.innerText = 'Error in equation for x. ' + e.message;
				}
			}

			const equationXForm = optionsDoc.getElementById('calc-equation-x-form');
			equationXForm.addEventListener('submit', function (event) {
				event.preventDefault();
				compileEquationX();
			});
			equationXForm.addEventListener('focusout', function (event) {
				if (!this.contains(event.relatedTarget)) {
					compileEquationX();
				}
			});

			function compileEquationY() {
				const formulaText = equationYInput.value;
				try {
					me.equations[shapeNum][pathNum][pieceNum].yFormula = realParser.parse(formulaText);
					errorBox.innerHTML = '';
					progressiveBackgroundGen(me, 0);
				} catch (e) {
					errorBox.innerText = 'Error in equation for y. ' + e.message;
				}
			}

			const equationYForm = optionsDoc.getElementById('calc-equation-y-form');
			equationYForm.addEventListener('submit', function (event) {
				event.preventDefault();
				compileEquationY();
			});
			equationYForm.addEventListener('focusout', function (event) {
				if (!this.contains(event.relatedTarget)) {
					compileEquationY();
				}
			});

			function updateRange() {
				let min = parseFraction(minInput.value);
				let max = parseFraction(maxInput.value);
				const units = rangeUnitsInput.value;
				if (units === 'PI') {
					min *= Math.PI;
					max *= Math.PI;
				}
				me.min[shapeNum][pathNum][pieceNum] = min;
				me.max[shapeNum][pathNum][pieceNum] = max;
				const isParametric = me.equations[shapeNum][pathNum][pieceNum] instanceof ParametricEquation;
				if (!isParametric) {
					if (pieceNum > 0) {
						me.max[shapeNum][pathNum][pieceNum - 1] = min;
					}
					if (pieceNum < me.min[shapeNum][pathNum].length - 1) {
						me.min[shapeNum][pathNum][pieceNum + 1] = max;
					}
				}
				progressiveBackgroundGen(me, 0);
			}

			const rangeForm = optionsDoc.getElementById('calc-range-form');
			rangeForm.addEventListener('submit', function (event) {
				event.preventDefault();
				updateRange();
			});
			rangeForm.addEventListener('focusout', function (event) {
				if (!this.contains(event.relatedTarget)) {
					updateRange();
				}
			});
			optionsDoc.getElementById('calc-range-units').addEventListener('input', function (event) {
				const options = this.children;
				let units;
				for (let i = 0; i < options.length; i++) {
					const option = options[i];
					if (option.value === this.value) {
						units = option.innerHTML;
						break;
					}
				}
				for (let element of unitDisplays) {
					element.innerHTML = units;
				};
			});
			optionsDoc.getElementById('calc-step').addEventListener('input', function (event) {
				let value = Math.abs(parseFraction(this.value));
				if (value > 0) {
					if (rangeUnitsInput.value === 'PI') {
						value *= Math.PI;
					}
					me.step[shapeNum][pathNum][pieceNum] = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('calc-translate-x').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (Number.isFinite(value)) {
					me.translateX[shapeNum][pathNum + 1] = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('calc-translate-y').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (Number.isFinite(value)) {
					me.translateY[shapeNum][pathNum + 1] = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('calc-scale').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (Number.isFinite(value)) {
					me.scale[shapeNum][pathNum + 1] = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('calc-stretch').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (Number.isFinite(value)) {
					me.stretch[shapeNum][pathNum + 1] = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('calc-shear').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (Number.isFinite(value)) {
					if (me.shearDirection[shapeNum][pathNum + 1] === 0) {
						me.shearX[shapeNum][pathNum + 1] = value;
					} else {
						me.shearY[shapeNum][pathNum + 1] = value;
					}
					progressiveBackgroundGen(me, 0);
				}
			});

			function setShearDirection(event) {
				const direction = parseFloat(this.value);
				const radians = direction * Math.PI;
				if (me.shearDirection[shapeNum][pathNum + 1] === radians) {
					return;
				}
				if (direction === 0) {
					me.shearX[shapeNum][pathNum + 1] = me.shearY[shapeNum][pathNum + 1];
					me.shearY[shapeNum][pathNum + 1] = 0;
				} else {
					me.shearY[shapeNum][pathNum + 1] = me.shearX[shapeNum][pathNum + 1];
					me.shearX[shapeNum][pathNum + 1] = 0;
				}
				me.shearDirection[shapeNum][pathNum + 1] = radians;
				progressiveBackgroundGen(me, 0);
			}

			for (let item of optionsDoc.querySelectorAll('input[name=calc-shear-direction')) {
				item.addEventListener('input', setShearDirection);
			};

			optionsDoc.getElementById('calc-close-path').addEventListener('input', function (event) {
				me.closePath[shapeNum][pathNum] = this.checked;
				progressiveBackgroundGen(me, 0);
			});

			optionsDoc.getElementById('calc-line-width').addEventListener('input', function (event) {
				const value = parseInt(this.value);
				if (value >= 0) {
					me.lineWidth[shapeNum] = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('calc-dash').addEventListener('input', function (event) {
				if (this.checkValidity()) {
					me.dash[shapeNum] = parseLineDash(this.value);
					progressiveBackgroundGen(me, 0);
				}
			});

			const strokeColorInput = optionsDoc.getElementById('calc-stroke-color');
			const strokeOpacityInput = optionsDoc.getElementById('calc-stroke-opacity');

			function updateStrokeColor() {
				const a = parseFloat(strokeOpacityInput.value);
				const [r, g, b] = hexToRGB(strokeColorInput.value)
				me.strokeColor[shapeNum] = rgba(r, g, b, a);
				progressiveBackgroundGen(me, 0);
			}

			strokeColorInput.addEventListener('input', updateStrokeColor);
			strokeOpacityInput.addEventListener('input', updateStrokeColor);

			const fillColorInput = optionsDoc.getElementById('calc-fill-color');
			const fillOpacityInput = optionsDoc.getElementById('calc-fill-opacity');

			function updateFillColor() {
				const a = parseFloat(fillOpacityInput.value);
				const [r, g, b] = hexToRGB(fillColorInput.value)
				me.fillColor[shapeNum] = rgba(r, g, b, a);
				progressiveBackgroundGen(me, 0);
			}

			fillColorInput.addEventListener('input', updateFillColor);
			fillOpacityInput.addEventListener('input', updateFillColor);

			optionsDoc.getElementById('calc-fill-rule').addEventListener('input', function (event) {
				me.fillRule[shapeNum] = this.value;
				progressiveBackgroundGen(me, 0);
			});

			optionsDoc.getElementById('calc-rotation').addEventListener('input', function (event) {
				me.rotation[shapeNum] = parseFloat(this.value) * TWO_PI;
				progressiveBackgroundGen(me, 0);
			});

			optionsDoc.getElementById('calc-major-grid-intensity').addEventListener('input', function (event) {
				me.majorGridlineIntensity = parseFloat(this.value);
				progressiveBackgroundGen(me, 0);
			});

			optionsDoc.getElementById('calc-axis-intensity').addEventListener('input', function (event) {
				me.axisIntensity = parseFloat(this.value);
				progressiveBackgroundGen(me, 0);
			});

			optionsDoc.getElementById('calc-grid-color').addEventListener('input', function (event) {
				me.gridlineColor = this.value;
				progressiveBackgroundGen(me, 0);
			});

			const minorRangeForm = optionsDoc.getElementById('calc-minor-range-form');
			const minorMinInput = optionsDoc.getElementById('calc-minor-min');
			const minorMaxInput = optionsDoc.getElementById('calc-minor-max');

			function rescaleMinorAxis() {
				let min = parseFloat(minorMinInput.value);
				let max = parseFloat(minorMaxInput.value);
				if (min === max) {
					return;
				} else if (min > max) {
					const temp = min;
					min = max;
					max = temp;
				}
				me.minorAxisMin = min;
				me.minorAxisMax = max;
				progressiveBackgroundGen(me, 0);
			}

			minorRangeForm.addEventListener('submit', function (event) {
				event.preventDefault();
				rescaleMinorAxis();
			});
			minorRangeForm.addEventListener('focusout', function (event) {
				if (!this.contains(event.relatedTarget)) {
					rescaleMinorAxis();
				}
			});

			optionsDoc.getElementById('calc-grid-minor-major').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (value > 0) {
					me.minorAxisMajorGridlines = value;
					progressiveBackgroundGen(me, 0);
				}
			});
			optionsDoc.getElementById('calc-major-axis-center').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (Number.isFinite(value)) {
					me.majorAxisTranslation = -value;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('calc-grid-major-major').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (value > 0) {
					me.majorAxisMajorGridlines = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			const helpText = `
<var>t</var> refers to the parameter in parametric equations and to the angle in polar equations.
<var>x</var> and <var>y</var> refer to positions along the axes in other forms of equations.
<var>time</var> refers to the proportion of time elapsed between 0 and 1.
<var>N</var> refers to the number of repetitions.
<var>n</var> refers to the current repetition number between 0 and <var>N</var>-1.
			`;
			errorBox.innerHTML = helpText;

			return optionsDoc;
		});

		this.equations = [];	// 2D array. Multiple shapes, multiple subpaths, multiple piecewise sections
		this.min = [];			// Per shape, per subpath, per piece
		this.max = [];			// Per shape, per subpath, per piece
		this.step = [];			// Per shape, per subpath, per piece
		this.minRepeat = [];	// Per shape, per subpath
		this.maxRepeat = [];	// Per shape, per subpath, range is min <= n < max

		this.rotation = [];		// Per shape
		this.translateX = [];	// Per shape & per subpath
		this.translateY = [];	// Per shape & per subpath
		this.scale = [];		// Per shape & per subpath
		this.stretch = [];		// Per shape & per subpath
		this.shearX = [];		// Per shape & per subpath
		this.shearY = [];		// Per shape & per subpath
		this.shearDirection = []; // Per shape & per subpath
		this.closePath = [];	// Per shape, per subpath
		this.lineWidth = [];	// Per shape
		this.dash = []			// Per shape
		this.strokeColor = [];	// Per shape
		this.fillColor = [];	// Per shape
		this.fillRule = [];		// Per shape

		this.minorAxisMin = -25;
		this.minorAxisMax = 25;
		this.majorAxisTranslation = 0;
		this.majorAxisMajorGridlines = 5;
		this.minorAxisMajorGridlines = 5;
		this.majorAxisMinorGridlines = 1;
		this.minorAxisMinorGridlines = 1;
		this.axisIntensity = 0.1;
		this.majorGridlineIntensity = 0.65;
		this.minorGridlineIntensity = 0.4;	// Relative to major grid lines
		this.gridlineColor = '#008000';

		this.addShape(0);
		this.addSubpath(0, 0);
		this.addParametricEquation(0, 0, 0);
		const equation = this.equations[0][0][0];
		equation.xFormula = realParser.parse('16 * sin(t)^3 * (sin(4PI * time)/4 + 0.75)');
		equation.yFormula = realParser.parse('(13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)) * (sin(4PI * time)/4 + 0.75)');
		this.tween = 0;
	}

	GraphingCalculator.prototype.animatable = {
		continuous: [
			'step', 'rotation', 'translateX', 'translateY', 'scale',
			'stretch', 'shearX', 'shearY', 'shearDirection', 'strokeColor', 'fillColor',
			'minorAxisMin', 'minorAxisMax', 'majorAxisTranslation',
			'majorGridlineIntensity', 'gridlineColor', 'majorAxisMajorGridlines',
			'minorAxisMajorGridlines'
		],
		stepped: [
			'closePath', 'lineWidth', 'dash', 'fillRule'
		],
		pairedContinuous: [
			['max', 'min']	// min catches up to max.
		],
		pairedStepped: [
			['maxRepeat', 'minRepeat']
		]
	};

	GraphingCalculator.prototype.addShape = function (index) {
		this.equations.splice(index, 0, []);
		this.min.splice(index, 0, []);
		this.max.splice(index, 0, []);
		this.step.splice(index, 0, []);
		this.minRepeat.splice(index, 0, []);
		this.maxRepeat.splice(index, 0, []);
		this.rotation.splice(index, 0, 0);
		this.translateX.splice(index, 0, [0]);
		this.translateY.splice(index, 0, [0]);
		this.scale.splice(index, 0, [1]);
		this.stretch.splice(index, 0, [1]);
		this.shearX.splice(index, 0, [0]);
		this.shearY.splice(index, 0, [0]);
		this.shearDirection.splice(index, 0, [0]);
		this.closePath.splice(index, 0, []);
		this.lineWidth.splice(index, 0, 3);
		this.dash.splice(index, 0, [1, 0]);
		this.strokeColor.splice(index, 0, '#000000ff');
		this.fillColor.splice(index, 0, '#ff00808c');
		this.fillRule.splice(index, 0, 'nonzero');
	};

	GraphingCalculator.prototype.addSubpath = function (shapeNum, index) {
		this.equations[shapeNum].splice(index, 0, []);
		this.min[shapeNum].splice(index, 0, []);
		this.max[shapeNum].splice(index, 0, []);
		this.step[shapeNum].splice(index, 0, []);
		this.minRepeat[shapeNum].splice(index, 0, 0);
		this.maxRepeat[shapeNum].splice(index, 0, 1);
		this.translateX[shapeNum].splice(index + 1, 0, 0);
		this.translateY[shapeNum].splice(index + 1, 0, 0);
		this.scale[shapeNum].splice(index + 1, 0, 1);
		this.stretch[shapeNum].splice(index + 1, 0, 1);
		this.shearX[shapeNum].splice(index + 1, 0, 0);
		this.shearY[shapeNum].splice(index + 1, 0, 0);
		this.shearDirection[shapeNum].splice(index + 1, 0, 0);
		this.closePath[shapeNum].splice(index, 0, false);
	}

	GraphingCalculator.prototype.addParametricEquation = function (shapeNum, subpathNum, index) {
		const r = this.equations[shapeNum][subpathNum].length + 1;
		this.equations[shapeNum][subpathNum].splice(index, 0, new ParametricEquation(
			realParser.parse(r + 'cos(t)'),
			realParser.parse(r + 'sin(t)')
		));
		this.min[shapeNum][subpathNum].splice(index, 0, -Math.PI);
		this.max[shapeNum][subpathNum].splice(index, 0, Math.PI);
		this.step[shapeNum][subpathNum].splice(index, 0, Math.PI / 180);
	};

	GraphingCalculator.prototype.generate = function* (context, canvasWidth, canvasHeight, preview) {
		let minDimension = Math.min(canvasWidth, canvasHeight);
		context.translate(canvasWidth / 2, canvasHeight / 2);
		const minorAxisMin = this.minorAxisMin;
		const minorAxisMax = this.minorAxisMax;
		const scale = minDimension / (minorAxisMax - minorAxisMin);
		const scaledWidth = canvasWidth / scale;
		const scaledHeight = canvasHeight / scale;
		context.scale(scale, -scale);
		context.lineJoin = 'bevel';
		let xTranslation, yTranslation, majorAxisMin, majorAxisMax;
		if (canvasWidth >= canvasHeight) {
			minDimension = canvasHeight;
			xTranslation = this.majorAxisTranslation;
			yTranslation = -(minorAxisMin + minorAxisMax) / 2;
			majorAxisMin = -scaledWidth / 2 - xTranslation;
			majorAxisMax = scaledWidth / 2 - xTranslation;
		} else {
			minDimension = canvasWidth;
			xTranslation = -(minorAxisMin + minorAxisMax) / 2;
			yTranslation = this.majorAxisTranslation;
			majorAxisMin = -scaledHeight / 2 - yTranslation;
			majorAxisMax = scaledHeight / 2 - yTranslation;
		}
		const variables = new Map();
		variables.set('time', this.tween);
		for (let shapeNum = 0; shapeNum < this.equations.length; shapeNum++) {
			context.save();
			context.beginPath();
			const shapeEquations = this.equations[shapeNum];
			const rotation = -this.rotation[shapeNum];
			const shapeTranslateX = this.translateX[shapeNum][0];
			const shapeTranslateY = this.translateY[shapeNum][0];
			const shapeScale = this.scale[shapeNum][0];
			const shapeStretch = this.stretch[shapeNum][0];
			const shapeShearDirection = this.shearDirection[shapeNum][0];
			const shapeShearX = this.shearX[shapeNum][0] * Math.cos(shapeShearDirection);
			const shapeShearY = this.shearY[shapeNum][0] * Math.sin(shapeShearDirection);

			for (let subpathNum = 0; subpathNum < shapeEquations.length; subpathNum++) {
				const pathMinRepeat = this.minRepeat[shapeNum][subpathNum];
				const pathMaxRepeat = this.maxRepeat[shapeNum][subpathNum];
				if (pathMaxRepeat <= pathMinRepeat) {
					continue;
				}
				variables.set('N', pathMaxRepeat);
				context.save();
				const translateX = shapeTranslateX + this.translateX[shapeNum][subpathNum + 1];
				const translateY = shapeTranslateY + this.translateY[shapeNum][subpathNum + 1];
				context.translate(translateX, translateY);
				context.rotate(rotation);
				context.translate(xTranslation, yTranslation);
				const subpathScale = shapeScale * this.scale[shapeNum][subpathNum + 1];
				const stretch = shapeStretch * this.stretch[shapeNum][subpathNum + 1];
				const shearDirection = this.shearDirection[shapeNum][subpathNum + 1];
				const shearX = shapeShearX + this.shearX[shapeNum][subpathNum + 1] * Math.cos(shearDirection);
				const shearY = shapeShearY + this.shearY[shapeNum][subpathNum + 1] * Math.sin(shearDirection);
				const subpathEquations = shapeEquations[subpathNum];
				for (let n = pathMinRepeat; n < pathMaxRepeat; n++) {
					variables.set('n', n);
					for (let equationNum = 0; equationNum < subpathEquations.length; equationNum++) {
						const min = this.min[shapeNum][subpathNum][equationNum];
						const max = this.max[shapeNum][subpathNum][equationNum];
						const step = this.step[shapeNum][subpathNum][equationNum];
						subpathEquations[equationNum].draw(
							context, new Map(variables), equationNum === 0, min, max, step,
							subpathScale, stretch, shearX, shearY
						);
					}
					if (this.closePath[shapeNum][subpathNum]) {
						context.closePath();
					}
				}
				context.restore();
			}
			context.scale(shapeScale, shapeScale);
			const fillColor = this.fillColor[shapeNum];
			context.fillStyle = fillColor;
			context.fill(this.fillRule[shapeNum]);
			const lineWidth = this.lineWidth[shapeNum];
			if (lineWidth > 0) {
				context.lineWidth = lineWidth / (scale * shapeScale);
				const dash = this.dash[shapeNum];
				const numDashLengths = dash.length;
				const scaledDash = new Array(numDashLengths);
				for (let i = 0; i < numDashLengths; i++) {
					scaledDash[i] = dash[i] / scale;
				}
				context.setLineDash(scaledDash);
				const strokeColor = this.strokeColor[shapeNum];
				context.strokeStyle = strokeColor;
				context.stroke();
			}
			context.restore();
		}

		let [r, g, b] = parseColor(this.gridlineColor)[1];
		let gridIntensity = this.majorGridlineIntensity;
		let rPrime = r * gridIntensity + 255 * (1 - gridIntensity);
		let gPrime = g * gridIntensity + 255 * (1 - gridIntensity);
		let bPrime = b * gridIntensity + 255 * (1 - gridIntensity);
		context.strokeStyle = rgba(rPrime, gPrime, bPrime, 1);
		context.lineWidth = 1 / scale;
		const majorAxisMajorGL = this.majorAxisMajorGridlines;
		const minorAxisMajorGL = this.minorAxisMajorGridlines;
		const xNudge = 0.5 * (1 - context.canvas.width % 2) / scale;
		const yNudge = 0.5 * (1 - context.canvas.height % 2) / scale;
		context.translate(xTranslation + xNudge, yTranslation + yNudge);
		context.globalCompositeOperation = 'multiply';
		let minMajorGridline = majorAxisMin - (majorAxisMin % majorAxisMajorGL);
		if (minMajorGridline === majorAxisMin) {
			minMajorGridline += majorAxisMajorGL;
		}
		let minMinorGridline = minorAxisMin - (minorAxisMin % minorAxisMajorGL);
		if (minMinorGridline === minorAxisMin) {
			minMinorGridline += minorAxisMajorGL;
		}
		if (canvasWidth >= canvasHeight) {
			context.translate(0, -(minorAxisMin + minorAxisMax) / 2);
			for (let x = minMajorGridline; x < majorAxisMax; x += majorAxisMajorGL) {
				if (x === 0) {
					continue;
				}
				context.beginPath();
				const xRounded = Math.round(x * scale) / scale;
				context.moveTo(xRounded, minorAxisMin);
				context.lineTo(xRounded, minorAxisMax);
				context.stroke();
			}
			for (let y = minMinorGridline; y < minorAxisMax; y += minorAxisMajorGL) {
				if (y === 0) {
					continue;
				}
				context.beginPath();
				const yRounded = Math.round(y * scale) / scale;
				context.moveTo(majorAxisMin, yRounded);
				context.lineTo(majorAxisMax, yRounded);
				context.stroke();
			}
		} else {
			context.translate(-(minorAxisMin + minorAxisMax) / 2, 0);
			for (let y = minMajorGridline; y < majorAxisMax; y += majorAxisMajorGL) {
				if (y === 0) {
					continue;
				}
				context.beginPath();
				const yRounded = Math.round(y * scale) / scale;
				context.moveTo(minorAxisMin, yRounded);
				context.lineTo(minorAxisMax, yRounded);
				context.stroke();
			}
			for (let x = minMinorGridline; x < minorAxisMax; x += minorAxisMajorGL) {
				if (x === 0) {
					continue;
				}
				context.beginPath();
				const xRounded = Math.round(x * scale) / scale;
				context.moveTo(xRounded, majorAxisMin);
				context.lineTo(xRounded, majorAxisMax);
				context.stroke();
			}
		}
		const axisIntensity = gridIntensity + this.axisIntensity * (1 - gridIntensity);
		rPrime = r * axisIntensity + 255 * (1 - axisIntensity);
		gPrime = g * axisIntensity + 255 * (1 - axisIntensity);
		bPrime = b * axisIntensity + 255 * (1 - axisIntensity);
		context.strokeStyle = rgba(rPrime, gPrime, bPrime, 1);
		let unnudge = this.axisIntensity >= 0.05 ? 1 : 0;
		if (unnudge) {
			context.lineWidth = 2 / scale;
		}
		context.beginPath();

		if (majorAxisMin < 0 && majorAxisMax > 0) {
			if (canvasWidth > canvasHeight) {
				context.moveTo(-xNudge * unnudge, minorAxisMin);
				context.lineTo(-xNudge * unnudge, minorAxisMax);
			} else {
				context.moveTo(minorAxisMin, -yNudge * unnudge);
				context.lineTo(minorAxisMax, -yNudge * unnudge);
			}
		}
		if (minorAxisMin < 0 && minorAxisMax > 0) {
			if (canvasWidth > canvasHeight) {
				context.moveTo(majorAxisMin, -yNudge * unnudge);
				context.lineTo(majorAxisMax, -yNudge * unnudge);
			} else {
				context.moveTo(-xNudge * unnudge, majorAxisMin);
				context.lineTo(-xNudge * unnudge, majorAxisMax);
			}
		}
		context.stroke();
	};

	addBgGenerator(GraphingCalculator);
}
