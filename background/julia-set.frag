vec2 complexPower(float r, float theta, float n) {
	float magnitude = pow(r, n);
	float angle = n * theta;
	return vec2(magnitude * cos(angle), magnitude * sin(angle));
}

void main() {
	float xMin = xCentre - xRange / 2.0;
	float yMin = yCentre - yRange / 2.0;
	float x = gl_FragCoord.x / canvasWidth * xRange + xMin;
	float y = gl_FragCoord.y / canvasHeight * yRange + yMin;
	if (burningShip == 1) {
		y = -y;
	}
	vec2 point = vec2(x, y);
	float cReal, cIm, divisor;

	if (mandelbrot == 1) {
		// Mandelbrot set
		if (inverse == 1) {
			point = vec2(0.0, 0.0);
		}
		cReal = x;
		cIm = y;
	} else {
		// Julia set
		cReal = finalRealConstant;
		cIm = finalImConstant;
	}
	if (inverse == 1) {
		divisor = cReal * cReal + cIm * cIm;
		cReal = cReal / divisor;
		cIm = -cIm / divisor;
	}

	float r = length(point);
	int i = 0;

	while (r < escapeRadius && i < maxIterations) {
		if (burningShip == 1) {
			point = vec2(abs(point.x), abs(point.y));
		}
		float theta = atan(point.y, point.x);
		vec2 numerator = vec2(numeratorRealConstant, numeratorImConstant);
		for (int j = 0; j <=3; j++) {
			float coefficient = numeratorCoefficients[j];
			if (coefficient != 0.0) {
				float exponent = numeratorExponents[j];
				numerator += coefficient * complexPower(r, theta, exponent);
			}
		}
		vec2 denominator = vec2(denominatorRealConstant, denominatorImConstant);
		for (int j = 0; j <=3; j++) {
			float coefficient = denominatorCoefficients[j];
			if (coefficient != 0.0) {
				float exponent = denominatorExponents[j];
				denominator += coefficient * complexPower(r, theta, exponent);
			}
		}

		divisor = denominator.x * denominator.x + denominator.y * denominator.y;
		point = vec2(
			(numerator.x * denominator.x + numerator.y * denominator.y) / divisor + cReal,
			(numerator.y * denominator.x - numerator.x * denominator.y) / divisor + cIm
		);
		r = length(point);
		i++;
	}
	if (i == maxIterations) {
		fragColor = vec4(0, 0, 0, 1);
	} else {
		float hue = 1.0 - float(i) / float(maxIterations);
		float lightness = 0.5 + 0.1 * hue;
		fragColor = hsla(hue, 1.0, lightness, 1.0);
	}
}
