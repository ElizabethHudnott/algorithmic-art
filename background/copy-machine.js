'use strict';

{
	class TextRendering {
		constructor(text) {
			this.text = text;
			this.font = 'sans-serif';
			this.fillStyle = '#000000';
			this.strokeStyle = undefined;
			this.lineWidth = 10;
		}

		draw(context, x, y, height) {
			context.textAlign = 'center';
			context.textBaseline = 'middle';
			context.font = height + 'px ' + this.font;
			if (this.fillStyle) {
				context.fillStyle = this.fillStyle;
				context.fillText(this.text, x, y);
			}
			if (this.strokeStyle) {
				context.strokeStyle = this.strokeStyle;
				context.strokeText(this.text, x, y);
			}
		}
	}

	function CopyMachine() {
		const me = this;
		this.title = 'Copy Machine';
		this.hasRandomness = true;

		this.depth = 2;
		this.sizes = [300, 300, 300];
		const renderings = [
			new TextRendering('T'),
			new TextRendering('L'),
			new TextRendering('L'),
		];
		this.renderings = renderings;
		renderings[1].fillStyle = '#000080';
		renderings[2].fillStyle = '#800000';

		this.rotations = [0, HALF_PI, 3 * HALF_PI];
		this.scalingsX = [0.7, 0.5, 0.5];
		this.scalingsY = [0.5, 0.5, 0.5];
		this.translationsX = [0, 20, 0];
		this.translationsY = [220, 120, 130];

	}

	backgroundGenerators.set('copy-machine', new CopyMachine());

	CopyMachine.prototype.draw = function (context, shapeNum, depth) {
		this.renderings[shapeNum].draw(context, 0, 0, this.sizes[shapeNum]);
		if (depth < this.depth) {
			depth++;
			for (let i = 0; i < this.renderings.length; i++) {
				context.save();
				context.rotate(this.rotations[i]);
				context.translate(this.translationsX[i], -this.translationsY[i]);
				context.scale(this.scalingsX[i], this.scalingsY[i]);
				this.draw(context, i, depth);
				context.restore();
			}
		}
	}

	CopyMachine.prototype.generate = function* (context, canvasWidth, canvasHeight, preview) {
		context.translate(canvasWidth / 2, canvasHeight / 2);
		this.draw(context, 0, 0);
	}

}
