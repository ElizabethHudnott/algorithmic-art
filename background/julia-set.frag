float complexArgument(vec2 z) {
	if (z.x == 0.0) {
		return sign(z.y) * PI / 2.0;
	} else {
		return atan(z.y, z.x);
	}
}

vec2 complexMultiply(vec2 z1, vec2 z2) {
	return vec2(
		z1.x * z2.x - z1.y * z2.y,
		z1.x * z2.y + z1.y * z2.x
	);
}

vec2 complexDivide(vec2 numerator, vec2 denominator) {
	float divisor = denominator.x * denominator.x + denominator.y * denominator.y;
	return vec2(
		(numerator.x * denominator.x + numerator.y * denominator.y) / divisor,
		(numerator.y * denominator.x - numerator.x * denominator.y) / divisor
	);
}

vec2 complexPower(float rSquared, float theta, float n) {
	float magnitude = pow(rSquared, n / 2.0);
	float angle = n * theta;
	return vec2(magnitude * cos(angle), magnitude * sin(angle));
}

vec2 complexFunction(int function, vec2 z) {
	switch (function) {
	case 0: // identity
		return vec2(1.0, 0.0);
	case 1: // multiply by i
		return vec2(0.0, 1.0);
	case 2: // e^z
		float expX = exp(z.x);
		return vec2(expX * cos(z.y), expX * sin(z.y));
	case 3: // sin(z)
		return vec2(sin(z.x) * cosh(z.y), cos(z.x) * sinh(z.y));
	case 4: // cos(z)
		return vec2(cos(z.x) * cosh(z.y), -sin(z.x) * sinh(z.y));
	case 5: // tan(z) = sin(z) / cos(z)
		float sinX = sin(z.x);
		float coshY = cosh(z.y);
		float cosX = cos(z.x);
		float sinhY = sinh(z.y);
		vec2 sinZ = vec2(sinX * coshY, cosX * sinhY);
		vec2 cosZ = vec2(cosX * coshY, -sinX * sinhY);
		return complexDivide(sinZ, cosZ);
	}
}

int intMod(int n, int m) {
	int result = abs(n) % m;
	if (n < 0 && result != 0) {
		result = m - result;
	}
	return result;
}

float colorEquation(float value) {
	if (colorPower == 0.0) {
		// Single colour scenario
		return 1.0;
	} else {
		return pow(value, colorPower);
	}
}

float colorFunc(int function, float custom, float maxCustom, float maxDistance, vec2 escaped, vec2 lastZ, float theta) {
	float value, maxValue, result;
	switch (function) {
	case 0:
		// Iteration count or distance to an orbit trap
		value = custom;
		maxValue = maxCustom;
		break;
	case 1:
		// |z|
		value = length(escaped);
		maxValue = maxDistance;
		break;
	case 2:
		// Re(z) + Im(z)
		value = lastZ.x + lastZ.y + SQRT2 * maxDistance;
		maxValue = 2.0 * SQRT2 * maxDistance;
		break;
	case 3:
		// Re(z)
		value = lastZ.x + maxDistance;
		maxValue = 2.0 * maxDistance;
		break;
	case 4:
		// Im(z)
		value = lastZ.y + maxDistance;
		maxValue = 2.0 * maxDistance;
		break;
	case 5:
		// arg(z)
		value = theta + PI;
		maxValue = 2.0 * PI;
		break;
	}
	result = colorEquation(value) / colorEquation(maxValue);
	if (function == 0) {
		result -= 1.0 / (colorMultiple * float(numColors));
	}
	return result;
}

void main() {
	vec2 trappedPoint;
	switch (colorVariable) {
	case 0:
	case 1:
		trappedPoint = vec2(maxTrapDistance, 0.0);
		break;
	case 2:
		trappedPoint = vec2(maxTrapDistance * SQRT2, 0.0);
		break;
	case 3:
		trappedPoint = vec2(maxTrapDistance, 0.0);
		break;
	case 4:
		trappedPoint = vec2(0.0, maxTrapDistance);
		break;
	case 5:
		trappedPoint = vec2(0.0, 0.0);
		break;
	}

	float xMin = xCentre - xRange / 2.0;
	float yMin = yCentre - yRange / 2.0;
	float x = gl_FragCoord.x / canvasWidth * xRange + xMin;
	float y = gl_FragCoord.y / canvasHeight * yRange + yMin;
	float theta, divisor;
	vec2 finalConstant, point, functionOfZ;

	float temp = x;
	x = x * cos(rotation) - y * sin(rotation);
	y = temp * sin(rotation) + y * cos(rotation);

	if (preOperation == 2) {
		// Burning ship
		y = -y;
	}

	if (mandelbrot) {

		// Mandelbrot set
		if (finalRealConstant == 0.0 && finalImConstant == 0.0) {
			bool badZero = false;
			for (int i = 0; i <= 3; i++) {
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
			// Explicit Z0 provided
			point = vec2(finalRealConstant, finalImConstant);
		}

		float cReal = x;
		float cIm = y;

		if (inverse > 0.0) {
			float nonInverse = 1.0 - inverse;
			float offsetX = x + finalRealConstant;
			float offsetY = y + finalImConstant;
			divisor = offsetX * offsetX + offsetY * offsetY;
			point = nonInverse * point + inverse * vec2(offsetX / divisor - muTranslation, -offsetY / divisor);
			divisor = cReal * cReal + cIm * cIm;
			cReal = nonInverse * cReal + inverse * (cReal / divisor - muTranslation);
			cIm = nonInverse * cIm + inverse * -cIm / divisor;
		}
		finalConstant = vec2(cReal, cIm);

	} else {

		// Julia set
		point = vec2(x, y);
		finalConstant = vec2(finalRealConstant, finalImConstant);

	}

	vec2 extraTerm = vec2(0.0, 0.0);
	vec2 lastZ = vec2(0.0, 0.0);
	vec2 lastZ2 = vec2(0.0, 0.0);
	float rSquared = point.x * point.x + point.y * point.y;
	float escapeRSquared = escapeValue * escapeValue;
	float maxTrapDistanceSq = maxTrapDistance * maxTrapDistance;
	int i = 0;

	switch (preOperation) {
	case 1:	// Conjugation
		theta = complexArgument(vec2(point.x, -point.y));
		break;
	case 2:	// Burning Ship
		theta = complexArgument(vec2(abs(point.x), abs(point.y)));
		break;
	default:
		theta = complexArgument(point);
	}

	mat4x2 trapLineDiffs = trapLineEnd - trapLineStart;
	vec4 trapLineLengthSq, trapLineDeterminant;
	for (int i = 0; i < numTrapLines; i++) {
		trapLineDeterminant[i] = trapLineEnd[i].x * trapLineStart[i].y - trapLineEnd[i].y * trapLineStart[i].x;
		trapLineLengthSq[i] = pow(trapLineDiffs[i].x, 2.0) + pow(trapLineDiffs[i].y, 2.0);
	}
	float trapDistanceSq = maxTrapDistanceSq;
	float trapTheta = complexArgument(point);
	float trapGridX, trapGridY;
	if (numTrapPoints == 1) {
		trapGridX = 1.0;
		trapGridY = 1.0;
	} else {
		trapGridX = 0.0;
		trapGridY = 0.0;
		for (int i = 0; i < numTrapPoints; i++) {
			trapGridX = max(trapGridX, trapPoints[i].x);
			trapGridY = max(trapGridY, trapPoints[i].y);
		}
		if (trapGridX == 0.0) {
			trapGridX = 1.0;
		}
		if (trapGridY == 0.0) {
			trapGridY = 1.0;
		}
	}

	while (i < maxIterations &&
		(escapeType == 0 ? rSquared <= escapeRSquared : abs(point.y) <= escapeValue)
	) {
		float trapDistanceSoFar;
		vec2 trapInput;
		if (gaussian) {
			trapInput = vec2(
				mod(point.x, trapGridX),
				mod(point.y, trapGridY)
			);
		} else {
			trapInput = point;
		}
		if (trapDistanceFunc == 0) {
			// Apply min function
			trapDistanceSoFar = maxTrapDistanceSq;
			for (int j = 0; j < numTrapPoints; j++) {
				vec2 trapPoint = trapPoints[j];
				float newDistance = pow(trapPoint.x - trapInput.x, 2.0) + pow(trapPoint.y - trapInput.y, 2.0);
				trapDistanceSoFar = min(trapDistanceSoFar, newDistance);
			}
			for (int j = 0; j < numTrapLines; j++) {
				vec2 trapLineDiff = trapLineDiffs[j];
				float lineValue = abs(trapLineDiff.y * point.x - trapLineDiff.x * point.y + trapLineDeterminant[j]);
				trapDistanceSoFar = min(trapDistanceSoFar, (lineValue * lineValue) / trapLineLengthSq[j]);
			}
		} else {
			// Apply max function
			trapDistanceSoFar = 0.0;
			for (int j = 0; j < numTrapPoints; j++) {
				vec2 trapPoint = trapPoints[j];
				float newDistance = pow(trapPoint.x - trapInput.x, 2.0) + pow(trapPoint.y - trapInput.y, 2.0);
				trapDistanceSoFar = max(trapDistanceSoFar, newDistance);
			}
			for (int j = 0; j < numTrapLines; j++) {
				vec2 trapLineDiff = trapLineDiffs[j];
				float lineValue = abs(trapLineDiff.y * point.x - trapLineDiff.x * point.y + trapLineDeterminant[j]);
				trapDistanceSoFar = max(trapDistanceSoFar, (lineValue * lineValue) / trapLineLengthSq[j]);
			}
		}
		if (trapDistanceSoFar < trapDistanceSq) {
			trapDistanceSq = trapDistanceSoFar;
			trappedPoint = point;
			trapTheta = theta;
		}

		switch (preOperation) {
		case 1:	// Conjugation
			point = vec2(point.x, -point.y);
			break;
		case 2:	// Burning Ship
			point = vec2(abs(point.x), abs(point.y));
			break;
		}
		theta = complexArgument(point);

		vec2 numerator = vec2(0.0, 0.0);
		if (numeratorCoefficients[0] != 0.0) {
			numerator = numeratorCoefficients[0] * complexPower(rSquared, theta, numeratorExponents[0]);
			functionOfZ = complexFunction(numeratorFunction, point);
			numerator = complexMultiply(numerator, functionOfZ);
		}
		for (int j = 1; j <=3; j++) {
			float coefficient = numeratorCoefficients[j];
			if (coefficient != 0.0) {
				float exponent = numeratorExponents[j];
				numerator += coefficient * complexPower(rSquared, theta, exponent);
			}
		}
		numerator += numeratorConstant;

		vec2 denominator = vec2(0.0, 0.0);
		if (denominatorCoefficients[0] != 0.0) {
			denominator = denominatorCoefficients[0] * complexPower(rSquared, theta, denominatorExponents[0]);
			functionOfZ = complexFunction(denominatorFunction, point);
			denominator = complexMultiply(denominator, functionOfZ);
		}
		for (int j = 1; j <=3; j++) {
			float coefficient = denominatorCoefficients[j];
			if (coefficient != 0.0) {
				float exponent = denominatorExponents[j];
				denominator += coefficient * complexPower(rSquared, theta, exponent);
			}
		}
		denominator += denominatorConstant;

		vec2 temp = point;
		if (extraTermCoefficient != 0.0) {
			extraTerm = complexFunction(extraTermFunction, point);
			divisor = extraTerm.x * extraTerm.x + extraTerm.y * extraTerm.y;
			extraTerm = extraTermCoefficient * vec2(extraTerm.x / divisor, -extraTerm.y / divisor);
		}
		functionOfZ = complexFunction(finalFunction, point);
		point = complexDivide(numerator, denominator);
		point += extraTerm;
		point += complexMultiply(finalConstant, functionOfZ);
		point += complexMultiply(feedback, lastZ);
		point += complexMultiply(feedback2, lastZ2);
		lastZ2 = lastZ;
		lastZ = temp;
		rSquared = point.x * point.x + point.y * point.y;
		i++;
	}

	if (i == maxIterations) {
		fragColor = innerColor;
	} else {
		float colorNumber;
		float numColorsF = float(numColors);

		if (numTrapPoints > 0 || numTrapLines > 0) {
			colorNumber = sqrt(trapDistanceSq);
			colorNumber = colorFunc(colorVariable, colorNumber, maxTrapDistance, maxTrapDistance, trappedPoint, trappedPoint, trapTheta);
		} else {
			colorNumber = float(maxIterations - 2 - i) + log(log(rSquared) / 2.0);
			colorNumber = colorFunc(colorVariable, colorNumber, float(maxIterations), escapeValue, point, lastZ, theta);
		}

		colorNumber = numColorsF * colorMultiple * colorNumber + colorOffset;

		float maxColor = (colorMultiple > 1.0 ? trunc(colorMultiple) : colorMultiple) * numColorsF;
		vec4 color1, color2;
		int colorIndex1;
		if (!wrapPalette && colorNumber >= maxColor) {
			colorNumber = maxColor;
			color1 = palette[numColors - 1];
			color1.a = 0.0;
		} else {
			colorIndex1 = int(floor(colorNumber));
			color1 = palette[intMod(colorIndex1, numColors)];
		}
		if (!wrapPalette && colorNumber + 1.0 >= maxColor) {
			color2 = palette[numColors - 1];
			color2.a = 0.0;
		} else {
			color2 = palette[intMod(colorIndex1 + 1, numColors)];
		}

		float mixing;
		if (interpolation == 1.0) {
			mixing = fract(colorNumber);
		} else {
			float interpolationInverse = 1.0 - interpolation;
			mixing = round(fract(colorNumber) / interpolationInverse) * interpolationInverse;
		}
		float hueDifference = color2[0] - color1[0];
		if (color1[1] == 0.0 || color1[2] == 0.0 || color1[3] == 0.0) {
			// Color 1 is a grey or transparent, so equalize hues.
			color1[0] = color2[0];
		} else if (color2[1] == 0.0 || color2[2] == 0.0 || color2[3] == 0.0) {
			// Color 2 is a grey or transparent, so equalize hues.
			color2[0] = color1[0];
		} else if (hueDifference > 0.5) {
			color1[0] += 1.0;
		} else if (hueDifference < -0.5) {
			color2[0] += 1.0;
		}
		vec4 finalColor = mix(color1, color2, mixing);
		fragColor = hsla(finalColor[0], finalColor[1], finalColor[2], finalColor[3]);
	}
}
