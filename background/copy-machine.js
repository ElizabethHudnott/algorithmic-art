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

		this.depth = 5;
		this.sizes = [300, 300, 300];
		const renderings = [
			new TextRendering('T'),
			new TextRendering('L'),
			new TextRendering('L'),
		];
		this.renderings = renderings;
		renderings[1].fillStyle = '#000080';
		renderings[2].fillStyle = '#800000';

		this.rotation = [0, HALF_PI, 3 * HALF_PI];
		this.scaleX = [0.7, 0.5, 0.5];
		this.scaleY = [0.5, 0.5, 0.5];
		this.translationX = [
			[0, 20, 0],
			[0, 20, 0],
			[0, 20, 0],
		];
		this.translationY = [
			[230, 130, 140],
			[220, 140, 130],
			[220, 140, 130],
		];
		this.shearX = [0.2, 0.2, 0.2];
		this.shearY = [0.1, 0.1, 0.1];
		this.shearDirection = [Math.PI / 3, 0, 0];

	}

	CopyMachine.prototype.draw = function (context, shapeNum, depth) {
		this.renderings[shapeNum].draw(context, 0, 0, this.sizes[shapeNum]);
		if (depth < this.depth) {
			depth++;
			for (let i = 0; i < this.renderings.length; i++) {
				context.save();
				context.rotate(this.rotation[i]);
				context.translate(this.translationX[shapeNum][i], -this.translationY[shapeNum][i]);
				const shearDirection = this.shearDirection[i];
				context.transform(
					this.scaleX[i],
					this.shearY[i] * Math.sin(shearDirection),
					-this.shearX[i] * Math.cos(shearDirection),
					this.scaleY[i],
					0, 0
				);
				this.draw(context, i, depth);
				context.restore();
			}
		}
	}

	CopyMachine.prototype.generate = function* (context, canvasWidth, canvasHeight, preview) {
		context.translate(canvasWidth / 2, canvasHeight / 2);
		this.draw(context, 0, 0);
	}

	backgroundGenerators.set('copy-machine', new CopyMachine());
}
