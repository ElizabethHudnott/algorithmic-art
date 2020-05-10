{

	class Shape {
		constructor(x, y, r, growing) {
			this.x = x;
			this.y = y;
			this.r = r;
			this.originalR = r;
			this.growing = growing;
		}
	}

	class PolygonRendering {
		constructor(n, star) {
			this.numSides = n;
			this.star = star;
			this.fillStyle = 'yellow';
			this.strokeStyle = 'black';
			this.outlineFraction = 0.03;
			this.frequency = 1;
			/*	1  Outline only
			 *	2  Fill only
			 *	3  Outline & fill, separate
			 *	7  Separate outline and fill, no outline in centre (4+3)
			 *	11 Gradient (8+3)
			 *	14 Image, no outline (12+2)
			 *	15 Image, with outline (12+3)
			 */
			this.mode = 1;

			this.exteriorAngle = TWO_PI / n;
		}

		draw(context, x, y, r, rotationFraction) {
			const n = this.numSides;
			const mode = this.mode;

			let lineWidth;
			if ((mode & 1) === 0) {
				// No outline
				lineWidth = 0;
			} else {
				lineWidth = Math.max(Math.round(r * this.outlineFraction), 1);
			}

			const radius = r - lineWidth / 2;
			let paths = [];

			const star = this.star;

			let rotation;
			if (n % 2 === 0 && n !== 4) {
				rotation = Math.PI * (1 / n - 0.5);
			} else {
				rotation = Math.PI * ((1 + Math.random() * 0.5) * 2 / n - 0.5);
			}


		}
	}

	function CirclePacking() {
		const me = this;
		this.title = 'Circle Packing';
		this.hasRandomness = true;

		this.optionsDocument = downloadFile('circle-packing.html', 'document').then(function (optionsDoc) {

			const maxGrowthInput = optionsDoc.getElementById('circle-pack-max-growth');

			function setShape(event) {
				me.circular = this.value === 'true';
				progressiveBackgroundGen(me, 0);
			}

			for (let item of optionsDoc.querySelectorAll('input[name=circle-pack-shape]')) {
				item.addEventListener('input', setShape);
			};

			optionsDoc.getElementById('circle-pack-num-seeds').addEventListener('input', function (event) {
				const value = parseInt(this.value);
				if (value >= 0) {
					me.numSeeds = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('circle-pack-min-seed-size').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (value >= 0.5) {
					me.minSeedSize = value;
					progressiveBackgroundGen(me, 0);
				}
			});


			const maxSeedSizeInput = optionsDoc.getElementById('circle-pack-max-seed-size');
			maxSeedSizeInput.addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (value >= 0.5) {
					me.maxSeedSize = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			maxSeedSizeInput.addEventListener('change', function (event) {
				const value = me.maxSeedSize;
				if (me.maxGrowth > value) {
					maxGrowthInput.value = value;
					me.maxGrowth = value;
				}
				progressiveBackgroundGen(me, 0);
			});

			optionsDoc.getElementById('circle-pack-min-size').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (value >= 0.5) {
					me.minSize = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('circle-pack-max-new-size').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (value >= 0.5) {
					me.maxNewSize = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('circle-pack-growth-rate').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (value >= 0.5) {
					me.growthRate = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			maxGrowthInput.addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (value >= 0.5) {
					me.maxGrowth = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('circle-pack-gap').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (value >= 0) {
					me.bufferSize = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('circle-pack-edge-gap').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (value >= 0) {
					me.edgeBufferSize = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('circle-pack-max-shapes').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (value >= 0) {
					me.maxShapes = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			optionsDoc.getElementById('circle-pack-max-attempts').addEventListener('input', function (event) {
				const value = parseFloat(this.value);
				if (value >= 1) {
					me.maxAttempts = value;
					progressiveBackgroundGen(me, 0);
				}
			});

			return optionsDoc;
		});

		this.seedShapes = [];
		this.numSeeds = 5;
		this.minSeedSize = 130;
		this.maxSeedSize = 180;
		this.minSize = 3;
		this.circular = false;
		this.bufferSize = 4;
		this.edgeBufferSize = 8;

		this.maxShapes = 2000;
		this.maxNewSize = 36;
		this.maxAttempts = 1000;
		this.growthRate = 0.5;
		this.maxGrowth = 90;
		this.numNewShapes = 25;
		this.shapes = undefined;
	}

	CirclePacking.prototype.purgeCache = function () {
		this.shapes = undefined;
	}

	CirclePacking.prototype.generate = function* (context, canvasWidth, canvasHeight, preview) {
		const shapes = this.seedShapes.slice();
		this.shapes = shapes;

		const minSeedSize = this.minSeedSize;
		const seedSizeRange = Math.max(this.maxSeedSize - minSeedSize, 0);
		const edgeBuffer = this.edgeBufferSize;

		const centreX = canvasWidth / 2;
		const centreY = canvasHeight / 2;
		const boundaryR = Math.min(centreX, centreY);

		const innerWidth = canvasWidth - 2 * edgeBuffer;
		const innerHeight = canvasHeight - 2 * edgeBuffer;

		if (this.circular) {
			for (let i = shapes.length; i < this.numSeeds; i++) {
				const theta = Math.random() * TWO_PI;
				const radius = minSeedSize + Math.random() * seedSizeRange;
				const maxR = boundaryR - edgeBuffer - radius;
				const r = Math.sqrt(Math.random()) * maxR;
				const x = centreX + r * Math.cos(theta);
				const y = centreY + r * Math.sin(theta);
				shapes.push(new Shape(x, y, radius, false));
			}
		} else {
			for (let i = shapes.length; i < this.numSeeds; i++) {
				const radius = minSeedSize + Math.random() * seedSizeRange;
				const xRange = innerWidth - 2 * radius;
				const yRange = innerHeight - 2 * radius;
				const x = Math.random() * xRange + edgeBuffer + radius;
				const y = Math.random() * yRange + edgeBuffer + radius;
				shapes.push(new Shape(x, y, radius, false));
			}
		}
		let numFullSize = this.removeOverlaps(shapes, canvasWidth, canvasHeight);

		const buffer = this.bufferSize;
		const maxShapes = this.maxShapes;
		const minSize = this.minSize;
		const newSizeRange = Math.max(this.maxNewSize - minSize, 0);
		const maxAttempts = this.maxAttempts;

		let numGrowing = 0;
		let attempts = 0;
		let loops = 0;
		do {
			if (numGrowing > 0) {
				for (let i = 0; i < shapes.length; i++)	{
					const shape1 = shapes[i];
					if (!shape1.growing) {
						continue;
					}
					const x = shape1.x;
					const y = shape1.y;
					let minDistance;
					if (this.circular) {
						const xDist = x - centreX;
						const yDist = y - centreY;
						const r = Math.hypot(xDist, yDist);
						minDistance = boundaryR - edgeBuffer - r;
					} else {
						minDistance = Math.min(x, y, canvasWidth - x, canvasHeight - y) - edgeBuffer;
					}
					for (let j = 0; j < shapes.length; j++) {
						if (i === j) {
							continue;
						}
						const shape2 = shapes[j];
						const xDist = shape2.x - shape1.x;
						const yDist = shape2.y - shape1.y;
						const dist = Math.hypot(xDist, yDist) - shape2.r - buffer;
						if (dist < minDistance) {
							minDistance = dist;
						}
					}
					const oldRadius = shape1.r;
					const grownRadius = oldRadius + this.growthRate;
					let newRadius = Math.min(grownRadius, minDistance, this.maxGrowth);
					if ((newRadius >= minSeedSize && numFullSize >= this.numSeeds)) {
						newRadius = oldRadius;
					}
					if (newRadius !== grownRadius) {
						/*
						if (this.maxGrowth < oldRadius) {
							newRadius = oldRadius;
						}
						*/
						shape1.growing = false;
						numGrowing--;
						if (newRadius >= minSeedSize) {
							numFullSize++;
						}
					}
					shape1.r = newRadius;
				}
			}
			if (shapes.length < maxShapes && attempts < maxAttempts) {
				for (let i = 0; i < this.numNewShapes; i++) {
					let x, y, radius;
					attempts = 0;
					do {
						radius =  minSize + Math.random() + newSizeRange;
						if (this.circular) {
							const theta = Math.random() * TWO_PI;
							const maxR = boundaryR - edgeBuffer;
							const r = Math.sqrt(Math.random()) * maxR;
							x = centreX + r * Math.cos(theta);
							y = centreY + r * Math.sin(theta);
							radius = Math.min(radius, maxR - r);
						} else {
							x = Math.random() * innerWidth;
							y = Math.random() * innerHeight;
							radius = Math.min(radius, x, y, innerWidth - x, innerHeight - y);
							x += edgeBuffer;
							y += edgeBuffer;
						}
						if (radius >= minSize) {
							for (let j = 0; j < shapes.length; j++) {
								const shape = shapes[j];
								const xDist = x - shape.x;
								const yDist = y - shape.y;
								const dist = Math.hypot(xDist, yDist) - shape.r;
								radius = Math.min(radius, dist - buffer);
								if (radius < minSize) {
									break;
								}
							}
						}
						attempts++;
					} while (radius < minSize && attempts < maxAttempts);

					if (radius >= minSize) {
						shapes.push(new Shape(x, y, radius, true));
						numGrowing++;
					} else if (attempts === maxAttempts) {
						break;
					}
				}
			}
		} while (numGrowing > 0 || (shapes.length < maxShapes && attempts < maxAttempts));

		for (let i = 0; i < shapes.length; i++) {
			const shape = shapes[i];
			context.beginPath();
			context.arc(shape.x, shape.y, shape.r, 0, TWO_PI);
			context.stroke();
		}
	}

	CirclePacking.prototype.removeOverlaps = function (shapes, width, height) {
		const minSize = this.minSize;
		const buffer = this.bufferSize;
		const edgeBuffer = this.edgeBufferSize;
		const centreX = width / 2;
		const centreY = height / 2;
		const boundaryR = Math.min(centreX, centreY);

		let numShapes = shapes.length;
		let i = 1;
		while (i < numShapes) {
			const shape1 = shapes[i];
			const x1 = shape1.x;
			const y1 = shape1.y;
			let r1 = shape1.r;
			let removed = false;
			for (let j = 0; j < i; j++) {
				const shape2 = shapes[j];
				const x2 = shape2.x;
				const y2 = shape2.y;
				let r2 = shape2.r;
				const xDist = x2 - x1;
				const yDist = y2 - y1;
				const dist = Math.hypot(xDist, yDist);
				const rSum = r1 + r2 + buffer;
				const excessRadius = rSum - dist;
				if (excessRadius > 0) {
					// TODO Try to move shape i away from shape j
					const shape2Weighting = r2 / (r1 + r2);
					const maxR2 = dist - buffer - minSize;
					if (maxR2 < minSize) {
						shapes.splice(i, 1);
						numShapes--;
						removed = true;
						break;
					}
					const idealR2 = r2 - shape2Weighting * excessRadius;
					r2 = Math.max(minSize, Math.min(idealR2, maxR2));
					r1 = dist - r2 - buffer;
					shape1.r = r1;
					shape2.r = r2;
				}
			}
			if (!removed) {
				i++;
			}
		}

		const minSeedSize = this.minSeedSize;
		let fullSize = 0;
		for (i = 0; i < numShapes; i++) {
			const shape1 = shapes[i];
			if (shape1.r !== shape1.originalR) {
				const x = shape1.x;
				const y = shape1.y;
				let minDistance;
				if (this.circular) {
					const xDist = x - centreX;
					const yDist = y - centreY;
					const r = Math.hypot(xDist, yDist);
					minDistance = boundaryR - edgeBuffer - r;
				} else {
					minDistance = Math.min(x, y, width - x, height - y) - edgeBuffer;
				}
				for (let j = 0; j < numShapes; j++) {
					if (i === j) {
						continue;
					}
					const shape2 = shapes[j];
					const xDist = shape2.x - shape1.x;
					const yDist = shape2.y - shape1.y;
					const dist = Math.hypot(xDist, yDist) - shape2.r - buffer;
					if (dist < minDistance) {
						minDistance = dist;
					}
				}
				shape1.r = Math.min(minDistance, shape1.originalR);
			}
			if (shape1.r >= minSeedSize) {
				fullSize++;
			}
		}
		return fullSize;
	}

	addBgGenerator(CirclePacking);
}
