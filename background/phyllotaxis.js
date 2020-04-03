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

			optionsDoc.getElementById('phyllotaxis-start').addEventListener('input', function (event) {
				const value = parseInt(this.value);
				if (value >= 0) {
					me.start = value;
					progressiveBackgroundGen(me, false);
				}
			});

			optionsDoc.getElementById('phyllotaxis-skip').addEventListener('input', function (event) {
				const value = parseInt(this.value);
				if (value >= 0) {
					me.skip = value;
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

			optionsDoc.querySelectorAll('input[name=phyllotaxis-stack]').forEach(function (item) {
				item.addEventListener('input', function (event) {
					me.stack = parseInt(this.value);
					progressiveBackgroundGen(me, false);
				});
			});

			optionsDoc.getElementById('phyllotaxis-color-mod').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (Number.isFinite(value) && value !== 0) {
					me.colorMod = value;
					progressiveBackgroundGen(me, false);
				}
			});

			optionsDoc.getElementById('phyllotaxis-hue-min').addEventListener('input', function (event) {
				me.hueMin = parseFloat(this.value);
				progressiveBackgroundGen(me, false);
			});

			optionsDoc.getElementById('phyllotaxis-hue-max').addEventListener('input', function (event) {
				me.hueMax = parseFloat(this.value);
				progressiveBackgroundGen(me, false);
			});

			optionsDoc.getElementById('phyllotaxis-hue-mode').addEventListener('input', function (event) {
				me.hueMode = this.value;
				$('#phyllotaxis-hue-max').collapse(this.value === 'c' ? 'hide' : 'show');
				progressiveBackgroundGen(me, false);
			});

			optionsDoc.getElementById('phyllotaxis-saturation-min').addEventListener('input', function (event) {
				me.saturationMin = parseFloat(this.value);
				progressiveBackgroundGen(me, false);
			});

			optionsDoc.getElementById('phyllotaxis-saturation-max').addEventListener('input', function (event) {
				me.saturationMax = parseFloat(this.value);
				progressiveBackgroundGen(me, false);
			});

			optionsDoc.getElementById('phyllotaxis-saturation-mode').addEventListener('input', function (event) {
				me.saturationMode = this.value;
				$('#phyllotaxis-saturation-max').collapse(this.value === 'c' ? 'hide' : 'show');
				progressiveBackgroundGen(me, false);
			});

			optionsDoc.getElementById('phyllotaxis-lightness-min').addEventListener('input', function (event) {
				me.lightnessMin = parseFloat(this.value);
				progressiveBackgroundGen(me, false);
			});

			optionsDoc.getElementById('phyllotaxis-lightness-max').addEventListener('input', function (event) {
				me.lightnessMax = parseFloat(this.value);
				progressiveBackgroundGen(me, false);
			});

			optionsDoc.getElementById('phyllotaxis-lightness-mode').addEventListener('input', function (event) {
				me.lightnessMode = this.value;
				$('#phyllotaxis-lightness-max').collapse(this.value === 'c' ? 'hide' : 'show');
				progressiveBackgroundGen(me, false);
			});

			optionsDoc.getElementById('phyllotaxis-opacity-min').addEventListener('input', function (event) {
				me.opacityMin = parseFloat(this.value);
				progressiveBackgroundGen(me, false);
			});

			optionsDoc.getElementById('phyllotaxis-opacity-max').addEventListener('input', function (event) {
				me.opacityMax = parseFloat(this.value);
				progressiveBackgroundGen(me, false);
			});

			optionsDoc.getElementById('phyllotaxis-opacity-mode').addEventListener('input', function (event) {
				me.opacityMode = this.value;
				$('#phyllotaxis-opacity-max').collapse(this.value === 'c' ? 'hide' : 'show');
				progressiveBackgroundGen(me, false);
			});

			return optionsDoc;
		});

		this.angle = 137.4 * Math.PI / 180;
		this.scale = 21;
		this.start = 1;
		this.step = 1;
		this.stack = -1;
		this.petalSize = 15;
		this.petalEnlargement = 0;

		this.colorMod = 61;

		this.hueMin = 30;
		this.hueMax = 360;
		this.hueMode = 'c';	// constant

		this.saturationMin = 1;
		this.saturationMax = 0;
		this.saturationMode = 'c';

		this.lightnessMin = 0.5;
		this.lightnessMax = 0;
		this.lightnessMode = 'c';

		this.opacityMin = 1;
		this.opacityMax = 0;
		this.opacityMode = 'c';
	}

	backgroundGenerators.set('phyllotaxis', new Phyllotaxis());

	class Petal {
		constructor(r, theta, petalSize) {
			this.r = r;
			this.theta = theta;
			this.radius = petalSize;
		}
	}

	Phyllotaxis.prototype.generate = function* (beginTime, context, canvasWidth, canvasHeight) {
		const angle = this.angle;
		const scale = this.scale;
		const petalSize = this.petalSize;
		const petalEnlargement = this.petalEnlargement;

		const colorMod = this.colorMod;
		const hueRange = this.hueMax - this.hueMin;
		const saturationRange = this.saturationMax - this.saturationMin;
		const lightnessRange = this.lightnessMax - this.lightnessMin;
		const opacityRange = this.opacityMax - this.opacityMin;

		context.translate(canvasWidth / 2, canvasHeight / 2);
		const maxR = Math.max(canvasWidth, canvasHeight) / 2 - petalSize;

		const points = [];
		let n = this.start;
		let r = scale * Math.sqrt(n);
		let lastR;
		const skip = this.skip;

		let currentPetalSize;
		if (petalEnlargement >= 0) {
			currentPetalSize = Math.max(petalSize, petalEnlargement * Math.sqrt(r));
		} else {
			currentPetalSize = Math.max(0.5, petalSize + petalEnlargement * Math.sqrt(r));
		}

		while (r + currentPetalSize < maxR) {
			const phi = n * angle;
			if (n % skip !== skip - 1) {
				points.push(new Petal(r, phi, currentPetalSize));
				lastR = r;
			}
			n++;
			r = scale * Math.sqrt(n);
			let radius
			if (petalEnlargement >= 0) {
				currentPetalSize = Math.max(petalSize, petalEnlargement * Math.sqrt(r));
			} else {
				currentPetalSize = Math.max(0.5, petalSize + petalEnlargement * Math.sqrt(r));
			}
		}

		const stack = this.stack;
		const numPoints = points.length;
		const lastRSquared = lastR * lastR;
		let hue = this.hueMin;
		let saturation = this.saturationMin;
		let lightness = this.lightnessMin;
		let opacity = this.opacityMin;

		for (let i = stack > 0 ? 0 : numPoints - 1; i >= 0 && i < numPoints; i += stack) {
			const point = points[i];
			const r = point.r;
			const theta = point.theta;
			const x = r * Math.cos(theta);
			const y = r * Math.sin(theta);
			context.beginPath();
			context.arc(x, y, point.radius, 0, TWO_PI);
			const degrees = theta / Math.PI * 180;
			const radialValue = (r * r) / lastRSquared;

			switch (this.hueMode) {
			case 'a':
				hue = (degrees % colorMod) * hueRange / colorMod + this.hueMin;
				break;
			case 'r':
				hue = this.hueMin + hueRange * radialValue;
				break;
			}

			switch (this.saturationMode) {
			case 'a':
				saturation = (degrees % colorMod) * saturationRange / colorMod + this.saturationMin;
				break;
			case 'r':
				saturation = this.saturationMin + saturationRange * radialValue;
				break;
			}

			switch (this.lightnessMode) {
			case 'a':
				lightness = (degrees % colorMod) * lightnessRange / colorMod + this.lightnessMin;
				break;
			case 'r':
				lightness = this.lightnessMin + lightnessRange * radialValue;
				break;
			}

			switch (this.opacityMode) {
			case 'a':
				opacity = (degrees % colorMod) * opacityRange / colorMod + this.opacityMin;
				break;
			case 'r':
				opacity = this.opacityMin + opacityRange * radialValue;
				break;
			}

			//hue = i % 120;
			//hue = (theta / Math.PI * 180 - r);
			context.fillStyle = hsla(hue, saturation, lightness, opacity);
			context.fill();
		}
	};

}
