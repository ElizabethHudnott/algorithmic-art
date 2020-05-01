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
			while (true) {
				const t = min + i * step;
				if (t > max) {
					break;
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
			}
		}
	}

	function GraphingCalculator() {
		const me = this;
		this.title = 'Graphing Calculator';
		this.hasRandomness = true;
		this.optionsDocument = downloadDocument('graphing-calculator.html').then(function (optionsDoc) {
			const shapeSelection = optionsDoc.getElementById('calc-shape-selection');
			const subpathSelection = optionsDoc.getElementById('calc-subpath-selection');
			const pieceSelection = optionsDoc.getElementById('calc-piece-selection');
			const pieceInput = optionsDoc.getElementById('calc-piece');
			const equationXInput = optionsDoc.getElementById('calc-equation-x');
			const equationYInput = optionsDoc.getElementById('calc-equation-y');
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

			function compileEquationX() {
				const formulaText = equationXInput.value;
				try {
					me.equations[shapeNum][pathNum][pieceNum].xFormula = realParser.parse(formulaText);
					errorBox.innerHTML = '';
					progressiveBackgroundGen(me, 0);
				} catch (e) {
					errorBox.innerText = e.message;
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
					errorBox.innerText = e.message;
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

			optionsDoc.querySelectorAll('input[name=calc-shear-direction').forEach(function (item) {
				item.addEventListener('input', setShearDirection);
			});

			optionsDoc.getElementById('calc-rotation').addEventListener('input', function (event) {
				me.rotation[shapeNum] = parseFloat(this.value) * TWO_PI;
				progressiveBackgroundGen(me, 0);
			});

			return optionsDoc;
		});

		this.equations = [];	// 2D array. Multiple shapes, multiple subpaths, multiple piecewise sections
		this.min = [];			// Per shape, per subpath, per piece
		this.max = [];			// Per shape, per subpath, per piece
		this.step = [];			// Per shape, per subpath, per piece

		this.rotation = [];		// Per shape
		this.translateX = [];	// Per shape & per subpath
		this.translateY = [];	// Per shape & per subpath
		this.scale = [];		// Per shape & per subpath
		this.stretch = [];		// Per shape & per subpath
		this.shearX = [];		// Per shape & per subpath
		this.shearY = [];		// Per shape & per subpath
		this.shearDirection = []; // Per shape & per subpath
		this.lineWidth = [];	// Per shape
		this.strokeStyle = [];	// Per shape

		this.minorAxisMin = -25;
		this.minorAxisMax = 25;
		this.majorAxisTranslation = 0;


		this.addShape(0);
		this.addSubpath(0, 0);
		this.addParametricEquation(0, 0, 0);
		const equation = this.equations[0][0][0];
		equation.xFormula = realParser.parse('16 * sin(t)^3');
		equation.yFormula = realParser.parse('13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)');
	}

	GraphingCalculator.prototype.addShape = function (index) {
		this.equations.splice(index, 0, []);
		this.min.splice(index, 0, []);
		this.max.splice(index, 0, []);
		this.step.splice(index, 0, []);
		this.rotation.splice(index, 0, 0);
		this.translateX.splice(index, 0, [0]);
		this.translateY.splice(index, 0, [0]);
		this.scale.splice(index, 0, [1]);
		this.stretch.splice(index, 0, [1]);
		this.shearX.splice(index, 0, [0]);
		this.shearY.splice(index, 0, [0]);
		this.shearDirection.splice(index, 0, [0]);
		this.lineWidth.splice(index, 0, 3);
		this.strokeStyle.splice(index, 0, '#000000');
	};

	GraphingCalculator.prototype.addSubpath = function (shapeNum, index) {
		this.equations[shapeNum].splice(index, 0, []);
		this.min[shapeNum].splice(index, 0, []);
		this.max[shapeNum].splice(index, 0, []);
		this.step[shapeNum].splice(index, 0, []);
		this.translateX[shapeNum].splice(index + 1, 0, 0);
		this.translateY[shapeNum].splice(index + 1, 0, 0);
		this.scale[shapeNum].splice(index + 1, 0, 1);
		this.stretch[shapeNum].splice(index + 1, 0, 1);
		this.shearX[shapeNum].splice(index + 1, 0, 0);
		this.shearY[shapeNum].splice(index + 1, 0, 0);
		this.shearDirection[shapeNum].splice(index + 1, 0, 0);
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
		const scale = minDimension / (this.minorAxisMax - this.minorAxisMin);
		const scaledWidth = canvasWidth / scale;
		const scaledHeight = canvasHeight / scale;
		context.scale(scale, -scale);
		let xTranslation, yTranslation;
		if (canvasWidth >= canvasHeight) {
			minDimension = canvasHeight;
			xTranslation = this.majorAxisTranslation;
			yTranslation = -(this.minorAxisMin + this.minorAxisMax) / 2;
		} else {
			minDimension = canvasWidth;
			xTranslation = -(this.minorAxisMin + this.minorAxisMax) / 2;
			yTranslation = this.majorAxisTranslation;
		}
		const variables = new Map();
		for (let shapeNum = 0; shapeNum < this.equations.length; shapeNum++) {
			context.save();
			context.beginPath();
			const shapeEquations = this.equations[shapeNum];
			const rotation = -this.rotation[shapeNum];
			const shapeTranslateX = this.translateX[shapeNum][0];
			const shapeTranslateY = this.translateY[shapeNum][0];
			const shapeScale = this.scale[shapeNum][0];
			const shapeStretch = this.scale[shapeNum][0];
			const shapeShearDirection = this.shearDirection[shapeNum][0];
			const shapeShearX = this.shearX[shapeNum][0] * Math.cos(shapeShearDirection);
			const shapeShearY = this.shearY[shapeNum][0] * Math.sin(shapeShearDirection);

			for (let subpathNum = 0; subpathNum < shapeEquations.length; subpathNum++) {
				context.save()
				const translateX = this.translateX[shapeNum][subpathNum + 1];
				const translateY = this.translateY[shapeNum][subpathNum + 1];
				context.translate(shapeTranslateX + translateX, shapeTranslateY + translateY);
				context.rotate(rotation);
				context.translate(xTranslation, yTranslation);
				const subpathScale = this.scale[shapeNum][subpathNum + 1];
				const stretch = this.stretch[shapeNum][subpathNum + 1];
				const shearDirection = this.shearDirection[shapeNum][subpathNum + 1];
				const shearX = shapeShearX + this.shearX[shapeNum][subpathNum + 1] * Math.cos(shearDirection);
				const shearY = shapeShearY + this.shearY[shapeNum][subpathNum + 1] * Math.sin(shearDirection);
				const subpathEquations = shapeEquations[subpathNum];
				for (let equationNum = 0; equationNum < subpathEquations.length; equationNum++) {
					const min = this.min[shapeNum][subpathNum][equationNum];
					const max = this.max[shapeNum][subpathNum][equationNum];
					const step = this.step[shapeNum][subpathNum][equationNum];
					subpathEquations[equationNum].draw(
						context, variables, equationNum === 0, min, max, step,
						subpathScale, stretch, shearX, shearY
					);
				}
				context.closePath();
				context.restore();
			}
			context.lineWidth = this.lineWidth[shapeNum] / scale;
			context.strokeStyle = this.strokeStyle[shapeNum];
			context.stroke();
			context.restore();
		}
	};

	backgroundGenerators.set('graphing-calculator', new GraphingCalculator());

}
