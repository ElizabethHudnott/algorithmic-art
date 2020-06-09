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
	if (preOperation == 2) {
		// Burning ship
		y = -y;
	}
	vec2 point;
	float nonInverse = 1.0 - inverse;
	float cReal, cIm, divisor;

	if (mandelbrot == 1) {
		// Mandelbrot set
		if (finalRealConstant == 0.0 && finalImConstant == 0.0) {
			bool badZero = false;
			for (int i = 0; i < 3; i++) {
				if (
					(numeratorCoefficients[i] != 0.0 && numeratorExponents[i] <= 0.0) ||
					(denominatorCoefficients[i] != 0.0 && denominatorExponents[i] <= 0.0)
				) {
					badZero = true;
					break;
				}
			}
			if (badZero) {
				point = vec2(x, y);
			} else {
				point = vec2(0.0, 0.0);
			}
		} else {
			point = vec2(finalRealConstant, finalImConstant);
		}
		float offsetX = x + finalRealConstant;
		float offsetY = y + finalImConstant;
		divisor = offsetX * offsetX + offsetY * offsetY;
		point = nonInverse * point + inverse * vec2(offsetX / divisor - muTranslation, -offsetY / divisor);
		cReal = x;
		cIm = y;
	} else {
		// Julia set
		point = vec2(x, y);
		cReal = finalRealConstant;
		cIm = finalImConstant;
	}
	cReal = nonInverse * cReal;
	cIm = nonInverse * cIm;
	if (inverse > 0.0) {
		divisor = cReal * cReal + cIm * cIm;
		cReal += inverse * (cReal / divisor - muTranslation);
		cIm += inverse * -cIm / divisor;
	}

	float r = length(point);
	int i = 0;

	while (r < escapeRadius && i < maxIterations) {
		switch (preOperation) {
		case 1:
			point = vec2(point.x, -point.y);
			break;
		case 2:
			point = vec2(abs(point.x), abs(point.y));
			break;
		}
		float theta;
		if (point.x == 0.0) {
			theta = sign(point.y) * PI / 2.0;
		} else {
			theta = atan(point.y, point.x);
		}
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
		fragColor = vec4(0, 0, 0, 0);
	} else {
		float hue = 1.0 - float(i) / float(maxIterations);
		float lightness = 0.5 + 0.1 * hue;
		fragColor = hsla(hue, 1.0, lightness, 1.0);
	}
}
