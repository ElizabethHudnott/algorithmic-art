
const float CROOT_EPSILON = 6.0 / 29.0;
const float KAPPA = 24389.0 / 27.0;

float fInverse(float v) {
	if (v > CROOT_EPSILON) {
		return v * v * v;
	} else {
		return (v * 116.0 - 16.0) / KAPPA;
	}
}

const mat3 xyzToRGB = mat3(
	+3.24081240, -0.96924302, +0.055638398,
	-1.53730845, +1.87596630, -0.204007461,
	-0.49858652, +0.04155503, +1.057129570
);

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
	float luminosity = 50.0;
	float red = 0.0;
	float blue = 0.0;

	for (int i = 0; i < bitDepth; i += 2) {
		blue += multiplier * colorComputation(difference, switchedSum, modulii[i], thresholds[i]);
		red += multiplier * colorComputation(difference, switchedSum, modulii[i + 1], thresholds[i + 1]);
		multiplier *= 2.0;
	}

	float maxValue = multiplier - 1.0;
	red = (red / maxValue * 256.0) - 128.0;
	blue = (blue / maxValue * 256.0) - 128.0;

	float fy = (luminosity + 16.0) / 116.0;
	float fx = (red / 500.0) + fy;
	float fz = fy - (blue / 200.0);

	vec3 xyz = vec3(
		fInverse(fx) * 0.95044922,
		luminosity > 8.0 ? fy * fy * fy : luminosity / KAPPA,
		fInverse(fz) * 1.08891665
	);

	vec3 rgb = max(xyzToRGB * xyz, vec3(0.0));
	fragColor.rgb = pow(rgb, vec3(1.0 / gamma));
	fragColor.a = 1.0;

}
