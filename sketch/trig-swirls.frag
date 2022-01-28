
const vec3 gamma = vec3(0.2126, 0.7152, 0.0722);

const mat4 yuvaToRGBAMat = mat4(
	1.0,					1.0,	1.0,	0.0,
	0.0,					2.0 * gamma.b / gamma.g * (gamma.b - 1.0),		2.0 - 2.0 * gamma.b,	0.0,
	2.0 - 2.0 * gamma.r,	2.0 * gamma.r / gamma.g * (gamma.r - 1.0),		0.0,					0.0,
	0.0,					0.0,											0.0,					1.0
);

float colorComputation(float sum, float sum2, float modulus, float shift, float threshold, float steps) {
	float minShift = -1.8 * threshold - 0.28;
	float maxShift = 1.0 - minShift;
	shift = minShift + shift * (maxShift - minShift);
	threshold = threshold * (3.0 * abs(0.5 - shift) + 0.5) * modulus * modulus;
	float sumMod = mod(sum, modulus) - shift * modulus;
	float sum2Mod = mod(sum2, modulus) - shift * modulus;
	float sumSquares = sumMod * sumMod + sum2Mod * sum2Mod;
	float value = max((threshold - sumSquares) / threshold, 0.0);
	return ceil(value * steps) / steps;
}

float triangle(float theta) {
	float s = sign(theta);
	theta = mod(abs(theta) + 0.5 * PI, 2.0 * PI);
	float value;
	if (theta <= PI) {
		value = 2.0 / PI * theta - 1.0;
	} else {
		value = 1.0 - 2.0 / PI * (theta - PI);
	}
	return s * value;
}

float sawtooth(float theta) {
	float s = sign(theta);
	float value = mod(abs(theta) + 0.5 * PI, 2.0 * PI) / PI - 1.0;
	return s * value;
}

float square(float theta) {
	float s = theta < 0.0 ? -1.0 : 1.0;
	theta = mod(abs(theta), 2.0 * PI);
	return s * (theta < PI ? 1.0 : -1.0);
}

void main() {
	float x = (gl_FragCoord.x - 0.5 * canvasWidth) / zoom - translateX / 1.8 * canvasWidth;
	float y = (gl_FragCoord.y - 0.5 * canvasHeight) / zoom + translateY / 1.8 * canvasHeight;

	float wave =
		amplitudeX * sin(x / (40.0 * stretchX) - phaseX) +
		amplitudeY * cos(y / (40.0 * stretchY) + phaseY);

	float s = amplitude[0] * sin(frequency[0] * wave + phase[0]);
	float c = amplitude[1] * cos(frequency[1] * wave + phase[1]);

	float sum = sumMagnitude[0] * abs(
		x * c * cos(sumAngle[0]) +  y * s * sin(sumAngle[0])
	);

	float switchedSum = sumMagnitude[1] * abs(
		x * s * cos(sumAngle[1]) +  y * c * sin(sumAngle[1])
	);

	float red;
	float maxValue = 0.0;
	bool transparent = true;
	for (int i = 0; i < redDepth; i++) {

		float weight = redWeight[i];
		if (weight > 0.0) {
			maxValue += weight;
		}

		red += weight * colorComputation(sum, switchedSum, redModulus[i],
			redShift[i], redThreshold[i], redSteps[i]);

	}
	if (maxValue > 0.0) {
		red = red / maxValue;
		transparent = red < greenChromaThreshold;
		float absOffset = abs(redOffset);
		red = red * (1.0 - absOffset) + absOffset - 0.5 + min(redOffset, 0.0);
	} else {
		red = clamp(redOffset, -0.5, 0.5);
	}

	float blue;
	maxValue = 0.0;
	for (int i = 0; i < blueDepth; i++) {

		float weight = blueWeight[i];
		if (weight > 0.0) {
			maxValue += weight;
		}

		blue += weight * colorComputation(sum, switchedSum, blueModulus[i],
			blueShift[i], blueThreshold[i], blueSteps[i]);

	}
	if (maxValue > 0.0) {
		blue = blue / maxValue;
		transparent = transparent && blue < greenChromaThreshold;
		float absOffset = abs(blueOffset);
		blue = blue * (1.0 - absOffset) + absOffset - 0.5 + min(blueOffset, 0.0);
	} else {
		blue = clamp(blueOffset, -0.5, 0.5);
	}

	float luminosity;
	maxValue = 0.0;
	for (int i = 0; i < luminosityDepth; i++) {

		float weight = luminosityWeight[i];
		if (weight > 0.0) {
			maxValue += weight;
		}

		luminosity += weight * colorComputation(sum, switchedSum, luminosityModulus[i],
			luminosityShift[i], luminosityThreshold[i], luminositySteps[i]);

	}
	if (maxValue > 0.0) {
		luminosity = luminosity / maxValue;
		transparent = transparent && luminosity < greenLumaThreshold;
		float absOffset = abs(luminosityOffset);
		luminosity = luminosity * (1.0 - absOffset) + absOffset + min(luminosityOffset, 0.0);
	} else {
		luminosity = clamp(0.6 + luminosityOffset, 0.0, 1.0);
	}

	float brightness = max(abs(red), abs(blue));
	if (luminosity >= brightness) {
		luminosity = (luminosity - brightness) / (1.0 - brightness);
	} else {
		brightness = luminosity / brightness;
		red *= brightness;
		blue *= brightness;
		luminosity = 0.0;
	}
	float alpha = transparent ? 0.0 : 1.0;
	fragColor = yuvaToRGBAMat * vec4(luminosity, blue, red, alpha);

}
