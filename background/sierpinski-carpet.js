'use strict';

{

	function SierpinskiCarpet() {
		const me = this;
		this.title = 'Sierpinski Carpet';

		this.optionsDocument = downloadDocument('sierpinski-carpet.html').then(function (optionsDoc) {

			optionsDoc.getElementById('carpet-depth').addEventListener('input', function (event) {
				me.maxDepth = this.value;
				progressiveBackgroundGen(me, false);
			});

			optionsDoc.getElementById('carpet-composition-op').addEventListener('input', function (event) {
				me.compositionOp = this.value;
				progressiveBackgroundGen(me, false);
			});

			const colorControls = optionsDoc.querySelectorAll('input[type=color]');
			const opacitySliders = Array.from(optionsDoc.getElementsByClassName('carpet-opacity'));

			function changeColor(index, preview) {
				return function (event) {
					const [r, g, b] = hexToRGB(colorControls[index].value);
					const alpha = parseFloat(opacitySliders[index].value);
					me.colors[index] = rgba(r, g, b, alpha);
					progressiveBackgroundGen(me, preview);
				};
			}

			colorControls.forEach(function (item, index) {
				item.addEventListener('input', changeColor(index, false));
			});

			for (let i = 0; i < opacitySliders.length; i++) {
				opacitySliders[i].addEventListener('input', changeColor(i, true));
				opacitySliders[i].addEventListener('mouseup', function (event) {
					progressiveBackgroundGen(me, false);
				});
			};

			return optionsDoc;
		});


		this.maxDepth = 4;
		this.compositionOp = 'source-over';

		const colors = new Array(9);
		colors.fill('#ffffff80');
		colors[4] = 'black';

		/*
		colors[0] = 'hsla(330, 100%, 80%, 0.5)';
		colors[1] = 'hsla(240, 100%, 80%, 0.5)';
		colors[2] = 'hsla( 30, 100%, 80%, 0.5)';
		colors[3] = 'hsla(330, 90%, 50%, 0.5)';
		colors[4] = 'black';
		colors[5] = 'hsla( 30, 100%, 50%, 0.5)';
		colors[6] = 'hsla(330, 100%, 20%, 0.5)';
		colors[7] = 'hsla(  0, 100%, 20%, 0.5)';
		colors[8] = 'hsla( 120, 100%, 20%, 0.5)';
		*/

		this.colors = colors;
	}

	backgroundGenerators.set('sierpinski-carpet', new SierpinskiCarpet());

	function Tile(x, y, color) {
		this.x = x;
		this.y = y;
		this.color = color;
	}

	SierpinskiCarpet.prototype.generate = function* (beginTime, canvas, context, preview) {
		const outerSize = Math.min(canvas.width, canvas.height);
		const colors = this.colors;
		let queue = [new Tile(0, 0, 'transparent')];
		let nextQueue = [];
		let prevSideLength = outerSize;
		let numProcessed = 0;
		context.globalCompositeOperation = this.compositionOp;

		let maxDepth = this.maxDepth;
		if (preview && maxDepth > 3) {
			maxDepth = 3;
		}

		for (let depth = 0; depth <= maxDepth; depth++) {
			let sideLength = outerSize / 3 ** (depth + 1);
			if (sideLength < 1) {
				break;
			}
			for (let tile of queue) {
				const x = tile.x;
				const y = tile.y;
				if (depth < 4) {
					context.fillStyle = tile.color;
					const roundedX = Math.round(x);
					const roundedY = Math.round(y);
					const roundedWidth = Math.round(prevSideLength + x - roundedX);
					const roundedHeight = Math.round(prevSideLength + y - roundedY);
					context.fillRect(roundedX, roundedY, roundedWidth, roundedHeight);
					context.fillStyle = colors[4];
				}

				const centreX = x + sideLength;
				const centreY = y + sideLength;
				const roundedCentreX = Math.round(centreX);
				const roundedCentreY = Math.round(centreY);
				const roundedWidth = Math.round(sideLength + centreX - roundedCentreX);
				const roundedHeight = Math.round(sideLength + centreY - roundedCentreY);
				context.fillRect(roundedCentreX, roundedCentreY, roundedWidth, roundedHeight);

				nextQueue.push(new Tile(x, y, colors[0]));
				nextQueue.push(new Tile(x + sideLength, y, colors[1]));
				nextQueue.push(new Tile(x + 2 * sideLength, y, colors[2]));
				nextQueue.push(new Tile(x, y + sideLength, colors[3]));
				nextQueue.push(new Tile(x + 2 * sideLength, y + sideLength, colors[5]));
				nextQueue.push(new Tile(x, y + 2 * sideLength, colors[6]));
				nextQueue.push(new Tile(x + sideLength, y + 2 * sideLength, colors[7]));
				nextQueue.push(new Tile(x + 2 * sideLength, y + 2 * sideLength, colors[8]));

				numProcessed++;
				if ((numProcessed & 511) === 511 && performance.now() >= beginTime + 20) {
					yield;
				}

			}
			queue = nextQueue;
			nextQueue = [];
			prevSideLength = sideLength;
		}
	}

}
