import Transform from './common.js';

class RelatedTile {
	constructor(x, y, tileType) {
		this.x = x;
		this.y = y;
		this.tileType = tileType;
	}

}

class TranslatePartition {
	constructor(fullWidth, fullHeight) {
		this.partWidth = Math.ceil(fullWidth / 2);
		this.partHeight = fullHeight;
		this.offsetX = (fullWidth % 2) * -0.5;
		this.offsetY = 0;
	}

	relatedTiles(x, y, tileType, transformedTypes) {
		return [new RelatedTile(x + this.partWidth, y, tileType)];
	}

}

export {TranslatePartition};
