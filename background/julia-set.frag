void main() {
	float xMin = xCentre - xRange / 2.0;
	float yMin = yCentre - yRange / 2.0;

	float x = gl_FragCoord.x / canvasWidth * xRange + xMin;
	float y = gl_FragCoord.y / canvasHeight * yRange + yMin;

	int i = 0;
	while (x * x + y * y < escapeRSquared && i < maxIterations) {
		float newX = x * x - y * y + cReal;
		y = 2.0 * x * y + cIm;
		x = newX;
		i++;
	}
	if (i == maxIterations) {
		fragColor = vec4(0, 0, 0, 1);
	} else {
		float hue = 1.0 - float(i) / float(maxIterations);
		float lightness = 0.5 + 0.1 * hue;
		fragColor = hsla(hue, 1.0, lightness, 1.0);
	}
}
