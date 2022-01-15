
const vec3 gamma = vec3(0.2126, 0.7152, 0.0722);

const mat4 yuvaToRGBAMat = mat4(
	1.0,					1.0,	1.0,	0.0,
	0.0,					2.0 * gamma.b / gamma.g * (gamma.b - 1.0),		2.0 - 2.0 * gamma.b,	0.0,
	2.0 - 2.0 * gamma.r,	2.0 * gamma.r / gamma.g * (gamma.r - 1.0),		0.0,					0.0,
	0.0,					0.0,											0.0,					1.0
);

float colorComputation(float difference, float sum, float modulus, float threshold) {
	threshold = threshold * modulus * modulus;
	float differenceMod = mod(difference, modulus) - 0.75 * modulus;
	float sumMod = mod(sum, modulus) - 0.75 * modulus;
	float sumSquares = differenceMod * differenceMod + sumMod * sumMod;
	return sumSquares < threshold ? 1.0 : 0.0;
}

void main() {
	float x = (gl_FragCoord.x - 0.5 * canvasWidth) / zoom;
	float y = (gl_FragCoord.y - 0.5 * canvasHeight) / zoom;

	float wave = sin(x / 40.0 + offsetX) + cos(y / 40.0 + offsetY);
	float s = sin(wave);
	float c = cos(wave);
	float difference = abs(x * c + y * s);
	float switchedSum = abs(y * c + x * s);

	float luminosity = 0.0;
	float multiplier;
	if (luminosityDepth > 0) {
		multiplier = 2.0;
		for (int i = luminosityDepth - 1; i >= 0; i--) {
			luminosity += multiplier * colorComputation(difference, switchedSum, luminosityModulii[i], luminosityThresholds[i]);
			multiplier *= 2.0;
		}
		luminosity = (luminosity + 1.0) / (multiplier - 1.0);
	} else {
		luminosity = 0.75;
	}

	float red = 0.0;
	if (redDepth > 0) {
		multiplier = 1.0;
		for (int i = redDepth - 1; i >= 0; i--) {
			red += multiplier * colorComputation(difference, switchedSum, redModulii[i], redThresholds[i]);
			multiplier *= 2.0;
		}
		red = red / (multiplier - 1.0) - 0.5;
	}

	float blue = 0.0;
	if (blueDepth > 0) {
		multiplier = 1.0;
		for (int i = blueDepth - 1; i >= 0; i--) {
			blue += multiplier * colorComputation(difference, switchedSum, blueModulii[i], blueThresholds[i]);
			multiplier *= 2.0;
		}
		blue = blue / (multiplier - 1.0) - 0.5;
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

	fragColor = yuvaToRGBAMat * vec4(luminosity, blue, red, 1.0);

}
