'use strict';

{

	class ParametricEquations {
		constructor(xFormula, yFormula) {
			this.xFormula = xFormula;
			this.yFormula = yFormula;
		}

		draw(context, variables, firstSegment, min, max, step, yScale, stretch, shear) {
			const xFormula = this.xFormula, yFormula = this.yFormula;
			const xScale = yScale * stretch;
			let i = 0;
			while (true) {
				const t = min + i * step;
				if (t > max) {
					break;
				}
				variables.set('t', t);
				const y = yScale * yFormula.eval(variables);
				const x = xScale * (xFormula.eval(variables) + shear * y);
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

		this.equations = [new ParametricEquations(
			realParser.parse('16 * sin(t)^3'),
			realParser.parse('13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)')
		)];
		this.min = [0];
		this.max = [TWO_PI];
		this.step = [1/360];

		this.rotation = [0];
		this.scale = [1];
		this.stretch = [1];
		this.shear = [0];

		this.minorAxisMin = -24;
		this.minorAxisMax = 24;
		this.majorAxisTranslation = 0;

		this.lineWidth = 1;
		this.strokeStyle = '#000000';
	}

	backgroundGenerators.set('graphing-calculator', new GraphingCalculator());

	GraphingCalculator.prototype.generate = function* (context, canvasWidth, canvasHeight, preview) {
		let minDimension = Math.min(canvasWidth, canvasHeight);
		context.translate(canvasWidth / 2, canvasHeight / 2);
		const scale = minDimension / (this.minorAxisMax - this.minorAxisMin);
		const scaledWidth = canvasWidth / scale;
		const scaledHeight = canvasHeight / scale;
		context.scale(scale, -scale);
		context.lineWidth = this.lineWidth / scale;
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
			this.equations[i].draw(
				context, variables, i === 0, this.min[i], this.max[i], this.step[i],
				this.scale[i], this.stretch[i], this.shear[i]
			);
			context.restore();
		}
		context.strokeStyle = this.strokeStyle;
		context.stroke();
	};

}
