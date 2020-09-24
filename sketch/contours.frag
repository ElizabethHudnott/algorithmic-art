const int MAX_ATTRACTORS = 50;
const float TWO_PI = 2.0 * PI;

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

float sineFunc(float sine, int exponent) {
	return (power(sine, 2 * exponent) - 1.0 + colorPortion);
}

vec4 colorFunc(int n, float scaledForce, float wave) {
	float a = wave * (scaledForce * baseBrightness[0] + (1.0 - scaledForce) * baseBrightness[2]);
	float aPrime = (1.0 - wave) * (scaledForce * baseBrightness[1] + (1.0 - scaledForce) * baseBrightness[3]);
	float b = scaledForce * (wave * baseBrightness[0] + (1.0 - wave) * baseBrightness[1]);
	float aDesaturation = 1.0 - foregroundSaturation;
	float aPrimeDesaturation = 1.0 - abs(backgroundSaturation);
	float bDesaturation = 1.0 - baseSaturation;
	float aNew = a  + (1.0 - a) * min(b * bDesaturation + aPrime * aPrimeDesaturation, 1.0);
	float aPrimeNew = aPrime + (1.0 - aPrime) * min(a * aDesaturation + b * bDesaturation, 1.0);
	float bNew = b  + (1.0 - b) * min(a * aDesaturation + aPrime * aPrimeDesaturation, 1.0);

	switch (n) {
	case 0:
		return vec4(aNew, bNew, aPrimeNew, 1.0);
	case 1:
		return vec4(bNew, aNew, aPrimeNew, 1.0);
	case 2:
		return vec4(aPrimeNew, aNew, bNew, 1.0);
	case 3:
		return vec4(aPrimeNew, bNew, aNew, 1.0);
	case 4:
		return vec4(bNew, aPrimeNew, aNew, 1.0);
	default:
		return vec4(aNew, aPrimeNew, bNew, 1.0);
	}
}

void main() {
	float hue, lightness, opacity = 1.0, gradient = 1.0;
	float lastRed = floor(hueFrequency) / hueFrequency;
	float saturation = 0.0;

	int numPoints = int(ceil(numAttractors));
	if (preview > 0) {
		numPoints = min(numPoints, 5);
	}
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
	float dotAmount = 0.0;

	for (int i = 0; i < numPoints; i++) {
		float x2 = scaledXPos[i];
		float y2 = scaledYPos[i];
		float distance = distanceMetric(x, y, x2, y2);

		float pointStrength = strength[i];
		if (i == numPoints - 1) {
			pointStrength *= finalPointScale;
		}

		float dotSize = round(max(pointStrength * maxDotSize, minDotSize));
		if (distance < dotSize + 0.5) {
			if (distance <= dotSize) {
				dotAmount = 1.0;
			} else {
				dotAmount = max(dotAmount, 1.0 - (distance - dotSize) * 2.0);
			}
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
	float wave;
	if (colorPortion == 0.0) {
		wave = 0.0;
	} else {
		float sine = sin(netForce * sineFrequency / 2.0);
		int lowerPower = int(sinePower);
		float upperPowerFrac = fract(sinePower);
	 	wave = max(
			((1.0 - upperPowerFrac) *sineFunc(sine, lowerPower) +
			upperPowerFrac * sineFunc(sine, lowerPower + 1)) / colorPortion,
			0.0
		);
	}
	float scaledForce = min(netForce / baseScale, 1.0);

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
	hue = mod(hue + hueRotation + waveHue * (1.0 - wave), 1.0);

	saturation /= totalForce;

	lightness = maxLightness *
		(waveLightness * wave + 1.0 - waveLightness);

	float uncoloredPart = maxLightness * (1.0 - colorPortion);
	if (wave < uncoloredPart && lightness < 0.5) {
		gradient = lightness / (uncoloredPart * (1.0 - sharpness));
		opacity = gradient;
		saturation = saturation * min(gradient, backgroundSaturation);
		lightness *= 1.0 - contrast;
	} else {
		saturation *= foregroundSaturation;
	}
	lightness = max(lightness, minLightness);

	vec4 color = hsla(hue, saturation, lightness, opacity);

	float baseColorMod = mod(baseColor, 6.0);
	if (baseColorMod < 0.0) {
		baseColorMod = 6.0 + baseColorMod;
	}
	int lowerBaseColor = int(baseColorMod);
	float baseColorFrac = fract(baseColorMod);
	int upperBaseColor = (lowerBaseColor + 1) % 6;

	fragColor = (1.0 - baseColorFrac) * colorFunc(lowerBaseColor, scaledForce, wave);
	fragColor += baseColorFrac * colorFunc(upperBaseColor, scaledForce, wave);
	float pixelBaseIntensity = max(baseIntensity, 1.0 - gradient);
	fragColor *= pixelBaseIntensity;
	fragColor.a =
		backgroundOpacity * (1.0 - baseIntensity) +
		baseIntensity * (backgroundOpacity + (1.0 - backgroundOpacity) * wave);
	fragColor += (1.0 - pixelBaseIntensity) * color;

	fragColor = fragColor * (1.0 - dotAmount) +
		dotAmount * hsla(dotColor[0], dotColor[1], dotColor[2], dotColor[3]);
}
