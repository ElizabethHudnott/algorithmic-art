'use strict';

 {

	function CellAutomaton() {
		const me = this;
		this.title = 'Cellular Automata';
		this.hasRandomness = true;

		this.optionsDocument = downloadFile('cellular-automata.html', 'document').then(function (optionsDoc) {
			const ruleTypeInput = optionsDoc.getElementById('ca-type');
			const numStatesInput = optionsDoc.getElementById('ca-num-states');
			const presetInput = optionsDoc.getElementById('ca-preset');
			const seedInput = optionsDoc.getElementById('ca-seed');
			const seedLengthInput = optionsDoc.getElementById('ca-seed-length');
			const seedTypeRow = optionsDoc.getElementById('ca-seed-type');

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
				} else {
					const numDigits = 3 * numStates - 2;
					const maxValue = numStates ** numDigits - 1;
					if (number >= 0 && number <= maxValue) {
						me.setTotalisticRule(number);
						progressiveBackgroundGen(me, 0);
					} else if (blank) {
						presetInput.value = '';
					}
				}
			}

			ruleTypeInput.addEventListener('input', setPreset);
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

			optionsDoc.getElementById('ca-cell-width').addEventListener('input', function (event) {
				const value = parseInt(this.value);
				if (value >= 1) {
					me.cellWidth = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('ca-cell-height').addEventListener('input', function (event) {
				const value = parseInt(this.value);
				if (value >= 1) {
					me.cellHeight = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('ca-gap-x').addEventListener('input', function (event) {
				me.gapX = parseFloat(this.value);
				progressiveBackgroundGen(me, 0);
			});

			optionsDoc.getElementById('ca-gap-y').addEventListener('input', function (event) {
				me.gapY = parseFloat(this.value);
				progressiveBackgroundGen(me, 0);
			});

			optionsDoc.getElementById('ca-hue-min').addEventListener('input', function (event) {
				me.hueMin = parseFloat(this.value);
				progressiveBackgroundGen(me, 0);
			});

			optionsDoc.getElementById('ca-hue-max').addEventListener('input', function (event) {
				me.hueMax = parseFloat(this.value);
				progressiveBackgroundGen(me, 0);
			});

			optionsDoc.getElementById('ca-stroke').addEventListener('input', function (event) {
				me.strokeIntensity = parseFloat(this.value);
				progressiveBackgroundGen(me, 0);
			});

			optionsDoc.getElementById('ca-start-row').addEventListener('input', function (event) {
				me.startHeight = parseFloat(this.value);
				progressiveBackgroundGen(me, 0);
			});

			optionsDoc.getElementById('ca-end-row').addEventListener('input', function (event) {
				me.endHeight = parseFloat(this.value);
				progressiveBackgroundGen(me, 0);
			});

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

		this.hues = [0, 60, 240];
		this.hueMin = 0;
		this.hueMax = 45;
		this.lightnesses = [0.55, 0.55, 0.55];
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

	CellAutomaton.prototype.setGeneralRule = function (n) {
		const numStates = this.numStates;
		const cubed = numStates ** 3;
		const pow4 = cubed * numStates;
		const transitions = new Array(pow4);
		for (let i = 0; i < cubed; i++) {
			const value = n % numStates;
			transitions[i] = value;
			transitions[cubed + i] = value;
			n = (n - value) / numStates;
		}
		this.transitions = transitions;
		this.history = undefined;
	};

	CellAutomaton.prototype.setTotalisticRule = function (n) {
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
		const pow4 = cubed * numStates;
		const transitions = new Array(pow4);
		for (let i = 0; i < cubed; i++) {
			let value = i;
			let total = 0;
			for (let j = 0; j < 3; j++) {
				let units = value % numStates;
				total += units;
				value = (value - units) / numStates;
			}
			transitions[i] = outputs[total];
		}
		for (let i = cubed; i < pow4; i++) {
			transitions[i] = transitions[i % cubed];
		}
		this.transitions = transitions;
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
			if (this.repeatSeed) {
				j = 0;
			} else {
				return 0;
			}
		} else if (j === this.history.length) {
			j = 0;
		}

		const row = this.history[j];
		const width = row.length;
		if (i === -1) {
			if (this.repeatSeed && j === 0) {
				return this.seed[this.seed.length - 1];	// wrap seed
			} else {
				return row[width - 1];	// wrap row data
			}
		} else if (i === width) {
			if (this.repeatSeed && j === 0) {
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
		const startHeight = this.startHeight;
		const minRow = startHeight === 1 ? gridHeight - 1 : Math.trunc(startHeight * gridHeight);
		const endHeight = this.endHeight;
		const maxRow = endHeight === 1 ? gridHeight - 1 : Math.trunc(endHeight * gridHeight);

		for (let j = history.length; j <= maxRow; j++) {
			const row = new Array(gridWidth);
			for (let i = 0; i < gridWidth; i++) {
				const left = this.getCellValue(i - 1, j - 1);
				const centre = this.history[j - 1][i];
				const right = this.getCellValue(i + 1, j - 1);
				const past = this.getCellValue(i, j - 2);
				const index =
					left +
					centre * numStates +
					right * numStates ** 2 +
					past * numStates ** 3;
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

		for (let j = minRow; j <= maxRow; j++) {
			const y = j * totalHeight;
			for (let i = 0; i < gridWidth; i++) {
				const value = history[j][i];
				if (value !== 0) {
					let neighbourCount = 0;
					neighbourCount += this.getCellValue(i - 1, j - 1) > 0 ? 1 : 0;
					neighbourCount += this.getCellValue(i, j - 1) > 0 ? 1 : 0;
					neighbourCount += this.getCellValue(i + 1, j - 1) > 0 ? 1 : 0;
					neighbourCount += this.getCellValue(i - 1, j) > 0 ? 1 : 0;
					neighbourCount += this.getCellValue(i + 1, j) > 0 ? 1 : 0;
					neighbourCount += this.getCellValue(i - 1, j + 1) > 0 ? 1 : 0;
					neighbourCount += this.getCellValue(i, j + 1) > 0 ? 1 : 0;
					neighbourCount += this.getCellValue(i + 1, j + 1) > 0 ? 1 : 0;

					let hue, saturation;
					if (this.numStates === 2) {
						hue = hueMin + j / (gridHeight - 1) * hueRange;
						saturation = 1 - neighbourCount / 8;
					} else {
						hue = this.hues[value - 1];
						saturation = 1;
					}
					const lightness = this.lightnesses[value - 1];
					const alpha = 1;
					context.fillStyle = hsla(hue, saturation, lightness, alpha);
					const x = i * totalWidth;
					context.fillRect(x, y, cellWidth, cellHeight);
					context.translate(0.5, 0.5);
					context.strokeRect(x, y, cellWidth, cellHeight);
					context.translate(-0.5, -0.5);
				}
			}
		}
	}

	addBgGenerator(CellAutomaton);
}
