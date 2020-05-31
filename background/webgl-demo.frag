void main() {
	gl_FragColor = vec4(
		tween * red,
		tween * gl_FragCoord.x / canvasWidth,
		tween * gl_FragCoord.y / canvasHeight,
		1.0
	);
}
