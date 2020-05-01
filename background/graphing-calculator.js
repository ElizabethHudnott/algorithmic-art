'use strict';

{

	class ParametricEquation {
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
		this.optionsDocument = downloadDocument('graphing-calculator.html').then(function (optionsDoc) {
			const parametricTemplate = optionsDoc.getElementById('parametric-equation');
			parametricTemplate.remove();
			const equations = optionsDoc.getElementById('calc-equations');
			const errorBox = optionsDoc.getElementById('calc-error');

			class ParametricEquationComponent extends HTMLElement {
				constructor(index) {
					super();
					this.attachShadow({ mode: 'open' });
					const shadowRoot = this.shadowRoot;
					const node = document.importNode(parametricTemplate.content, true);
					node.appendChild(bootstrapStyleSheet.cloneNode(false));
					shadowRoot.appendChild(node);
					const component = this;
					shadowRoot.getElementById('equation-x-form').addEventListener('submit', function (event) {
						event.preventDefault();
						component.compileEquationX();
					});
					shadowRoot.getElementById('equation-y-form').addEventListener('submit', function (event) {
						event.preventDefault();
						component.compileEquationY();
					});
				}

				compileEquationX() {
					const index = indexOfChild(this);
					const formulaText = this.shadowRoot.getElementById('equation-x').value;
					try {
						me.equations[index].xFormula = realParser.parse(formulaText);
						errorBox.innerHTML = '';
						progressiveBackgroundGen(me, 0);
					} catch (e) {
						errorBox.innerText = e.message;
					}
				}

				compileEquationY() {
					const index = indexOfChild(this);
					const formulaText = this.shadowRoot.getElementById('equation-y').value;
					try {
						me.equations[index].yFormula = realParser.parse(formulaText);
						errorBox.innerHTML = '';
						progressiveBackgroundGen(me, 0);
					} catch (e) {
						errorBox.innerText = e.message;
					}
				}

			}

			customElements.define('parametric-equation', ParametricEquationComponent);

			function addParametricEquation() {
				const index = me.equations.length;

				me.equations[index] = new ParametricEquation(
					realParser.parse('cos(t)'),
					realParser.parse('sin(t)')
				);

				me.min[index] = -Math.PI;
				me.max[index] = Math.PI;
				me.step[index] = 1 / 360;
				me.rotation[index] = 0;
				me.scale[index] = 1;
				me.stretch[index] = 1;
				me.shear[index] = 0;

				equations.append(document.createElement('parametric-equation'));
				progressiveBackgroundGen(me, 0);
			}

			addParametricEquation();

			return optionsDoc;
		});

		this.equations = [];
		this.min = [];
		this.max = [];
		this.step = [];

		this.rotation = [];
		this.scale = [];
		this.stretch = [];
		this.shear = [];

		this.minorAxisMin = -Math.PI;
		this.minorAxisMax = Math.PI;
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
