'use strict';

 {

	function CellAutomaton() {
		const me = this;
		this.title = 'Cellular Automata';
		this.hasRandomness = true;

		this.optionsDocument = downloadFile('cellular-automata.html', 'document').then(function (optionsDoc) {
			const helpLinks = new Map();
			helpLinks.set('g', 'https://mathworld.wolfram.com/CellularAutomaton.html');
			helpLinks.set('a', 'https://mathworld.wolfram.com/AdditiveCellularAutomaton.html');
			helpLinks.set('c', 'https://en.wikipedia.org/wiki/Cyclic_cellular_automaton');
			helpLinks.set('ot', 'https://mathworld.wolfram.com/Outer-TotalisticCellularAutomaton.html');
			helpLinks.set('at', 'https://mathworld.wolfram.com/TotalisticCellularAutomaton.html');

			const ruleTypeInput = optionsDoc.getElementById('ca-type');
			const helpAnchor = optionsDoc.getElementById('ca-help');
			const numStatesInput = optionsDoc.getElementById('ca-num-states');
			const presetInput = optionsDoc.getElementById('ca-preset');
			const seedInput = optionsDoc.getElementById('ca-seed');
			const seedLengthInput = optionsDoc.getElementById('ca-seed-length');
			const seedTypeRow = optionsDoc.getElementById('ca-seed-type');

			function fullRedraw() {
				progressiveBackgroundGen(me, 0);
			}

			function setPreset() {
				const type = ruleTypeInput.value;
				const numStates = me.numStates;
				const number = parseInt(presetInput.value);
				const blank = this !== presetInput;

				if (type === 'g') {
					const maxValue = numStates ** (numStates ** 3) - 1;
					if (number >= 0 && number <= maxValue) {
						me.setGeneralRule(number);
						progressiveBackgroundGen(me, 0);
					} else if (blank) {
						presetInput.value = '';
					}
				} else if (type === 'a') {
					me.setAdditiveRule();
					progressiveBackgroundGen(me, 0);
				} else if (type[1] === 't') {
					const outer = type[0] === 'o';
					const numDigits = (outer ? 2 : 3) * (numStates - 1) + 1;
					const maxValue = numStates ** numDigits - 1;
					if (number >= 0 && number <= maxValue) {
						me.setTotalisticRule(number, outer);
						progressiveBackgroundGen(me, 0);
					} else if (blank) {
						presetInput.value = '';
					}
				} else {
					me.setCyclicRule();
					progressiveBackgroundGen(me, 0);
				}
				presetInput.disabled = type === 'a' || type === 'c';
			}

			ruleTypeInput.addEventListener('input', function (event) {
				const value = this.value;
				helpAnchor.href = helpLinks.get(value);
				for (let option of this.children) {
					if (option.value === value) {
						helpAnchor.innerHTML = 'About ' + option.innerText.toLowerCase() + ' CAs';
					}
				}
				setPreset();
			});
			presetInput.addEventListener('input', setPreset);

			numStatesInput.addEventListener('input', function (event) {
				me.numStates = parseInt(this.value);
				setPreset();
			});

			function setSeed() {
				const seed = parseInt(seedInput.value);

				if (seed >= 0) {
					const seedType = queryChecked(seedTypeRow, 'ca-seed-type').value;
					let length;
					if (seedType === 'tri') {
						length = 1;
					} else {
						length = parseInt(seedLengthInput.value);
						if (!(length >= 1)) {
							length = 1;
						}
					}
					me.setSeed(seed, length);
				}
				progressiveBackgroundGen(me, 0);
			};

			seedInput.addEventListener('input', setSeed);
			seedLengthInput.addEventListener('input', setSeed);

			function setSeedType(event) {
				const type = this.value;
				me.repeatSeed = type === 'repeat';
				if (type === 'random') {
					me.seed = undefined;
					progressiveBackgroundGen(me, 0);
				} else {
					setSeed();
				}
				seedInput.disabled = type === 'random';
				seedLengthInput.disabled = type !== 'repeat';
			}

			for (let element of seedTypeRow.querySelectorAll('[name=ca-seed-type]')) {
				element.addEventListener('input', setSeedType);
			}

			optionsDoc.getElementById('ca-border-row').addEventListener('input', function (event) {
				me.borderRow = this.checked;
				progressiveBackgroundGen(me, 0);
			});

			optionsDoc.getElementById('ca-cell-width').addEventListener('change', function (event) {
				const value = parseInt(this.value);
				if (value >= 1) {
					me.cellWidth = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('ca-cell-height').addEventListener('change', function (event) {
				const value = parseInt(this.value);
				if (value >= 1) {
					me.cellHeight = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			const gapXSlider = optionsDoc.getElementById('ca-gap-x');
			gapXSlider.addEventListener('input', function (event) {
				me.gapX = parseFloat(this.value);
				progressiveBackgroundGen(me, 1);
			});
			gapXSlider.addEventListener('pointerup', fullRedraw);
			gapXSlider.addEventListener('keyup', fullRedraw);

			const gapYSlider = optionsDoc.getElementById('ca-gap-y');
			gapYSlider.addEventListener('input', function (event) {
				me.gapY = parseFloat(this.value);
				progressiveBackgroundGen(me, 1);
			});
			gapYSlider.addEventListener('pointerup', fullRedraw);
			gapYSlider.addEventListener('keyup', fullRedraw);

			optionsDoc.getElementById('ca-hue-min').addEventListener('input', function (event) {
				me.hueMin = parseFloat(this.value);
				progressiveBackgroundGen(me, 0);
			});

			optionsDoc.getElementById('ca-hue-max').addEventListener('input', function (event) {
				me.hueMax = parseFloat(this.value);
				progressiveBackgroundGen(me, 0);
			});

			const strokeSlider = optionsDoc.getElementById('ca-stroke');
			strokeSlider.addEventListener('input', function (event) {
				me.strokeIntensity = parseFloat(this.value);
				progressiveBackgroundGen(me, 1);
			});
			strokeSlider.addEventListener('pointerup', fullRedraw);
			strokeSlider.addEventListener('keyup', fullRedraw);

			const startSlider = optionsDoc.getElementById('ca-start-row');
			startSlider.addEventListener('input', function (event) {
				me.startHeight = parseFloat(this.value);
				progressiveBackgroundGen(me, 1);
			});
			startSlider.addEventListener('pointerup', fullRedraw);
			startSlider.addEventListener('keyup', fullRedraw);

			const endSlider = optionsDoc.getElementById('ca-end-row');
			endSlider.addEventListener('input', function (event) {
				me.endHeight = parseFloat(this.value);
				progressiveBackgroundGen(me, 1);
			});
			endSlider.addEventListener('pointerup', fullRedraw);
			endSlider.addEventListener('keyup', fullRedraw);

			return optionsDoc;
		});

		const transitions = new Array(16);
		transitions.fill(0);
		transitions[1] = 1;
		transitions[4] = 1;
		transitions[9] = 1;
		transitions[12] = 1;
		this.transitions = transitions;
		this.numStates = 2;
		this.neighbourhood = 7;	// left, centre and right

		this.hues = [0, 0];
		this.saturations = [1, 1];
		this.lightnesses = [0.55, 0];
		this.hueMin = 0;
		this.hueMax = 45;
		this.strokeIntensity = 1;

		this.seed = [1];
		this.repeatSeed = false;
		this.cellWidth = 11;
		this.cellHeight = 11;
		this.borderRow = true;
		this.gapX = 0;
		this.gapY = 0;
		this.startHeight = 0;
		this.endHeight = 1;

		this.history = undefined;
		this.cachedWidth = undefined;
		this.cachedHeight = undefined;
	}

	CellAutomaton.prototype.animatable = {
		continuous: [
			'hueMin', 'hueMax', 'strokeIntensity', 'gapX', 'gapY'
		],
		stepped: [
			'repeatSeed', 'cellWidth', 'cellHeight', 'borderRow'
		],
		pairedContinuous: [
			['endHeight', 'startHeight']
		]
	};

	CellAutomaton.prototype.setSeed = function (n, padLength) {
		const numStates = this.numStates;
		const seed = [];
		do {
			const value = n % numStates;
			seed.push(value);
			n = (n - value) / numStates;
		} while (n > 0);
		seed.reverse();
		for (let i = seed.length; i < padLength; i++) {
			seed[i] = 0;
		}
		this.seed = seed;
		this.history = undefined;
	}

	CellAutomaton.prototype.restrictNeighbourhood = function () {
		const transitions = this.transitions;
		const numTransitions = transitions.length;
		const numStates = this.numStates;
		const neighbourhood = this.neighbourhood;
		const squared = numStates * numStates;
		const cubed = squared * numStates;
		for (let i = 0; i < numTransitions; i++) {
			if (transitions[i] === undefined) {
				let value = i;
				const left = value % numStates;
				value = (value - left) / numStates;
				const centre = value % numStates;
				value = (value - centre) / numStates;
				const right = value % numStates;
				const past = (value - right) / numStates;
				const index =
					(neighbourhood & 1 ? left : 0) +
					(neighbourhood & 2 ? centre * numStates : 0) +
					(neighbourhood & 4 ? right * squared : 0) +
					(neighbourhood & 8 ? past * cubed : 0);
				transitions[i] = transitions[index];
			}
		}
	};

	CellAutomaton.prototype.setGeneralRule = function (n) {
		const numStates = this.numStates;
		const cubed = numStates ** 3;
		const transitions = new Array(cubed * numStates);
		for (let i = 0; i < cubed; i++) {
			const value = n % numStates;
			transitions[i] = value;
			transitions[cubed + i] = value;
			n = (n - value) / numStates;
		}
		this.transitions = transitions;
		this.neighbourhood = 7;
		this.restrictNeighbourhood();
		this.history = undefined;
	};

	CellAutomaton.prototype.setAdditiveRule = function () {
		const numStates = this.numStates;
		const pow4 = numStates ** 4;
		const neighbourhood = this.neighbourhood;
		const transitions = new Array(pow4);
		for (let i = 0; i < pow4; i++) {
			let value = i;
			const left = value % numStates;
			value = (value - left) / numStates;
			const centre = value % numStates;
			value = (value - centre) / numStates;
			const right = value % numStates;
			const past = (value - right) / numStates;
			let total =
				(neighbourhood & 1 ? left : 0) +
				(neighbourhood & 2 ? centre : 0) +
				(neighbourhood & 4 ? right : 0) +
				(neighbourhood & 8 ? past : 0);
			transitions[i] = total % numStates;
		}
		this.transitions = transitions;
		this.history = undefined;
	}


	CellAutomaton.prototype.setCyclicRule = function () {
		const numStates = this.numStates;
		const cubed = numStates ** 3;
		const transitions = new Array(cubed * numStates);
		for (let i = 0; i < cubed; i++) {
			let value = i;
			const left = value % numStates;
			value = (value - left) / numStates;
			const centre = value % numStates;
			value = (value - centre) / numStates;
			const right = value;
			const nextState = (centre + 1) % numStates;
			const leftMatch = left === nextState;
			const rightMatch = right === nextState;
			if (leftMatch ^ rightMatch) {
				transitions[i] = nextState;
			} else {
				transitions[i] = centre;
			}
		}
		this.transitions = transitions;
		this.neighbourhood = 7;
		this.restrictNeighbourhood();
		this.history = undefined;
	};

	CellAutomaton.prototype.setTotalisticRule = function (n, outer) {
		const numStates = this.numStates;
		const outputs = new Array(3 * numStates - 2);
		outputs.fill(0);
		let i = 0;
		while (n > 0) {
			const value = n % numStates;
			outputs[i] = value;
			n = (n - value) / numStates;
			i++;
		}
		const cubed = numStates ** 3;
		const transitions = new Array(cubed * numStates);
		for (let i = 0; i < cubed; i++) {
			let value = i;
			let total = 0;
			for (let j = 0; j < 3; j++) {
				let units = value % numStates;
				if (!outer || j !== 1) {
					total += units;
				}
				value = (value - units) / numStates;
			}
			transitions[i] = outputs[total];
		}
		this.transitions = transitions;
		this.neighbourhood = outer ? 5 : 7;
		this.restrictNeighbourhood();
		this.history = undefined;
	};

	CellAutomaton.prototype.generateFirstRow = function (width, height) {
		const row = new Array(width);
		this.history = [row];
		this.cachedWidth = width;
		this.cachedHeight = height;
		const seed = this.seed;

		if (seed === undefined) {
			const numStates = this.numStates;
			for (let i = 0; i < width; i++) {
				row[i] = Math.trunc(Math.random() * numStates);
			}
			return;
		}

		const seedLength = seed.length;
		if (this.repeatSeed) {
			for (let i = 0; i < width; i++) {
				row[i] = seed[i % seedLength];
			}
		} else {
			row.fill(0);
			const offset1 = height - 1;
			const offset2 = width - (height - 1) - seedLength;
			if (offset2 - offset1 >= Math.max(width * 0.1, seedLength)) {
				for (let i = 0; i < seedLength; i++) {
					const value = seed[i];
					row[offset1 + i] = value;
					row[offset2 + i] = value;
				}
			} else {
				const offset = Math.max(Math.trunc((width - seedLength) / 2), 0);
				const maxI = Math.min(seedLength, width);
				for (let i = 0; i < maxI; i++) {
					row[offset + i] = seed[i];
				}
			}
		}
	}

	CellAutomaton.prototype.getCellValue = function (i, j) {
		if (j === -1) {
			return 0
		}

		const row = this.history[j];
		const width = row.length;
		if (i === -1) {
			if (this.seed === undefined) {
				return Math.trunc(Math.random() * this.numStates);
			} else if (j === 0 && this.repeatSeed) {
				return this.seed[this.seed.length - 1];	// wrap seed
			} else {
				return row[width - 1];	// wrap row data
			}
		} else if (i === width) {
			if (this.seed === undefined) {
				return Math.trunc(Math.random() * this.numStates);
			} if (j === 0 && this.repeatSeed) {
				return this.seed[(i + 1) % this.seed.length];	// wrap seed
			} else {
				return row[0];	// wrap row data
			}
		} else {
			return row[i];
		}
	}

	CellAutomaton.prototype.generate = function* (context, canvasWidth, canvasHeight, preview) {
		const cellWidth = this.cellWidth;
		const cellHeight = this.cellHeight;
		const totalWidth = Math.round(cellWidth * (1 + this.gapX));
		const totalHeight = Math.round(cellHeight * (1 + this.gapY));
		const gridWidth = Math.trunc(canvasWidth / totalWidth);
		const emptyTopRow = this.borderRow;
		const gridHeight = Math.ceil(canvasHeight / totalHeight) - emptyTopRow;

		if (
			this.history === undefined ||
			this.cachedWidth !== gridWidth ||
			(!this.repeatSeed && this.cachedHeight !== gridHeight) ||
			this.seed === undefined
		) {
			this.generateFirstRow(gridWidth, gridHeight);
		}

		const history = this.history;
		const numStates = this.numStates;
		const squared = numStates * numStates;
		const cubed = squared * numStates;
		const startHeight = this.startHeight;
		const minRow = startHeight === 1 ? gridHeight - 1 : Math.trunc(startHeight * gridHeight);
		const endHeight = this.endHeight;
		const maxRow = endHeight === 1 ? gridHeight : Math.trunc(endHeight * (gridHeight + 1));

		for (let j = history.length; j <= maxRow + 1; j++) {
			const row = new Array(gridWidth);
			for (let i = 0; i < gridWidth; i++) {
				const left = this.getCellValue(i - 1, j - 1);
				const centre = this.history[j - 1][i];
				const right = this.getCellValue(i + 1, j - 1);
				const past = this.getCellValue(i, j - 2);
				const index =
					left +
					centre * numStates +
					right * squared +
					past * cubed;
				row[i] = this.transitions[index];
			}
			history.push(row);
		}

		const hueMin = this.hueMin;
		const hueRange = this.hueMax - hueMin;

		const strokeIntensity = this.strokeIntensity;
		context.translate(
			Math.trunc((canvasWidth - gridWidth * totalWidth) / 2),
			(emptyTopRow ? cellHeight : 0)
		);
		context.strokeStyle = rgba(0, 0, 0, strokeIntensity);

		for (let j = minRow; j < maxRow; j++) {
			const y = j * totalHeight;
			for (let i = 0; i < gridWidth; i++) {
				const value = history[j][i];
				if (value !== 0) {
					const x = i * totalWidth;
					let hue, saturation, lightness;

					if (this.numStates === 2) {
						let neighbourCount = 0;
						neighbourCount += this.getCellValue(i - 1, j - 1) > 0 ? 1 : 0;
						neighbourCount += this.getCellValue(i, j - 1) > 0 ? 1 : 0;
						neighbourCount += this.getCellValue(i + 1, j - 1) > 0 ? 1 : 0;
						neighbourCount += this.getCellValue(i - 1, j) > 0 ? 1 : 0;
						neighbourCount += this.getCellValue(i + 1, j) > 0 ? 1 : 0;
						neighbourCount += this.getCellValue(i - 1, j + 1) > 0 ? 1 : 0;
						neighbourCount += this.getCellValue(i, j + 1) > 0 ? 1 : 0;
						neighbourCount += this.getCellValue(i + 1, j + 1) > 0 ? 1 : 0;

						hue = hueMin + j / (gridHeight - 1) * hueRange;
						saturation = 1 - neighbourCount / 8;
						lightness = this.lightnesses[value - 1];

						context.fillStyle = hsla(hue, saturation, lightness, 1);
						context.fillRect(x, y, cellWidth, cellHeight);

					} else {
						hue = this.hues[value - 1];
						saturation = this.saturations[value - 1];
						lightness = this.lightnesses[value - 1];
						const thisColor = hsla(hue, saturation, lightness, 1);

						if (preview > 0) {

							context.fillStyle = thisColor;
							context.fillRect(x, y, cellWidth, cellHeight);

						} else {

							context.save();
							const scale = cellWidth / cellHeight;
							context.scale(scale, 1);
							const scaledX = x / scale;
							const centreX = scaledX + cellHeight / 2;
							const centreY = y + cellHeight / 2;
							const r = cellHeight / 2 * Math.SQRT2;

							let top = this.getCellValue(i, j - 1);
							if (top === 0) {
								top = value;
							}
							if (top === value) {
								context.fillStyle = thisColor;
							} else {
								const g = context.createRadialGradient(centreX, centreY, 0, centreX, centreY, r);
								hue = this.hues[top - 1];
								saturation = this.saturations[top - 1];
								lightness = this.lightnesses[top - 1];
								const topColor = hsla(hue, saturation, lightness, 1);
								g.addColorStop(0, thisColor);
								g.addColorStop(1, topColor);
								context.fillStyle = g;
							}
							context.beginPath();
							context.moveTo(scaledX + cellHeight, y);
							context.lineTo(scaledX, y);

							let left = this.getCellValue(i - 1, j);
							if (left === 0) {
								left = value;
							}
							if (left !== top) {
								context.lineTo(centreX, centreY + 1);
								context.fill();
								context.beginPath();
								context.moveTo(centreX + 1, centreY);
								context.lineTo(scaledX, y);
								if (left === value) {
									context.fillStyle = thisColor;
								} else {
									const g = context.createRadialGradient(centreX, centreY, 0, centreX, centreY, r);
									hue = this.hues[left - 1];
									saturation = this.saturations[left - 1];
									lightness = this.lightnesses[left - 1];
									const leftColor = hsla(hue, saturation, lightness, 1);
									g.addColorStop(0, thisColor);
									g.addColorStop(1, leftColor);
									context.fillStyle = g;
								}
							}
							context.lineTo(scaledX, y + cellHeight);

							if (left !== value) {
								context.fill();
								context.beginPath();
								context.fillStyle = thisColor;
								context.moveTo(scaledX, y + cellHeight);
							}
							context.lineTo(scaledX + cellHeight, y + cellHeight);
							context.lineTo(scaledX + cellHeight, y);
							context.fill();
							context.restore();
						}
					}

					context.translate(0.5, 0.5);
					context.strokeRect(x, y, cellWidth, cellHeight);
					context.translate(-0.5, -0.5);
				}
			}
		}
	}

	addBgGenerator(CellAutomaton);
}
