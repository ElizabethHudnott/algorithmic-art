'use strict';

{
	function Phyllotaxis() {
		const me = this;
		this.title = 'Phyllotaxis';
		this.hasRandomness = false;
		this.hasCustomImage = true;

		this.optionsDocument = downloadDocument('phyllotaxis.html').then(function (optionsDoc) {
			const colorFieldSelect = optionsDoc.getElementById('phyllotaxis-color-field');
			const angleModeSelect = optionsDoc.getElementById('phyllotaxis-angle-mode');
			const colorModInput = optionsDoc.getElementById('phyllotaxis-color-mod');

			function fullRedraw() {
				progressiveBackgroundGen(me, 0);
			}

			optionsDoc.getElementById('phyllotaxis-max-petals').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (value > 0) {
					me.maxPetals = value * 1000;
					progressiveBackgroundGen(me, 0);
				}
			});

			const angleSlider = optionsDoc.getElementById('phyllotaxis-angle-range');
			angleSlider.addEventListener('input', function (event) {
				me.angle = parseFloat(this.value) * TWO_PI;
				progressiveBackgroundGen(me, 1);
			});
			angleSlider.addEventListener('mouseup', fullRedraw);

			optionsDoc.getElementById('phyllotaxis-spread').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (Number.isFinite(value)) {
					me.spread = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('phyllotaxis-exponent').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (value > 0) {
					me.exponent = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('phyllotaxis-scale').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (value > 0) {
					me.scale = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('phyllotaxis-start').addEventListener('input', function (event) {
				const value = parseInt(this.value);
				if (value >= 0) {
					me.start = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('phyllotaxis-skip').addEventListener('input', function (event) {
				const value = parseInt(this.value);
				if (value >= 0) {
					me.skip = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('phyllotaxis-petal-size').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (value > 0) {
					me.petalSize = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('phyllotaxis-petal-enlarge').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (Number.isFinite(value)) {
					me.petalEnlargement = parseFloat(this.value);
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.querySelectorAll('input[name=phyllotaxis-stack]').forEach(function (item) {
				item.addEventListener('input', function (event) {
					me.stacking = parseInt(this.value);
					progressiveBackgroundGen(me, 0);
				});
			});

			angleModeSelect.addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				const field = colorFieldSelect.value;
				if (field === 'all') {
					me.angleMode.fill(value);
				} else {
					me.angleMode[parseInt(field)] = value;
				}
				progressiveBackgroundGen(me, 2);
			});

			colorFieldSelect.addEventListener('input', function (event) {
				const field = this.value;
				if (field === 'all') {
					me.angleMode.fill(parseInt(angleModeSelect.value));
					colorModInput.value = '';
				} else {
					const fieldNum = parseInt(field);
					angleModeSelect.value = me.angleMode[fieldNum];
					colorModInput.value = me.colorMod[fieldNum];
				}
			});

			colorModInput.addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (value > 0) {
					const field = colorFieldSelect.value;
					if (field === 'all') {
						me.colorMod.fill(value);
					} else {
						me.colorMod[parseInt(field)] = value;
					}
					progressiveBackgroundGen(me, 2);
				}
			});

			optionsDoc.getElementById('phyllotaxis-hue-min').addEventListener('input', function (event) {
				me.hueMin = parseFloat(this.value);
				progressiveBackgroundGen(me, 2);
			});

			optionsDoc.getElementById('phyllotaxis-hue-max').addEventListener('input', function (event) {
				me.hueMax = parseFloat(this.value);
				progressiveBackgroundGen(me, 2);
			});

			optionsDoc.getElementById('phyllotaxis-hue-mode').addEventListener('input', function (event) {
				me.hueMode = this.value;
				$('#phyllotaxis-hue-max').collapse(this.value === 'c' ? 'hide' : 'show');
				progressiveBackgroundGen(me, 2);
			});

			optionsDoc.getElementById('phyllotaxis-saturation-min').addEventListener('input', function (event) {
				me.saturationMin = parseFloat(this.value);
				progressiveBackgroundGen(me, 2);
			});

			optionsDoc.getElementById('phyllotaxis-saturation-max').addEventListener('input', function (event) {
				me.saturationMax = parseFloat(this.value);
				progressiveBackgroundGen(me, 2);
			});

			optionsDoc.getElementById('phyllotaxis-saturation-mode').addEventListener('input', function (event) {
				me.saturationMode = this.value;
				$('#phyllotaxis-saturation-max').collapse(this.value === 'c' ? 'hide' : 'show');
				progressiveBackgroundGen(me, 2);
			});

			optionsDoc.getElementById('phyllotaxis-lightness-min').addEventListener('input', function (event) {
				me.lightnessMin = parseFloat(this.value);
				progressiveBackgroundGen(me, 2);
			});

			optionsDoc.getElementById('phyllotaxis-lightness-max').addEventListener('input', function (event) {
				me.lightnessMax = parseFloat(this.value);
				progressiveBackgroundGen(me, 2);
			});

			optionsDoc.getElementById('phyllotaxis-lightness-mode').addEventListener('input', function (event) {
				me.lightnessMode = this.value;
				$('#phyllotaxis-lightness-max').collapse(this.value === 'c' ? 'hide' : 'show');
				progressiveBackgroundGen(me, 2);
			});

			optionsDoc.getElementById('phyllotaxis-opacity-min').addEventListener('input', function (event) {
				me.opacityMin = parseFloat(this.value);
				progressiveBackgroundGen(me, 2);
			});

			optionsDoc.getElementById('phyllotaxis-opacity-max').addEventListener('input', function (event) {
				me.opacityMax = parseFloat(this.value);
				progressiveBackgroundGen(me, 2);
			});

			optionsDoc.getElementById('phyllotaxis-opacity-mode').addEventListener('input', function (event) {
				me.opacityMode = this.value;
				$('#phyllotaxis-opacity-max').collapse(this.value === 'c' ? 'hide' : 'show');
				progressiveBackgroundGen(me, 2);
			});

			optionsDoc.getElementById('phyllotaxis-lighting').addEventListener('input', function (event) {
				me.lighting = parseFloat(this.value);
				progressiveBackgroundGen(me, 2);
			});

			optionsDoc.getElementById('phyllotaxis-contrast').addEventListener('input', function (event) {
				me.contrast = Math.sqrt(parseFloat(this.value));
				progressiveBackgroundGen(me, 2);
			});

			optionsDoc.getElementById('phyllotaxis-shadow-angle').addEventListener('input', function (event) {
				me.shadowAngle = (parseFloat(this.value) - 0.5) * Math.PI;
				progressiveBackgroundGen(me, 2);
			});

			optionsDoc.getElementById('phyllotaxis-shadow-blur').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (value >= 0) {
					me.shadowBlur = value;
					progressiveBackgroundGen(me, 2);
				}
			});

			optionsDoc.getElementById('phyllotaxis-shadow-offset').addEventListener('input', function (event) {
				me.shadowOffset = parseFloat(this.value);
				progressiveBackgroundGen(me, 2);
			});

			optionsDoc.getElementById('phyllotaxis-spot-offset').addEventListener('input', function (event) {
				me.spotOffset = parseFloat(this.value);
				progressiveBackgroundGen(me, 2);
			});

			optionsDoc.getElementById('phyllotaxis-shadow-color').addEventListener('input', function (event) {
				const shade = parseInt(this.max) - parseInt(this.value);
				me.shadowColor = rgba(shade, shade, shade, 1);
				progressiveBackgroundGen(me, 2);
			});

			return optionsDoc;
		});

		this.points = undefined;

		this.exponent = 0.5;
		this.angle = 2 * Math.PI * 0.382;
		this.spread = 1;
		this.scale = 20;
		this.start = 1;
		this.step = 1;
		this.stacking = -1;
		this.petalSize = 15;
		this.petalEnlargement = 0;
		this.maxPetals = 10000;

		this.angleMode = new Array(4);
		this.angleMode.fill(0);
		this.colorMod = new Array(4);
		this.colorMod.fill(256);

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

		this.lighting = 0;
		this.contrast = 0;
		this.shadowColor = 'black';
		this.shadowAngle = 0.25 * Math.PI;
		this.shadowBlur = 0;
		this.shadowOffset = 0;
		this.spotOffset = 0;
	}

	backgroundGenerators.set('phyllotaxis', new Phyllotaxis());

	class Petal {
		constructor(r, theta, petalSize) {
			this.r = r;
			this.theta = theta;
			this.radius = petalSize;
		}
	}

	Phyllotaxis.prototype.angularColor = function (r, degrees, n, property, range, min) {
		let value;
		switch (this.angleMode[property]) {
		case 0:
			value = degrees;
			break;
		case 1:
			value = n;
			break;
		case 2:
			value = degrees - r;
			break;
		}
		const mod = this.colorMod[property];
		return (value % mod) * range / mod + min;
	};

	Phyllotaxis.prototype.generate = function* (beginTime, context, canvasWidth, canvasHeight, preview) {

		if (preview < 2 || this.points === undefined) {
			const angle = this.angle;
			const maxR = Math.max(canvasWidth, canvasHeight) / 2;
			const exponent = this.exponent;
			const scale = this.scale ** (exponent / 0.5) / (maxR ** (2 * exponent - 1));
			const petalSize = this.petalSize;
			const petalEnlargement = this.petalEnlargement;
			const maxPetals = preview === 1 ? 5000 : this.maxPetals;

			this.points = []
			let n = this.start;
			let numPetals = 0;
			let r = scale * n ** exponent;
			const skip = this.skip;

			let currentPetalSize;
			if (petalEnlargement >= 0) {
				currentPetalSize = Math.max(petalSize, petalEnlargement * Math.sqrt(r));
			} else {
				currentPetalSize = Math.max(0.5, petalSize + petalEnlargement * Math.sqrt(r));
			}

			while (numPetals <= maxPetals && r + currentPetalSize < maxR) {
				const phi = n * angle;
				if (numPetals % skip !== skip - 1) {
					this.points.push(new Petal(r, phi, currentPetalSize));
				}
				numPetals++;
				const inc = n === 0 ? 1 : 1 / (n ** ((1 - this.spread) * exponent));
				n += inc;
				r = scale * n ** exponent;
				let radius
				if (petalEnlargement >= 0) {
					currentPetalSize = Math.max(petalSize, petalEnlargement * Math.sqrt(r));
				} else {
					currentPetalSize = Math.max(0.5, petalSize + petalEnlargement * Math.sqrt(r));
				}
			}
		}

		const numPoints = this.points.length;
		if (numPoints === 0) {
			return;
		}
		const lastR = this.points[numPoints - 1].r;
		const lastRSquared = lastR * lastR;
		const stacking = this.stacking;

		let hue = this.hueMin;
		let saturation = this.saturationMin;
		let lightness = this.lightnessMin;
		let opacity = this.opacityMin;
		const hueRange = this.hueMax - this.hueMin;
		const saturationRange = this.saturationMax - this.saturationMin;
		const lightnessRange = this.lightnessMax - this.lightnessMin;
		const opacityRange = this.opacityMax - this.opacityMin;

		context.translate(canvasWidth / 2, canvasHeight / 2);
		context.shadowColor = this.shadowColor;
		context.shadowBlur = this.shadowBlur;

		for (let i = stacking > 0 ? 0 : numPoints - 1; i >= 0 && i < numPoints; i += stacking) {
			const point = this.points[i];
			const r = point.r;
			const theta = point.theta;
			const x = r * Math.cos(theta);
			const y = r * Math.sin(theta);
			const petalSize = point.radius;
			context.beginPath();
			context.arc(x, y, petalSize, 0, TWO_PI);
			const degrees = theta / Math.PI * 180;
			const radialValue = (r * r) / lastRSquared;

			switch (this.hueMode) {
			case 'a':
				hue = this.angularColor(r, degrees, i, 0, hueRange, this.hueMin);
				break;
			case 'r':
				hue = this.hueMin + hueRange * radialValue;
				break;
			}

			switch (this.saturationMode) {
			case 'a':
				saturation = this.angularColor(r, degrees, i, 1, saturationRange, this.saturationMin);
				break;
			case 'r':
				saturation = this.saturationMin + saturationRange * radialValue;
				break;
			}

			switch (this.lightnessMode) {
			case 'a':
				lightness = this.angularColor(r, degrees, i, 2, lightnessRange, this.lightnessMin);
				break;
			case 'r':
				lightness = this.lightnessMin + lightnessRange * radialValue;
				break;
			}

			switch (this.opacityMode) {
			case 'a':
				opacity = this.angularColor(r, degrees, i, 3, opacityRange, this.opacityMin);
				break;
			case 'r':
				opacity = this.opacityMin + opacityRange * radialValue;
				break;
			}

			const shadowR = petalSize * this.shadowOffset;
			const shadowAngle = this.shadowAngle;
			const cos = Math.cos(shadowAngle);
			const sin = Math.sin(shadowAngle);
			context.shadowOffsetX = shadowR * cos;
			context.shadowOffsetY = shadowR * sin;

			const spotX = x - this.spotOffset * petalSize * cos;
			const spotY = y - this.spotOffset * petalSize * sin;
			const gradient = context.createRadialGradient(spotX, spotY, 0, x, y, petalSize);
			const innerColor = hsla(hue, saturation, lightness, opacity);
			const outerColor = hsla(hue, saturation, lightness * (1 - this.contrast), opacity);
			gradient.addColorStop(this.lighting, innerColor);
			gradient.addColorStop(1, outerColor);
			context.fillStyle = gradient;

			context.fill();
		}
	};

}
