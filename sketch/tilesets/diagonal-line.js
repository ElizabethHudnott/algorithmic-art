import {TileType} from './common.js';

export default class DiagonalLineTile extends TileType {
	constructor(str) {
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
		super(connections);
		this.type = str;
	}

	//TODO add .preview, .mutate()

	draw(context, tile, left, top, width, height, lineWidth, shear, generator) {
		const transform = coordinateTransform.bind(null, left, top, width, height, shear);
		const lineWidth1 = Math.trunc(lineWidth);
		const lineWidth2 = Math.ceil(lineWidth);
		context.beginPath();
		if (this.type === '0') {
			// Forward slash
			let y = height - lineWidth1;
			context.moveTo(...transform(0, height - lineWidth1));
			context.lineTo(...transform(width, -lineWidth1))
			context.lineTo(...transform(width, lineWidth2));
			context.lineTo(...transform(0, height + lineWidth2));
			context.fillStyle = generator.getColor(tile.getLineColor(4, 12));
		} else {
			// Backslash
			context.moveTo(...transform(0, -lineWidth1));
			context.lineTo(...transform(width, height - lineWidth1));
			context.lineTo(...transform(width, height + lineWidth2));
			context.lineTo(...transform(0, lineWidth2));
			context.fillStyle = generator.getColor(tile.getLineColor(0, 8));
		}
		context.fill();
	}

}
