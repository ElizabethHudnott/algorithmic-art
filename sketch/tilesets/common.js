/*	Locations of port numbers
	0	1	2	3	4
	15				5
	14				6
	13				7
	12	11	10	9	8
 */

class TileType {
	constructor(connections) {
		// Maps a port number to an set of port numbers
		this.connections = connections;
		for (let [connector, connectees] of Array.from(connections.entries())) {
			for (let connectee of connectees) {
				let reverseConnections = connections.get(connectee);
				if (reverseConnections === undefined) {
					reverseConnections = new Set();
					connections.set(connectee, reverseConnections);
				}
				reverseConnections.add(connector);
			}
		}
	}

	getLineColor(port1, port2, colors) {
		return colors.get(port1);
	}

	hasPort(port) {
		return this.connections.has(port);
	}

	permittedTiling(tileMap, x, y) {
		return true;
	}

	ports() {
		return this.connections.keys();
	}

	drawPreview(context, lineWidth, previewSize, generator) {
		this.draw(context, this.preview, 0, 0, previewSize, previewSize, lineWidth, [0, 0, 0, 0], generator);
	}

}

class Tile {
	constructor(tileType, colors) {
		this.tileType = tileType;
		// Maps port -> color
		this.colors = colors || new Map();
	}

	getColor(port) {
		return this.colors.get(port);
	}

	getLineColor(port1, port2) {
		return this.tileType.getLineColor(port1, port2, this.colors);
	}

	flowColor(inPort, color, histogram) {
		this.colors.set(inPort, color);
		let numColored = 1;
		const outPorts = [];
		const connected = this.tileType.connections.get(inPort);
		if (connected !== undefined) {
			for (let outPort of connected) {
				this.colors.set(outPort, color);
				numColored++;
				outPorts.push(outPort);
			}
		}
		histogram[color] += numColored;
		return outPorts;
	}

	hasPort(port) {
		return this.tileType.hasPort(port);
	}

	permittedTiling(tileMap, x, y) {
		return this.tileType.permittedTiling(tileMap, x, y);
	}

	ports() {
		return this.tileType.ports();
	}

	draw(context, x, y, cellWidth, cellHeight, lineWidth, shear, generator) {
		this.tileType.draw(context, this, x, y, cellWidth, cellHeight, lineWidth, shear, generator);
	}

}

class BlankTile extends TileType {

	constructor() {
		super(new Map());
	}

	draw(context, tile, left, top, width, height, lineWidth, shear, generator) {
		// Nothing to draw
	}
}

const BLANK_TILE = new Tile(new BlankTile());

function coordinateTransform(xReference, yReference, width, height, shear, relativeX, relativeY) {
	const halfWidth = width / 2;
	const halfHeight = height / 2;
	let transformedX, transformedY;
	if (relativeY <= halfHeight) {
		transformedX = Math.round(relativeX + relativeY / halfHeight * shear[0]);
	} else {
		transformedX = Math.round(relativeX + shear[0] + (relativeY - halfHeight) / halfHeight * shear[1]);
	}
	if (relativeX <= halfWidth) {
		transformedY = Math.round(relativeY + relativeX / halfWidth * shear[2]);
	} else {
		transformedY = Math.round(relativeY + shear[2] + (relativeX - halfWidth) / halfWidth * shear[3]);
	}
	return [xReference + transformedX, yReference + transformedY];
}

function tileMapLookup(map, x, y) {
	const row = map[y];
	if (row === undefined) {
		return undefined;
	} else {
		return row[x];
	}
}

export {TileType, Tile, BLANK_TILE, coordinateTransform, tileMapLookup};
