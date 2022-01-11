
float colorComputation(float difference, float sum, float modulus, float threshold) {
	float differenceMod = mod(difference, modulus) - 0.75 * modulus;
	float sumMod = mod(sum, modulus) - 0.75 * modulus;
	float sumSquares = differenceMod * differenceMod + sumMod * sumMod;
	return sumSquares < threshold ? 1.0 : 0.0;
}

void main() {
	float x = (gl_FragCoord.x - 0.5 * canvasWidth) / zoom;
	float y = (gl_FragCoord.y - 0.5 * canvasHeight) / zoom;

	float wave = sin(x / divisor + offsetX * PI) + cos(y / divisor + offsetY * PI);
	float s = sin(wave);
	float c = cos(wave);
	float difference = abs(x * c + y * s);
	float switchedSum = abs(y * c + x * s);

	float red = colorComputation(difference, switchedSum, modulii[0], thresholds[0]);
	float green = colorComputation(difference, switchedSum, modulii[1], thresholds[1]);
	float blue = colorComputation(difference, switchedSum, modulii[2], thresholds[2]);

	fragColor = vec4(red, green, blue, 1.0);

}
