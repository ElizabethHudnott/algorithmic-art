/*	Locations of port numbers
	0	1	2	3	4
	15				5
	14				6
	13				7
	12	11	10	9	8
 */

/** Connections from a port on one tile to ports on neighbouring tiles.
 *	Format: output port -> collection of tile map delta x, tile map delta y, input port
 *	number triples
 */
const POSSIBLE_CONNECTIONS = new Array(16);
POSSIBLE_CONNECTIONS[ 0] = [ [-1,  0,  4], [ 0, -1, 12], [-1, -1,  8]	];
POSSIBLE_CONNECTIONS[ 1] = [ [ 0, -1, 11]								];
POSSIBLE_CONNECTIONS[ 2] = [ [ 0, -1, 10]								];
POSSIBLE_CONNECTIONS[ 3] = [ [ 0, -1,  9]								];
POSSIBLE_CONNECTIONS[ 4] = [ [ 1,  0,  0], [ 0, -1,  8], [ 1, -1, 12]	];
POSSIBLE_CONNECTIONS[ 5] = [ [ 1,  0, 15]								];
POSSIBLE_CONNECTIONS[ 6] = [ [ 1,  0, 14]								];
POSSIBLE_CONNECTIONS[ 7] = [ [ 1,  0, 13]								];
POSSIBLE_CONNECTIONS[ 8] = [ [ 1,  0, 12], [ 0,  1,  4], [ 1,  1,  0]	];
POSSIBLE_CONNECTIONS[ 9] = [ [ 0,  1,  3]								];
POSSIBLE_CONNECTIONS[10] = [ [ 0,  1,  2]								];
POSSIBLE_CONNECTIONS[11] = [ [ 0,  1,  1]								];
POSSIBLE_CONNECTIONS[12] = [ [-1,  0,  8], [ 0,  1,  0], [-1,  1,  4]	];
POSSIBLE_CONNECTIONS[13] = [ [-1,  0,  7]								];
POSSIBLE_CONNECTIONS[14] = [ [-1,  0,  6]								];
POSSIBLE_CONNECTIONS[15] = [ [-1,  0,  5]								];

const Placement = Object.freeze({
	TILE: 0,
	OFF_SCREEN: 1,
	EMPTY: 2,
})

function tileMapLookup(map, x, y, width, height) {
	if (x < 0 || x >= width || y < 0 || y >= height) {
		return [undefined, Placement.OFF_SCREEN];
	}
	const row = map[y];
	if (row === undefined) {
		return [undefined, Placement.EMPTY];
	}
	const tile = row[x];
	if (tile === undefined) {
		return [undefined, Placement.EMPTY];
	} else {
		return [tile, Placement.TILE];
	}
}

class TileType {
	constructor(connections, minConnections, maxConnections, checkSpecialConstraints) {
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
		this.minConnections = minConnections;
		this.maxConnections = maxConnections;
		this.checkSpecialConstraints = checkSpecialConstraints;
	}

	getLineColor(port1, port2, colors) {
		return colors.get(port1);
	}

	hasPort(port) {
		return this.connections.has(port);
	}

	mutate(x, y, lineWidth, previewSize, color) {
		return this;
	}

	permittedTiling(map, x, y, width, height, dxNew, dyNew) {
		let minPossibleConnections = 0;
		let maxPossibleConnections = this.connections.size;
		let offScreenConnections = false;
		let affected = dxNew === 0 && dyNew === 0;
		for (let outPort of this.connections.keys()) {
			for (let [dx, dy, inPort] of POSSIBLE_CONNECTIONS[outPort]) {
				affected = affected || (dx === dxNew && dy === dyNew);
				const [tile, outcome] = tileMapLookup(map, x + dx, y + dy, width, height);
				switch (outcome) {
				case Placement.OFF_SCREEN:
					minPossibleConnections++;
					offScreenConnections = true;
					break;
				case Placement.TILE:
					if (tile.hasPort(inPort)) {
						minPossibleConnections++;
					} else {
						maxPossibleConnections--;
					}
					break;
				}
			}
		}
		if (this.minConnections === 1 && offScreenConnections && maxPossibleConnections < 2) {
			return !affected;
		} else {
			const localConnectivityOK =
				maxPossibleConnections >= this.minConnections &&
				minPossibleConnections <= this.maxConnections;
			const specialConstraintsOK = !this.checkSpecialConstraints ||
				this.specialConstraintsSatisfied(map, x, y, width, height, minPossibleConnections, maxPossibleConnections);
			return (localConnectivityOK && specialConstraintsOK) || !affected;
		}
	}

	specialConstraintsSatisfied(map, x, y, width, height, minPossibleConnections, maxPossibleConnections) {
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

	permittedTiling(tileMap, x, y, width, height, dxNew, dyNew) {
		return this.tileType.permittedTiling(tileMap, x, y, width, height, dxNew, dyNew);
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
		super(new Map(), 0, 4);
	}

	draw(context, tile, left, top, width, height, lineWidth, shear, generator) {
		// Nothing to draw
	}
}

const BLANK_TILE = new Tile(new BlankTile());

function chooseTile(tileTypes, cdf, frequenciesTotal, attemptedTypes, colorMode) {
	const maxTileType = tileTypes.length - 1;
	const p = random.next() * frequenciesTotal;
	let tileTypeIndex = maxTileType;
	while (tileTypeIndex > 0 && cdf[tileTypeIndex - 1] >= p) {
		tileTypeIndex--;
	}

	let firstChoice = tileTypeIndex;
	while (tileTypeIndex > 0 && attemptedTypes.has(tileTypeIndex)) {
		tileTypeIndex--;
	}

	if (attemptedTypes.has(tileTypeIndex)) {
		tileTypeIndex = firstChoice;
		while (tileTypeIndex < maxTileType && attemptedTypes.has(tileTypeIndex)) {
			tileTypeIndex++;
		}
	}

	attemptedTypes.add(tileTypeIndex);
	let tile;
	switch (colorMode) {
	case 'd':
		return tileTypes[tileTypeIndex].preview;
	case 'r':
		return new Tile(tileTypes[tileTypeIndex]);
	}
}

function checkTiling(tileMap, x, y, width, height) {
	let tile = tileMap[y][x];
	if (!tile.permittedTiling(tileMap, x, y, width, height, 0, 0)) {
		return false;
	}
	if (y > 0) {
		if (x > 0) {
			tile = tileMap[y - 1][x - 1];
			if (!tile.permittedTiling(tileMap, x - 1, y - 1, width, height, 1, 1)) {
				return false;
			}
		}
		tile = tileMap[y - 1][x];
		if (!tile.permittedTiling(tileMap, x, y - 1, width, height, 0, 1)) {
			return false;
		}
		if (x < width - 1) {
			tile = tileMap[y - 1][x + 1];
			if (!tile.permittedTiling(tileMap, x + 1, y - 1, width, height, -1, 1)) {
				return false;
			}
		}
	}
	if (x > 0) {
		tile = tileMap[y][x - 1];
		if (!tile.permittedTiling(tileMap, x - 1, y, width, height, 1, 0)) {
			return false;
		}
	}
	return true;
}

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

export {
	TileType, Tile, BLANK_TILE, POSSIBLE_CONNECTIONS, checkTiling, chooseTile,
	coordinateTransform, Placement, tileMapLookup
};
