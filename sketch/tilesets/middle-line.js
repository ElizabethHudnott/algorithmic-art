import {TileType, Tile, BLANK_TILE, coordinateTransform, Placement, tileMapLookup} from './common.js';
const C = 0.551915024494;

class ShapeSet {
	constructor(top, right, bottom, left) {
		if (top) {
			this.topYLeft = top[0];
			this.topYRight = top[1];
			this.topX = top[2] || 0;
		}
		if (right) {
			this.rightXTop = right[0];
			this.rightXBottom = right[1];
			this.rightY = right[2] || 0;
		}
		if (bottom) {
			this.bottomYLeft = bottom[0];
			this.bottomYRight = bottom[1];
			this.bottomX = bottom[2] || 0;
		}
		if (left) {
			this.leftXTop = left[0];
			this.leftXBottom = left[1];
			this.leftY = left[2] || 0;
		}
	}
}

const shapesMap = new Map();
{
	/* 1st digit represents a possible line from the top to the centre.
	 * 2nd digit right to centre, 3rd bottom to centre, 4th left to centre.
	 * Each digit is either 0 if that line is not present, or the sum of the values of the
	 * lines that have the same colour as itself (including itself).
	 * The weights are 1 = line from top to centre has the same colour as the current line,
	 * 2 = line from right to centre, 4 = bottom to centre, 8 = left to centre.
	 * The coordinates are 0 = left or top, 2 = right or bottom, 1 = halfway
	 */
	shapesMap.set('0000', new ShapeSet());
	shapesMap.set('0008', new ShapeSet(null, null, null, [2, 2]));
	shapesMap.set('0200', new ShapeSet(null, [0, 0]));
	shapesMap.set('0040', new ShapeSet(null, null, [0, 0]));
	shapesMap.set('1000', new ShapeSet([2, 2]));
	shapesMap.set('0a0a', new ShapeSet(null, [1, 1], null, [1, 1]));
	shapesMap.set('5050', new ShapeSet([1, 1], null, [1, 1]));
	shapesMap.set('9009', new ShapeSet([0, 0], null, null, [2, 2]));
	shapesMap.set('3300', new ShapeSet([0, 0], [0, 0]));
	shapesMap.set('0660', new ShapeSet(null, [0, 0], [2, 2]));
	shapesMap.set('00cc', new ShapeSet(null, null, [0, 0], [0, 0]));
	shapesMap.set('0208', new ShapeSet(null, [2, 0], null, [2, 0]));
	shapesMap.set('1040', new ShapeSet([2, 0], null, [2, 0]));
	shapesMap.set('1008', new ShapeSet([0, 2], null, null, [0, 2]));
	shapesMap.set('1200', new ShapeSet([2,0], [2, 0]));
	shapesMap.set('0240', new ShapeSet(null, [0, 2], [0, 2]));
	shapesMap.set('0048', new ShapeSet(null, null, [2, 0], [2, 0]));
	shapesMap.set('d0dd', new ShapeSet([1, 1], null, [1, 1], [0, 0, 1]));
	shapesMap.set('7770', new ShapeSet([1, 1], [2, 2, 1], [1, 1]));
	shapesMap.set('bb0b', new ShapeSet([0, 0, 1], [1, 1], null, [1, 1]));
	shapesMap.set('0eee', new ShapeSet(null, [1, 1], [2, 2, 1], [1, 1]));
	shapesMap.set('10cc', new ShapeSet([0, 2], null, [0, 2], [0, 0]));
	shapesMap.set('1660', new ShapeSet([2, 0], [2, 0], [2, 0]));
	shapesMap.set('9209', new ShapeSet([2, 0], [2, 0], null, [0, 0]));
	shapesMap.set('02cc', new ShapeSet(null, [0, 2], [0, 2], [0, 0]));
	shapesMap.set('9049', new ShapeSet([2, 0], null, [2, 0], [0, 0]));
	shapesMap.set('3340', new ShapeSet([0, 0], [0, 2], [0, 2]));
	shapesMap.set('3308', new ShapeSet([0, 0], [0, 2], null, [0, 2]));
	shapesMap.set('0668', new ShapeSet(null, [2, 0], [2, 0], [2, 0]));
	shapesMap.set('5058', new ShapeSet([1, 1], null, [1, 1], [0, 0, 1]));
	shapesMap.set('5250', new ShapeSet([1, 1], [2, 2, 1], [1, 1]));
	shapesMap.set('1a0a', new ShapeSet([0, 0, 1], [1, 1], null, [1, 1]));
	shapesMap.set('0a4a', new ShapeSet(null, [1, 1], [2, 2, 1], [1, 1]));
	shapesMap.set('ffff', new ShapeSet([1, 0, 1], [1, 2, 1], [1, 2, 1], [1, 0, 1]));
	shapesMap.set('d2dd', new ShapeSet([1, 1], [2, 2, 1], [1, 1], [0, 0, 1]));
	shapesMap.set('7778', new ShapeSet([0, 0], [0, 2], [0, 2], [0, 0]));
	shapesMap.set('bb4b', new ShapeSet([0, 0, 1], [1, 1], [2, 2, 1], [1, 1]));
	shapesMap.set('1eee', new ShapeSet([0, 0], [2, 0], [0, 0], [0, 0]));
	shapesMap.set('5a5a', new ShapeSet([1, 1], [2, 2, 1], [1, 1], [0, 0, 1])); // Over-under
	shapesMap.set('5258', new ShapeSet([2, 2], [2, 2], [2, 2], [0, 0]));
	shapesMap.set('9669', new ShapeSet([2, 0], [2, 0], [2, 0], [0, 0]));
	shapesMap.set('33cc', new ShapeSet([0, 2], [0, 2], [0, 2], [0, 0]));
	shapesMap.set('1a4a', new ShapeSet([0, 0, 1], [1, 1], [2, 2, 1], [1, 1]));
	shapesMap.set('1248', new ShapeSet([1, 0, 1], [1, 2, 1], [1, 2, 1], [1, 0, 1]));

	shapesMap.set('9249', new ShapeSet([2, 2], [2, 2], [2, 2], [0, 0]));
	shapesMap.set('12cc', new ShapeSet([0, 0], [2, 2], [0, 0], [0, 0]));
	shapesMap.set('3348', new ShapeSet([2, 2], [2, 2], [2, 2], [0, 0]));
	shapesMap.set('1668', new ShapeSet([0, 0], [0, 2], [0, 2], [0, 0]));

	/* Alternatives with diagonal lines in the centre (V-shaped)
	shapesMap.set('9249', new ShapeSet([2, 0], [1, 2, 1], [1, 2, 1], [0, 0]));
	shapesMap.set('12cc', new ShapeSet([1, 0, 1], [1, 2, 1], [0, 2], [0, 0]));
	shapesMap.set('3348', new ShapeSet([0, 2], [2, 2], [1, 2, 1], [1, 0, 1]));
	shapesMap.set('1668', new ShapeSet([1, 0, 1], [2, 0], [2, 2], [1, 0, 1]));
	*/

	shapesMap.set('1048', new ShapeSet([0, 1], null, [2, 1], [2, 0, 1]));
	shapesMap.set('1240', new ShapeSet([1, 0], [0, 2, 1], [1, 2]));
	shapesMap.set('1208', new ShapeSet([2, 0, 1], [2, 1], null, [0, 1]));
	shapesMap.set('0248', new ShapeSet(null, [1, 2], [0, 2, 1], [1, 0]));
}

export default class MiddleLineTile extends TileType {
	/**
	 * First 4 digits: diagonal lines: upper right quadrant, lower right, lower left, upper left
	 * Second 4 digits: straight lines: up, right, down, left
	 * Ninth digit bits: 1 = upper right, 2 = lower right, 4 = lower left, 8 = upper left
	 * Tenth digit bits: semicircles 1 = above, 2 = right, 4 = down, 8 = left
	 */
	constructor(str, minConnections, maxConnections, checkSpecialConstraints) {
		const connections = new Map();
		const defaultColors = new Map();
		const colorMap = new Map();		// Maps colours to sets of ports
		const usedPorts = new Set();
		// Step 1: Figure out which ports share the same colour.
		// Second four characters represent horizontal and vertical lines
		for (let i = 0; i < 4; i++) {
			const color = parseInt(str[i + 4]);
			if (str[i + 4] !== '0') {
				let mapping = colorMap.get(color);
				if (mapping === undefined) {
					mapping = new Set();
					colorMap.set(color, mapping);
				}
				const source = i * 4 + 2;
				mapping.add(source);
				usedPorts.add(source)
				defaultColors.set(source, color - 1);
			}
		}
		// First four characters represent diagonal lines
		for (let i = 0; i < 4; i++) {
			const color = parseInt(str[i]);
			if (str[i] !== '0') {
				let mapping = colorMap.get(color);
				if (mapping === undefined) {
					mapping = new Set();
					colorMap.set(color, mapping);
				}
				const destination = ((i + 1) * 4 + 2) % 16;
				if (!usedPorts.has(destination)) {
					mapping.add(destination);
					usedPorts.add(destination);
					defaultColors.set(destination, color - 1);
				}
			}
		}
		for (let i = 0; i < 4; i++) {
			const color = parseInt(str[i]);
			if (str[i] !== '0') {
				let mapping = colorMap.get(color);
				const source = i * 4 + 2;
				if (!usedPorts.has(source)) {
					mapping.add(source);
					usedPorts.add(source);
					defaultColors.set(source, color - 1);
				}
			}
		}
		// Step 2: Mark ports with the same colour as connected.
		for (let [color, ports] of colorMap.entries()) {
			const portsIter = ports.values();
			if (ports.size === 1) {
				connections.set(portsIter.next().value, new Set());
			} else {
				let result;
				while ((result = portsIter.next()) && !result.done) {
					const port1 = result.value;
					let destinations = connections.get(port1);
					if (destinations === undefined) {
						destinations = new Set();
						connections.set(port1, destinations);
					}
					for (let port2 of ports) {
						if (port1 !== port2) {
							destinations.add(port2);
						}
					}
				}
			}
		}
		super(connections, minConnections, maxConnections, checkSpecialConstraints);
		this.curved = parseInt(str[8], 16);
		this.stubs = parseInt(str[9], 16);
		this.str = str;
		this.preview = new Tile(this, defaultColors);
	}

	specialConstraintsSatisfied(map, x, y, width, height, minPossibleConnections, maxPossibleConnections, invert) {
		if (maxPossibleConnections !== 2) {
			/* 90 degree condition is either always satisfied or can never be satisfied,
			 * so ignore it.
			 */
			return true;
		}

		const hasUpOutput = this.hasPort(2);
		const hasRightOutput = this.hasPort(6);
		const hasDownOutput = this.hasPort(10);
		const hasLeftOutput = this.hasPort(14);

		if (
			(!hasUpOutput && !hasDownOutput) ||
			(!hasLeftOutput && !hasRightOutput)
		) {
			// Condition can never be satisfied, so ignore it.
			return true;
		}

		let connectedUp = false, connectedRight = false, connectedDown = false, connectedLeft = false;
		let canConnectUp = false, canConnectRight = false, canConnectDown = false, canConnectLeft = false;
		let notConnectedUp = true, notConnectedRight = true, notConnectedDown = true, notConnectedLeft = true;
		let tile, outcome;
		if (hasUpOutput) {
			[tile, outcome] = tileMapLookup(map, x, y - 1, width, height);
			connectedUp = outcome === Placement.TILE && tile.hasPort(10);
			canConnectUp = connectedUp || outcome !== Placement.TILE;
			notConnectedUp = outcome === Placement.EMPTY || (outcome === Placement.TILE && !tile.hasPort(10));
		}
		if (hasRightOutput) {
			[tile, outcome] = tileMapLookup(map, x + 1, y, width, height);
			connectedRight = outcome === Placement.TILE && tile.hasPort(14);
			canConnectRight = connectedRight || outcome !== Placement.TILE;
			notConnectedRight = outcome === Placement.EMPTY || (outcome === Placement.TILE && !tile.hasPort(14));
		}
		if (hasDownOutput) {
			[tile, outcome] = tileMapLookup(map, x, y + 1, width, height);
			connectedDown = outcome === Placement.TILE && tile.hasPort(2);
			canConnectDown = connectedDown || outcome !== Placement.TILE;
			notConnectedDown = outcome === Placement.EMPTY || (outcome === Placement.TILE && !tile.hasPort(2));
		}
		if (hasLeftOutput) {
			[tile, outcome] = tileMapLookup(map, x - 1, y, width, height);
			connectedLeft = outcome === Placement.TILE && tile.hasPort(6);
			canConnectLeft = connectedLeft || outcome !== Placement.TILE;
			notConnectedLeft = outcome === Placement.EMPTY || (outcome === Placement.TILE && !tile.hasPort(6));
		}

		if (!invert) {
			return (canConnectUp || canConnectDown) && (canConnectLeft || canConnectRight);
		}

		if (connectedLeft || connectedRight) {
			return notConnectedUp && notConnectedDown;
		} else if (connectedUp || connectedDown) {
			return notConnectedLeft && notConnectedRight;
		} else {
			return true;
		}
	}

	drawPreview(context, width, height, lineWidth1, lineWidth2, generator) {
		const hMargin = Math.ceil(Math.min(lineWidth2 / 2, width / 8));
		const vMargin = Math.ceil(Math.min(lineWidth1 / 2, height / 8));
		const innerWidth = width - 2 * hMargin;
		const innerHeight = height - 2 * vMargin;
		lineWidth1 = Math.max(Math.round(lineWidth1 * innerWidth / width), 1);
		lineWidth2 = Math.max(Math.round(lineWidth2 * innerHeight / height), 1);
		context.fillStyle = '#999';
		context.fillRect(hMargin, vMargin, innerWidth, innerHeight);
		this.draw(context, this.preview, hMargin, vMargin, innerWidth, innerHeight, lineWidth1, lineWidth2, [0, 0, 0, 0], generator);
	}

	mutate(x, y, previewWidth, previewHeight, lineWidthH, lineWidthV, color) {
		const halfWidth = previewWidth / 2;
		const halfHeight = previewHeight / 2;
		const minH = halfWidth - lineWidthH / 2;
		const maxH = halfWidth + lineWidthH / 2;
		const minV = halfHeight - lineWidthV / 2;
		const maxV = halfHeight + lineWidthV / 2;
		let index;
		if (x >= minH && x <= maxH) {
			index = y < halfHeight ? 4 : 6;
		} else if (y >= minV && y <= maxV) {
			index = x < halfWidth ? 7 : 5;
		} else if (x < halfWidth) {
			index = y < halfHeight ? 3 : 2;
		} else {
			index = y < halfHeight ? 0 : 1;
		}
		const oldStr = this.str;
		let curved = this.curved;
		let stubs = this.stubs;
		// By default transition not present to straight or to a new colour.
		let newChar = String(color + 1);
		if (oldStr[index] !== '0' && oldStr[index] === newChar) {
			if (index < 4) {
				const wasCurved = (curved & (1 << index)) !== 0;
				if (wasCurved) {
					// Transition curved to not present.
					newChar = '0';
					curved = curved - (1 << index);
				} else {
					// Transition straight to curved.
					newChar = oldStr[index];
					curved = curved + (1 << index);
				}
			} else {
				// Transition straight to no present.
				newChar = '0';
			}
		}
		const newStr = oldStr.slice(0, index) + newChar + oldStr.slice(index + 1, 8) +
			curved.toString(16) + stubs.toString(16);
		return new MiddleLineTile(newStr, this.minConnections, this.maxConnections, this.checkSpecialConstraints);
	}

	// Determines the colour of a diagonal line.
	getLineColor(port1, port2, colors) {
		const thisIndex = (port1 - 2) / 4;
		const str = this.str;
		const thisColor = str[thisIndex];
		if (thisColor === '0') {
			return undefined;
		}
		const orth2Index = (thisIndex + 1) % 4 + 4;
		const orth2Color = str[orth2Index];

		if (orth2Color !== '0' && thisColor !== orth2Color) {
			const orth1Index = thisIndex + 4;
			const orth1Color = str[orth1Index];
			const prevDiagonalIndex = (thisIndex + 3) % 4;
			const prevDiagonalColor = str[prevDiagonalIndex];
			if (
				(orth1Color !== '0' && orth1Color !== thisColor) ||
				(orth1Color === '0' && prevDiagonalColor !== '0' && prevDiagonalColor !== thisColor)
			) {
				// Hemmed in at both ends

				const orth3Index = (thisIndex + 2) % 4 + 4;
				const orth3Color = str[orth3Index];
				const nextDiagonalIndex = (thisIndex + 1) % 4;
				const nextDiagonalColor = str[nextDiagonalIndex];
				if (thisColor === orth3Color || (orth3Color === '0' && thisColor === nextDiagonalColor)) {
					return colors.get((orth3Index - 4) * 4 + 2);
				}
				const orth4Index = (thisIndex + 3) % 4 + 4;
				const orth4Color = str[orth4Index];
				const otherDiagonalIndex = (thisIndex + 2) % 4;
				const otherDiagonalColor = str[otherDiagonalIndex];
				if (
					thisColor === orth4Color ||
					(orth4Color === '0' && (thisColor === otherDiagonalColor ||
						(thisColor === prevDiagonalColor && otherDiagonalColor === '0')
					))
				) {
					return colors.get((orth4Index - 4) * 4 + 2);
				}

				return parseInt(thisColor) - 1;

			} else {
				return colors.get(port1);
			}
		} else {
			return colors.get(port2);
		}
	}

	/**
	 * @param {number} lineWidthH The distance from left to right across a vertical line.
	 * @param {number} lineWidthV The distance from top to bottom across a horizontal line.
	 */
	draw(context, tile, left, top, width, height, lineWidthH, lineWidthV, shear, generator, tileMap, cellX, cellY) {
		const transform = coordinateTransform.bind(null, left, top, width, height, shear);
		const CENTRE = Math.trunc(width / 2);
		const MIDDLE = Math.trunc(height / 2);
		const lineWidthLR = lineWidthH / 2;		// Half of the line width left or right
		const lineWidthTB = lineWidthV / 2;		// Half of the line width top or bottom
		const gradient = height / width;
		const gradient2 = (height + lineWidthV) / (width + lineWidthH);

		const overlapX = generator.overlap * (width - lineWidthLR);
		const overlapY = generator.overlap * (height - lineWidthTB);

		const topToRight = this.str[0] !== '0';
		const rightToBottom = this.str[1] !== '0';
		const bottomToLeft = this.str[2] !== '0';
		const leftToTop = this.str[3] !== '0';
		const topToCentre = this.str[4] !== '0';
		const rightToCentre = this.str[5] !== '0';
		const bottomToCentre = this.str[6] !== '0';
		const leftToCentre = this.str[7] !== '0';

		const matchingColors = [0, 0, 0, 0];
		for (let i = 0; i < 4; i++) {
			if (this.str[4 + i] !== '0') {
				const color = tile.getColor(i * 4 + 2);
				for (let j = 0; j < 4; j++) {
					if (this.str[4 + j] !== '0' && tile.getColor(j * 4 + 2) === color) {
						matchingColors[i] += 1 << j
					}
				}
			}
		}
		const shapeStr = matchingColors[0].toString(16) + matchingColors[1].toString(16) +
			matchingColors[2].toString(16) + matchingColors[3].toString(16);
		const shapes = shapesMap.get(shapeStr);

		const LINE_LEFT = CENTRE - lineWidthLR;
		const LINE_RIGHT = CENTRE + lineWidthLR;
		const portionH = [LINE_LEFT, CENTRE, LINE_RIGHT];
		const LINE_TOP = MIDDLE - lineWidthTB;
		const LINE_BOTTOM = MIDDLE + lineWidthTB;
		const portionV = [LINE_TOP, MIDDLE, LINE_BOTTOM];

		if (topToCentre) {
			context.beginPath();
			context.moveTo(...transform(LINE_LEFT, 0));
			context.lineTo(...transform(LINE_LEFT, LINE_TOP));
			context.lineTo(...transform(portionH[shapes.topX], portionV[shapes.topYLeft]));
			context.lineTo(...transform(LINE_RIGHT, portionV[shapes.topYRight]));
			context.lineTo(...transform(LINE_RIGHT, 0));
			const color = tile.getColor(2);
			if (
				(this.stubs & 1) === 1 &&
				(tileMap === undefined || (cellY > 0 && !tileMap[cellY - 1][cellX].hasPort(10)))
			) {
				if ((this.curved & 1) === 0 && tile.getLineColor(2, 6) === color) {
					// Top-to-right has the same colour.
					if ((this.curved & 8) === 0 && tile.getLineColor(14, 2) === color) {
						// Left-to-top has the same colour too.
						context.arcTo(
							...transform(CENTRE, -gradient2 * lineWidthLR),
							...transform(LINE_LEFT, 0),
							lineWidthLR
						);
					} else {
						context.arcTo(
							...transform(LINE_LEFT, -gradient2 * lineWidthH),
							...transform(LINE_LEFT, 0),
							lineWidthLR
						);
					}
				} else if ((this.curved & 8) === 0 && tile.getLineColor(14, 2) === color) {
					// Left-to-top has the same colour.
					context.arcTo(
						...transform(LINE_RIGHT, -gradient2 * lineWidthH),
						...transform(LINE_LEFT, 0),
						lineWidthLR
					);
				} else {
					context.bezierCurveTo(
						...transform(LINE_RIGHT, -C * overlapY),
						...transform(CENTRE + C * lineWidthLR, -overlapY),
						...transform(CENTRE, -overlapY)
					);
					context.bezierCurveTo(
						...transform(CENTRE - C * lineWidthLR, -overlapY),
						...transform(LINE_LEFT, -C * overlapY),
						...transform(LINE_LEFT, 0)
					);
				}
			}
			context.fillStyle = generator.getColor(color);
			context.fill();
		}

		if (bottomToCentre) {
			context.beginPath();
			context.moveTo(...transform(LINE_LEFT, height));
			context.lineTo(...transform(LINE_LEFT, LINE_BOTTOM));
			context.lineTo(...transform(portionH[shapes.bottomX], portionV[shapes.bottomYLeft]));
			context.lineTo(...transform(LINE_RIGHT, portionV[shapes.bottomYRight]));
			context.lineTo(...transform(LINE_RIGHT, height));
			const color = tile.getColor(10);
			if (
				(this.stubs & 4) === 4 &&
				(tileMap === undefined || (cellY < tileMap.length - 1 && !tileMap[cellY + 1][cellX].hasPort(2)))
			) {
				if ((this.curved & 4) === 0 && tile.getLineColor(10, 14) === color) {
					// Bottom-to-left has the same colour.
					if ((this.curved & 2) === 0 && tile.getLineColor(6, 10) === color) {
						// Right-to-bottom has the same colour too.
						context.arcTo(
							...transform(CENTRE, height + gradient2 * lineWidthLR),
							...transform(LINE_LEFT, height),
							lineWidthLR
						);
					} else {
						context.arcTo(
							...transform(LINE_RIGHT, height + gradient2 * lineWidthH),
							...transform(LINE_LEFT, height),
							lineWidthLR
						);
					}
				} else if ((this.curved & 2) === 0 && tile.getLineColor(6, 10) === color) {
					// Right-to-bottom has the same colour.
					context.arcTo(
						...transform(LINE_LEFT, height + gradient2 * lineWidthH),
						...transform(LINE_LEFT, height),
						lineWidthLR
					);
				} else {
					context.bezierCurveTo(
						...transform(LINE_RIGHT, height + C * overlapY),
						...transform(CENTRE + C * lineWidthLR, height + overlapY),
						...transform(CENTRE, height + overlapY)
					);
					context.bezierCurveTo(
						...transform(CENTRE - C * lineWidthLR, height + overlapY),
						...transform(LINE_LEFT, height + C * overlapY),
						...transform(LINE_LEFT, height)
					);
				}
			}
			context.fillStyle = generator.getColor(color);
			context.fill();
		}

		if (leftToCentre) {
			context.beginPath();
			context.moveTo(...transform(0, LINE_TOP));
			context.lineTo(...transform(LINE_LEFT, LINE_TOP));
			context.lineTo(...transform(portionH[shapes.leftXTop], portionV[shapes.leftY]));
			context.lineTo(...transform(portionH[shapes.leftXBottom], LINE_BOTTOM));
			context.lineTo(...transform(0, LINE_BOTTOM));
			const color = tile.getColor(14);
			if (
				(this.stubs & 8) === 8 &&
				(tileMap === undefined || (cellX > 0 && !tileMap[cellY][cellX - 1].hasPort(6)))
			) {
				if ((this.curved & 8) === 0 && tile.getLineColor(14, 2) === color) {
					// Left-to-top has the same colour.
					if ((this.curved & 4) === 0 && tile.getLineColor(10, 14) === color) {
						// Bottom-to-left has the same colour too.
						context.arcTo(
							...transform(-lineWidthTB / gradient2, MIDDLE),
							...transform(0, LINE_TOP),
							lineWidthTB
						);
					} else {
						context.arcTo(
							...transform(-lineWidthV / gradient2, LINE_BOTTOM),
							...transform(0, LINE_TOP),
							lineWidthTB
						);
					}
				} else if ((this.curved & 4) === 0 && tile.getLineColor(10, 14) === color) {
					// Bottom-to-left has the same colour.
					context.arcTo(
						...transform(-lineWidthV / gradient2, LINE_TOP),
						...transform(0, LINE_TOP),
						lineWidthTB
					);
				} else {
					context.bezierCurveTo(
						...transform(-C * overlapX, LINE_BOTTOM),
						...transform(-overlapX, MIDDLE + C * lineWidthTB),
						...transform(-overlapX, MIDDLE)
					);
					context.bezierCurveTo(
						...transform(-overlapX, MIDDLE - C * lineWidthTB),
						...transform(-C * overlapX, LINE_TOP),
						...transform(0, LINE_TOP)
					);
				}
			}
			context.fillStyle = generator.getColor(color);
			context.fill();
		}

		if (rightToCentre) {
			context.beginPath();
			context.moveTo(...transform(width, LINE_TOP));
			context.lineTo(...transform(LINE_RIGHT, LINE_TOP));
			context.lineTo(...transform(portionH[shapes.rightXTop], portionV[shapes.rightY]));
			context.lineTo(...transform(portionH[shapes.rightXBottom], LINE_BOTTOM));
			context.lineTo(...transform(width, LINE_BOTTOM));
			const color = tile.getColor(6);
			if (
				(this.stubs & 2) === 2 &&
				(tileMap === undefined || (cellX < tileMap[0].length - 1 && !tileMap[cellY][cellX + 1].hasPort(14)))
			) {
				if ((this.curved & 2) === 0 && tile.getLineColor(6, 10) === color) {
					// Right-to-bottom has the same colour.
					if ((this.curved & 1) === 0 && tile.getLineColor(2, 6) === color) {
						// Top-to-right has the same colour too.
						context.arcTo(
							...transform(width + lineWidthTB / gradient2, MIDDLE),
							...transform(width, LINE_TOP),
							lineWidthTB
						);
					} else {
						context.arcTo(
							...transform(width + lineWidthV / gradient2, LINE_TOP),
							...transform(width, LINE_TOP),
							lineWidthTB
						);
					}
				} else if ((this.curved & 1) === 0 && tile.getLineColor(2, 6) === color) {
					// Top-to-right has the same colour.
					context.arcTo(
						...transform(width + lineWidthV / gradient2, LINE_BOTTOM),
						...transform(width, LINE_TOP),
						lineWidthTB
					);
				} else {
					context.bezierCurveTo(
						...transform(width + C * overlapX, LINE_BOTTOM),
						...transform(width + overlapX, MIDDLE + C * lineWidthTB),
						...transform(width + overlapX, MIDDLE)
					);
					context.bezierCurveTo(
						...transform(width + overlapX, MIDDLE - C * lineWidthTB),
						...transform(width + C * overlapX, LINE_TOP),
						...transform(width, LINE_TOP)
					);
				}
			}
			context.fillStyle = generator.getColor(color);
			context.fill();
		}

		if (leftToTop) {
			context.beginPath();
			context.moveTo(...transform(0, LINE_TOP));
			const [x, y] = transform(LINE_LEFT, 0);
			if ((this.curved & 8) === 8) {
				context.bezierCurveTo(
					...transform(C * LINE_LEFT, LINE_TOP),
					...transform(LINE_LEFT, C * LINE_TOP),
					x, y
				);
				context.lineTo(...transform(LINE_RIGHT, 0));
				context.bezierCurveTo(
					...transform(LINE_RIGHT, C * LINE_BOTTOM),
					...transform(C * LINE_RIGHT, LINE_BOTTOM),
					...transform(0, LINE_BOTTOM)
				);
			} else {
				context.lineTo(x, y);
				if (topToCentre) {
					context.lineTo(...transform(LINE_LEFT, lineWidthH * gradient));
				} else {
					context.lineTo(...transform(LINE_RIGHT, 0));
				}
				if (leftToCentre) {
					context.lineTo(...transform(lineWidthV / gradient, LINE_TOP));
				} else if (bottomToLeft) {
					context.lineTo(...transform((lineWidthV / 2) / gradient2, MIDDLE));
				} else {
					context.lineTo(...transform(0, LINE_BOTTOM));
				}
			}
			context.fillStyle = generator.getColor(tile.getLineColor(14, 2));
			context.fill();
		}

		if (bottomToLeft) {
			context.beginPath();
			context.moveTo(...transform(LINE_LEFT, height));
			const [x, y] = transform(0, LINE_BOTTOM);
			if ((this.curved & 4) === 4) {
				context.bezierCurveTo(
					...transform(LINE_LEFT, height - C * (height / 2 - lineWidthTB)),
					...transform(C * LINE_LEFT, LINE_BOTTOM),
					x, y
				);
				context.lineTo(...transform(0, LINE_TOP));
				context.bezierCurveTo(
					...transform(C * LINE_RIGHT, LINE_TOP),
					...transform(LINE_RIGHT, height - C * (height / 2 + lineWidthTB)),
					...transform(LINE_RIGHT, height),
				);
			} else {
				context.lineTo(x, y);
				if (leftToCentre) {
					context.lineTo(...transform(lineWidthV / gradient, LINE_BOTTOM));
				} else {
					context.lineTo(...transform(0, LINE_TOP));
				}
				if (bottomToCentre) {
					context.lineTo(...transform(LINE_LEFT, height - lineWidthH * gradient));
				} else if (rightToBottom) {
					context.lineTo(...transform(CENTRE, height - lineWidthH / 2 * gradient2));
				} else {
					context.lineTo(...transform(LINE_RIGHT, height));
				}
			}
			context.fillStyle = generator.getColor(tile.getLineColor(10, 14));
			context.fill();
		}

		if (rightToBottom) {
			context.beginPath();
			context.moveTo(...transform(width, LINE_BOTTOM));
			const [x, y] = transform(LINE_RIGHT, height);
			if ((this.curved & 2) === 2) {
				context.bezierCurveTo(
					...transform(width - C * (width / 2 - lineWidthLR), LINE_BOTTOM),
					...transform(LINE_RIGHT, height - C * (height / 2 - lineWidthTB)),
					x, y
				);
				context.lineTo(...transform(LINE_LEFT, height));
				context.bezierCurveTo(
					...transform(LINE_LEFT, height - C * (height / 2 + lineWidthTB)),
					...transform(width - C * (width / 2 + lineWidthLR), LINE_TOP),
					...transform(width, LINE_TOP)
				);
			} else {
				context.lineTo(x, y);
				if (bottomToCentre) {
					context.lineTo(...transform(LINE_RIGHT, height - lineWidthH * gradient));
				} else {
					context.lineTo(...transform(LINE_LEFT, height));
				}
				if (rightToCentre) {
					context.lineTo(...transform(width - lineWidthV / gradient, LINE_BOTTOM));
				} else if (topToRight) {
					context.lineTo(...transform(width - (lineWidthV / 2) / gradient2, MIDDLE));
				} else {
					context.lineTo(...transform(width, LINE_TOP));
				}
			}
			context.fillStyle = generator.getColor(tile.getLineColor(6, 10));
			context.fill();
		}

		if (topToRight) {
			context.beginPath()
			context.moveTo(...transform(LINE_RIGHT, 0));
			const [x, y] = transform(width, LINE_TOP);
			if ((this.curved & 1) === 1) {
				context.bezierCurveTo(
					...transform(LINE_RIGHT, C * LINE_TOP),
					...transform(width - C * (width / 2 - lineWidthLR), LINE_TOP),
					x, y
				);
				context.lineTo(...transform(width, LINE_BOTTOM));
				context.bezierCurveTo(
					...transform(width - C * (width / 2 + lineWidthLR), LINE_BOTTOM),
					...transform(LINE_LEFT, C * LINE_BOTTOM),
					...transform(LINE_LEFT, 0)
				);
			} else {
				context.lineTo(x, y);
				if (rightToCentre) {
					context.lineTo(...transform(width - lineWidthV / gradient, LINE_TOP));
				} else {
					context.lineTo(...transform(width, LINE_BOTTOM));
				}
				if (topToCentre) {
					context.lineTo(...transform(LINE_RIGHT, lineWidthH * gradient));
				} else if (leftToTop) {
					context.lineTo(...transform(CENTRE, lineWidthH / 2 * gradient2));
				} else {
					context.lineTo(...transform(LINE_LEFT, 0));
				}
			}
			context.fillStyle = generator.getColor(tile.getLineColor(2, 6));
			context.fill();
		}

	}

}
