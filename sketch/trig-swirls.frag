
const vec3 gamma = vec3(0.2126, 0.7152, 0.0722);

const mat4 yuvaToRGBAMat = mat4(
	1.0,					1.0,	1.0,	0.0,
	0.0,					2.0 * gamma.b / gamma.g * (gamma.b - 1.0),		2.0 - 2.0 * gamma.b,	0.0,
	2.0 - 2.0 * gamma.r,	2.0 * gamma.r / gamma.g * (gamma.r - 1.0),		0.0,					0.0,
	0.0,					0.0,											0.0,					1.0
);

float colorComputation(float difference, float sum, float modulus, float shift, float threshold, float steps) {
	float minShift = -1.8 * threshold - 0.28;
	float maxShift = 1.0 - minShift;
	shift = minShift + shift * (maxShift - minShift);
	threshold = threshold * (3.0 * abs(0.5 - shift) + 0.5) * modulus * modulus;
	float differenceMod = mod(difference, modulus) - shift * modulus;
	float sumMod = mod(sum, modulus) - shift * modulus;
	float sumSquares = differenceMod * differenceMod + sumMod * sumMod;
	float value = max((threshold - sumSquares) / threshold, 0.0);
	return ceil(value * steps) / steps;
}

void main() {
	float x = (gl_FragCoord.x - 0.5 * canvasWidth) / zoom - translateX / 1.8 * canvasWidth;
	float y = (gl_FragCoord.y - 0.5 * canvasHeight) / zoom + translateY / 1.8 * canvasHeight;

	float wave = sin(x / 40.0 - phaseX) + cos(y / 40.0 + phaseY);
	float s = sin(wave);
	float c = cos(wave);
	float difference = abs(x * c + y * s);
	float switchedSum = abs(y * c + x * s);

	bool transparent = true;
	float multiplier;
	float red = 0.0;
	float minRed;
	float maxValue;
	if (redDepth > 0) {
		multiplier = 1.0;
		for (int i = redDepth - 1; i >= 0; i--) {
			red += multiplier * colorComputation(difference, switchedSum, redModulus[i],
				redShift[i], redThreshold[i], redSteps[i]);
			multiplier *= 2.0;
		}
		transparent = red < 0.5;
		maxValue = multiplier - 1.0;
		red = red / maxValue - 0.5;
		minRed = 1.0 / maxValue;
	}
	red = clamp(red + redOffset, -0.5, 0.5);

	float blue = 0.0;
	float minBlue;
	if (blueDepth > 0) {
		multiplier = 1.0;
		for (int i = blueDepth - 1; i >= 0; i--) {
			blue += multiplier * colorComputation(difference, switchedSum, blueModulus[i],
				blueShift[i], blueThreshold[i], blueSteps[i]);
			multiplier *= 2.0;
		}
		transparent = transparent && blue < 0.5;
		maxValue = multiplier - 1.0;
		blue = blue / maxValue - 0.5;
		minBlue = 1.0 / maxValue;
	}
	blue = clamp(blue + blueOffset, -0.5, 0.5);

	float luminosity = 0.0;
	if (luminosityDepth > 0) {
		multiplier = 2.0;
		for (int i = luminosityDepth - 1; i >= 0; i--) {
			luminosity += multiplier *
				colorComputation(difference, switchedSum, luminosityModulus[i],
					luminosityShift[i], luminosityThreshold[i], luminositySteps[i]);
			multiplier *= 2.0;
		}
		transparent = transparent && luminosity <= alphaThreshold * (multiplier - 2.0);
		luminosity = (luminosity + 1.0) / (multiplier - 1.0);
	} else {
		luminosity = 0.6;
	}
	luminosity = clamp(luminosity + luminosityOffset, 0.0, 1.0);

	float alpha = 1.0;
	if (transparent) {
		alpha = max(
			redDepth  > 0 ? (red + 0.5) / minRed : 0.0,
			blueDepth > 0 ? (blue + 0.5) / minBlue : 0.0
		);
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
	fragColor = yuvaToRGBAMat * vec4(luminosity, blue, red, alpha);

}
