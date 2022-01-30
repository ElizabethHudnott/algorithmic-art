const int MAX_ATTRACTORS = 50;
const float TWO_PI = 2.0 * PI;

float angle(float x, float y) {
	if (x == 0.0) {
		return sign(y) * PI / 2.0;
	} else {
		return atan(y, x);
	}
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

vec4 colorFunc(int n, float scaledForce, float wave) {
	float a = wave * mix(baseBrightness[2], baseBrightness[0], scaledForce);
	float aPrime =  (1.0 - wave) * mix(baseBrightness[3], baseBrightness[1], scaledForce);
	float b = scaledForce * mix(baseBrightness[1], baseBrightness[0], wave);
	float aDesaturation = 1.0 - minSaturation;
	float aPrimeDesaturation = 1.0 - abs(backgroundSaturation);
	float bDesaturation = 1.0 - baseSaturation;
	float aNew = mix(min(b * bDesaturation + aPrime * aPrimeDesaturation, 1.0), 1.0, a);
	float aPrimeNew = mix(min(a * aDesaturation + b * bDesaturation, 1.0), 1.0, aPrime);
	float bNew = mix(min(a * aDesaturation + aPrime * aPrimeDesaturation, 1.0), 1.0, b);

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

float solveCubic(float a, float b, float c, float d) {
	float threeAC = 3.0 * a * c;
	float bSquared = b * b;
	float threeASquared = 3.0 * a * a;
	float p = (threeAC - bSquared) / threeASquared;
	float q = (2.0 * bSquared * b - 3.0 * threeAC * b + 9.0 * threeASquared * d) / (9.0 * threeASquared * a);

	float discriminant = -4.0 * p * p * p - 27.0 * q *q;
	float root3 = sqrt(3.0);
	float t, rootP;

	if (discriminant >= 0.0) {

		rootP = sqrt(-p);
		t = 2.0 * rootP / root3 * cos(
			1.0 / 3.0 * acos(1.5 * q / p * root3 / rootP) - 2.0 / 3.0 * PI
		);

	} else if (p == 0.0) {

		t = pow(-q, 1.0 / 3.0);

	} else if (p < 0.0) {

		rootP = sqrt(-p);
		t = -2.0 * sign(q) * rootP / root3 * cosh(
			1.0 / 3.0  * acosh(-1.5 * abs(q) / p * root3 / rootP)
		);

	} else {

		rootP = sqrt(p);
		t = -2.0 * rootP / root3 * sinh(
			1.0 / 3.0 * asinh(1.5 * q / p * root3 / rootP)
		);

	}
	return t - b / (3.0 * a);
}

float bezier(float a, float b, float x, bool reverseDirection) {
	float xPrime = mod((reverseDirection ? 1.0 - x : x) + 0.75, 1.0);
	float t, y;
	if (xPrime < 0.5) {
		t = solveCubic(0.5, -0.75, 0.75, -xPrime);
		y = (a + b) * (2.0 * t - 3.0) * t * t + a;
	} else {
		t = solveCubic(0.5, -0.75, 0.75, 0.5 - xPrime);
		y = (a + b) * (3.0 - 2.0 * t) * t * t - b;
	}
	return y;
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
		finalPointScale = mix(finalPointScale, 1.0, explosion);
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

	float maxDisplacementPx = sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight);
	if (displaceMax < 1.0) {
		maxDisplacementPx *= displaceMax;
	}

	for (int i = 0; i < numPoints; i++) {
		int index = ((i + 1) * modulus) % MAX_ATTRACTORS;
		float x2 = positionX[index] * canvasWidth;
		float y2 = positionY[index] * canvasHeight;
		{
			float displacePortion = displaceAmount[index];
			bool reverseDirection = displacePortion < 0.0;
			displacePortion = abs(displacePortion);

			float m = displaceGradient[index];
			float c = y2 - m * x2;
			float yZeroX = -c / m;
			float yMaxX = (canvasHeight - c) / m;
			float xMin, xMax;
			if (m == 0.0) {
				xMin = 0.0;
				xMax = canvasWidth;
			} else if (m > 0.0) {
				xMin = max(yZeroX, 0.0);
				xMax = min(yMaxX, canvasWidth);
			} else {
				xMin = max(yMaxX, 0.0);
				xMax = min(yZeroX, canvasWidth);
			}
			float displaceLeft = x2 - xMin;
			float displaceRight = xMax - x2;
			float maxDeltaX = displacePortion * maxDisplacementPx;
			maxDeltaX *= maxDeltaX;
			maxDeltaX = sqrt(maxDeltaX / (1.0 + m * m));
			if (displaceRight > displaceLeft) {
				displaceRight = min(displaceRight, maxDeltaX);
				displaceLeft = min(displaceLeft, displaceRight);
			} else {
				displaceLeft = min(displaceLeft, maxDeltaX);
				displaceRight = min(displaceLeft, displaceRight);
			}
			if (displaceMax > 1.0) {
				displaceLeft *= displaceMax;
				displaceRight *= displaceMax;
			}
			float displaceX = bezier(displaceRight, displaceLeft, tween, reverseDirection);
			x2 += displaceX;
			y2 += m * displaceX;
		}

		float distance = distanceMetric(x, y, x2, y2);

		float pointStrength = strength[index];
		if (i == numPoints - 1) {
			pointStrength *= finalPointScale;
		}

		float dotSize = round(max(abs(pointStrength) * maxDotSize, minDotSize));
		if (distance < dotSize) {
			float lightness = distance <= dotSize - 1.0 ? 1.0 : 1.0 - fract(distance);
			vec4 color = dotColors[pointStrength < 0.0 ? 1 : 0];
			fragColor = hsla(color[0], color[1], color[2] * lightness, color[3]);
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
	 	wave = max(
			(pow(sine, 2.0) - 1.0 + colorPortion) / colorPortion,
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

	float waveLightnessPrime;
	if (waveLightness < 0.0) {
		waveLightnessPrime = waveLightness * 1.5 / 2.0;
	} else if (waveLightness <= 1.0) {
		waveLightnessPrime = waveLightness * colorPortion;
	} else if (waveLightness > 1.0) {
		waveLightnessPrime = mix(waveLightness - 1.0, 1.0, colorPortion);
	}

	float rawLightness = maxLightness * (waveLightnessPrime * wave + 1.0 - waveLightnessPrime);
	lightness = max(rawLightness, minLightness);

	float uncoloredPart = maxLightness * (1.0 - colorPortion);
	if (wave < uncoloredPart) {
		gradient = rawLightness / (uncoloredPart * (1.0 - sharpness));
		gradient = max(gradient, 1.0 - waveLightnessPrime);
		opacity = gradient;
		saturation = saturation * backgroundSaturation;
		lightness *= 1.0 - contrast;
	}

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
	float pixelBaseIntensity = max(baseIntensity, (1.0 - gradient) * backgroundOpacity);
	fragColor *= pixelBaseIntensity;
	fragColor.a = mix(backgroundOpacity, mix(wave, 1.0, backgroundOpacity), baseIntensity);
	fragColor += (1.0 - pixelBaseIntensity) * color;
}
