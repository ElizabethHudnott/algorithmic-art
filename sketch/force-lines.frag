const float TWO_PI = 2.0 * PI;

float angle(float x, float y) {
	if (x == 0.0) {
		return sign(y) * PI / 2.0;
	} else {
		return atan(y, x);
	}
}

void main() {
	if (colorPortion == 0.0) {
		fragColor = vec4(0.0, 0.0, 0.0, 0.0);
		return;
	}

	vec2 totalColor = vec2(0.0, 0.0);
	float hue;
	float antialiasingF = float(antialiasing);
	float step = 1.0 / antialiasingF;

	for (int xShift = 0; xShift < antialiasing; xShift++) {
		for (int yShift = 0; yShift < antialiasing; yShift++) {
			float x = gl_FragCoord.x + float(xShift) * step;
			float y = gl_FragCoord.y + float(yShift) * step;

			float forceX = 0.0, forceY = 0.0;
			float effectiveFieldConstant = fieldConstant * min(canvasWidth, canvasHeight);
			for (int i = 0; i < numAttractors; i++) {
				float displacementX = x - positionX[i] * canvasWidth;
				float displacementY = y - positionY[i] * canvasHeight;
				float distance = sqrt(displacementX * displacementX + displacementY * displacementY);
				float attractorAngle = angle(displacementX, displacementY);
				float force = effectiveFieldConstant * strength[i] / pow(distance, fieldExponent);
				forceX += force * cos(attractorAngle);
				forceY += force * sin(attractorAngle);
			}

			float netForce = sqrt(forceX * forceX + forceY * forceY);
			float theta = angle(forceX, forceY);
			if (xShift == 0 && yShift == 0) {
				hue = mod(-theta + 0.5 * PI, TWO_PI) / TWO_PI;
				float lastRed = floor(hueFrequency) / hueFrequency;
				if (hue > lastRed) {
					hue = (hue - lastRed) / (1.0 - lastRed);
				} else {
					hue = hue * hueFrequency;
				}
				hue = mod(hue - hueRotation, 1.0);
			}
			float wave = (sin(netForce) + colorPortion * 2.0 - 1.0) / (colorPortion * 2.0);
			float lightness = maxLightness * max(wave, 0.0);
			float opacity = 1.0;
			float uncoloredPart = maxLightness * (1.0 - colorPortion);
			if (lightness < uncoloredPart && lightness < 0.5) {
				if (sharpness == 1.0) {
					opacity = 0.0;
				} else {
					opacity = lightness / (uncoloredPart * (1.0 - sharpness));
				}
			}
			lightness = max(lightness, minLightness);
			totalColor += vec2(lightness, opacity);
		}
	}

	float samplePoints = antialiasingF * antialiasingF;
	vec2 meanColor = totalColor / samplePoints;
	fragColor = hsla(hue, saturation, meanColor[0], meanColor[1]);
}
