function Phyllotaxis() {
	const me = this;
	this.title = 'Phyllotaxis';
	this.credits = 'Inspired by Daniel Shiffman\'s <a href="https://thecodingtrain.com/CodingChallenges/030-phyllotaxis.html" target="_blank">Coding Challenge #30</a>, which he developed from the book <a href="http://algorithmicbotany.org/papers/#abop" target="_blank">The Algorithmic Beauty of Plants</a> by Prusinkiewicz &amp; Lindenmayer.';
	this.hasRandomness = false;

	this.optionsDocument = downloadFile('phyllotaxis.html', 'document').then(function (optionsDoc) {
		const colorFieldSelect = optionsDoc.getElementById('phyllotaxis-color-field');
		const angleModeSelect = optionsDoc.getElementById('phyllotaxis-angle-mode');
		const colorModInput = optionsDoc.getElementById('phyllotaxis-color-mod');

		function fullRedraw() {
			progressiveBackgroundGen(me, 0);
		}

		function fullRecolor() {
			progressiveBackgroundGen(me, 2);
		}

		const radiusSlider = optionsDoc.getElementById('phyllotaxis-radius');

		optionsDoc.getElementById('phyllotaxis-radius-preset').addEventListener('input', function (event) {
			const value = this.value;
			const isCustom = value === 'custom';
			$(radiusSlider).collapse(isCustom ? 'show' : 'hide');
			me.radiusPreset = value;
			if (isCustom) {
				me.radius = parseFloat(radiusSlider.value);
			}
			progressiveBackgroundGen(me, 0);
		});

		radiusSlider.addEventListener('input', function (event) {
			me.radius = parseFloat(this.value);
			progressiveBackgroundGen(me, 1);
		});
		radiusSlider.addEventListener('pointerup', fullRedraw);
		radiusSlider.addEventListener('keyup', fullRedraw);

		optionsDoc.getElementById('phyllotaxis-max-petals').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0) {
				me.maxPetals = value * 1000;
				progressiveBackgroundGen(me, 0);
			}
		});

		optionsDoc.getElementById('phyllotaxis-clipping').addEventListener('input', function (event) {
			me.clipping = this.checked ? 1 : -1;
			progressiveBackgroundGen(me, 0);
		});

		optionsDoc.getElementById('phyllotaxis-bidirectional').addEventListener('input', function (event) {
			me.bidirectional = this.checked;
			progressiveBackgroundGen(me, 0);
		});

		const angleSlider = optionsDoc.getElementById('phyllotaxis-angle-range');
		angleSlider.addEventListener('input', function (event) {
			me.angle = parseFloat(this.value) * TWO_PI;
			progressiveBackgroundGen(me, 1);
		});
		angleSlider.addEventListener('pointerup', fullRedraw);
		angleSlider.addEventListener('keyup', fullRedraw);

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

		optionsDoc.getElementById('phyllotaxis-aspect-ratio').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value > 0) {
				me.aspectRatio = value;
				progressiveBackgroundGen(me, 0);
			}
		});

		optionsDoc.getElementById('phyllotaxis-start').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
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

		const polygonOptions = optionsDoc.querySelectorAll('.phyllotaxis-polygon-opts');
		function setShape(event) {
			const shape = this.value;
			me.petalShape = shape;
			const shapeIsImage = shape === 'i';
			for (let element of polygonOptions) {
				element.hidden = shapeIsImage;
			};
			if (shapeIsImage && bgGeneratorImage.src === '') {
				document.getElementById('background-gen-image-upload').click();
			} else {
				progressiveBackgroundGen(me, 2);
			}
		}

		for (let item of optionsDoc.querySelectorAll('input[name=phyllotaxis-petal-shape]')) {
			item.addEventListener('input', setShape);
		};

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

		optionsDoc.getElementById('phyllotaxis-petal-stretch').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value > 0) {
				me.petalStretch = value;
				progressiveBackgroundGen(me, 0);
			}
		});

		optionsDoc.getElementById('phyllotaxis-petal-rotation').addEventListener('input', function (event) {
			me.petalRotation = parseFloat(this.value) * Math.PI;
			progressiveBackgroundGen(me, 2);
		});

		function setStacking(event) {
			me.stacking = parseInt(this.value);
			progressiveBackgroundGen(me, 0);
		}

		for (let item of optionsDoc.querySelectorAll('input[name=phyllotaxis-stack]')) {
			item.addEventListener('input', setStacking);
		};

		angleModeSelect.addEventListener('input', function (event) {
			const value = this.value;
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
				me.angleMode.fill(angleModeSelect.value);
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

		const hueMinInput = optionsDoc.getElementById('phyllotaxis-hue-min');
		hueMinInput.addEventListener('input', function (event) {
			me.hueMin = parseFloat(this.value);
			progressiveBackgroundGen(me, 3);
		});
		hueMinInput.addEventListener('pointerup', fullRecolor);
		hueMinInput.addEventListener('keyup', fullRecolor);

		const hueMaxInput = optionsDoc.getElementById('phyllotaxis-hue-max');
		hueMaxInput.addEventListener('input', function (event) {
			me.hueMax = parseFloat(this.value);
			progressiveBackgroundGen(me, 3);
		});
		hueMaxInput.addEventListener('pointerup', fullRecolor);
		hueMaxInput.addEventListener('keyup', fullRecolor);

		optionsDoc.getElementById('phyllotaxis-hue-mode').addEventListener('input', function (event) {
			me.hueMode = this.value;
			$('#phyllotaxis-hue-max').collapse(this.value === 'c' ? 'hide' : 'show');
			progressiveBackgroundGen(me, 2);
		});

		const saturationMinInput = optionsDoc.getElementById('phyllotaxis-saturation-min');
		saturationMinInput.addEventListener('input', function (event) {
			me.saturationMin = parseFloat(this.value);
			progressiveBackgroundGen(me, 3);
		});
		saturationMinInput.addEventListener('pointerup', fullRecolor);
		saturationMinInput.addEventListener('keyup', fullRecolor);

		const saturationMaxInput = optionsDoc.getElementById('phyllotaxis-saturation-max');
		saturationMaxInput.addEventListener('input', function (event) {
			me.saturationMax = parseFloat(this.value);
			progressiveBackgroundGen(me, 3);
		});
		saturationMaxInput.addEventListener('pointerup', fullRecolor);
		saturationMaxInput.addEventListener('keyup', fullRecolor);

		optionsDoc.getElementById('phyllotaxis-saturation-mode').addEventListener('input', function (event) {
			me.saturationMode = this.value;
			$('#phyllotaxis-saturation-max').collapse(this.value === 'c' ? 'hide' : 'show');
			progressiveBackgroundGen(me, 2);
		});

		const lightnessMinInput = optionsDoc.getElementById('phyllotaxis-lightness-min');
		lightnessMinInput.addEventListener('input', function (event) {
			me.lightnessMin = parseFloat(this.value);
			progressiveBackgroundGen(me, 3);
		});
		lightnessMinInput.addEventListener('pointerup', fullRecolor);
		lightnessMinInput.addEventListener('keyup', fullRecolor);

		const lightnessMaxInput = optionsDoc.getElementById('phyllotaxis-lightness-max');
		lightnessMaxInput.addEventListener('input', function (event) {
			me.lightnessMax = parseFloat(this.value);
			progressiveBackgroundGen(me, 3);
		});
		lightnessMaxInput.addEventListener('pointerup', fullRecolor);
		lightnessMaxInput.addEventListener('keyup', fullRecolor);

		optionsDoc.getElementById('phyllotaxis-lightness-mode').addEventListener('input', function (event) {
			me.lightnessMode = this.value;
			$('#phyllotaxis-lightness-max').collapse(this.value === 'c' ? 'hide' : 'show');
			progressiveBackgroundGen(me, 2);
		});

		const opacityMinInput = optionsDoc.getElementById('phyllotaxis-opacity-min');
		opacityMinInput.addEventListener('input', function (event) {
			me.opacityMin = parseFloat(this.value);
			progressiveBackgroundGen(me, 3);
		});
		opacityMinInput.addEventListener('pointerup', fullRecolor);
		opacityMinInput.addEventListener('keyup', fullRecolor);

		const opacityMaxInput = optionsDoc.getElementById('phyllotaxis-opacity-max');
		opacityMaxInput.addEventListener('input', function (event) {
			me.opacityMax = parseFloat(this.value);
			progressiveBackgroundGen(me, 3);
		});
		opacityMaxInput.addEventListener('pointerup', fullRecolor);
		opacityMaxInput.addEventListener('keyup', fullRecolor);

		optionsDoc.getElementById('phyllotaxis-opacity-mode').addEventListener('input', function (event) {
			me.opacityMode = this.value;
			$('#phyllotaxis-opacity-max').collapse(this.value === 'c' ? 'hide' : 'show');
			progressiveBackgroundGen(me, 2);
		});

		const lightingInput = optionsDoc.getElementById('phyllotaxis-lighting');
		lightingInput.addEventListener('input', function (event) {
			me.lighting = parseFloat(this.value);
			progressiveBackgroundGen(me, 3);
		});
		lightingInput.addEventListener('pointerup', fullRecolor);
		lightingInput.addEventListener('keyup', fullRecolor);

		const contrastInput = optionsDoc.getElementById('phyllotaxis-contrast');
		contrastInput.addEventListener('input', function (event) {
			me.contrast = Math.sqrt(parseFloat(this.value));
			progressiveBackgroundGen(me, 3);
		});
		contrastInput.addEventListener('pointerup', fullRecolor);
		contrastInput.addEventListener('keyup', fullRecolor);

		const shadowAngleInput = optionsDoc.getElementById('phyllotaxis-shadow-angle');
		shadowAngleInput.addEventListener('input', function (event) {
			me.shadowAngle = (parseFloat(this.value) - 0.5) * Math.PI;
			progressiveBackgroundGen(me, 3);
		});
		shadowAngleInput.addEventListener('pointerup', fullRecolor);
		shadowAngleInput.addEventListener('keyup', fullRecolor);

		const shadowBlurInput = optionsDoc.getElementById('phyllotaxis-shadow-blur');
		shadowBlurInput.addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (value >= 0) {
				me.shadowBlur = value;
				progressiveBackgroundGen(me, 3);
			}
		});
		shadowBlurInput.addEventListener('pointerup', fullRecolor);
		shadowBlurInput.addEventListener('keyup', fullRecolor);

		const shadowOffsetInput = optionsDoc.getElementById('phyllotaxis-shadow-offset');
		shadowOffsetInput.addEventListener('input', function (event) {
			me.shadowOffset = parseFloat(this.value);
			progressiveBackgroundGen(me, 3);
		});
		shadowOffsetInput.addEventListener('pointerup', fullRecolor);
		shadowOffsetInput.addEventListener('keyup', fullRecolor);

		const spotOffsetInput = optionsDoc.getElementById('phyllotaxis-spot-offset');
		spotOffsetInput.addEventListener('input', function (event) {
			me.spotOffset = parseFloat(this.value);
			progressiveBackgroundGen(me, 3);
		});
		spotOffsetInput.addEventListener('pointerup', fullRecolor);
		spotOffsetInput.addEventListener('keyup', fullRecolor);

		const shadowColorInput = optionsDoc.getElementById('phyllotaxis-shadow-color');
		shadowColorInput.addEventListener('input', function (event) {
			me.shadowColor = rgba(0, 0, 0, parseFloat(this.value));
			progressiveBackgroundGen(me, 3);
		});
		shadowColorInput.addEventListener('pointerup', fullRecolor);
		shadowColorInput.addEventListener('keyup', fullRecolor);

		const outlineInput = optionsDoc.getElementById('phyllotaxis-outline');
		outlineInput.addEventListener('input', function (event) {
			me.strokeStyle = 'rgba(0, 0, 0, ' + this.value + ')';
			progressiveBackgroundGen(me, 3);
		});
		outlineInput.addEventListener('pointerup', fullRecolor);
		outlineInput.addEventListener('keyup', fullRecolor);

		const centerInnerRadiusInput = optionsDoc.getElementById('phyllotaxis-center-inner-radius');
		centerInnerRadiusInput.addEventListener('input', function (event) {
			me.centerInnerRadius = parseFloat(this.value);
			progressiveBackgroundGen(me, 3);
		});
		centerInnerRadiusInput.addEventListener('pointerup', fullRecolor);
		centerInnerRadiusInput.addEventListener('keyup', fullRecolor);

		const centerMidRadiusInput = optionsDoc.getElementById('phyllotaxis-center-mid-radius');
		centerMidRadiusInput.addEventListener('input', function (event) {
			me.centerMidRadius = parseFloat(this.value);
			progressiveBackgroundGen(me, 3);
		});
		centerMidRadiusInput.addEventListener('pointerup', fullRecolor);
		centerMidRadiusInput.addEventListener('keyup', fullRecolor);

		const centerOuterRadiusInput = optionsDoc.getElementById('phyllotaxis-center-outer-radius');
		centerOuterRadiusInput.addEventListener('input', function (event) {
			me.centerOuterRadius = parseFloat(this.value);
			progressiveBackgroundGen(me, 3);
		});
		centerOuterRadiusInput.addEventListener('pointerup', fullRecolor);
		centerOuterRadiusInput.addEventListener('keyup', fullRecolor);

		optionsDoc.getElementById('phyllotaxis-center-inner-color').addEventListener('input', function (event) {
			me.centerInnerColor = this.value;
			progressiveBackgroundGen(me, 2);
		});

		optionsDoc.getElementById('phyllotaxis-center-mid-color').addEventListener('input', function (event) {
			me.centerMidColor = this.value;
			progressiveBackgroundGen(me, 2);
		});

		return optionsDoc;
	});

	this.centerInnerRadius = 0.10;
	this.centerMidRadius = 0.4;
	this.centerOuterRadius = 0;
	this.centerInnerColor = '#003300';
	this.centerMidColor = '#008800';

	this.points = undefined;
	this.radiusPreset = 'max';
	this.radius = 1;
	this.aspectRatio = 1;
	this.clipping = -1;
	this.bidirectional = false;

	this.exponent = 0.5;
	this.angle = TWO_PI * 0.382;
	this.spread = 1;
	this.scale = 20;
	this.start = 1;
	this.skip = 0;
	this.stacking = 0;
	this.petalShape = 'e';
	this.petalSize = 15;
	this.petalEnlargement = 0;
	this.petalStretch = 1;
	this.petalRotation = 0;
	this.maxPetals = 10000;
	this.strokeStyle = 'rgba(0, 0, 0, 0)';

	this.angleMode = new Array(4);
	this.angleMode.fill('t');
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
	this.shadowColor = '#000000';
	this.shadowAngle = 0.25 * Math.PI;
	this.shadowBlur = 0;
	this.shadowOffset = 0;
	this.spotOffset = 0;

	this.spriteSheet = document.createElement('CANVAS');
}

Phyllotaxis.prototype.purgeCache = function () {
	this.points = undefined;
}

Phyllotaxis.prototype.animatable = {
	continuous: [
		'radius', 'aspectRatio', 'clipping', 'exponent', 'angle', 'spread', 'scale',
		'petalSize', 'petalEnlargement', 'petalStretch', 'petalRotation',
		'colorMod', 'hueMin', 'hueMax', 'saturationMin',
		'saturationMax', 'lightnessMin', 'lightnessMax', 'opacityMin', 'opacityMax',
		'lighting', 'contrast', 'shadowColor', 'shadowAngle', 'shadowBlur',
		'shadowOffset', 'spotOffset', 'strokeStyle', 'centerInnerRadius',
		'centerMidRadius', 'centerOuterRadius', 'centerInnerColor', 'centerMidColor'
	],
	stepped: [
		'bidirectional', 'skip', 'stacking', 'petalShape', 'angleMode',
		'hueMode', 'saturationMode', 'lightnessMode', 'opacityMode'
	],
	pairedStepped: [
		['maxPetals', 'start']	// start moves towards maxPetals
	]
};

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
	case 't': 	// Theta
		value = degrees;
		break;
	case 'n': 	// n
		value = n + this.start;
		break;
	case 'd': 	// Difference
		value = degrees - r;
		break;
	}
	const mod = this.colorMod[property];
	return (value % mod) * range / mod + min;
};

/**
 *	Preview levels:
 *		0	Produce a full and accurate drawing.
 *		1	Draw only a limited number of petals.
 *		2	Don't recalculate the petal positions and sizes but redraw all of them.
 *		3	Don't recalculate the petal positions and sizes and redraw only a limited number of them.
 */
Phyllotaxis.prototype.generate = function* (context, canvasWidth, canvasHeight, preview) {
	const previewMaxPetals = 1500;
	const aspectRatio = this.aspectRatio;
	const hypotenuse = Math.hypot(canvasWidth / aspectRatio, canvasHeight) / 2;
	let maxR;
	if (this.radiusPreset === 'custom') {
		maxR = this.radius * hypotenuse;
	} else {
		maxR = Math[this.radiusPreset](canvasWidth / aspectRatio, canvasHeight) / 2;
		this.radius = maxR / hypotenuse;
	}

	const petalStretch = this.petalStretch;
	const petalDistortion = aspectRatio >= 1 ? petalStretch : 1 / petalStretch;

	if (preview < 2 || this.points === undefined) {
		const angle = this.angle;
		const exponent = this.exponent;
		const scale = this.scale ** (exponent / 0.5) / (maxR ** (2 * exponent - 1));
		const petalSize = this.petalSize;
		const petalEnlargement = this.petalEnlargement;
		const maxPetals = preview === 1 ? Math.min(previewMaxPetals, this.maxPetals) : this.maxPetals;
		const clipping = this.clipping;

		this.points = []
		let n = this.start;
		let numPetals = n - 1;
		let r = scale * n ** exponent;
		let skip = this.skip;
		if (skip === 1) {
			skip = 0;
		}

		let currentPetalSize;
		if (petalEnlargement >= 0) {
			currentPetalSize = Math.max(petalSize, petalEnlargement * Math.sqrt(r));
		} else {
			currentPetalSize = Math.max(0.5, petalSize + petalEnlargement * Math.sqrt(r));
		}

		const loopConditionMultiplier = clipping *  petalDistortion;
		while (numPetals < maxPetals && r < maxR + currentPetalSize * loopConditionMultiplier) {
			const phi = n * angle;
			if (numPetals % skip !== skip - 1) {
				this.points.push(new Petal(r, phi, currentPetalSize));
				if (this.bidirectional) {
					this.points.push(new Petal(r, -phi, currentPetalSize));
				}
			}
			numPetals++;
			const inc = r === 0 ? 1 : 1 / ((r / TWO_PI) ** (1 - this.spread));
			n += inc;
			r = scale * n ** exponent;
			if (petalEnlargement >= 0) {
				currentPetalSize = Math.max(petalSize, petalEnlargement * Math.sqrt(r));
			} else {
				currentPetalSize = Math.max(0.5, petalSize + petalEnlargement * Math.sqrt(r));
			}
		}
	}

	let numPoints = this.points.length;
	if (numPoints === 0) {
		return;
	}
	const lastCalculatedR = this.points[numPoints - 1].r
	if (preview >= 3) {
		numPoints = Math.min(numPoints, previewMaxPetals);
	}
	const lastR = this.points[numPoints - 1].r;
	const zoom = lastCalculatedR / lastR;
	const lastRSquared = lastR * lastR;
	let stacking = this.stacking;
	if (stacking == 0) {
		stacking = -1; // iterate from outermost to innermost
	}

	const petalShape = this.petalShape;
	const strokeStyle = this.strokeStyle;
	const fillRadius = petalShape === 'r' ? Math.SQRT2 : 1;

	let hue = this.hueMin;
	let saturation = this.saturationMin;
	let lightness = this.lightnessMin;
	let opacity = this.opacityMin;
	const hueRange = this.hueMax - this.hueMin;
	const saturationRange = this.saturationMax - this.saturationMin;
	const lightnessRange = this.lightnessMax - this.lightnessMin;
	const opacityRange = this.opacityMax - this.opacityMin;
	const contrast = this.lighting === 1  || petalShape === 'i' ? 0 : this.contrast;
	const shadowOffset = this.shadowOffset * (petalStretch >= 1 ? 1 : petalStretch);
	const shadowAngle = this.shadowAngle;
	let cosShadowAngle = 0, sinShadowAngle = 0;
	if (shadowOffset > 0) {
		cosShadowAngle = Math.cos(shadowAngle);
		sinShadowAngle = Math.sin(shadowAngle);
	}
	const spotOffset = this.spotOffset;

	let image, imageAspect, applyFilters, hueVaries, saturationVaries, lightnessVaries;
	if (petalShape === 'i') {
		const imageWidth = bgGeneratorImage.width;
		const imageHeight = bgGeneratorImage.height;
		imageAspect = imageHeight / imageWidth;
		applyFilters = preview === 0 || preview === 2;
		const variesRegExp = /[ar]/;
		hueVaries = variesRegExp.test(this.hueMode);
		saturationVaries = variesRegExp.test(this.saturationMode);
		lightnessVaries = variesRegExp.test(this.lightnessMode);
		if (hueVaries) {
			this.spriteSheet.width = imageWidth;
			this.spriteSheet.height = imageHeight;
			const spriteContext = this.spriteSheet.getContext('2d');
			spriteContext.filter = 'url("filters.svg#green")';
			spriteContext.drawImage(bgGeneratorImage, 0, 0);
			image = this.spriteSheet;
		} else {
			image = bgGeneratorImage;
		}
	}

	context.translate(canvasWidth / 2, canvasHeight / 2);

	const centerOuterRadius = this.centerOuterRadius * hypotenuse;
	if (centerOuterRadius > 0) {
		context.save();
		context.scale(aspectRatio, 1);
		context.beginPath();
		context.arc(0, 0, centerOuterRadius, 0, TWO_PI);
		const gradient = context.createRadialGradient(0, 0, 0, 0, 0, centerOuterRadius);
		const innnerColor = this.centerInnerColor;
		gradient.addColorStop(0, innnerColor);
		const midRadius = this.centerMidRadius;
		const innerRadius = this.centerInnerRadius * midRadius;
		gradient.addColorStop(innerRadius, innnerColor);
		const midColor = this.centerMidColor;
		gradient.addColorStop(midRadius, midColor);
		const [r, g, b] = parseColor(midColor)[1];
		gradient.addColorStop(1, rgba(r, g, b, 0));
		context.fillStyle = gradient;
		context.fill();
		context.restore();
	}

	const maxRX = maxR * aspectRatio;
	const maxRY = maxR;
	context.beginPath();
	context.ellipse(0, 0, maxRX, maxRY, 0, 0, TWO_PI);
	context.clip();

	const stroke = petalShape !== 'i' && strokeStyle !== 'rgba(0, 0, 0, 0)';
	context.strokeStyle = strokeStyle;
	context.shadowColor = this.shadowColor;
	context.shadowBlur = this.shadowBlur;

	for (let i = stacking > 0 ? 0 : numPoints - 1; i >= 0 && i < numPoints; i += stacking) {
		const point = this.points[i];
		const r = point.r;
		const theta = point.theta;
		const x = zoom * r * aspectRatio * Math.cos(theta);
		const y = zoom * r * Math.sin(theta);
		const petalSize = zoom * point.radius;

		const degrees = Math.abs(theta) / Math.PI * 180;
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

		const petalRotation = theta + HALF_PI + this.petalRotation;
		const shadowR = petalSize * shadowOffset;
		context.shadowOffsetX = shadowR * cosShadowAngle;
		context.shadowOffsetY = shadowR * sinShadowAngle;

		const innerColor = hsla(hue, saturation, lightness, opacity);
		if (contrast === 0) {
			context.fillStyle = innerColor;
		} else {
			let spotX = 0, spotY = 0;
			if (spotOffset > 0) {
				spotX = spotOffset * petalSize * Math.cos(-HALF_PI - shadowAngle - petalRotation);
				spotY = spotOffset * petalSize * Math.sin(-HALF_PI - shadowAngle - petalRotation);
			}
			const gradient = context.createRadialGradient(spotX, spotY, 0, 0, 0, petalSize * fillRadius);
			const outerColor = hsla(hue, saturation, lightness * (1 - this.contrast), opacity);
			gradient.addColorStop(1, outerColor);
			gradient.addColorStop(this.lighting, innerColor);
			context.fillStyle = gradient;
		}

		context.save();
		context.translate(x, y);
		context.rotate(petalRotation);

		switch (petalShape) {
		case 'e':	// Ellipse
			context.scale(1, petalStretch);
			context.beginPath();
			context.arc(0, 0, petalSize, 0, TWO_PI);
			context.fill();
			break;
		case 'r': // Rectangle
			context.scale(1, petalStretch);
			context.beginPath();
			context.rect(-petalSize, -petalSize, petalSize * 2, petalSize * 2);
			context.fill();
			break;
		case 'i':	// Image
			const imageResizedWidth = 2 * petalSize;
			const imageResizedHeight = 2 * petalSize * petalStretch * imageAspect;
			let filter = '';
			if (applyFilters) {
				if (hueVaries) {
					filter += 'hue-rotate(' + (hue - 120) + 'deg) ';
				}
				if (saturationVaries) {
					filter += 'saturate(' + saturation + ') ';
				}
				if (lightnessVaries) {
					const brightness = lightness * 2;
					filter += 'brightness(' + brightness + ') ';
				}
			}
			if (filter !== '') {
				context.filter = filter;
			}
			context.globalAlpha = opacity;
			context.drawImage(image, -imageResizedWidth / 2, -imageResizedHeight / 2, imageResizedWidth, imageResizedHeight);
		}
		if (stroke) {
			context.shadowOffsetX = 0;
			context.shadowOffsetY = 0;
			context.stroke();
		}
		context.restore();
	}
};

return Phyllotaxis;
