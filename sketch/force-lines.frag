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

	vec2[25] colors;
	float hue;
	float antialiasingF = float(antialiasing);
	float step = 1.0 / antialiasingF;
	float lastRed = floor(hueFrequency) / hueFrequency;
	float uncoloredPart = maxLightness * (1.0 - colorPortion);

	int numPoints = int(ceil(numAttractors));
	float finalPointScale = fract(numAttractors);
	if (finalPointScale == 0.0) {
		finalPointScale = 1.0;
	}
	finalPointScale = explosion + finalPointScale * (1.0 - explosion);

	float[30] scaledXPos, scaledYPos;
	for (int i = 0; i < numPoints; i++) {
		scaledXPos[i] = positionX[i] * canvasWidth;
		scaledYPos[i] = positionY[i] * canvasHeight;
	}

	for (int xShift = 0; xShift < antialiasing; xShift++) {
		for (int yShift = 0; yShift < antialiasing; yShift++) {
			float x = gl_FragCoord.x + float(xShift) * step;
			float y = gl_FragCoord.y + float(yShift) * step;

			float forceX = 0.0, forceY = 0.0;

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
			}

			float netForce = sqrt(forceX * forceX + forceY * forceY);
			float wave = max(
				(power(sin(netForce), 2 * sinePower) - (1.0 - colorPortion)) / colorPortion,
				0.0
			);

			if (xShift == 0 && yShift == 0) {
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
			}

			float lightness = maxLightness *
				(waveLightness * wave + 1.0 - waveLightness);

			float opacity = 1.0;

			if (lightness < uncoloredPart && lightness < 0.5) {
				if (sharpness == 1.0) {
					opacity = 0.0;
				} else {
					opacity = lightness / (uncoloredPart * (1.0 - sharpness));
				}
			}
			lightness = max(lightness, minLightness);
			colors[yShift * antialiasing + xShift] = vec2(lightness, opacity);
		}
	}

	int samplePoints = antialiasing * antialiasing;
	float[25] lightnesses, opacities;
	float lightness, opacity;
	for (int i = 0; i < samplePoints; i++) {
		lightness = 0.0;
		opacity = 0.0;
		int lightnessIndex, opacityIndex;
		for (int j = 0; j < samplePoints; j++) {
			vec2 color = colors[j];
			if (color[0] >= lightness) {
				lightness = color[0];
				lightnessIndex = j;
			}
			if (color[1] >= opacity) {
				opacity = color[1];
				opacityIndex = j;
			}
		}
		lightnesses[i] = lightness;
		opacities[i] = opacity;
		colors[lightnessIndex][0] = -1.0;
		colors[opacityIndex][1] = -1.0;
	}
	int index = (samplePoints - 1) / 2;
	if (samplePoints % 2 == 0) {
		lightness = (lightnesses[index] + lightnesses[index + 1]) / 2.0;
		opacity = (opacities[index] + opacities[index + 1]) / 2.0;
	} else {
		lightness = lightnesses[index];
		opacity = opacities[index];
	}
	fragColor = hsla(hue, saturation, lightness, opacity);
}
