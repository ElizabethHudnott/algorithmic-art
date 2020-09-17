const int MAX_ATTRACTORS = 50;
const float TWO_PI = 2.0 * PI;

float distanceMetric(float x1, float y1, float x2, float y2) {
	if (minkowskiOrder == 0.0) {
		return 0.0;
	}

	float dx = x2 - x1;
	float dy = y2 - y1;
	float xWeight = 1.0 - distanceWeight + distanceWeight * (x1 + x2) / canvasWidth;
	float yWeight = 1.0 - distanceWeight + distanceWeight * (y1 + y2) / canvasHeight;

	if (minkowskiOrder > 12.3) {
		return max(abs(dx) / xWeight, abs(dy) / yWeight);
	}
	return pow(
		pow(
			abs(dx) / xWeight, minkowskiOrder) + pow(abs(dy) / yWeight,
			minkowskiOrder
		),
		1.0 / minkowskiOrder
	);
}

float angle(float x, float y) {
	if (x == 0.0) {
		return sign(y) * PI / 2.0;
	} else {
		return atan(y, x);
	}
}

float power(float base, int exponent) {
	float s = exponent % 2 == 0 ? 1.0 : sign(base);
	return s * pow(base, float(abs(exponent)));
}

void main() {
	if (colorPortion == 0.0) {
		fragColor = vec4(0.0, 0.0, 0.0, 0.0);
		return;
	}

	float hue, lightness, opacity = 1.0;
	float lastRed = floor(hueFrequency) / hueFrequency;
	float saturation = 0.0;

	int numPoints = int(ceil(numAttractors));
	float finalPointScale = fract(numAttractors);
	if (finalPointScale == 0.0) {
		finalPointScale = 1.0;
	}
	finalPointScale = explosion + finalPointScale * (1.0 - explosion);

	float[MAX_ATTRACTORS] scaledXPos, scaledYPos;
	for (int i = 0; i < numPoints; i++) {
		scaledXPos[i] = positionX[i] * canvasWidth;
		scaledYPos[i] = positionY[i] * canvasHeight;
	}

	float x = gl_FragCoord.x;
	float y = gl_FragCoord.y;
	float forceX = 0.0, forceY = 0.0;
	float totalForce = 0.0;

	for (int i = 0; i < numPoints; i++) {
		float x2 = scaledXPos[i];
		float y2 = scaledYPos[i];
		float distance = distanceMetric(x, y, x2, y2);

		float pointStrength = strength[i];
		if (i == numPoints - 1) {
			pointStrength *= finalPointScale;
		}
		float force =
			fieldConstant * pointStrength *
			pow(base, -pow(distance / divisor, fieldExponent));

		float attractorAngle = angle(x - x2, y - y2);
		forceX += force * cos(attractorAngle);
		forceY += force * sin(attractorAngle);

		float absForce = abs(force);
		saturation += saturations[i] * absForce;
		totalForce += absForce;
	}

	float netForce = sqrt(forceX * forceX + forceY * forceY);
	float wave = max(
		(power(sin(netForce), 2 * sinePower) - (1.0 - colorPortion)) / colorPortion,
		0.0
	);

	hue = mod(-angle(forceX, forceY) + 0.5 * PI, TWO_PI) / TWO_PI;
	if (hueFrequency < 1.0) {
		if (hue > hueFrequency) {
			hue = hueFrequency - (hue - hueFrequency) / (1.0 - hueFrequency) * hueFrequency;
		}
	} else if (hue > lastRed) {
		hue = (hue - lastRed) / (1.0 - lastRed);
	} else {
		hue = hue * hueFrequency;
	}
	hue = mod(hue - hueRotation + waveHue * (1.0 - wave), 1.0);

	saturation = overallSaturation * saturation / totalForce;

	lightness = maxLightness *
		(waveLightness * wave + 1.0 - waveLightness);

	float uncoloredPart = maxLightness * (1.0 - colorPortion);
	if (wave < uncoloredPart && lightness < 0.5) {
		opacity = lightness / (uncoloredPart * (1.0 - sharpness));
		saturation = saturation * min(opacity, backgroundSaturation);
		lightness *= 1.0 - contrast;
	}
	lightness = max(lightness, minLightness);

	fragColor = hsla(hue, saturation, lightness, opacity);

	float baseMod = mod(baseColor, 1.0) * 6.0;
	if (baseMod < 0.0) {
		baseMod = 6.0 + baseMod;
	}
	float baseFraction = fract(baseMod);
	vec4 baseWeights;
	if (baseMod < 1.0) {
		// Fade red to yellow
		baseWeights = vec4(1.0, baseFraction, 0.0, 0.0);
	} else if (baseMod < 2.0) {
		// Fade yellow to green
		baseWeights = vec4(1.0 - baseFraction, 1.0, 0.0, 0.0);
	} else if (baseMod < 3.0) {
		// Fade green to cyan
		baseWeights = vec4(0.0, 1.0, baseFraction, 0.0);
	} else if (baseMod < 4.0) {
		// Fade cyan to blue
		baseWeights = vec4(0.0, 1.0 - baseFraction, 1.0, 0.0);
	} else if (baseMod < 5.0) {
		// Fade blue to magenta
		baseWeights = vec4(baseFraction, 0.0, 1.0, 0.0);
	} else {
		// Fade magenta to red
		baseWeights = vec4(1.0, 0.0, 1.0 - baseFraction, 0.0);
	}
	baseWeights *= baseAmount;
	vec4 maxValues = vec4(baseIntensity, baseIntensity, baseIntensity, 0.0);
	fragColor =
		min(baseWeights * netForce / baseScale, maxValues) +
		(vec4(1.0, 1.0, 1.0, 1.0) - baseWeights * baseIntensity) * fragColor;

}
