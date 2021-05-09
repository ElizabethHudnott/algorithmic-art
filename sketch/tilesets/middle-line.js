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
	shapesMap.set('0a0a', new ShapeSet(null, [2, 2], null, [2, 2]));
	shapesMap.set('5050', new ShapeSet([2, 2], null, [2, 2]));
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
	shapesMap.set('d0dd', new ShapeSet([2, 2], null, [2, 2], [0, 0]));
	shapesMap.set('7770', new ShapeSet([2, 2], [2, 2], [2, 2]));
	shapesMap.set('bb0b', new ShapeSet([2, 2], [2, 2], null, [0, 0]));
	shapesMap.set('0eee', new ShapeSet(null, [2, 2], [0, 0], [0, 0]));
	shapesMap.set('10cc', new ShapeSet([0, 2], null, [0, 2], [0, 0]));
	shapesMap.set('1660', new ShapeSet([2, 0], [2, 2], [2, 0]));
	shapesMap.set('9209', new ShapeSet([2, 0], [2, 0], null, [0, 0]));
	shapesMap.set('02cc', new ShapeSet(null, [0, 2], [0, 2], [0, 0]));
	shapesMap.set('9049', new ShapeSet([2, 0], null, [2, 0], [0, 0]));
	shapesMap.set('3340', new ShapeSet([0, 2], [2, 2], [0, 2]));
	shapesMap.set('3308', new ShapeSet([0, 2], [2, 2], null, [0, 2]));
	shapesMap.set('0668', new ShapeSet(null, [2, 2], [2, 0], [2, 0]));
	shapesMap.set('5058', new ShapeSet([2, 2], null, [2, 2], [0, 0]));
	shapesMap.set('5250', new ShapeSet([2, 2], [2, 2], [2, 2]));
	shapesMap.set('1a0a', new ShapeSet([0, 0], [2, 2], null, [2, 2]));
	shapesMap.set('0a4a', new ShapeSet(null, [2, 2], [2, 2], [2, 2]));
	const cross = new ShapeSet([2, 2], [2, 2], [2, 2], [0, 0]);
	shapesMap.set('ffff', cross);
	shapesMap.set('d2dd', cross);
	shapesMap.set('7778', cross);
	shapesMap.set('bb4b', cross);
	shapesMap.set('1eee', new ShapeSet([0, 0], [2, 2], [0, 0], [0, 0]));
	shapesMap.set('5a5a', cross); // Over-under
	shapesMap.set('5258', cross);
	shapesMap.set('9669', new ShapeSet([2, 0], [2, 0], [2, 2], [0, 0]));
	shapesMap.set('33cc', new ShapeSet([0, 2], [2, 2], [0, 2], [0, 0]));
	shapesMap.set('1a4a', new ShapeSet([0, 0], [2, 2], [2, 2], [2, 2]));
	shapesMap.set('1248', new ShapeSet([1, 0, 1], [1, 2, 1], [1, 2, 1], [1, 0, 1]));

	shapesMap.set('9249', new ShapeSet([2, 2], [2, 2], [2, 2], [0, 0]));
	shapesMap.set('12cc', new ShapeSet([0, 0], [2, 2], [0, 0], [0, 0]));
	shapesMap.set('3348', new ShapeSet([2, 2], [2, 2], [2, 2], [0, 0]));
	shapesMap.set('1668', new ShapeSet([0, 0], [2, 2], [0, 0], [0, 0]));

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

class MiddleLineTile extends TileType {
	/**
	 * First 4 digits: diagonal lines: upper right quadrant, lower right, lower left, upper left
	 * Second 4 digits: straight lines: up, right, down, left
	 * Ninth digit bits: 1 = upper right, 2 = lower right, 4 = lower left, 8 = upper left
	 */
	constructor(str, minConnections, maxConnections, checkSpecialConstraints) {
		const connections = new Map();
		const defaultColors = new Map();
		const colorMap = new Map();
		const usedPorts = new Set();
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
				const source = i * 4 + 2;
				if (!usedPorts.has(source)) {
					mapping.add(source);
					usedPorts.add(source);
					defaultColors.set(source, color - 1);
				}
				const destination = ((i + 1) * 4 + 2) % 16;
				if (!usedPorts.has(destination)) {
					mapping.add(destination);
					usedPorts.add(destination);
					defaultColors.set(destination, color - 1);
				}
			}
		}
		for (let [color, ports] of colorMap.entries()) {
			for (let port1 of ports) {
				if (ports.size === 1) {
					connections.set(port1, new Set());
				} else {
					for (let port2 of ports) {
						if (port1 !== port2) {
							let destinations = connections.get(port1);
							if (destinations === undefined) {
								destinations = new Set();
								connections.set(port1, destinations);
							}
							destinations.add(port2);
						}
					}
				}
			}
		}
		super(connections, minConnections, maxConnections, checkSpecialConstraints);
		this.curved = parseInt(str[8], 16);
		this.str = str;
		this.preview = new Tile(this, defaultColors);
	}

	specialConstraintsSatisfied(map, x, y, width, height, minPossibleConnections, maxPossibleConnections) {
		const hasUpOutput = this.hasPort(2);
		const hasRightOutput = this.hasPort(6);
		const hasDownOutput = this.hasPort(10);
		const hasLeftOutput = this.hasPort(14);

		if (
			this.minConnections < 2 ||
			(!hasUpOutput && !hasDownOutput) ||
			(!hasLeftOutput && !hasRightOutput)
		) {
			return true;
		}

		let connectedUp = false, connectedRight = false, connectedDown = false, connectedLeft = false;
		let tile, outcome;
		if (hasUpOutput) {
			[tile, outcome] = tileMapLookup(map, x, y - 1, width, height);
			connectedUp = outcome !== Placement.TILE || tile.hasPort(10);
		}
		if (hasRightOutput) {
			[tile, outcome] = tileMapLookup(map, x + 1, y, width, height);
			connectedRight = outcome !== Placement.TILE || tile.hasPort(14);
		}
		if (hasDownOutput) {
			[tile, outcome] = tileMapLookup(map, x, y + 1, width, height);
			connectedDown = outcome !== Placement.TILE || tile.hasPort(2);
		}
		if (hasLeftOutput) {
			[tile, outcome] = tileMapLookup(map, x - 1, y, width, height);
			connectedLeft = outcome !== Placement.TILE || tile.hasPort(6);
		}
		return (connectedUp || connectedDown) && (connectedLeft || connectedRight);
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
		let curved = this.curved;
		// By default transition not present to straight or to a new colour.
		let newChar = String(color + 1);
		if (this.str[index] !== '0' && this.str[index] === newChar) {
			if (index < 4) {
				const wasCurved = (curved & (1 << index)) !== 0;
				if (wasCurved) {
					// Transition curved to not present.
					newChar = '0';
					curved = curved - (1 << index);
				} else {
					// Transition straight to curved.
					newChar = this.str[index];
					curved = curved + (1 << index);
				}
			} else {
				// Transition straight to not present.
				newChar = '0';
			}
		}
		const newStr = this.str.slice(0, index) + newChar + this.str.slice(index + 1, 8) + curved.toString(16) + this.str.slice(9);
		return new MiddleLineTile(newStr, this.minConnections, this.maxConnections, this.checkSpecialConstraints);
	}

	getLineColor(port1, port2, colors) {
		const index1 = (port1 - 2) / 4;
		const index2 = index1 + 4;
		const index3 = (index1 + 3) % 4;
		const str = this.str;
		const designColor1 = str[index1];
		const designColor2 = str[index2];
		const designColor3 = str[index3];
		if (
			(designColor2 !== '0' && designColor2 !== designColor1) ||
			(designColor3 !== '0' && designColor3 !== designColor1)
		) {
			return colors.get(port2);
		} else {
			return colors.get(port1);
		}
	}

	/**
	 * @param {number} lineWidthH The distance from left to right across a vertical line.
	 * @param {number} lineWidthV The distance from top to bottom across a horizontal line.
	 */
	draw(context, tile, left, top, width, height, lineWidthH, lineWidthV, shear, generator) {
		const transform = coordinateTransform.bind(null, left, top, width, height, shear);
		const CENTRE = Math.trunc(width / 2);
		const MIDDLE = Math.trunc(height / 2);
		const lineWidthL = Math.trunc(lineWidthH / 2);
		const lineWidthR = Math.ceil(lineWidthH / 2);
		const lineWidthT = Math.trunc(lineWidthV / 2);
		const lineWidthB = Math.ceil(lineWidthV / 2);
		const gradient = height / width;
		const gradient2 = (height + lineWidthV) / (width + lineWidthH);

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

		const LINE_LEFT = CENTRE - lineWidthL;
		const LINE_RIGHT = CENTRE + lineWidthR;
		const portionH = [LINE_LEFT, CENTRE, LINE_RIGHT];
		const LINE_TOP = MIDDLE - lineWidthT;
		const LINE_BOTTOM = MIDDLE + lineWidthB;
		const portionV = [LINE_TOP, MIDDLE, LINE_BOTTOM];

		if (topToCentre) {
			context.beginPath();
			context.moveTo(...transform(LINE_LEFT, 0));
			context.lineTo(...transform(LINE_LEFT, LINE_TOP));
			context.lineTo(...transform(portionH[shapes.topX], portionV[shapes.topYLeft]));
			context.lineTo(...transform(LINE_RIGHT, portionV[shapes.topYRight]));
			context.lineTo(...transform(LINE_RIGHT, 0));
			context.fillStyle = generator.getColor(tile.getColor(2));
			context.fill();
		}

		if (bottomToCentre) {
			context.beginPath();
			context.moveTo(...transform(LINE_LEFT, height));
			context.lineTo(...transform(LINE_LEFT, LINE_BOTTOM));
			context.lineTo(...transform(portionH[shapes.bottomX], portionV[shapes.bottomYLeft]));
			context.lineTo(...transform(LINE_RIGHT, portionV[shapes.bottomYRight]));
			context.lineTo(...transform(LINE_RIGHT, height));
			context.fillStyle = generator.getColor(tile.getColor(10));
			context.fill();
		}

		if (leftToCentre) {
			context.beginPath();
			context.moveTo(...transform(0, LINE_TOP));
			context.lineTo(...transform(LINE_LEFT, LINE_TOP));
			context.lineTo(...transform(portionH[shapes.leftXTop], portionV[shapes.leftY]));
			context.lineTo(...transform(portionH[shapes.leftXBottom], LINE_BOTTOM));
			context.lineTo(...transform(0, LINE_BOTTOM));
			context.fillStyle = generator.getColor(tile.getColor(14));
			context.fill();
		}

		if (rightToCentre) {
			context.beginPath();
			context.moveTo(...transform(width, LINE_TOP));
			context.lineTo(...transform(LINE_BOTTOM, LINE_TOP));
			context.lineTo(...transform(portionH[shapes.rightXTop], portionV[shapes.rightY]));
			context.lineTo(...transform(portionH[shapes.rightXBottom], LINE_BOTTOM));
			context.lineTo(...transform(width, LINE_BOTTOM));
			context.fillStyle = generator.getColor(tile.getColor(6));
			context.fill();
		}

		if (topToRight) {
			context.beginPath()
			context.moveTo(...transform(LINE_RIGHT, 0));
			const [x, y] = transform(width, LINE_TOP);
			if ((this.curved & 1) === 1) {
				context.bezierCurveTo(
					...transform(LINE_RIGHT, C * LINE_TOP),
					...transform(width - C * (width / 2 - lineWidthR), LINE_TOP),
					x, y
				);
				context.lineTo(...transform(width, LINE_BOTTOM));
				context.bezierCurveTo(
					...transform(width - C * (width / 2 + lineWidthL), LINE_BOTTOM),
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

		if (rightToBottom) {
			context.beginPath();
			context.moveTo(...transform(width, LINE_BOTTOM));
			const [x, y] = transform(LINE_RIGHT, height);
			if ((this.curved & 2) === 2) {
				context.bezierCurveTo(
					...transform(width - C * (width / 2 - lineWidthR), LINE_BOTTOM),
					...transform(LINE_RIGHT, height - C * (height / 2 - lineWidthB)),
					x, y
				);
				context.lineTo(...transform(LINE_LEFT, height));
				context.bezierCurveTo(
					...transform(LINE_LEFT, height - C * (height / 2 + lineWidthT)),
					...transform(width - C * (width / 2 + lineWidthL), LINE_TOP),
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

		if (bottomToLeft) {
			context.beginPath();
			context.moveTo(...transform(LINE_LEFT, height));
			const [x, y] = transform(0, LINE_BOTTOM);
			if ((this.curved & 4) === 4) {
				context.bezierCurveTo(
					...transform(LINE_LEFT, height - C * (height / 2 - lineWidthB)),
					...transform(C * LINE_LEFT, LINE_BOTTOM),
					x, y
				);
				context.lineTo(...transform(0, LINE_TOP));
				context.bezierCurveTo(
					...transform(C * LINE_RIGHT, LINE_TOP),
					...transform(LINE_RIGHT, height - C * (height / 2 + lineWidthT)),
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
	}

}

const diamondConnections = new Map();
diamondConnections.set( 2, new Set([6, 10, 14]));
diamondConnections.set( 6, new Set([2, 10, 14]));
diamondConnections.set(10, new Set([2,  6, 14]));
diamondConnections.set(14, new Set([2,  6, 10]));
const diamondColors = new Map();
diamondColors.set(2, 5);
diamondColors.set(6, 5);
diamondColors.set(10, 5);
diamondColors.set(14, 5);

class Diamond extends TileType {
	constructor(minConnections, maxConnections, checkSpecialConstraints) {
		super(diamondConnections, minConnections, maxConnections, checkSpecialConstraints);
		this.preview = new Tile(this, diamondColors);
	}

	specialConstraintsSatisfied(map, x, y, width, height, minPossibleConnections, maxPossibleConnections) {
		if (this.minConnections < 2) {
			return true;
		}
		let connectedUp = false, connectedRight = false, connectedDown = false, connectedLeft = false;
		let [tile, outcome] = tileMapLookup(map, x, y - 1, width, height);
		connectedUp = outcome !== Placement.TILE || tile.hasPort(10);
		[tile, outcome] = tileMapLookup(map, x + 1, y, width, height);
		connectedRight = outcome !== Placement.TILE || tile.hasPort(14);
		[tile, outcome] = tileMapLookup(map, x, y + 1, width, height);
		connectedDown = outcome !== Placement.TILE || tile.hasPort(2);
		[tile, outcome] = tileMapLookup(map, x - 1, y, width, height);
		connectedLeft = outcome !== Placement.TILE || tile.hasPort(6);
		return (connectedUp || connectedDown) && (connectedLeft || connectedRight);
	}

	draw(context, tile, left, top, width, height, lineWidthH, lineWidthV, shear, generator) {

	}
}

export {MiddleLineTile, Diamond};
