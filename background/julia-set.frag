void main() {
	float xMin = xCentre - xRange / 2.0;
	float yMin = yCentre - yRange / 2.0;

	float x = gl_FragCoord.x / canvasWidth * xRange + xMin;
	float y = gl_FragCoord.y / canvasHeight * yRange + yMin;

	int exitTime = maxIterations;
	for (int i = 0; i < 1000000; i++) {
		float newX = x * x - y * y + cReal;
		y = 2.0 * x * y + cIm;
		x = newX;
		if (i == maxIterations || x * x + y * y > escapeRSquared) {
			exitTime = i;
			break;
		}
	}
	if (exitTime == maxIterations) {
		gl_FragColor = vec4(0, 0, 0, 1);
	} else {
		float hue = 1.0 - float(exitTime) / float(maxIterations);
		float lightness = 0.5 + 0.1 * hue;
		gl_FragColor = hsla(hue, 1.0, lightness, 1.0);
	}
}
