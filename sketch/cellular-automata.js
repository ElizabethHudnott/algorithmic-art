function compareNumbers(a, b) {
  return a - b;
}

export default function CellAutomaton() {
	const me = this;
	this.title = 'Cellular Automata';
	this.helpFile = 'help/cellular-automata.html';

	this.optionsDocument = downloadFile('cellular-automata.html', 'document').then(function (optionsDoc) {
		const helpLinks = new Map();
		helpLinks.set('g', 'https://mathworld.wolfram.com/CellularAutomaton.html');
		helpLinks.set('a', 'https://mathworld.wolfram.com/AdditiveCellularAutomaton.html');
		helpLinks.set('c', 'https://en.wikipedia.org/wiki/Cyclic_cellular_automaton');
		helpLinks.set('t', 'https://mathworld.wolfram.com/TotalisticCellularAutomaton.html');

		const ruleTypeInput = optionsDoc.getElementById('ca-type');
		const helpAnchor = optionsDoc.getElementById('ca-help');
		const numStatesInput = optionsDoc.getElementById('ca-num-states');
		const presetInput = optionsDoc.getElementById('ca-preset');
		const memoryOptions = optionsDoc.getElementById('ca-memory');
		const excludeCentreCheck = optionsDoc.getElementById('ca-exclude-centre');
		const weightsSection = $(optionsDoc.getElementById('ca-weights'));
		const weightInputs = optionsDoc.getElementById('ca-weights').querySelectorAll('input');
		const seedInput = optionsDoc.getElementById('ca-seed');
		me.seedInput = seedInput;
		const seedLengthInput = optionsDoc.getElementById('ca-seed-length');
		const seedTypeRows = optionsDoc.getElementById('ca-seed-type');

		function fullRedraw() {
			generateBackground(0);
		}

		me.onclick = function (x, y, canvasWidth, canvasHeight) {
			const totalHeight = me.cellHeight * (1 + me.gapY);
			const borderHeight = me.borderHeight * totalHeight;
			if (y > borderHeight + totalHeight) {
				return;
			}

			const totalWidth = me.cellWidth * (1 + me.gapX);
			let gridWidth = Math.ceil(canvasWidth / totalWidth);
			gridWidth += gridWidth % 2;
			const xOffset = -(gridWidth * totalWidth - canvasWidth) / 2;

			let cellX = Math.trunc((x - xOffset) / totalWidth);
			let seed = parseInt(seedInput.value);
			const {numStates, seedLength} = me;

			if (me.repeatSeed) {
				cellX = cellX % seedLength;
				const logSeed = Math.trunc(Math.log2(seed) / Math.log2(numStates));
				if (cellX <= logSeed) {
					cellX = logSeed - cellX;
					const positionValue = numStates ** cellX;
					const currentValue = Math.trunc(seed / positionValue) % numStates;
					const value = (currentValue + 1) % numStates;
					seed = seed + (value - currentValue) * positionValue;
				}
			}
			me.seed = seed;
			seedInput.value = seed;
			me.history = undefined;
			generateBackground(0);
		}

		function setPreset() {
			const type = ruleTypeInput.value;
			const numStates = me.numStates;
			let number = parseInt(presetInput.value);
			const memoryFunction = queryChecked(memoryOptions, 'ca-memory').value;
			const includeCentre = !excludeCentreCheck.checked || memoryFunction === 'c';
			const neighbourhood =
				5 +
				(includeCentre ? 2 : 0) +
				(memoryFunction === 'n' ? 8 : 0);
			me.neighbourhood = neighbourhood;
			const weights = [
				parseFloat(weightInputs[1].value),	// left
				parseFloat(weightInputs[2].value),	// centre
				parseFloat(weightInputs[3].value),	// right
				parseFloat(weightInputs[0].value)	// past
			];
			for (let i = 0; i <= 3; i++) {
				if (Number.isNaN(weights[i])) {
					weights[i] = 1;
				}
			}
			if (memoryFunction === 'c') {
				weights[1] = weights[3];
			}
			let maxValue;

			switch (type) {
			case 'g': 	// General
				maxValue = numStates ** (numStates ** 3) - 1;
				if (number >= 0) {
					number = number % maxValue;
					me.setGeneralRule(number, memoryFunction);
				}
				break;

			case 'a': 	// Additive
				me.setAdditiveRule(weights, memoryFunction);
				break;

			case 'c': 	// Cyclic
				const numNeighbours = 2 + includeCentre + (memoryFunction === 'n');
				if (!(number < numNeighbours)) {
					number = 1;
					if (this !== presetInput) {
						presetInput.value = '1';
					}
				}
				me.setCyclicRule(number, memoryFunction);
				break;

			case 't': {	// Totalistic
				const numTransitions = numStates ** 4;
				const totalsSet = new Set();
				for (let i = 0; i < numTransitions; i++) {
					const [left, centre, right, past] = me.transitionNumToCellValues(i);
					const total =
						(neighbourhood & 1 ? left * weights[0] : 0) +
						(neighbourhood & 2 ? centre * weights[1] : 0) +
						(neighbourhood & 4 ? right * weights[2] : 0) +
						(neighbourhood & 8 ? past * weights[3] : 0);
					totalsSet.add(total);
				}
				const numDigits = totalsSet.size;
				maxValue = numStates ** numDigits - 1;
				if (number >= 0) {
					number = number % maxValue;
					const totals = Array.from(totalsSet);
					totals.sort(compareNumbers);
					me.setTotalisticRule(number, weights, totals, memoryFunction);
				}
				break;
			}

			default:
				throw new Error('Missing case statement');
			}

			presetInput.disabled = type === 'a';
			weightsSection.collapse(type === 'a' || type === 't' ? 'show' : 'hide');
			weightInputs[0].disabled = memoryFunction === 'i';
			weightInputs[2].disabled = excludeCentreCheck.checked || memoryFunction === 'c';
			generateBackground(0);
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

		numStatesInput.addEventListener('input', function (event) {
			me.numStates = parseInt(this.value);
			setPreset();
		});

		presetInput.addEventListener('input', setPreset);

		for (let element of optionsDoc.querySelectorAll('[name=ca-memory]')) {
			element.addEventListener('input', setPreset);
		}

		excludeCentreCheck.addEventListener('input', setPreset);

		for (let input of weightInputs) {
			input.addEventListener('input', setPreset);
		}

		seedInput.addEventListener('input', function (event) {
			const seed = parseInt(this.value);
			if (seed >= 0) {
				me.seed = seed;
				me.history = undefined;
			}
			generateBackground(0);
		});

		function setSeedLength() {
			const seedType = queryChecked(seedTypeRows, 'ca-seed-type').value;
			let length;
			if (seedType === 'tri') {
				length = 1;
			} else {
				length = parseInt(seedLengthInput.value);
				if (!(length >= 1)) {
					length = 1;
				}
			}
			me.seedLength = length;
			me.history = undefined;
			generateBackground(0);
		};

		seedLengthInput.addEventListener('input', setSeedLength);

		function setSeedType(event) {
			const type = this.value;
			const isRandom = type === 'random' || type === 'all-random';
			const repeated = type === 'repeat' || type === 'random';
			hasRandomness(isRandom);
			if (isRandom) {
				me.seed = undefined;
			} else {
				let seed = parseInt(seedInput.value);
				if (!(seed >= 0)) {
					seed = 1;
				}
				me.seed = seed;
			}
			me.repeatSeed = repeated;
			seedInput.disabled = isRandom;
			seedLengthInput.disabled = !repeated;
			setSeedLength();
		}

		for (let element of seedTypeRows.querySelectorAll('[name=ca-seed-type]')) {
			element.addEventListener('input', setSeedType);
		}

		optionsDoc.getElementById('ca-border-height').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0) {
				me.borderHeight = value;
				me.history = undefined;
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('ca-cell-width').addEventListener('input', function (event) {
			const value = parseInt(this.value);
			if (value >= 1) {
				me.cellWidth = value;
				generateBackground(0);
			}
		});

		optionsDoc.getElementById('ca-cell-height').addEventListener('input', function (event) {
			const value = parseInt(this.value);
			if (value >= 1) {
				me.cellHeight = value;
				generateBackground(0);
			}
		});

		const gapXSlider = optionsDoc.getElementById('ca-gap-x');
		gapXSlider.addEventListener('input', function (event) {
			me.gapX = parseFloat(this.value);
			generateBackground(1);
		});
		gapXSlider.addEventListener('pointerup', fullRedraw);
		gapXSlider.addEventListener('keyup', fullRedraw);

		const gapYSlider = optionsDoc.getElementById('ca-gap-y');
		gapYSlider.addEventListener('input', function (event) {
			me.gapY = parseFloat(this.value);
			generateBackground(1);
		});
		gapYSlider.addEventListener('pointerup', fullRedraw);
		gapYSlider.addEventListener('keyup', fullRedraw);

		optionsDoc.getElementById('ca-hue-min').addEventListener('input', function (event) {
			me.hueMin = parseFloat(this.value);
			generateBackground(0);
		});

		optionsDoc.getElementById('ca-hue-max').addEventListener('input', function (event) {
			me.hueMax = parseFloat(this.value);
			generateBackground(0);
		});

		const strokeSlider = optionsDoc.getElementById('ca-stroke');
		strokeSlider.addEventListener('input', function (event) {
			me.strokeIntensity = parseFloat(this.value);
			generateBackground(1);
		});
		strokeSlider.addEventListener('pointerup', fullRedraw);
		strokeSlider.addEventListener('keyup', fullRedraw);

		const startSlider = optionsDoc.getElementById('ca-start-row');
		startSlider.addEventListener('input', function (event) {
			me.startHeight = parseFloat(this.value);
			generateBackground(1);
		});
		startSlider.addEventListener('pointerup', fullRedraw);
		startSlider.addEventListener('keyup', fullRedraw);

		const endSlider = optionsDoc.getElementById('ca-end-row');
		endSlider.addEventListener('input', function (event) {
			me.endHeight = parseFloat(this.value);
			generateBackground(1);
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

	this.seed = 1;
	this.seedLength = 1;
	this.repeatSeed = false;
	this.cellWidth = 11;
	this.cellHeight = 11;
	this.borderHeight = 1;
	this.gapX = 0;
	this.gapY = 0;
	this.startHeight = 0;
	this.endHeight = 1;

	this.history = undefined;
	this.cachedWidth = undefined;
	this.cachedHeight = undefined;
	this.cachedSeedLength = this.seedLength;
}

CellAutomaton.prototype.animatable = {
	continuous: [
		'borderHeight', 'hueMin', 'hueMax', 'strokeIntensity', 'cellWidth', 'cellHeight',
		'gapX', 'gapY'
	],
	stepped: [
		'seedLength', 'repeatSeed'
	],
	pairedContinuous: [
		['endHeight', 'startHeight']
	]
};

CellAutomaton.prototype.calcSeed = function () {
	let n = this.seed;
	const padLength = this.seedLength;
	const numStates = this.numStates;
	const seed = [];
	if (n === undefined) {
		if (!this.repeatSeed) {
			return undefined;
		}
		for (let i = 0; i < padLength; i++) {
			seed.push(Math.trunc(random.next() * numStates));
		}
	} else {
		do {
			const value = n % numStates;
			seed.push(value);
			n = (n - value) / numStates;
		} while (n > 0);
		seed.reverse();
		for (let i = seed.length; i < padLength; i++) {
			seed[i] = 0;
		}
	}
	return seed;
}

CellAutomaton.prototype.transitionNumToCellValues = function (transitionNum) {
	const numStates = this.numStates;
	const left = transitionNum % numStates;
	transitionNum = (transitionNum - left) / numStates;
	const centre = transitionNum % numStates;
	transitionNum = (transitionNum - centre) / numStates;
	const right = transitionNum % numStates;
	const past = (transitionNum - right) / numStates;
	return [left, centre, right, past];
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
			const [left, centre, right, past] = this.transitionNumToCellValues(i);
			const index =
				(neighbourhood & 1 ? left : 0) +
				(neighbourhood & 2 ? centre * numStates : 0) +
				(neighbourhood & 4 ? right * squared : 0) +
				(neighbourhood & 8 ? past * cubed : 0);
			transitions[i] = transitions[index];
		}
	}
};

CellAutomaton.prototype.setMemoryFunction = function (option) {
	const currentTransitions = this.transitions;
	const numStates = this.numStates;
	const squared = numStates * numStates;
	const cubed = squared * numStates;
	const numTransitions = cubed * numStates;

	switch (option) {
	case 'i': 	// Ignore the memory cell, no further action needed
	case 'n': 	// Treat like a normal neighbour cell, no further action needed
		break;

	case '+': 	// Add the value of the memory cell to the original output.
		for (let i = cubed; i < numTransitions; i++) {
			const past = Math.trunc(i / cubed);
			currentTransitions[i] = (currentTransitions[i % cubed] + past) % numStates;
		}
		this.neighbourhood = this.neighbourhood | 8;
		break;

	case 'c': 	// Substitute the memory cell for the centre cell.
		const newTransitions = new Array(numTransitions);
		for (let i = 0; i < cubed; i++) {
			const [left, centre, right] = this.transitionNumToCellValues(i);
			const index = left + right * squared + centre * cubed;
			newTransitions[index] = currentTransitions[i];
		}
		this.transitions = newTransitions;
		this.neighbourhood = (this.neighbourhood & 5) | 8;
		this.restrictNeighbourhood();
		break;

	default:
		throw new Error('Missing case statement.')
	}

};

CellAutomaton.prototype.setGeneralRule = function (n, memoryFunction) {
	const numStates = this.numStates;
	const squared = numStates * numStates;
	const cubed = squared * numStates;
	const numTransitions = cubed * numStates;
	const transitions = new Array(numTransitions);
	const neighbourhood = this.neighbourhood;
	for (let i = 0; i < numTransitions; i++) {
		const [left, centre, right, past] = this.transitionNumToCellValues(i);
		const index =
			(neighbourhood & 1 ? left : 0) +
			(neighbourhood & 2 ? centre * numStates : 0) +
			(neighbourhood & 4 ? right * squared : 0) +
			(neighbourhood & 8 ? past * cubed : 0);

		if (index === i) {
			const value = n % numStates;
			transitions[i] = value;
			n = (n - value) / numStates;
		} else {
			transitions[i] = transitions[index];
		}
	}
	this.transitions = transitions;
	this.setMemoryFunction(memoryFunction);
	this.history = undefined;
};

CellAutomaton.prototype.setAdditiveRule = function (weights, memoryFunction) {
	const numStates = this.numStates;
	const numTransitions = numStates ** 4;
	const transitions = new Array(numTransitions);
	const neighbourhood = this.neighbourhood;

	for (let i = 0; i < numTransitions; i++) {
		const [left, centre, right, past] = this.transitionNumToCellValues(i);
		let total =
			(neighbourhood & 1 ? left * weights[0] : 0) +
			(neighbourhood & 2 ? centre * weights[1] : 0) +
			(neighbourhood & 4 ? right * weights[2] : 0) +
			(neighbourhood & 8 ? past * weights[3] : 0);
		total = Math.round(total) % numStates;
		if (total < 0) {
			total += numStates;
		}
		transitions[i] = total;
	}

	this.transitions = transitions;
	this.setMemoryFunction(memoryFunction);
	this.history = undefined;
};

CellAutomaton.prototype.setCyclicRule = function (threshold, memoryFunction) {
	const numStates = this.numStates;
	const numTransitions = numStates ** 4;
	const transitions = new Array(numTransitions);
	const neighbourhood = this.neighbourhood;

	for (let i = 0; i < numTransitions; i++) {
		const [left, centre, right, past] = this.transitionNumToCellValues(i);
		const nextState = (centre + 1) % numStates;
		const leftMatch = left === nextState && (neighbourhood & 1);
		const rightMatch = right === nextState && (neighbourhood & 4);
		const pastMatch = past === nextState && (neighbourhood & 8);
		if (leftMatch + rightMatch + pastMatch >= threshold) {
			transitions[i] = nextState;
		} else {
			transitions[i] = centre;
		}
	}
	this.transitions = transitions;
	this.neighbourhood = this.neighbourhood | 2;
	this.setMemoryFunction(memoryFunction);
	this.history = undefined;
};

CellAutomaton.prototype.setTotalisticRule = function (n, weights, totals, memoryFunction) {
	const numStates = this.numStates;
	const outputs = new Array(totals.length);
	outputs.fill(0);
	let i = 0;
	while (n > 0) {
		const value = n % numStates;
		outputs[i] = value;
		n = (n - value) / numStates;
		i++;
	}

	const numTransitions = numStates ** 4;
	const transitions = new Array(numTransitions);
	const neighbourhood = this.neighbourhood;
	for (let i = 0; i < numTransitions; i++) {
		let value = i;
		let total = 0;
		for (let j = 0; j < 4; j++) {
			let units = value % numStates;
			if ((neighbourhood & (1 << j)) !== 0) {
				total += units * weights[j];
			}
			value = (value - units) / numStates;
		}
		transitions[i] = outputs[totals.indexOf(total)];
	}
	this.transitions = transitions;
	this.setMemoryFunction(memoryFunction);
	this.history = undefined;
};

/**
 *	@returns {int[]} The seed used.
 */
CellAutomaton.prototype.generateFirstRow = function (width, height) {
	const row = new Array(width);
	this.history = [row];
	this.cachedWidth = width;
	this.cachedHeight = height;
	this.cachedSeedLength = this.seedLength;
	const seed = this.calcSeed();
	const numStates = this.numStates;

	if (seed === undefined) {
		for (let i = 0; i < width; i++) {
			row[i] = Math.trunc(random.next() * numStates);
		}
		return undefined;
	}
	if (this.seed === undefined) {
		const seedLength = seed.length;
		let n = 0;
		let mult = numStates ** (seedLength - 1);
		for (let i = 0; i < seedLength; i++) {
			n += seed[i] * mult;
			mult /= numStates;
		}
		this.seedInput.value = n;
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
		if (offset2 - offset1 >= seedLength) {
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
	return seed;
}

CellAutomaton.prototype.getCellValue = function (seed, i, j) {
	if (j < 0) {
		if (this.borderHeight > 0) {
			return 0;
		} else {
			j = 0;
		}
	}

	const row = this.history[j];
	const width = row.length;
	if (i === -1) {
		if (seed === undefined) {
			return Math.trunc(random.next() * this.numStates);
		} else if (j === 0 && this.repeatSeed) {
			return seed[seed.length - 1];	// wrap seed
		} else {
			return row[width - 1];	// wrap row data
		}
	} else if (i === width) {
		if (seed === undefined) {
			return Math.trunc(random.next() * this.numStates);
		} if (j === 0 && this.repeatSeed) {
			return seed[(i + 1) % seed.length];	// wrap seed
		} else {
			return row[0];	// wrap row data
		}
	} else {
		return row[i];
	}
}

CellAutomaton.prototype.generate = function* (context, canvasWidth, canvasHeight, preview) {
	let cellWidth = this.cellWidth;
	let cellHeight = this.cellHeight;
	const totalWidth = cellWidth * (1 + this.gapX);
	const totalHeight = cellHeight * (1 + this.gapY);
	const borderHeight = this.borderHeight * totalHeight;
	let gridWidth = Math.ceil(canvasWidth / totalWidth);
	gridWidth += gridWidth % 2;
	const xOffset = -(gridWidth * totalWidth - canvasWidth) / 2;
	const gridHeight = Math.ceil((canvasHeight - borderHeight) / totalHeight);
	let seed;

	if (
		this.history === undefined ||
		this.cachedWidth !== gridWidth ||
		(!this.repeatSeed && this.cachedHeight !== gridHeight) ||
		this.cachedSeedLength !== this.seedLength ||
		this.seed === undefined
	) {
		seed = this.generateFirstRow(gridWidth, gridHeight);
	} else {
		seed = this.calcSeed();
	}

	const history = this.history;
	const numStates = this.numStates;
	const squared = numStates * numStates;
	const cubed = squared * numStates;
	const startHeight = this.startHeight;
	let minRow = startHeight * gridHeight;
	const minCol = Math.trunc((minRow - Math.trunc(minRow)) * gridWidth);
	minRow = Math.trunc(minRow);
	const endHeight = this.endHeight;
	let maxRow = endHeight === 1 ? gridHeight : endHeight * (gridHeight + 1);
	let maxCol = (maxRow - Math.trunc(maxRow)) * gridWidth;
	if (maxCol === 0) {
		maxCol = gridWidth - 1;
	}
	maxCol = Math.trunc(maxCol);
	maxRow = Math.trunc(maxRow);

	for (let j = history.length; j <= maxRow + 1; j++) {
		const row = new Array(gridWidth);
		for (let i = 0; i < gridWidth; i++) {
			const left = this.getCellValue(seed, i - 1, j - 1);
			const centre = this.history[j - 1][i];
			const right = this.getCellValue(seed, i + 1, j - 1);
			const past = this.getCellValue(seed, i, j - 2);
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
	context.strokeStyle = rgba(0, 0, 0, strokeIntensity);
	cellWidth = Math.round(cellWidth);
	cellHeight = Math.round(cellHeight);

	for (let j = minRow; j < maxRow; j++) {
		const y = Math.round(j * totalHeight + borderHeight);
		const firstCol = j === minRow ? minCol : 0;
		const lastCol = j === maxRow - 1 ? maxCol : gridWidth - 1;
		for (let i = firstCol; i <= lastCol; i++) {
			const value = history[j][i];
			if (value !== 0) {
				const x = Math.round(i * totalWidth + xOffset);
				let hue, saturation, lightness;

				if (this.numStates === 2) {
					let neighbourCount = 0;
					neighbourCount += this.getCellValue(seed, i - 1, j - 1) > 0 ? 1 : 0;
					neighbourCount += this.getCellValue(seed, i, j - 1) > 0 ? 1 : 0;
					neighbourCount += this.getCellValue(seed, i + 1, j - 1) > 0 ? 1 : 0;
					neighbourCount += this.getCellValue(seed, i - 1, j) > 0 ? 1 : 0;
					neighbourCount += this.getCellValue(seed, i + 1, j) > 0 ? 1 : 0;
					neighbourCount += this.getCellValue(seed, i - 1, j + 1) > 0 ? 1 : 0;
					neighbourCount += this.getCellValue(seed, i, j + 1) > 0 ? 1 : 0;
					neighbourCount += this.getCellValue(seed, i + 1, j + 1) > 0 ? 1 : 0;

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

						let top = this.getCellValue(seed, i, j - 1);
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

						let left = this.getCellValue(seed, i - 1, j);
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
