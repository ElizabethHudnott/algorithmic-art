'use strict';

{
	function Phyllotaxis() {
		const me = this;
		this.title = 'Phyllotaxis';
		this.hasRandomness = false;

		this.optionsDocument = downloadDocument('phyllotaxis.html').then(function (optionsDoc) {

			optionsDoc.getElementById('phyllotaxis-angle-range').addEventListener('input', function (event) {
				me.angle = parseFloat(this.value) * TWO_PI;
				progressiveBackgroundGen(me, false);
			});

			optionsDoc.getElementById('phyllotaxis-scale').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (value > 0) {
					me.scale = value;
					progressiveBackgroundGen(me, false);
				}
			});

			optionsDoc.getElementById('phyllotaxis-petal-size').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (value > 0) {
					me.petalSize = value;
					progressiveBackgroundGen(me, false);
				}
			});

			optionsDoc.getElementById('phyllotaxis-petal-enlarge').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (Number.isFinite(value)) {
					me.petalEnlargement = parseFloat(this.value);
					progressiveBackgroundGen(me, false);
				}
			});

			return optionsDoc;
		});

		this.angle = 137.4 * Math.PI / 180;
		this.scale = 21;
		this.petalSize = 15;
		this.petalEnlargement = 0;
	}

	backgroundGenerators.set('phyllotaxis', new Phyllotaxis());

	Phyllotaxis.prototype.generate = function* (beginTime, context, canvasWidth, canvasHeight) {
		const angle = this.angle;
		const scale = this.scale;
		const petalSize = this.petalSize;
		const petalEnlargement = this.petalEnlargement;

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
			let radius
			if (petalEnlargement >= 0) {
				radius = Math.max(petalSize, petalEnlargement * Math.sqrt(r));
			} else {
				radius = Math.max(0.5, petalSize + petalEnlargement * Math.sqrt(r));
			}
			context.arc(x, y, radius, 0, TWO_PI);
			const h = ((theta / Math.PI * 180) % 61);
			//const h = i % 120;
			//const h = (theta / Math.PI * 180 - r);
			const s = 1 - 0.4 * r / maxR;
			context.fillStyle = hsla(h, s, 0.5, 1);
			context.fill();
		}
	};

}
