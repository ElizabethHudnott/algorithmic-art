'use strict';

 {

	function CellAutomaton() {
		const me = this;
		this.title = 'Cellular Automata';
		this.hasRandomness = true;

		/*
		this.optionsDocument = downloadFile('cellular-automata.html', 'document').then(function (optionsDoc) {

			return optionsDoc;
		});
		*/

		const transitions = new Array(16);
		transitions.fill(0);
		transitions[1] = 1;
		transitions[4] = 1;
		transitions[9] = 1;
		transitions[12] = 1;
		this.transitions = transitions;
		this.numStates = 2;

		this.colors = [
			'#ff0000'
		];

		this.seed = [1];
		this.repeatSeed = false;
		this.cellWidth = 12;
		this.cellHeight = 12;

		this.history = undefined;
		this.cachedWidth = undefined;
		this.cachedHeight = undefined;
		this.tween = 1;
	}

	CellAutomaton.prototype.animatable = {
	};

	CellAutomaton.prototype.setSeed = function (n, padLength) {
		const numStates = this.numStates;
		const seed = [];
		while (n > 0) {
			const value = n % numStates;
			seed.push(value);
			n = (n - value) / numStates;
		}
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

	CellAutomaton.prototype.generate = function* (context, canvasWidth, canvasHeight, preview) {
		const cellWidth = this.cellWidth;
		const cellHeight = this.cellHeight;
		const gridWidth = Math.trunc(canvasWidth / cellWidth);
		const emptyTopRow = !this.repeatSeed && this.seed !== undefined;
		const gridHeight = Math.ceil(canvasHeight / cellHeight) - emptyTopRow;
		context.translate(
			(canvasWidth - gridWidth * cellWidth) / 2 + 0.5,
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
		const maxRow = Math.ceil(this.tween * gridHeight);

		for (let j = history.length; j < maxRow; j++) {
			const lastRow = history[j - 1];
			const row = new Array(gridWidth);
			for (let i = 0; i < gridWidth; i++) {
				let left, centre, right, past;
				if (i === 0) {
					if (this.repeatSeed && j === 1) {
						left = this.seed[this.seed.length - 1];
					} else {
						left = lastRow[gridWidth - 1];
					}
				} else {
					left = lastRow[i - 1];
				}
				centre = lastRow[i];
				if (i === gridWidth - 1) {
					if (this.repeatSeed && j === 1) {
						right = this.seed[(i + 1) % this.seed.length];
					} else {
						right = lastRow[0];
					}
				} else {
					right = lastRow[i + 1];
				}
				if (j === 1) {
					if (this.repeatSeed) {
						past = centre;
					} else {
						past = 0;
					}
				} else {
					past = history[j - 2][i];
				}
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
					const x = i * cellWidth;
					context.fillStyle = this.colors[value - 1];
					context.fillRect(x, y, cellWidth, cellHeight);
					context.strokeRect(x, y, cellWidth, cellHeight);
				}
			}
		}
	}

	addBgGenerator(CellAutomaton);
}
