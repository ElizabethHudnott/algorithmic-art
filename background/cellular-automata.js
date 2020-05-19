'use strict';

 {
	function compareNumbers(a, b) {
	  return a - b;
	}

	function CellAutomaton() {
		const me = this;
		this.title = 'Cellular Automata';
		this.hasRandomness = true;

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
			const seedLengthInput = optionsDoc.getElementById('ca-seed-length');
			const seedTypeRow = optionsDoc.getElementById('ca-seed-type');

			function fullRedraw() {
				progressiveBackgroundGen(me, 0);
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
				progressiveBackgroundGen(me, 0);
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
				me.history = undefined;
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
		if (j < 0) {
			if (this.borderRow) {
				return 0;
			} else {
				j = 0;
			}
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
			const firstCol = j === minRow ? minCol : 0;
			const lastCol = j === maxRow - 1 ? maxCol : gridWidth - 1;
			for (let i = firstCol; i <= lastCol; i++) {
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
