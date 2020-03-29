'use strict';

{
	function Phyllotaxis() {
		this.angle = 137.4 * Math.PI / 180;
		this.scale = 20;
		this.petalSize = 15;
	}

	backgroundGenerators.set('phyllotaxis', new Phyllotaxis());

	Phyllotaxis.prototype.generate = function* (beginTime, context, canvasWidth, canvasHeight) {
		const angle = this.angle;
		const scale = this.scale;
		const petalSize = this.petalSize;

		context.translate(canvasWidth / 2, canvasHeight / 2);
		const maxR = Math.max(canvasWidth, canvasHeight) / 2 - petalSize;

		const points = [];
		let r = scale;
		let n = 1;
		while (r < maxR) {
			const phi = n * angle;
			points.push(new PolarPoint(r, phi));
			n++;
			r = scale * Math.sqrt(n);
		}
		for (let i = points.length - 1; i >= 0; i--) {
			const point = points[i];
			const r = point.r;
			const theta = point.theta;
			const x = r * Math.cos(theta);
			const y = r * Math.sin(theta);
			context.beginPath();
			context.arc(x, y, petalSize, 0, TWO_PI);
			const h = ((theta / Math.PI * 180) % 61);
			//const h = i % 120;
			//const h = (theta / Math.PI * 180 - r);
			const s = 1 - 0.4 * r / maxR;
			context.fillStyle = hsla(h, s, 0.5, 1);
			context.fill();
		}
	};

}
