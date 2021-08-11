import {TileType} from './common.js';

export default class DiagonalLineTile extends TileType {
	constructor(str, minConnections, maxConnections, checkSpecialConstraints) {
		const connections = new Map();
		const destinations = new Set();
		if (str === '0') {
			// Forward slash
			destinations.add(12);
			connections.set(4, destinations);
		} else {
			// Backslash
			destinations.add(8);
			connections.set(0, destinations);
		}
		super(connections, minConnections, maxConnections, checkSpecialConstraints);
		this.type = str;
	}

	//TODO add .preview, .mutate()

	draw(context, tile, left, top, width, height, lineWidthBack, lineWidthFore, shear, generator, tileMap, cellX, cellY) {
		const transform = coordinateTransform.bind(null, left, top, width, height, shear);
		const lWidthBackT = Math.trunc(lineWidthBack / 2);
		const lWidthBackB = Math.ceil(lineWidthBack / 2);
		const lWidthForeT = Math.trunc(lineWidthFore / 2);
		const lWidthForeB = Math.ceil(lineWidthFore / 2);
		context.beginPath();
		if (this.type === '0') {
			// Forward slash
			let y = height - lineWidth1;
			context.moveTo(...transform(0, height - lWidthForeT));
			context.lineTo(...transform(width, -lWidthForeT))
			context.lineTo(...transform(width, lWidthForeB));
			context.lineTo(...transform(0, height + lWidthForeB));
			context.fillStyle = generator.getColor(tile.getLineColor(4, 12));
		} else {
			// Backslash
			context.moveTo(...transform(0, -lWidthBackT));
			context.lineTo(...transform(width, height - lWidthBackT));
			context.lineTo(...transform(width, height + lWidthBackB));
			context.lineTo(...transform(0, lWidthBackB));
			context.fillStyle = generator.getColor(tile.getLineColor(0, 8));
		}
		context.fill();
	}

}
