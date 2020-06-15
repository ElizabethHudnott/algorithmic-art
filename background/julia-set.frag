vec2 complexPower(float rSquared, float theta, float n) {
	float magnitude = pow(rSquared, n / 2.0);
	float angle = n * theta;
	return vec2(magnitude * cos(angle), magnitude * sin(angle));
}

int intMod(int n, int m) {
	int result = abs(n) % m;
	if (n < 0 && result != 0) {
		result = m - result;
	}
	return result;
}

float colorFunc(float value) {
	if (colorPower == 0.0) {
		return 0.0;
	} else {
		return pow(value, colorPower);
	}
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

	if (mandelbrot) {
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
	if (inverse > 0.0) {
		divisor = cReal * cReal + cIm * cIm;
		cReal = nonInverse * cReal + inverse * (cReal / divisor - muTranslation);
		cIm = nonInverse * cIm + inverse * -cIm / divisor;
	}

	float rSquared = point.x * point.x + point.y * point.y;
	int i = 0;

	while (rSquared < escapeRSquared && i < maxIterations) {
		switch (preOperation) {
		case 1:	// Conjugation
			point = vec2(point.x, -point.y);
			break;
		case 2:	// Burning Ship
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
				if (exponent == 1.0) {
					numerator += coefficient * point;
				} else {
					numerator += coefficient * complexPower(rSquared, theta, exponent);
				}
			}
		}
		vec2 denominator = vec2(denominatorRealConstant, denominatorImConstant);
		for (int j = 0; j <=3; j++) {
			float coefficient = denominatorCoefficients[j];
			if (coefficient != 0.0) {
				float exponent = denominatorExponents[j];
				if (exponent == 1.0) {
					denominator += coefficient * point;
				} else {
					denominator += coefficient * complexPower(rSquared, theta, exponent);
				}
			}
		}

		divisor = denominator.x * denominator.x + denominator.y * denominator.y;
		point = vec2(
			(numerator.x * denominator.x + numerator.y * denominator.y) / divisor + cReal,
			(numerator.y * denominator.x - numerator.x * denominator.y) / divisor + cIm
		);
		rSquared = point.x * point.x + point.y * point.y;
		i++;
	}
	if (i == maxIterations) {
		fragColor = innerColor;
	} else {
		float colorNumber = float(maxIterations - 2 - i) + log(log2(rSquared) / 2.0);
		float numColorsF = float(numColors);
		colorNumber = numColorsF * colorMultiple *
			colorFunc(colorNumber) / colorFunc(float(maxIterations)) + colorOffset - 1.0;

		if (!wrapPalette && colorNumber >= numColorsF) {
			colorNumber = numColorsF - 1.0;
		}

		int colorIndex1 = int(floor(colorNumber));
		vec4 color1 = palette[intMod(colorIndex1, numColors)];
		vec4 color2 = palette[intMod(colorIndex1 + 1, numColors)];
		float mixing;
		if (interpolation == 1.0) {
			mixing = fract(colorNumber);
		} else {
			float interpolationInverse = 1.0 - interpolation;
			mixing = round(fract(colorNumber) / interpolationInverse) * interpolationInverse;
		}
		float hueDifference = color2[0] - color1[0];
		if (hueDifference > 0.5) {
			color1[0] += 1.0;
		} else if (hueDifference < -0.5) {
			color2[0] += 1.0;
		}
		mixing = smoothstep(0.0, 1.0, mixing);
		vec4 finalColor = mix(color1, color2, mixing);
		fragColor = hsla(finalColor[0], finalColor[1], finalColor[2], finalColor[3]);
	}
}
