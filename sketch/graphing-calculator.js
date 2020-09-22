import {parseFraction, parseLineDash, adjustLineDash} from '../js/parse-util.js';
import parseEquation from '../parser/real-expression.js';

class RectangularEquation {
	constructor(text) {
		this.parseYFormula(text);
	}

	parseYFormula(input) {
		const inputStr = String(input);
		this.yFormula = parseEquation(inputStr);
		this.yFormulaText = inputStr;
		this.formulas = [this.yFormula];
	}

	variables = Object.freeze(['y']);

	draw(context, variables, firstSegment, min, max, step, yScale, stretch, shearX, shearY) {
		const formula = this.yFormula;
		const xScale = yScale * stretch;
		let i = 0;
		let x, amountLeft;
		do {
			if (max >= min) {
				x = min + i * step;
				if (x > max) {
					x = max;
				}
				amountLeft = max - x;
			} else {
				x = min - i * step;
				if (x < max) {
					x = max;
				}
				amountLeft = x - max;
			}
			variables.set('x', x);
			let y = formula.eval(variables);
			const initialX = xScale * x;
			const initialY = yScale * y;
			x = initialX + stretch * shearX * initialY;
			y = initialY + shearY * initialX;
			if (i === 0 && firstSegment) {
				context.moveTo(x, y);
			} else {
				context.lineTo(x, y);
			}
			i++;
		} while (amountLeft > 0);
	}

	getBoundingBox(variables, min, max, step) {
		const formula = this.yFormula;
		variables.set('x', min);
		let minY = formula.eval(variables);
		let maxY = minY;
		let i = 1;
		let x, amountLeft;
		do {
			if (max >= min) {
				x = min + i * step;
				if (x > max) {
					x = max;
				}
				amountLeft = max - x;
			} else {
				x = min - i * step;
				if (x < max) {
					x = max;
				}
				amountLeft = x - max;
			}
			variables.set('x', x);
			const y = formula.eval(variables);
			if (y < minY) {
				minY = y;
			} else if (y > maxY) {
				maxY = y;
			}
			i++;
		} while (amountLeft > 0);
		if (min < max) {
			return new BoundingBox(min, max, minY, maxY);
		} else {
			return new BoundingBox(max, min, minY, maxY);
		}
	}
}

class MagXEquation {
	constructor(text) {
		this.parseMagXFormula(text);
	}

	parseMagXFormula(input) {
		const inputStr = String(input);
		this.magXFormula = parseEquation(inputStr);
		this.magXFormulaText = inputStr;
		this.formulas = [this.magXFormula];
	}

	variables = Object.freeze(['magX']);

	draw(context, variables, firstSegment, min, max, step, yScale, stretch, shearX, shearY) {
		const formula = this.magXFormula;
		const xScale = yScale * stretch;
		const values = [];
		let i = 0;
		let initialX, initialY, x, y, amountLeft;
		do {
			if (max >= min) {
				y = min + i * step;
				if (y > max) {
					y = max;
				}
				amountLeft = max - y;
			} else {
				y = min - i * step;
				if (y < max) {
					y = max;
				}
				amountLeft = y - max;
			}
			variables.set('y', y);
			x = formula.eval(variables);
			values.push(x);
			initialX = xScale * x;
			initialY = yScale * y;
			x = initialX + stretch * shearX * initialY;
			y = initialY + shearY * initialX;
			if (i === 0 && firstSegment) {
				context.moveTo(x, y);
			} else {
				context.lineTo(x, y);
			}
			i++;
		} while (amountLeft > 0);

		x = -values[values.length - 1];
		initialX = xScale * x;
		initialY = yScale * y;
		x = initialX + stretch * shearX * initialY;
		y = initialY + shearY * initialX;
		context.moveTo(x, y);

		for (i = values.length - 2; i >= 0; i--) {
			x = -values[i];
			if (max >= min) {
				y = min + i * step;
				if (y > max) {
					y = max;
				}
				amountLeft = max - y;
			} else {
				y = min - i * step;
				if (y < max) {
					y = max;
				}
				amountLeft = y - max;
			}
			initialX = xScale * x;
			initialY = yScale * y;
			x = initialX + stretch * shearX * initialY;
			y = initialY + shearY * initialX;
			context.lineTo(x, y);
		}
	}

	getBoundingBox(variables, min, max, step) {
		const formula = this.magXFormula;
		variables.set('y', min);
		let maxMag = Math.abs(formula.eval(variables));
		let i = 1;
		let y, amountLeft;
		do {
			if (max >= min) {
				y = min + i * step;
				if (y > max) {
					y = max;
				}
				amountLeft = max - y;
			} else {
				y = min - i * step;
				if (y < max) {
					y = max;
				}
				amountLeft = y - max;
			}
			variables.set('y', y);
			const magX = Math.abs(formula.eval(variables));
			if (magX > maxMag) {
				maxMag = magX;
			}
			i++;
		} while (amountLeft > 0);
		if (min < max) {
			return new BoundingBox(-maxMag, maxMag, min, max);
		} else {
			return new BoundingBox(-maxMag, maxMag, max, min);
		}
	}
}

class ParametricEquation {
	constructor(xText, yText) {
		this.parseXFormula(xText);
		this.parseYFormula(yText);
	}

	parseXFormula(input) {
		const inputStr = String(input);
		this.xFormula = parseEquation(inputStr);
		this.xFormulaText = inputStr;
		this.formulas = [this.xFormula, this.yFormula];
	}

	parseYFormula(input) {
		const inputStr = String(input);
		this.yFormula = parseEquation(inputStr);
		this.yFormulaText = inputStr;
		this.formulas = [this.xFormula, this.yFormula];
	}

	variables = Object.freeze(['x', 'y']);

	draw(context, variables, firstSegment, min, max, step, yScale, stretch, shearX, shearY) {
		const xFormula = this.xFormula, yFormula = this.yFormula;
		const xScale = yScale * stretch;
		let i = 0;
		let t, amountLeft;
		do {
			if (max >= min) {
				t = min + i * step;
				if (t > max) {
					t = max;
				}
				amountLeft = max - t;
			} else {
				t = min - i * step;
				if (t < max) {
					t = max;
				}
				amountLeft = t - max;
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
		} while (amountLeft > 0);
	}

	getBoundingBox(variables, min, max, step) {
		const xFormula = this.xFormula, yFormula = this.yFormula;
		variables.set('t', min);
		let minX = xFormula.eval(variables);
		let minY = yFormula.eval(variables);
		let maxX = minX, maxY = minY;
		let i = 1;
		let t, amountLeft;
		do {
			if (max >= min) {
				t = min + i * step;
				if (t > max) {
					t = max;
				}
				amountLeft = max - t;
			} else {
				t = min - i * step;
				if (t < max) {
					t = max;
				}
				amountLeft = t - max;
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
		} while (amountLeft > 0);
		return new BoundingBox(minX, maxX, minY, maxY);
	}
}

class PolarEquation {
	constructor(text) {
		this.parseRFormula(text);
	}

	parseRFormula(input) {
		const inputStr = String(input);
		this.rFormula = parseEquation(inputStr);
		this.rFormulaText = inputStr;
		this.formulas = [this.rFormula];
	}

	variables = Object.freeze(['r']);

	draw(context, variables, firstSegment, min, max, step, yScale, stretch, shearX, shearY) {
		const formula = this.rFormula;
		const xScale = yScale * stretch;
		let i = 0;
		let t, amountLeft;
		do {
			if (max >= min) {
				t = min + i * step;
				if (t > max) {
					t = max;
				}
				amountLeft = max - t;
			} else {
				t = min - i * step;
				if (t < max) {
					t = max;
				}
				amountLeft = t - max;
			}
			variables.set('t', t);
			const r = formula.eval(variables);
			const initialX = xScale * r * Math.cos(t);
			const initialY = yScale * r * Math.sin(t);
			const x = initialX + stretch * shearX * initialY;
			const y = initialY + shearY * initialX;
			if (i === 0 && firstSegment) {
				context.moveTo(x, y);
			} else {
				context.lineTo(x, y);
			}
			i++;
		} while (amountLeft > 0);
	}

	getBoundingBox(variables, min, max, step) {
		const formula = this.rFormula;
		variables.set('t', min);
		const initialR = formula.eval(variables);
		let minX = initialR * Math.cos(min);
		let minY = initialR * Math.sin(min);
		let maxX = minX, maxY = minY;
		let i = 1;
		let t, amountLeft;
		do {
			if (max >= min) {
				t = min + i * step;
				if (t > max) {
					t = max;
				}
				amountLeft = max - t;
			} else {
				t = min - i * step;
				if (t < max) {
					t = max;
				}
				amountLeft = t - max;
			}
			variables.set('t', t);
			const r = formula.eval(variables);
			const x = r * Math.cos(t);
			const y = r * Math.sin(t);
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
		} while (amountLeft > 0);
		return new BoundingBox(minX, maxX, minY, maxY);
	}
}

export default function GraphingCalculator() {
	const me = this;
	this.title = 'Graphing Calculator';
	this.backgroundColor = [255, 255, 255];
	this.equations = [];	// 2D array. Multiple shapes, multiple subpaths, multiple piecewise sections
	this.min = [];			// Per shape, per subpath, per piece
	this.max = [];			// Per shape, per subpath, per piece
	this.step = [];			// Per shape, per subpath, per piece
	this.rangeUnits = [];	// Per shape, per subpath, per piece
	this.minPathRepeat = [];	// Per shape, per subpath
	this.maxPathRepeat = [];	// Per shape, per subpath, range is min <= n < max

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
	this.lineJoin = [];		// Per shape
	this.dash = [];			// Per shape
	this.strokeColor = [];	// Per shape
	this.fillColor = [];	// Per shape
	this.fillRule = [];		// Per shape
	this.clip = [];			// Per shape

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
	switch (urlParameters.get('preset')) {
	case 'heart':
		this.addHeartEquation(0, 0, 0);
		break;
	case 'rose':
		this.addRoseEquation(0, 0, 0);
		break;
	default:
		this.addRectangularEquation(0, 0, 0);
	}
	this.tween = 0;

	this.optionsDocument = downloadFile('graphing-calculator.html', 'document').then(function (optionsDoc) {
		const shapeSelection = optionsDoc.getElementById('calc-shape-selection');
		const subpathSelection = optionsDoc.getElementById('calc-subpath-selection');
		const pathInput = optionsDoc.getElementById('calc-subpath');
		const pieceSelection = optionsDoc.getElementById('calc-piece-selection');
		const pieceInput = optionsDoc.getElementById('calc-piece');
		const pathControls = optionsDoc.getElementById('calc-path-controls');

		const equationXForm = optionsDoc.getElementById('calc-equation-x-form');
		const equationYForm = optionsDoc.getElementById('calc-equation-y-form');
		const equationRForm = optionsDoc.getElementById('calc-equation-r-form');
		const equationMagXForm = optionsDoc.getElementById('calc-equation-mag-x-form');
		const equationForms = new Map();
		equationForms.set('x', equationXForm);
		equationForms.set('y', equationYForm);
		equationForms.set('r', equationRForm);
		equationForms.set('magX', equationMagXForm);
		const equationXInput = optionsDoc.getElementById('calc-equation-x');
		const equationYInput = optionsDoc.getElementById('calc-equation-y');
		const equationRInput = optionsDoc.getElementById('calc-equation-r');
		const equationMagXInput = optionsDoc.getElementById('calc-equation-mag-x');
		const equationInputs = new Map();
		equationInputs.set('x', equationXInput);
		equationInputs.set('y', equationYInput);
		equationInputs.set('r', equationRInput);
		equationInputs.set('magX', equationMagXInput);

		const minInput = optionsDoc.getElementById('calc-min');
		const maxInput = optionsDoc.getElementById('calc-max');
		const stepInput = optionsDoc.getElementById('calc-step');
		const rangeUnitsInput = optionsDoc.getElementById('calc-range-units');
		const unitDisplays = optionsDoc.querySelectorAll('.calc-units');
		const errorBox = optionsDoc.getElementById('calc-error');
		const pathRepeatInput = optionsDoc.getElementById('calc-path-repeat');
		const pathTranslateXInput = optionsDoc.getElementById('calc-translate-x');
		const pathTranslateYInput = optionsDoc.getElementById('calc-translate-y');
		const pathScaleInput = optionsDoc.getElementById('calc-scale');
		const pathStretchInput = optionsDoc.getElementById('calc-stretch');
		const pathShearRow = optionsDoc.getElementById('calc-shear-row');
		const pathShearInput = optionsDoc.getElementById('calc-shear');
		const pathClosedInput = optionsDoc.getElementById('calc-close-path');
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

		$(optionsDoc.getElementById('calc-render-tab')).on('show.bs.tab', function (event) {
			shapeSelection.hidden = false;
			subpathSelection.hidden = true;
			pieceSelection.hidden = true;
		});

		$(optionsDoc.getElementById('calc-axes-tab')).on('show.bs.tab', function (event) {
			shapeSelection.hidden = true;
			subpathSelection.hidden = true;
			pieceSelection.hidden = true;
		});

		const pathDelBtn = optionsDoc.getElementById('calc-del-path');
		const addPieceBtn = optionsDoc.getElementById('calc-add-piece');
		const pieceDelBtn = optionsDoc.getElementById('calc-del-piece');

		function displayPath() {
			pieceNum = 0;
			pathInput.value = pathNum;
			const numPieces = me.equations[shapeNum][pathNum].length;
			const numOptions = pieceInput.children.length;
			for (let i = numPieces; i < numOptions; i++) {
				pieceInput.removeChild(pieceInput.children[i]);
			}
			for (let i = numOptions; i < numPieces; i++) {
				const option = document.createElement('OPTION');
				option.innerHTML = i;
				pieceInput.appendChild(option);
			}
			const variables = me.equations[shapeNum][pathNum][0].variables;
			for (let [varName, form] of equationForms.entries()) {
				form.hidden = !variables.includes(varName);
			}
			displayPiece();
			pathRepeatInput.value = me.maxPathRepeat[shapeNum][pathNum];
			pathTranslateXInput.value = me.translateX[shapeNum][pathNum + 1];
			pathTranslateYInput.value = me.translateY[shapeNum][pathNum + 1];
			pathScaleInput.value = me.scale[shapeNum][pathNum + 1];
			pathStretchInput.value = me.stretch[shapeNum][pathNum + 1];
			const rawShearX = me.shearX[shapeNum][pathNum + 1];
			const rawShearY = me.shearY[shapeNum][pathNum + 1];
			const shearDirection = me.shearDirection[shapeNum][pathNum + 1];
			const shearX = rawShearX * Math.cos(shearDirection);
			const shearY = rawShearY * Math.sin(shearDirection);
			if (shearX >= shearY) {
				pathShearInput.value = shearX;
				checkInput(pathShearRow, 'calc-shear-direction', '0');
			} else {
				pathShearInput.value = shearY;
				checkInput(pathShearRow, 'calc-shear-direction', '0.5');
			}
			pathClosedInput.checked = me.closePath[shapeNum][pathNum];
		}

		function displayPiece() {
			pieceInput.value = pieceNum;
			pieceDelBtn.disabled = me.equations[shapeNum][pathNum].length === 1;
			const equation = me.equations[shapeNum][pathNum][pieceNum];
			const variables = equation.variables;
			for (let [varName, input] of equationInputs.entries()) {
				if (variables.includes(varName)) {
					input.value = equation[varName + 'FormulaText'];
				}
			}
			const unitsCode = me.rangeUnits[shapeNum][pathNum][pieceNum];
			rangeUnitsInput.value = unitsCode;
			updateUnitsDisplay();
			const units = unitsCode === '1' ? 1 : Math.PI;
			minInput.value = me.min[shapeNum][pathNum][pieceNum] / units;
			maxInput.value = me.max[shapeNum][pathNum][pieceNum] / units;
			stepInput.value = me.step[shapeNum][pathNum][pieceNum] / units;
			errorBox.innerHTML = '';
		}
		displayPath();

		pathInput.addEventListener('input', function (event) {
			pathNum = parseInt(this.value);
			displayPath();
		});

		pieceInput.addEventListener('input', function (event) {
			pieceNum = parseInt(this.value);
			displayPiece();
		});

		function addPath(event) {
			const methodName = 'add' + this.value + 'Equation';
			pathNum++;
			pieceNum = 0;
			me.addSubpath(shapeNum, pathNum);
			me[methodName](shapeNum, pathNum, 0);
			const option = document.createElement('OPTION');
			option.innerHTML = me.equations[shapeNum].length - 1;
			pathInput.appendChild(option);
			pieceInput.innerHTML = '<option>0</option>';
			displayPath();
			pathControls.classList.add('show');
			pathDelBtn.disabled = false;
			addPieceBtn.disabled = false;
			generateBackground(0);
		}

		for (let element of optionsDoc.getElementById('calc-equation-type').querySelectorAll('button')) {
			element.addEventListener('click', addPath);
		}

		addPieceBtn.addEventListener('click', function (event) {
			pieceNum++;
			const methodName = 'add' + me.equations[shapeNum][pathNum][0].constructor.name;
			me[methodName](shapeNum, pathNum, pieceNum);
			const option = document.createElement('OPTION');
			option.innerHTML = me.equations[shapeNum][pathNum].length - 1;
			pieceInput.appendChild(option);
			const step = Math.abs(parseFraction(stepInput.value));
			if (step > 0) {
				const stepUnits = rangeUnitsInput.value === 'PI' ? Math.PI : 1;
				me.step[shapeNum][pathNum][pieceNum] = step * stepUnits;
			}
			displayPiece();
			generateBackground(0);
		});

		pathDelBtn.addEventListener('click', function (event) {
			me.removeSubpath(shapeNum, pathNum);
			const numPaths = pathInput.children.length;
			pathInput.removeChild(pathInput.children[numPaths - 1]);
			if (pathNum === numPaths - 1) {
				pathNum--;
			}
			if (pathNum >= 0) {
				displayPath();
			} else {
				pathDelBtn.disabled = true;
				pieceInput.innerHTML = '';
				addPieceBtn.disabled = true;
				pathControls.classList.remove('show');
			}
			generateBackground(0);
		});

		pieceDelBtn.addEventListener('click', function (event) {
			me.removeEquation(shapeNum, pathNum, pieceNum);
			const numPieces = pieceInput.children.length;
			pieceInput.removeChild(pieceInput.children[numPieces - 1]);
			if (pieceNum === numPieces - 1) {
				pieceNum--;
			}
			displayPiece();
			generateBackground(0);
		});

		function displayBoundingBox() {
			const maxRepeat = me.maxPathRepeat[shapeNum][pathNum];
			const variables = new Map();
			variables.set('time', me.tween);
			variables.set('N', maxRepeat);
			variables.set('n', 0);
			const equation = me.equations[shapeNum][pathNum][pieceNum];
			const min = me.min[shapeNum][pathNum][pieceNum];
			const max = me.max[shapeNum][pathNum][pieceNum];
			const step = me.step[shapeNum][pathNum][pieceNum];
			const box = equation.getBoundingBox(variables, min, max, step);
			const formatter = new Intl.NumberFormat({maximumSignificantDigits: 10});
			let minXStr = formatter.format(box.minX);
			let maxXStr = formatter.format(box.maxX);
			let minYStr = formatter.format(box.minY);
			let maxYStr = formatter.format(box.maxY);
			if (minXStr === '-0') { minXStr = '0'};
			if (maxXStr === '-0') { maxXStr = '0'};
			if (minYStr === '-0') { minYStr = '0'};
			if (maxYStr === '-0') { maxYStr = '0'};
			const table = document.createElement('TABLE');
			let row = document.createElement('TR');
			row.innerHTML = '<td class="pr-3"><var>x<sub>min</sub></var> =</td><td class="text-right">' + minXStr + '</td>';
			table.appendChild(row);
			row = document.createElement('TR');
			row.innerHTML = '<td class="pr-3"><var>x<sub>max</sub></var> =</td><td class="text-right">' + maxXStr + '</td>';
			table.appendChild(row);
			row = document.createElement('TR');
			row.innerHTML = '<td class="pr-3"><var>y<sub>min</sub></var> =</td><td class="text-right">' + minYStr + '</td>';
			table.appendChild(row);
			row = document.createElement('TR');
			row.innerHTML = '<td class="pr-3"><var>y<sub>max</sub></var> =</td><td class="text-right">' + maxYStr + '</td>';
			table.appendChild(row);
			errorBox.innerHTML = '';
			errorBox.appendChild(table);
			const div = document.createElement('DIV');
			div.innerHTML = 'when <var>n</var> = 0 ; <var>time</var> = ' + me.tween.toFixed(3) + ' (3 d.p.)';
			errorBox.appendChild(div);
		}

		function compileEquation(varName) {
			const formulaText = equationInputs.get(varName).value;
			try {
				const methodName = 'parse' + varName[0].toUpperCase() + varName.slice(1) + 'Formula';
				me.equations[shapeNum][pathNum][pieceNum][methodName](formulaText);
				generateBackground(0);
				displayBoundingBox();
				me.checkForRandomness();
			} catch (e) {
				errorBox.innerText = 'Error in equation for ' + varName + '. ' + e.message;
			}
		}

		equationXForm.addEventListener('submit', function (event) {
			event.preventDefault();
			compileEquation('x');
		});
		equationXForm.addEventListener('focusout', function (event) {
			if (!this.contains(event.relatedTarget)) {
				compileEquation('x');
			}
		});

		equationYForm.addEventListener('submit', function (event) {
			event.preventDefault();
			compileEquation('y');
		});
		equationYForm.addEventListener('focusout', function (event) {
			if (!this.contains(event.relatedTarget)) {
				compileEquation('y');
			}
		});

		equationRForm.addEventListener('submit', function (event) {
			event.preventDefault();
			compileEquation('r');
		});
		equationRForm.addEventListener('focusout', function (event) {
			if (!this.contains(event.relatedTarget)) {
				compileEquation('r');
			}
		});

		equationMagXForm.addEventListener('submit', function (event) {
			event.preventDefault();
			compileEquation('magX');
		});
		equationMagXForm.addEventListener('focusout', function (event) {
			if (!this.contains(event.relatedTarget)) {
				compileEquation('magX');
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
			generateBackground(0);
			displayBoundingBox();
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
		function updateUnitsDisplay() {
			const unitsCode = rangeUnitsInput.value;
			const options = rangeUnitsInput.children;
			let units;
			for (let i = 0; i < options.length; i++) {
				const option = options[i];
				if (option.value === unitsCode) {
					units = option.innerHTML;
					break;
				}
			}
			for (let element of unitDisplays) {
				element.innerHTML = units;
			}
		}
		rangeUnitsInput.addEventListener('input', function (event) {
			me.rangeUnits[shapeNum][pathNum][pieceNum] = this.value;
			updateUnitsDisplay();
		});
		stepInput.addEventListener('input', function (event) {
			let value = Math.abs(parseFraction(this.value));
			if (value > 0) {
				if (rangeUnitsInput.value === 'PI') {
					value *= Math.PI;
				}
				me.step[shapeNum][pathNum][pieceNum] = value;
				generateBackground(0);
				displayBoundingBox();
			}
		});

		pathRepeatInput.addEventListener('input', function (event) {
			const value = parseInt(this.value);
			if (value >= 0) {
				me.minPathRepeat[shapeNum][pathNum] = 0;
				me.maxPathRepeat[shapeNum][pathNum] = value;
				generateBackground(0);
				displayBoundingBox();
			}
		});

		pathTranslateXInput.addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				me.translateX[shapeNum][pathNum + 1] = value;
				generateBackground(0);
			}
		});

		pathTranslateYInput.addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				me.translateY[shapeNum][pathNum + 1] = value;
				generateBackground(0);
			}
		});

		pathScaleInput.addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				me.scale[shapeNum][pathNum + 1] = value;
				generateBackground(0);
			}
		});

		pathStretchInput.addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				me.stretch[shapeNum][pathNum + 1] = value;
				generateBackground(0);
			}
		});

		pathShearInput.addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				if (me.shearDirection[shapeNum][pathNum + 1] === 0) {
					me.shearX[shapeNum][pathNum + 1] = value;
				} else {
					me.shearY[shapeNum][pathNum + 1] = value;
				}
				generateBackground(0);
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
			generateBackground(0);
		}

		for (let item of pathShearRow.querySelectorAll('input[name=calc-shear-direction')) {
			item.addEventListener('input', setShearDirection);
		};

		pathClosedInput.addEventListener('input', function (event) {
			me.closePath[shapeNum][pathNum] = this.checked;
			generateBackground(0);
		});

		optionsDoc.getElementById('calc-line-width').addEventListener('input', function (event) {
			const value = parseInt(this.value);
			if (value >= 0) {
				me.lineWidth[shapeNum] = value;
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('calc-dash').addEventListener('input', function (event) {
			if (this.checkValidity()) {
				me.dash[shapeNum] = parseLineDash(this.value);
				generateBackground(0);
			}
		});

		function setLineJoin(event) {
			me.lineJoin[shapeNum] = this.value;
			generateBackground(0);
		}

		for (let element of optionsDoc.querySelectorAll('input[name="calc-line-join"]')) {
			element.addEventListener('input', setLineJoin);
		}

		const strokeColorInput = optionsDoc.getElementById('calc-stroke-color');
		const strokeOpacityInput = optionsDoc.getElementById('calc-stroke-opacity');

		function updateStrokeColor() {
			const a = parseFloat(strokeOpacityInput.value);
			const [r, g, b] = hexToRGBA(strokeColorInput.value)
			me.strokeColor[shapeNum] = rgba(r, g, b, a);
			generateBackground(0);
		}

		strokeColorInput.addEventListener('input', updateStrokeColor);
		strokeOpacityInput.addEventListener('input', updateStrokeColor);

		const fillColorInput = optionsDoc.getElementById('calc-fill-color');
		const fillOpacityInput = optionsDoc.getElementById('calc-fill-opacity');

		function updateFillColor() {
			const a = parseFloat(fillOpacityInput.value);
			const [r, g, b] = hexToRGBA(fillColorInput.value)
			me.fillColor[shapeNum] = rgba(r, g, b, a);
			generateBackground(0);
		}

		fillColorInput.addEventListener('input', updateFillColor);
		fillOpacityInput.addEventListener('input', updateFillColor);

		optionsDoc.getElementById('calc-fill-rule').addEventListener('input', function (event) {
			me.fillRule[shapeNum] = this.value;
			generateBackground(0);
		});

		optionsDoc.getElementById('calc-clip').addEventListener('input', function (event) {
			me.clip[shapeNum] = this.checked;
			generateBackground(0);
		});

		const rotationSlider = optionsDoc.getElementById('calc-rotation');
		rotationSlider.addEventListener('input', function (event) {
			me.rotation[shapeNum] = parseFloat(this.value) * TWO_PI;
			generateBackground(0);
		});

		optionsDoc.getElementById('calc-rotation-reset').addEventListener('click', function (event) {
			rotationSlider.value = '0';
			me.rotation[shapeNum] = 0;
			generateBackground(0);
		});

		optionsDoc.getElementById('calc-major-grid-intensity').addEventListener('input', function (event) {
			me.majorGridlineIntensity = parseFloat(this.value);
			generateBackground(0);
		});

		optionsDoc.getElementById('calc-axis-intensity').addEventListener('input', function (event) {
			me.axisIntensity = parseFloat(this.value);
			generateBackground(0);
		});

		optionsDoc.getElementById('calc-grid-color').addEventListener('input', function (event) {
			me.gridlineColor = this.value;
			generateBackground(0);
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
			generateBackground(0);
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
				generateBackground(0);
			}
		});
		optionsDoc.getElementById('calc-major-axis-center').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				me.majorAxisTranslation = -value;
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('calc-grid-major-major').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value > 0) {
				me.majorAxisMajorGridlines = value;
				generateBackground(0);
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
		'closePath', 'lineWidth', 'dash', 'fillRule', 'clip'
	],
	pairedContinuous: [
		['max', 'min']	// min catches up to max.
	],
	pairedStepped: [
		['maxPathRepeat', 'minPathRepeat']
	]
};

GraphingCalculator.prototype.checkForRandomness = function () {
	for (let shape of this.equations) {
		for (let path of shape) {
			for (let piece of path) {
				for (let equation of piece.formulas) {
					if (equation.hasRandomness) {
						hasRandomness(true);
						return;
					}
				}
			}
		}
	}
	hasRandomness(false);
}

GraphingCalculator.prototype.addShape = function (index) {
	this.equations.splice(index, 0, []);
	this.min.splice(index, 0, []);
	this.max.splice(index, 0, []);
	this.step.splice(index, 0, []);
	this.rangeUnits.splice(index, 0, []);
	this.minPathRepeat.splice(index, 0, []);
	this.maxPathRepeat.splice(index, 0, []);
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
	this.lineJoin.splice(index, 0, 'round');
	this.dash.splice(index, 0, [1, 0]);
	this.strokeColor.splice(index, 0, '#000000ff');
	this.fillColor.splice(index, 0, '#ff00808c');
	this.fillRule.splice(index, 0, 'evenodd');
	this.clip.splice(index, 0, false);
};

GraphingCalculator.prototype.addSubpath = function (shapeNum, index) {
	this.equations[shapeNum].splice(index, 0, []);
	this.min[shapeNum].splice(index, 0, []);
	this.max[shapeNum].splice(index, 0, []);
	this.step[shapeNum].splice(index, 0, []);
	this.rangeUnits[shapeNum].splice(index, 0, []);
	this.minPathRepeat[shapeNum].splice(index, 0, 0);
	this.maxPathRepeat[shapeNum].splice(index, 0, 1);
	this.translateX[shapeNum].splice(index + 1, 0, 0);
	this.translateY[shapeNum].splice(index + 1, 0, 0);
	this.scale[shapeNum].splice(index + 1, 0, 1);
	this.stretch[shapeNum].splice(index + 1, 0, 1);
	this.shearX[shapeNum].splice(index + 1, 0, 0);
	this.shearY[shapeNum].splice(index + 1, 0, 0);
	this.shearDirection[shapeNum].splice(index + 1, 0, 0);
	this.closePath[shapeNum].splice(index, 0, false);
}

GraphingCalculator.prototype.removeSubpath = function (shapeNum, index) {
	this.equations[shapeNum].splice(index, 1);
	this.min[shapeNum].splice(index, 1);
	this.max[shapeNum].splice(index, 1);
	this.step[shapeNum].splice(index, 1);
	this.rangeUnits[shapeNum].splice(index, 1);
	this.minPathRepeat[shapeNum].splice(index, 1);
	this.maxPathRepeat[shapeNum].splice(index, 1);
	this.translateX[shapeNum].splice(index + 1, 1);
	this.translateY[shapeNum].splice(index + 1, 1);
	this.scale[shapeNum].splice(index + 1, 1);
	this.stretch[shapeNum].splice(index + 1, 1);
	this.shearX[shapeNum].splice(index + 1, 1);
	this.shearY[shapeNum].splice(index + 1, 1);
	this.shearDirection[shapeNum].splice(index + 1, 1);
	this.closePath[shapeNum].splice(index, 1);
}

GraphingCalculator.prototype.getExampleRadius = function () {
	let r = 1;
	for (let shape of this.equations) {
		for (let subpath of shape) {
			r += subpath.length;
		}
	}
	return r;
};

GraphingCalculator.prototype.setLinearRange = function (shapeNum, subpathNum, index) {
	this.min[shapeNum][subpathNum].splice(index, 0, this.minorAxisMin);
	this.max[shapeNum][subpathNum].splice(index, 0, this.minorAxisMax);
	let step = (this.minorAxisMax - this.minorAxisMin) / screen.width;
	let log = Math.floor(Math.log10(step));
	const pow = log > 0 ? 1 : 10 ** log;
	step = Math.ceil(step / pow) * pow;
	this.step[shapeNum][subpathNum].splice(index, 0, step);
	this.rangeUnits[shapeNum][subpathNum].splice(index, 0, '1');
};

GraphingCalculator.prototype.addRectangularEquation = function (shapeNum, subpathNum, index) {
	const m = this.getExampleRadius();
	this.equations[shapeNum][subpathNum].splice(index, 0, new RectangularEquation(m + 'x'));
	this.setLinearRange(shapeNum, subpathNum, index);
};

GraphingCalculator.prototype.addParametricEquation = function (shapeNum, subpathNum, index) {
	const r = this.getExampleRadius();
	this.equations[shapeNum][subpathNum].splice(index, 0, new ParametricEquation(
		r + 'cos(t)',
		r + 'sin(t)'
	));
	this.min[shapeNum][subpathNum].splice(index, 0, -Math.PI);
	this.max[shapeNum][subpathNum].splice(index, 0, Math.PI);
	this.step[shapeNum][subpathNum].splice(index, 0, Math.PI / 180);
	this.rangeUnits[shapeNum][subpathNum].splice(index, 0, 'PI');
};

GraphingCalculator.prototype.addPolarEquation = function (shapeNum, subpathNum, index) {
	const r = this.getExampleRadius();
	this.equations[shapeNum][subpathNum].splice(index, 0, new PolarEquation(r));
	this.min[shapeNum][subpathNum].splice(index, 0, 0);
	this.max[shapeNum][subpathNum].splice(index, 0, TWO_PI);
	this.step[shapeNum][subpathNum].splice(index, 0, Math.PI / 180);
	this.rangeUnits[shapeNum][subpathNum].splice(index, 0, 'PI');
};

GraphingCalculator.prototype.addMagXEquation = function (shapeNum, subpathNum, index) {
	const r = this.getExampleRadius();
	this.equations[shapeNum][subpathNum].splice(index, 0, new MagXEquation(r));
	this.setLinearRange(shapeNum, subpathNum, index);
};

GraphingCalculator.prototype.addHeartEquation = function (shapeNum, subpathNum, index) {
	this.addParametricEquation(shapeNum, subpathNum, index);
	const equation = this.equations[shapeNum][subpathNum][index];
	equation.parseXFormula('16 * sin(t)^3 * (sin(4PI * time)/4 + 0.75)');
	equation.parseYFormula('(13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)) * (sin(4PI * time)/4 + 0.75)');
}

GraphingCalculator.prototype.addRoseEquation = function (shapeNum, subpathNum, index) {
	this.addPolarEquation(shapeNum, subpathNum, index);
	const equation = this.equations[shapeNum][subpathNum][index];
	equation.parseRFormula('20cos(7/1 * t) + 5');
}

GraphingCalculator.prototype.removeEquation = function (shapeNum, pathNum, pieceNum) {
	this.equations[shapeNum][pathNum].splice(pieceNum, 1);
	this.min[shapeNum][pathNum].splice(pieceNum, 1);
	this.max[shapeNum][pathNum].splice(pieceNum, 1);
	this.step[shapeNum][pathNum].splice(pieceNum, 1);
	this.rangeUnits[shapeNum][pathNum].splice(pieceNum, 1);
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
		const clip = this.clip[shapeNum];

		const lineWidth = this.lineWidth[shapeNum];
		context.lineWidth = lineWidth / (scale * shapeScale);
		const lineJoin = this.lineJoin[shapeNum];
		context.lineJoin = lineJoin;
		let dash = this.dash[shapeNum];
		if (lineJoin === 'round') {
			dash = dash.slice();
			adjustLineDash(dash, lineWidth);
			context.lineCap = 'round';
		} else {
			context.lineCap = 'butt';
		}
		const numDashLengths = dash.length;
		const scaledDash = new Array(numDashLengths);
		for (let i = 0; i < numDashLengths; i++) {
			scaledDash[i] = dash[i] / scale;
		}
		context.setLineDash(scaledDash);
		const strokeColor = this.strokeColor[shapeNum];
		context.strokeStyle = strokeColor;

		for (let subpathNum = 0; subpathNum < shapeEquations.length; subpathNum++) {
			const pathMinRepeat = this.minPathRepeat[shapeNum][subpathNum];
			const pathMaxRepeat = this.maxPathRepeat[shapeNum][subpathNum];
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
			context.scale(shapeScale, shapeScale);
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
			if (clip) {
				if (lineWidth > 0) {
					context.stroke();
				}
				if (subpathNum === 0) {
					context.clip();
					context.save();
				}
			}
		}
		const fillColor = this.fillColor[shapeNum];
		context.fillStyle = fillColor;
		context.fill(this.fillRule[shapeNum]);
		if (lineWidth > 0) {
			context.stroke();
		}
		context.restore();
		if (clip) {
			context.restore();
		}
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
