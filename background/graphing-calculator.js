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
			const pieceInput = optionsDoc.getElementById('calc-piece');
			const equationXInput = optionsDoc.getElementById('calc-equation-x');
			const equationYInput = optionsDoc.getElementById('calc-equation-y');
			const errorBox = optionsDoc.getElementById('calc-error');
			let shapeNum = 0, pieceNum = 0;

			function compileEquationX() {
				const formulaText = equationXInput.value;
				try {
					me.equations[shapeNum][pieceNum].xFormula = realParser.parse(formulaText);
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
					me.equations[shapeNum][pieceNum].yFormula = realParser.parse(formulaText);
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

			optionsDoc.getElementById('calc-scale').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (Number.isFinite(value)) {
					me.scale[shapeNum] = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('calc-stretch').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (Number.isFinite(value)) {
					me.stretch[shapeNum] = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('calc-rotation').addEventListener('input', function (event) {
				me.rotation[shapeNum] = parseFloat(this.value) * TWO_PI;
				progressiveBackgroundGen(me, 0);
			});

			return optionsDoc;
		});

		this.equations = [];	// 2D array. Multiple shapes, multiple piecewise sections
		this.min = [];			// Per shape, per piece
		this.max = [];			// Per shape, per piece
		this.step = [];			// Per shape, per piece

		this.rotation = [];		// Per shape
		this.scale = [];		// Per shape
		this.stretch = [];		// Per shape
		this.shearX = [];		// Per shape
		this.shearY = [];		// Per shape
		this.shearDirection = []; // Per shape
		this.lineWidth = [];	// Per shape
		this.strokeStyle = [];	// Per shape

		this.minorAxisMin = -25;
		this.minorAxisMax = 25;
		this.majorAxisTranslation = 0;


		this.addParametricEquation('16 * sin(t)^3', '13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)');
	}

	GraphingCalculator.prototype.addParametricEquation = function (xFormula, yFormula) {
		const index = this.equations.length;
		this.equations[index] = [new ParametricEquation(
			realParser.parse(xFormula === undefined ? 'cos(t)' : xFormula),
			realParser.parse(yFormula === undefined ? 'sin(t)' : yFormula)
		)];
		this.min[index] = [-Math.PI];
		this.max[index] = [Math.PI];
		this.step[index] = [Math.PI / 180];
		this.rotation[index] = 0;
		this.scale[index] = 1;
		this.stretch[index] = 1;
		this.shearX[index] = 0;
		this.shearY[index] = 0;
		this.shearDirection[index] = 0;
		this.lineWidth[index] = 1;
		this.strokeStyle[index] = '#000000';
		progressiveBackgroundGen(this, 0);
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
		context.beginPath();
		const variables = new Map();
		for (let i = 0; i < this.equations.length; i++) {
			context.save();
			context.rotate(-this.rotation[i]);
			context.translate(xTranslation, yTranslation);
			const equations = this.equations[i];
			const shapeScale = this.scale[i];
			const stretch = this.stretch[i];
			const shearDirection = this.shearDirection[i];
			const shearX = this.shearX[i] * Math.cos(shearDirection);
			const shearY = this.shearY[i] * Math.sin(shearDirection);
			for (let j = 0; j < equations.length; j++) {
				equations[j].draw(
					context, variables, j === 0, this.min[i][j], this.max[i][j],
					this.step[i][j], shapeScale, stretch, shearX, shearY
				);
			}
			context.lineWidth = this.lineWidth[i] / scale;
			context.strokeStyle = this.strokeStyle[i];
			context.stroke();
			context.restore();
		}
	};

	backgroundGenerators.set('graphing-calculator', new GraphingCalculator());

}
