'use strict';

 {

	function CellAutomaton() {
		const me = this;
		this.title = 'Cellular Automata';
		this.hasRandomness = true;

		this.optionsDocument = downloadFile('cellular-automata.html', 'document').then(function (optionsDoc) {

			const presetInput = optionsDoc.getElementById('ca-preset');
			const seedInput = optionsDoc.getElementById('ca-seed');
			const seedLengthInput = optionsDoc.getElementById('ca-seed-length');
			const seedTypeRow = optionsDoc.getElementById('ca-seed-type');

			function setPreset() {
				const number = parseInt(presetInput.value);
				if (number >= 0 && number <= 255) {
					me.setElementaryRule(number);
					progressiveBackgroundGen(me, 0);
				}
			}
			presetInput.addEventListener('input', setPreset);

			function setSeed() {
				let seed = parseInt(seedInput.value);
				if (!(seed >= 0)) {
					seed = me.seed;
				}
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

		this.hues = [0];
		this.lightnesses = [0.5];

		this.seed = [1];
		this.repeatSeed = false;
		this.cellWidth = 12;
		this.cellHeight = 12;

		this.history = undefined;
		this.cachedWidth = undefined;
		this.cachedHeight = undefined;
		//this.tween = 1;
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

	CellAutomaton.prototype.setElementaryRule = function (n) {
		const transitions = new Array(16);
		for (let i = 0; i < 8; i++) {
			const value = n & 1;
			transitions[i] = value;
			transitions[8 + i] = value;
			n = n >>> 1;
		}
		this.transitions = transitions;
		this.numStates = 2;
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
		const gridWidth = Math.trunc(canvasWidth / cellWidth);
		const emptyTopRow = !this.repeatSeed && this.seed !== undefined;
		const gridHeight = Math.ceil(canvasHeight / cellHeight) - emptyTopRow;
		context.translate(
			Math.trunc((canvasWidth - gridWidth * cellWidth) / 2) + 0.5,
			(emptyTopRow ? cellHeight : 0) + 0.5
		);


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
		const tween = 1;
		const maxRow = Math.ceil(tween * gridHeight);

		for (let j = history.length; j < maxRow; j++) {
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

		for (let j = 0; j < maxRow - 1; j++) {
			const y = j * cellHeight;
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

					const hue = this.hues[value - 1];
					const saturation = 1 - neighbourCount / 8;
					const lightness = this.lightnesses[value - 1];
					const alpha = 1;
					context.fillStyle = hsla(hue, saturation, lightness, alpha);
					const x = i * cellWidth;
					context.fillRect(x, y, cellWidth, cellHeight);
					context.strokeRect(x, y, cellWidth, cellHeight);
				}
			}
		}
	}

	addBgGenerator(CellAutomaton);
}
