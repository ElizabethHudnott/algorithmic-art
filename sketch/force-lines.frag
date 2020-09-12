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
	float uncoloredPart = maxLightness * (1.0 - colorPortion);
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

	float[MAX_ATTRACTORS] saturationRadiiSq;
	for (int i = 0; i < numPoints; i++) {
		saturationRadiiSq[i] = 1.0e20;
	}
	for (int i = 0; i < numPoints; i++) {
		float x1 = scaledXPos[i];
		float y1 = scaledYPos[i];
		float strength1 = strength[i];
		for (int j = 0; j < i; j++) {
			float dx = scaledXPos[j] - x1;
			float dy = scaledYPos[j] - y1;
			float distanceSq = dx * dx + dy * dy;
			float strength2 = strength[j];
			float strengthTotal = strength1 + strength2;
			float weight = strength1 / strengthTotal;
			saturationRadiiSq[i] = min(saturationRadiiSq[i], distanceSq * weight * weight);
			weight = strength2 / strengthTotal;
			saturationRadiiSq[j] = min(saturationRadiiSq[j], distanceSq * weight * weight);
		}
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
		totalForce += abs(force);

		float saturationRadiusSq = saturationRadiiSq[i];
		float distanceSq = distance * distance;
		float saturationContrib;
		if (distanceSq >= saturationRadiusSq) {
			saturationContrib = outerSaturation[i];
		} else {
			saturationContrib = innerSaturation[i] +
				(outerSaturation[i] - innerSaturation[i]) * distanceSq / saturationRadiusSq;
		}
		saturation += saturationContrib * abs(force);

		float attractorAngle = angle(x - x2, y - y2);
		forceX += force * cos(attractorAngle);
		forceY += force * sin(attractorAngle);
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

	saturation /= totalForce;

	lightness = maxLightness *
		(waveLightness * wave + 1.0 - waveLightness);

	if (lightness < uncoloredPart && lightness < 0.5) {
		if (sharpness == 1.0) {
			opacity = 0.0;
		} else {
			opacity = lightness / (uncoloredPart * (1.0 - sharpness));
		}
	}
	lightness = max(lightness, minLightness);

	fragColor = hsla(hue, saturation, lightness, opacity);
}
