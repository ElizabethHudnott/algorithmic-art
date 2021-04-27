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
	 */
	shapesMap.set('0000', new ShapeSet());
	shapesMap.set('0008', new ShapeSet(null, null, null, [1, 1]));
	shapesMap.set('0200', new ShapeSet(null, [0, 0]));
	shapesMap.set('0040', new ShapeSet(null, null, [0, 0]));
	shapesMap.set('1000', new ShapeSet([1, 1]));
	shapesMap.set('0a0a', new ShapeSet(null, [1, 1], null, [1, 1]));
	shapesMap.set('5050', new ShapeSet([1, 1], null, [1, 1]));
	shapesMap.set('9009', new ShapeSet([0, 0], null, null, [1, 1]));
	shapesMap.set('3300', new ShapeSet([0, 0], [0, 0]));
	shapesMap.set('0660', new ShapeSet(null, [0, 0], [1, 1]));
	shapesMap.set('00cc', new ShapeSet(null, null, [0, 0], [0, 0]));
	shapesMap.set('0208', new ShapeSet(null, [1, 0], null, [1, 0]));
	shapesMap.set('1040', new ShapeSet([1, 0], null, [1, 0]));
	shapesMap.set('1008', new ShapeSet([0, 1], null, null, [0, 1]));
	shapesMap.set('1200', new ShapeSet([1,0], [1, 0]));
	shapesMap.set('0240', new ShapeSet(null, [0, 1], [0, 1]));
	shapesMap.set('0048', new ShapeSet(null, null, [1, 0], [1, 0]));
	shapesMap.set('d0dd', new ShapeSet([1, 1], null, [1, 1], [0, 0]));
	shapesMap.set('7770', new ShapeSet([1, 1], [1, 1], [1, 1]));
	shapesMap.set('bb0b', new ShapeSet([1, 1], [1, 1], null, [0, 0]));
	shapesMap.set('0eee', new ShapeSet(null, [1, 1], [0, 0], [0, 0]));
	shapesMap.set('10cc', new ShapeSet([0, 1], null, [0, 1], [0, 0]));
	shapesMap.set('1660', new ShapeSet([1, 0], [1, 1], [1, 0]));
	shapesMap.set('9209', new ShapeSet([1, 0], [1, 0], null, [0, 0]));
	shapesMap.set('02cc', new ShapeSet(null, [0, 1], [0, 1], [0, 0]));
	shapesMap.set('9049', new ShapeSet([1, 0], null, [1, 0], [0, 0]));
	shapesMap.set('3340', new ShapeSet([0, 1], [1, 1], [0, 1]));
	shapesMap.set('3308', new ShapeSet([0, 1], [1, 1], null, [0, 1]));
	shapesMap.set('0668', new ShapeSet(null, [1, 1], [1, 0], [1, 0]));
	shapesMap.set('5058', new ShapeSet([1, 1], null, [1, 1], [0, 0]));
	shapesMap.set('5250', new ShapeSet([1, 1], [1, 1], [1, 1]));
	shapesMap.set('1a0a', new ShapeSet([0, 0], [1, 1], null, [1, 1]));
	shapesMap.set('0a4a', new ShapeSet(null, [1, 1], [1, 1], [1, 1]));
	const cross = new ShapeSet([1, 1], [1, 1], [1, 1], [0, 0]);
	shapesMap.set('ffff', cross);
	shapesMap.set('d2dd', cross);
	shapesMap.set('7778', cross);
	shapesMap.set('bb4b', cross);
	shapesMap.set('1eee', new ShapeSet([0, 0], [1, 1], [0, 0], [0, 0]));
	shapesMap.set('5a5a', cross); // Over-under
	shapesMap.set('5258', cross);
	shapesMap.set('9669', new ShapeSet([1, 0], [1, 0], [1, 1], [0, 0]));
	shapesMap.set('33cc', new ShapeSet([0, 1], [1, 1], [0, 1], [0, 0]));
	shapesMap.set('1a4a', new ShapeSet([0, 0], [1, 1], [1, 1], [1, 1]));
	shapesMap.set('1248', new ShapeSet([0.5, 0, 0.5], [0.5, 1, 0.5], [0.5, 1, 0.5], [0.5, 0, 0.5]));

	shapesMap.set('9249', new ShapeSet([1, 1], [1, 1], [1, 1], [0, 0]));
	shapesMap.set('12cc', new ShapeSet([0, 0], [1, 1], [0, 0], [0, 0]));
	shapesMap.set('3348', new ShapeSet([1, 1], [1, 1], [1, 1], [0, 0]));
	shapesMap.set('1668', new ShapeSet([0, 0], [1, 1], [0, 0], [0, 0]));

	/* Alternatives with diagonal lines in the centre
	shapesMap.set('9249', new ShapeSet([1, 0], [0.5, 1, 0.5], [0.5, 1, 0.5], [0, 0]));
	shapesMap.set('12cc', new ShapeSet([0.5, 0, 0.5], [0.5, 1, 0.5], [0, 1], [0, 0]));
	shapesMap.set('3348', new ShapeSet([0, 1], [1, 1], [0.5, 1, 0.5], [0.5, 0, 0.5]));
	shapesMap.set('1668', new ShapeSet([0.5, 0, 0.5], [1, 0], [1, 1], [0.5, 0, 0.5]));
	*/

	shapesMap.set('1048', new ShapeSet([0, 0.5], null, [1, 0.5], [1, 0, 0.5]));
	shapesMap.set('1240', new ShapeSet([0.5, 0], [0, 1, 0.5], [0.5, 1]));
	shapesMap.set('1208', new ShapeSet([1, 0, 0.5], [1, 0.5], null, [0, 0.5]));
	shapesMap.set('0248', new ShapeSet(null, [0.5, 1], [0, 1, 0.5], [0.5, 0]));
}

export default class MiddleLineTile extends TileType {
	/**
	 * First 4 digits: diagonal lines: upper right quadrant, lower right, lower left, upper left
	 * Second 4 digits: straight lines: up, right, down, left
	 * Ninth digit bits: 1 = upper right, 2 = lower right, 4 = lower left, 8 = upper left
	 */
	constructor(str, minConnections, maxConnections) {
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
		super(connections, minConnections, maxConnections);
		this.curved = parseInt(str[8], 16);
		this.str = str;
		this.preview = new Tile(this, defaultColors);
	}

	mutate(x, y, lineWidth, previewSize, color) {
		const halfLength = previewSize / 2;
		const min = halfLength - lineWidth / 2;
		const max = halfLength + lineWidth / 2;
		let index;
		if (x >= min && x <= max) {
			index = y < halfLength ? 4 : 6;
		} else if (y >= min && y <= max) {
			index = x < halfLength ? 7 : 5;
		} else if (x < halfLength) {
			index = y < halfLength ? 3 : 2;
		} else {
			index = y < halfLength ? 0 : 1;
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
		return new MiddleLineTile(newStr, this.minConnections, this.maxConnections);
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

	draw(context, tile, left, top, width, height, lineWidth, shear, generator) {
		const transform = coordinateTransform.bind(null, left, top, width, height, shear);
		const centre = Math.trunc(width / 2);
		const middle = Math.trunc(height / 2);
		const lineWidth1 = Math.trunc(lineWidth / 2);
		const lineWidth2 = Math.ceil(lineWidth / 2);
		const gradient = height / width;
		const gradient2 = (height + lineWidth) / (width + lineWidth);

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

		function portion(amount, middle) {
			switch (amount) {
			case 0:
				return middle - lineWidth1;
			case 0.5:
				return middle;
			case 1:
				return middle + lineWidth2;
			}
		}

		if (topToCentre) {
			context.beginPath();
			context.moveTo(...transform(centre - lineWidth1, 0));
			context.lineTo(...transform(centre - lineWidth1, middle - lineWidth1));
			context.lineTo(...transform(portion(shapes.topX, centre), portion(shapes.topYLeft, middle)));
			context.lineTo(...transform(centre + lineWidth2, portion(shapes.topYRight, middle)));
			context.lineTo(...transform(centre + lineWidth2, 0));
			context.fillStyle = generator.getColor(tile.getColor(2));
			context.fill();
		}

		if (bottomToCentre) {
			context.beginPath();
			context.moveTo(...transform(centre - lineWidth1, height));
			context.lineTo(...transform(centre - lineWidth1, middle + lineWidth2));
			context.lineTo(...transform(portion(shapes.bottomX, centre), portion(shapes.bottomYLeft, middle)));
			context.lineTo(...transform(centre + lineWidth2, portion(shapes.bottomYRight, middle)));
			context.lineTo(...transform(centre + lineWidth2, height));
			context.fillStyle = generator.getColor(tile.getColor(10));
			context.fill();
		}

		if (leftToCentre) {
			context.beginPath();
			context.moveTo(...transform(0, middle - lineWidth1));
			context.lineTo(...transform(centre - lineWidth1, middle - lineWidth1));
			context.lineTo(...transform(portion(shapes.leftXTop, centre), portion(shapes.leftY, middle)));
			context.lineTo(...transform(portion(shapes.leftXBottom, centre), middle + lineWidth2));
			context.lineTo(...transform(0, middle + lineWidth2));
			context.fillStyle = generator.getColor(tile.getColor(14));
			context.fill();
		}

		if (rightToCentre) {
			context.beginPath();
			context.moveTo(...transform(width, middle - lineWidth1));
			context.lineTo(...transform(middle + lineWidth2, middle - lineWidth1));
			context.lineTo(...transform(portion(shapes.rightXTop, centre), portion(shapes.rightY, middle)));
			context.lineTo(...transform(portion(shapes.rightXBottom, centre), middle + lineWidth2));
			context.lineTo(...transform(width, middle + lineWidth2));
			context.fillStyle = generator.getColor(tile.getColor(6));
			context.fill();
		}

		if (topToRight) {
			context.beginPath()
			context.moveTo(...transform(centre + lineWidth2, 0));
			const [x, y] = transform(width, middle - lineWidth1);
			if ((this.curved & 1) === 1) {
				context.bezierCurveTo(
					...transform(centre + lineWidth2, C * (middle - lineWidth1)),
					...transform(width - C * (width / 2 - lineWidth2), middle - lineWidth1),
					x, y
				);
				context.lineTo(...transform(width, middle + lineWidth2));
				context.bezierCurveTo(
					...transform(width - C * (width / 2 + lineWidth1), middle + lineWidth2),
					...transform(centre - lineWidth1, C * (middle + lineWidth2)),
					...transform(centre - lineWidth1, 0)
				);
			} else {
				context.lineTo(x, y);
				if (rightToCentre) {
					context.lineTo(...transform(width - lineWidth / gradient, middle - lineWidth1));
				} else {
					context.lineTo(...transform(width, middle + lineWidth2));
				}
				if (topToCentre) {
					context.lineTo(...transform(centre + lineWidth2, lineWidth * gradient));
				} else if (leftToTop) {
					context.lineTo(...transform(centre, lineWidth / 2 * gradient2));
				} else {
					context.lineTo(...transform(centre - lineWidth1, 0));
				}
			}
			context.fillStyle = generator.getColor(tile.getLineColor(2, 6));
			context.fill();
		}

		if (rightToBottom) {
			context.beginPath();
			context.moveTo(...transform(width, middle + lineWidth2));
			const [x, y] = transform(centre + lineWidth2, height);
			if ((this.curved & 2) === 2) {
				context.bezierCurveTo(
					...transform(width - C * (width / 2 - lineWidth2), middle + lineWidth2),
					...transform(centre + lineWidth2, height - C * (height / 2 - lineWidth2)),
					x, y
				);
				context.lineTo(...transform(centre - lineWidth1, height));
				context.bezierCurveTo(
					...transform(centre - lineWidth1, height - C * (height / 2 + lineWidth1)),
					...transform(width - C * (width / 2 + lineWidth1), middle - lineWidth1),
					...transform(width, middle - lineWidth1)
				);
			} else {
				context.lineTo(x, y);
				if (bottomToCentre) {
					context.lineTo(...transform(centre + lineWidth2, height - lineWidth * gradient));
				} else {
					context.lineTo(...transform(centre - lineWidth1, height));
				}
				if (rightToCentre) {
					context.lineTo(...transform(width - lineWidth / gradient, middle + lineWidth2));
				} else if (topToRight) {
					context.lineTo(...transform(width - (lineWidth / 2) / gradient2, middle));
				} else {
					context.lineTo(...transform(width, middle - lineWidth1));
				}
			}
			context.fillStyle = generator.getColor(tile.getLineColor(6, 10));
			context.fill();
		}

		if (bottomToLeft) {
			context.beginPath();
			context.moveTo(...transform(centre - lineWidth1, height));
			const [x, y] = transform(0, middle + lineWidth2);
			if ((this.curved & 4) === 4) {
				context.bezierCurveTo(
					...transform(centre - lineWidth1, height - C * (height / 2 - lineWidth2)),
					...transform(C * (centre - lineWidth1), middle + lineWidth2),
					x, y
				);
				context.lineTo(...transform(0, middle - lineWidth1));
				context.bezierCurveTo(
					...transform(C * (centre + lineWidth2), middle - lineWidth1),
					...transform(centre + lineWidth2, height - C * (height / 2 + lineWidth1)),
					...transform(centre + lineWidth2, height),
				);
			} else {
				context.lineTo(x, y);
				if (leftToCentre) {
					context.lineTo(...transform(lineWidth / gradient, middle + lineWidth2));
				} else {
					context.lineTo(...transform(0, middle - lineWidth1));
				}
				if (bottomToCentre) {
					context.lineTo(...transform(centre - lineWidth1, height - lineWidth * gradient));
				} else if (rightToBottom) {
					context.lineTo(...transform(centre, height - lineWidth / 2 * gradient2));
				} else {
					context.lineTo(...transform(centre + lineWidth2, height));
				}
			}
			context.fillStyle = generator.getColor(tile.getLineColor(10, 14));
			context.fill();
		}

		if (leftToTop) {
			context.beginPath();
			context.moveTo(...transform(0, middle - lineWidth1));
			const [x, y] = transform(centre - lineWidth1, 0);
			if ((this.curved & 8) === 8) {
				context.bezierCurveTo(
					...transform(C * (centre - lineWidth1), middle - lineWidth1),
					...transform(centre - lineWidth1, C * (middle - lineWidth1)),
					x, y
				);
				context.lineTo(...transform(centre + lineWidth2, 0));
				context.bezierCurveTo(
					...transform(centre + lineWidth2, C * (middle + lineWidth2)),
					...transform(C * (centre + lineWidth2), middle + lineWidth2),
					...transform(0, middle + lineWidth2)
				);
			} else {
				context.lineTo(x, y);
				if (topToCentre) {
					context.lineTo(...transform(centre - lineWidth1, lineWidth * gradient));
				} else {
					context.lineTo(...transform(centre + lineWidth2, 0));
				}
				if (leftToCentre) {
					context.lineTo(...transform(lineWidth / gradient, middle - lineWidth1));
				} else if (bottomToLeft) {
					context.lineTo(...transform((lineWidth / 2) / gradient2, middle));
				} else {
					context.lineTo(...transform(0, middle + lineWidth2));
				}
			}
			context.fillStyle = generator.getColor(tile.getLineColor(14, 2));
			context.fill();
		}
	}

}
