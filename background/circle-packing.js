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

	function CirclePacking() {
		const me = this;
		this.title = 'Circle Packing';
		this.hasRandomness = true;
		this.hasCustomImage = true;

		this.seedShapes = [];
		this.numSeeds = 20;
		this.meanSeedRadius = 200;
		this.seedRadiusRange = 100;
		this.minRadius = 6;
		this.circular = false;
		this.bufferSize = 4;
		this.edgeBufferSize = 6;

		this.maxShapes = 2000;
		this.maxNewRadius = 36;
		this.growthRate = 4;
		this.numNewShapes = 5;
		this.shapes = [];
	}

	backgroundGenerators.set('circle-packing', new CirclePacking);

	CirclePacking.prototype.generate = function* (beginTime, context, canvasWidth, canvasHeight, preview) {
		let shapes = this.seedShapes.slice();

		const seedRadius = this.meanSeedRadius;
		const radiusRange = this.seedRadiusRange;
		const minRadius = this.minRadius;
		const edgeBuffer = this.edgeBufferSize;

		const centreX = canvasWidth / 2;
		const centreY = canvasHeight / 2;
		const boundaryR = Math.min(centreX, centreY);

		const innerWidth = canvasWidth - 2 * edgeBuffer;
		const innerHeight = canvasHeight - 2 * edgeBuffer;

		if (this.circular) {
			context.beginPath();
			context.arc(centreX, centreY, boundaryR, 0, TWO_PI);
			context.stroke();
			for (let i = shapes.length; i < this.numSeeds; i++) {
				const theta = Math.random() * 2 * Math.PI;
				const radius = Math.max(minRadius, seedRadius + radiusRange * Math.random() - radiusRange / 2);
				const maxR = boundaryR - edgeBuffer - radius;
				const r = Math.sqrt(Math.random()) * maxR;
				const x = centreX + r * Math.cos(theta);
				const y = centreY + r * Math.sin(theta);
				shapes.push(new Shape(x, y, radius, false));
			}
		} else {
			for (let i = shapes.length; i < this.numSeeds; i++) {
				const radius = Math.max(minRadius, seedRadius + radiusRange * Math.random() - radiusRange / 2);
				const xRange = innerWidth - 2 * radius;
				const yRange = innerHeight - 2 * radius;
				const x = Math.random() * xRange + edgeBuffer + radius;
				const y = Math.random() * yRange + edgeBuffer + radius;
				shapes.push(new Shape(x, y, radius, false));
			}
		}
		this.removeOverlaps(shapes, canvasWidth, canvasHeight);

		const buffer = this.bufferSize;
		const maxShapes = this.maxShapes;
		const maxNewRadius = this.maxNewRadius;
		const maxAttempts = 10000;

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
						const r = Math.sqrt(xDist * xDist + yDist * yDist);
						minDistance = boundaryR - r;
					} else {
						minDistance = Math.min(x, y, canvasWidth - x, canvasHeight - y);
					}
					for (let j = 0; j < shapes.length; j++) {
						if (i === j) {
							continue;
						}
						const shape2 = shapes[j];
						const xDist = shape2.x - shape1.x;
						const yDist = shape2.y - shape1.y;
						const dist = Math.sqrt(xDist * xDist + yDist * yDist) - shape2.r;
						if (dist < minDistance) {
							minDistance = dist;
						}
					}
					shape1.r = Math.min(shape1.r + this.growthRate, minDistance - buffer);
					if (shape1.r === minDistance - buffer) {
						shape1.growing = false;
						numGrowing--;
					}
				}
			}
			if (shapes.length < maxShapes && attempts < maxAttempts) {
				for (let i = 0; i < this.numNewShapes; i++) {
					let x, y, radius;
					attempts = 0;
					do {
						radius =  (maxNewRadius - minRadius) * Math.random() + minRadius;
						if (this.circular) {
							const theta = Math.random() * 2 * Math.PI;
							const maxR = boundaryR - edgeBuffer - radius;
							const r = Math.sqrt(Math.random()) * maxR;
							x = centreX + r * Math.cos(theta);
							y = centreY + r * Math.sin(theta);
						} else {
							const xRange = innerWidth - 2 * radius;
							const yRange = innerHeight - 2 * radius;
							x = Math.random() * xRange + edgeBuffer + radius;
							y = Math.random() * yRange + edgeBuffer + radius;
						}
						for (let j = 0; j < shapes.length; j++) {
							const shape = shapes[j];
							const xDist = x - shape.x;
							const yDist = y - shape.y;
							const dist = Math.sqrt(xDist * xDist + yDist * yDist) - shape.r;
							radius = Math.min(radius, dist - buffer);
							if (radius < minRadius) {
								break;
							}
						}
						attempts++;
					} while (radius < minRadius && attempts < maxAttempts);

					if (radius >= minRadius) {
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
		const minRadius = this.minRadius;
		const buffer = this.bufferSize;

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
				const dist = Math.sqrt(xDist * xDist + yDist * yDist);
				const rSum = r1 + r2 + buffer;
				const excessRadius = rSum - dist;
				if (excessRadius > 0) {
					// TODO Try to move shape i away from shape j
					const shape2Weighting = r2 / (r1 + r2);
					const maxR2 = dist - buffer - minRadius;
					if (maxR2 < minRadius) {
						shapes.splice(i, 1);
						numShapes--;
						removed = true;
						break;
					}
					const idealR2 = r2 - shape2Weighting * excessRadius;
					r2 = Math.max(minRadius, Math.min(idealR2, maxR2));
					r1 = dist - r2 - buffer;
					shape1.r = r1;
					shape2.r = r2;
				}
			}
			if (!removed) {
				i++;
			}
		}

		const seedRadius = this.meanSeedRadius;
		const radiusRange = this.seedRadiusRange;
		const smallestIdealR = seedRadius - radiusRange / 2;
		const centreX = width / 2;
		const centreY = height / 2;
		const boundaryR = Math.min(centreX, centreY);
		for (i = 0; i < numShapes; i++) {
			const shape1 = shapes[i];
			if (shape1.r !== shape1.originalR) {
				const x = shape1.x;
				const y = shape1.y;
				let minDistance;
				if (this.circular) {
					const xDist = x - centreX;
					const yDist = y - centreY;
					const r = Math.sqrt(xDist * xDist + yDist * yDist);
					minDistance = boundaryR - r;
				} else {
					minDistance = Math.min(x, y, width - x, height - y);
				}
				for (let j = 0; j < numShapes; j++) {
					if (i === j) {
						continue;
					}
					const shape2 = shapes[j];
					const xDist = shape2.x - shape1.x;
					const yDist = shape2.y - shape1.y;
					const dist = Math.sqrt(xDist * xDist + yDist * yDist) - shape2.r;
					if (dist < minDistance) {
						minDistance = dist;
					}
				}
				shape1.r = Math.min(minDistance - buffer, shape1.originalR);
			}
		}
	}

}
