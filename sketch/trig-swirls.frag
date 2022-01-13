
const vec3 gamma = vec3(0.2126, 0.7152, 0.0722);

const mat4 yuvaToRGBAMat = mat4(
	1.0,					1.0,	1.0,	0.0,
	0.0,					2.0 * gamma.b / gamma.g * (gamma.b - 1.0),		2.0 - 2.0 * gamma.b,	0.0,
	2.0 - 2.0 * gamma.r,	2.0 * gamma.r / gamma.g * (gamma.r - 1.0),		0.0,					0.0,
	0.0,					0.0,											0.0,					1.0
);

vec4 yuvaToRGBA(float luminosity, float blue, float red, float alpha) {
	return yuvaToRGBAMat * vec4(luminosity, blue, red, alpha);
}

float colorComputation(float difference, float sum, float modulus, float threshold) {
	threshold = (threshold / 10000.0 + 0.125) * modulus * modulus;
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

	float multiplier = 1.0;
	float luminosity = 1.0;
	float red = 0.0;
	float blue = 0.0;

	for (int i = 0; i < bitDepth; i += 2) {
		blue += multiplier * colorComputation(difference, switchedSum, modulii[i], thresholds[i]);
		red += multiplier * colorComputation(difference, switchedSum, modulii[i + 1], thresholds[i + 1]);
		multiplier *= 2.0;
	}

	float maxValue = multiplier - 1.0;
	blue = blue / maxValue - 0.5;
	red = red / maxValue - 0.5;

	fragColor = yuvaToRGBA(luminosity, blue, red, 1.0);

}
