{

	class Shape {
		constructor(x, y, r) {
			this.x = x;
			this.y = y;
			this.r = r;
		}
	}

	function CirclePacking() {
		const me = this;
		this.title = 'Shape Packing';
		this.hasRandomness = true;
		this.hasCustomImage = false;

		this.startPoints = [];
		this.numStartPoints = 10;
		this.meanStartRadius = 200;
		this.startRadiusRange = 100;
		this.minRadius = 8;
		this.circular = false;
		this.bufferSize = 5;
		this.edgeBufferSize = 5;

		this.shapes = [];
	}

	backgroundGenerators.set('circle-packing', new CirclePacking);

	CirclePacking.prototype.generate = function* (beginTime, context, canvasWidth, canvasHeight, preview) {
		this.startPoints = [];
		for (let i = 0; i < this.numStartPoints; i++) {
			this.startPoints.push(new Point(Math.random() * canvasWidth, Math.random() * canvasHeight));
		}
		this.shapes = this.generateStartingShapes(canvasWidth, canvasHeight);

		const shapes = this.shapes;
		for (let i = 0; i < shapes.length; i++) {
			const shape = shapes[i];
			context.beginPath();
			context.arc(shape.x, shape.y, shape.r, 0, TWO_PI);
			context.stroke();
		}
	}

	CirclePacking.prototype.generateStartingShapes = function (width, height) {
		const startPoints = this.startPoints;
		const numStartPoints = startPoints.length;
		const startRadius = this.meanStartRadius;
		const radiusRange = this.startRadiusRange;
		const minRadius = this.minRadius;
		const buffer = this.bufferSize;
		const edgeBuffer = this.edgeBufferSize;
		const shapes = [];

		if (this.circular) {
			const centreX = width / 2;
			const centreY = height / 2;
			const maxRadius = Math.min(centreX, centreY);
			for (let i = 0; i < numStartPoints; i++) {
				const point = startPoints[i];
				const x = point.x;
				const y = point.y;
				const dist = Math.sqrt(x * x + y * y);
				let radius = startRadius + radiusRange * Math.random() - radiusRange / 2;
				radius = Math.min(radius, maxRadius - dist);
				if (radius >= edgeBuffer) {
					shapes.push(new Shape(x, y, radius));
				}
			}
		} else {
			for (let i = 0; i < numStartPoints; i++) {
				const point = startPoints[i];
				const x = point.x;
				const y = point.y;
				const leftDistance = x - edgeBuffer;
				const rightDistance = width - edgeBuffer - x;
				const topDistance = y - edgeBuffer;
				const bottomDistance = height - edgeBuffer - y;
				let radius = startRadius + radiusRange * Math.random() - radiusRange / 2;
				radius = Math.min(radius, leftDistance, topDistance, rightDistance, bottomDistance);
				if (radius >= minRadius) {
					shapes.push(new Shape(x, y, radius));
				}
			}
		}

		let numShapes = shapes.length;
		let i = 1;
		while (i < numShapes) {
			const shape1 = shapes[i];
			const x1 = shape1.x;
			const y1 = shape1.y;
			let r1 = shape1.r;
			let r1Squared = r1 * r1;
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
					const r2Squared = r2 * r2;
					shape2Weighting = r2Squared / (r1Squared + r2Squared);
					r2 = Math.max(minRadius, r2 - shape2Weighting * excessRadius);
					r1 = dist - r2 - buffer;
					if (r1 < minRadius) {
						shapes.splice(i, 1);
						numShapes--;
						removed = true;
						break;
					}
					r1Squared = r1 * r1;
					shape1.r = r1;
					shape2.r = r2;
				}
			}
			if (!removed) {
				i++;
			}
		}
		return shapes;
	}

}
