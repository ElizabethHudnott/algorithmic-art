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
	float aDesaturation = 1.0 - maxSaturation;
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

int gcd(int n, int m) {
	if (m == 1) {
		return 1;
	}
	while (n != 0 && m != 0) {
		if (n > m) {
			n %= m;
		} else {
			m %= n;
		}
	}
	return max(n, m);
}

int findCoprime(int n, int m) {
	while (gcd(n, m) != 1) {
		m--;
	}
	return m;
}

void main() {
	float hue, lightness, saturation = 0.0, opacity = 1.0, gradient = 1.0;
	float lastRed = floor(hueFrequency) / hueFrequency;

	int numPoints = int(ceil(numAttractors));
	float finalPointScale;
	if (preview == 0) {
		finalPointScale = fract(numAttractors);
		if (finalPointScale == 0.0) {
			finalPointScale = 1.0;
		}
		finalPointScale = explosion + finalPointScale * (1.0 - explosion);
	} else {
		numPoints = min(numPoints, 5);
		finalPointScale = 1.0;
	}
	int modulus = findCoprime(MAX_ATTRACTORS, step);

	float x = gl_FragCoord.x;
	float y = gl_FragCoord.y;
	float forceX = 0.0, forceY = 0.0;
	float lightingDivisor = lighting * min(canvasWidth, canvasHeight) / 10.0;
	lightingDivisor *= 5.0 * pow(2.0, -log(numAttractors) / log(5.0));

	for (int i = 0; i < numPoints; i++) {
		int index = (i * modulus) % MAX_ATTRACTORS;
		float x2 = positionX[index] * canvasWidth;
		float y2 = positionY[index] * canvasHeight;
		float distance = distanceMetric(x, y, x2, y2);

		float pointStrength = strength[index];
		if (i == numPoints - 1) {
			pointStrength *= finalPointScale;
		}

		float dotSize = round(max(pointStrength * maxDotSize, minDotSize));
		if (distance < dotSize + 1.0) {
			float lightness = distance <= dotSize ? 1.0 : 1.0 - fract(distance);
			fragColor = hsla(dotColor[0], dotColor[1], dotColor[2] * lightness, dotColor[3]);
			return;
		}

		float fallOff = pow(base, -pow(distance / divisor, fieldExponent));
		float force = fieldConstant * pointStrength * fallOff;

		float attractorAngle = angle(x - x2, y - y2);
		forceX += force * cos(attractorAngle);
		forceY += force * sin(attractorAngle);

		float d = distance / lightingDivisor;
		saturation += saturations[index] / (1.0 + d * d);
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

	saturation = min(saturation, 1.0) * (maxSaturation - minSaturation) + minSaturation;

	lightness = maxLightness *
		(waveLightness * wave + 1.0 - waveLightness);

	float uncoloredPart = maxLightness * (1.0 - colorPortion);
	if (wave < uncoloredPart && lightness < 0.5) {
		gradient = lightness / (uncoloredPart * (1.0 - sharpness));
		opacity = gradient;
		saturation = saturation * min(gradient, backgroundSaturation);
		lightness *= 1.0 - contrast;
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
}
