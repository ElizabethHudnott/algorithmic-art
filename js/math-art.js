'use strict';
filePath = 'sketch/';
const urlParameters = new URLSearchParams(document.location.search);
let bgGenerator, generateBackground, setBgProperty, setBgPropertyElement;
let random = new RandomNumberGenerator();
const bgGeneratorImage = new Image();
let backgroundImage;

if (!window.debug) {
	window.debug = {};
}
debug.video = false;

let store;
try {
	store = window.localStorage;
} catch (e) {
	console.warn('Local storage unavailable.');
}

{
	const backendRoot = 'http://localhost/';
	const backgroundElement = document.body;
	if (darkMode()) {
		document.getElementById('background-color').value = '#000000';
		backgroundElement.style.backgroundColor = '#000000';
	}

	let backgroundRedraw;
	let rotation = 0, opacity = 1;

	const canvas = document.getElementById('background-canvas');

	const vertexShaderSource = `#version 300 es
 		in vec4 aVertexPosition;
		uniform mat4 uModelViewMatrix;
		uniform mat4 uProjectionMatrix;

		void main() {
			gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
		}
	`;

	const fragmentShaderHeader = `#version 300 es
		precision highp float;
		precision highp int;
		out vec4 fragColor;
		#define PI ${Math.PI}
		#define SQRT2 ${Math.SQRT2}
		uniform float canvasWidth;
		uniform float canvasHeight;
		uniform float tween;
		uniform int preview;

		vec4 hsla(in float h, in float s, in float l, in float a) {
			vec3 rgb = clamp(
				abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0,
				0.0, 1.0
			);
			return vec4(l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0)), a);
		}
	`;

	function loadShader(context, type, source) {
		const shader = context.createShader(type);
		context.shaderSource(shader, source);
		context.compileShader(shader);

		if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
			console.error('Unable to compile shader: ' + context.getShaderInfoLog(shader));
			context.deleteShader(shader);
			const sourceLines = source.split('\n');
			let annotatedLines = ''
			for (let i = 0; i < sourceLines.length; i++) {
				annotatedLines += String(i + 1) + '\t' + sourceLines[i] + '\n';
			}
			console.log(annotatedLines);
			return null;
		}

		return shader;
	}

	const GLTypeCategory = Object.freeze({
		'SCALAR': 0,
		'VECTOR': 1,
		'MATRIX': 2,
	});

	class GLType {
		constructor(category, baseType, width, height, length) {
			this.category = category;
			this.baseType = baseType;
			this.width = width;
			this.height = height;
			this.length = length;

			const setterBaseType = baseType === 'b' ? 'f' : baseType;
			if (category === GLTypeCategory.SCALAR && length === undefined) {
				this.setterName = 'uniform1' + setterBaseType;
			} else if (category === GLTypeCategory.MATRIX) {
				if (width === height) {
					this.setterName = 'uniformMatrix' + width + 'fv';
				} else {
					this.setterName = 'uniformMatrix' + height + 'x' + width + 'fv';
				}
			} else {
				this.setterName = 'uniform' + width + setterBaseType + 'v'
			}
		}

		toString() {
			let category = this.category;
			if (category === GLTypeCategory.VECTOR && this.width === 1) {
				category = GLTypeCategory.SCALAR;
			}
			let typeName;
			switch (category) {
			case GLTypeCategory.SCALAR:
				switch (this.baseType) {
				case 'b':
					typeName = 'bool';
					break;
				case 'i':
					typeName = 'int';
					break;
				case 'f':
					typeName = 'float';
					break;
				}
				break;
			case GLTypeCategory.VECTOR:
				typeName = (this.baseType === 'f' ? 'vec' : this.baseType + 'vec') + this.width;
				break;
			case GLTypeCategory.MATRIX:
				typeName = 'mat' + this.height + 'x' + this.width;
				break;
			}
			if (this.length !== undefined) {
				typeName += '[' + this.length + ']';
			}
			return typeName;
		}

		/**
		 * @param {boolean} isArrayElement	true if we're setting a single element inside an array.
		 */
		assignValue(gl, location, value, isArrayElement) {
			const category = this.category;
			const isArray = this.length !== undefined;
			if (isArray && !isArrayElement) {
				value = [].concat(...value); // Flatten
			}
			if (category === GLTypeCategory.MATRIX) {
				value = new Float32Array([].concat(...value));
				gl[this.setterName](location, false, value);
			} else {
				if (
					this.baseType === 'i' &&
					(category === GLTypeCategory.VECTOR || isArray)
				) {
					value = new Int32Array(value);
				}
				gl[this.setterName](location, value);
			}
		}

	}

	const glTypes = new Map();
	glTypes.set('b', new GLType(GLTypeCategory.SCALAR, 'b'));
	glTypes.set('i', new GLType(GLTypeCategory.SCALAR, 'i'));
	glTypes.set('f', new GLType(GLTypeCategory.SCALAR, 'f'));
	for (let i = 1; i <= 4; i++) {
		glTypes.set('bvec' + i, new GLType(GLTypeCategory.VECTOR, 'b', i));
		glTypes.set('ivec' + i, new GLType(GLTypeCategory.VECTOR, 'i', i));
		glTypes.set('fvec' + i, new GLType(GLTypeCategory.VECTOR, 'f', i));
	}

	function glBaseType(example, isInteger) {
		if (isInteger) {
			if (example === true || example === false) {
				return 'b';
			} else {
				return 'i';
			}
		} else {
			return 'f';
		}
	}

	function inferGLType(example, isInteger) {

		if (Array.isArray(example)) {
			const dim1 = example.length;

			if (Array.isArray(example[0])) {
				const dim2 = example[0].length;

				if (Array.isArray(example[0][0])) {
					const dim3 = example[0][0].length;
					// Array of matrices
					return new GLType(GLTypeCategory.MATRIX, 'f', dim3, dim2, dim1);
				} else if (!isInteger && dim1 > 1 && dim1 < 5 && dim2 > 1 && dim2 < 5) {
					// Matrix
					return new GLType(GLTypeCategory.MATRIX, 'f', dim2, dim1);
				} else {
					// Array of vectors
					return new GLType(GLTypeCategory.VECTOR, glBaseType(example[0][0]), dim2, 1, dim1);
				}
			} else if (dim1 < 5) {
				// Vector
				return glTypes.get(glBaseType(example[0], isInteger) + 'vec' + dim1);
			} else {
				// Array of scalars
				return new GLType(GLTypeCategory.SCALAR, glBaseType(example[0]), 1, 1, dim1);
			}
		} else {
			return glTypes.get(glBaseType(example, isInteger));
		}
	}

	function shaderDeclarations(generator) {
		let str = '';
		const animatable = generator.animatable;
		if (animatable !== undefined) {
			const continuous = animatable.continuous;
			if (continuous !== undefined) {
				for (let property of continuous) {
					const value = generator[property];
					const typeName = inferGLType(value, false).toString();
					str += 'uniform ' + typeName + ' ' + property + ';\n';
				}
			}
			const stepped = animatable.stepped;
			if (stepped !== undefined) {
				for (let property of stepped) {
					const value = generator[property];
					const typeName = inferGLType(value, true).toString();
					str += 'uniform ' + typeName + ' ' + property + ';\n';
				}
			}
			const pairedContinuous = animatable.pairedContinuous;
			if (pairedContinuous !== undefined) {
				for (let [property1, property2] of pairedContinuous) {
					const value1 = generator[property1];
					const typeName = inferGLType(value1, false).toString();
					str += 'uniform ' + typeName + ' ' + property1 + ';\n';
					str += 'uniform ' + typeName + ' ' + property2 + ';\n';
				}
			}
			const xy = animatable.xy;
			if (xy !== undefined) {
				for (let [property1, property2] of xy) {
					str += 'uniform float ' + property1 + ';\n';
					str += 'uniform float ' + property2 + ';\n';
				}

			}
			const pairedStepped = animatable.pairedStepped;
			if (pairedStepped !== undefined) {
				for (let [property1, property2] of pairedStepped) {
					const value1 = generator[property1];
					const typeName = inferGLType(value1, true).toString();
					str += 'uniform ' + typeName + ' ' + property1 + ';\n';
					str += 'uniform ' + typeName + ' ' + property2 + ';\n';
				}
			}
		}
		return str;
	}

	class DrawingContext {
		constructor(canvas, width, height, scale) {
			const twoD = canvas.getContext('2d');
			this.twoD = twoD;
			this.gl = undefined;
			this.scale = scale;
			this.resize(width, height);
			this.modelViewMatrix = undefined;
			this.projectionMatrix = undefined;
			this.uniformLocations = undefined;
			this.program = undefined;
			this.types = new Map();
		}

		resize(width, height) {
			const canvas = this.twoD.canvas;
			canvas.width = width;
			canvas.height = height;
			const twoD = this.twoD;
			const scale = this.scale;
			if (scale !== 1) {
				twoD.scale(scale, scale);
				twoD.save();
			}
			twoD.save();

			const gl = this.gl;
			if (gl !== undefined) {
				const glCanvas = gl.canvas;
				glCanvas.width = width / scale;
				glCanvas.height = height / scale;
				gl.viewport(0, 0, glCanvas.width, glCanvas.height);

				const fieldOfView = Math.PI / 4;
				const aspect = width / height;
				const zNear = 0.1;
				const zFar = 100;
				const projectionMatrix = mat4.create();
				mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
				this.projectionMatrix = projectionMatrix;

				const uniformLocations = this.uniformLocations;
				if (uniformLocations !== undefined) {
					gl.uniformMatrix4fv(
						uniformLocations.projectionMatrix,
						false,
						projectionMatrix
					);
					gl.uniform1f(uniformLocations.width, glCanvas.width);
					gl.uniform1f(uniformLocations.height, glCanvas.height);
				}
			}
        }

		initializeShader(generator) {
			if (generator.shaderSource === undefined) {
				return;
			}
			let gl = this.gl;
			if (this.gl === undefined) {
				const glCanvas = document.createElement('CANVAS');
				gl = glCanvas.getContext('webgl2', {premultipliedAlpha : false});
				this.gl = gl;
				const positionBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
				const points = [
					-1,  1,
					 1,  1,
					-1, -1,
					 1, -1,
				];
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
				gl.enable(gl.DEPTH_TEST);
				const modelViewMatrix = mat4.create();
				mat4.translate(
					modelViewMatrix,	// destination matrix
					modelViewMatrix,	// matrix to translate
					[0, 0, -1]			// amount to translate
				);
				this.modelViewMatrix = modelViewMatrix;
				const twoDCanvas = this.twoD.canvas;
				this.resize(twoDCanvas.width, twoDCanvas.height);
			}

			const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
			const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, generator.shaderSource);
			const program = gl.createProgram();
			this.program = program;
			gl.attachShader(program, vertexShader);
			gl.attachShader(program, fragmentShader);
			gl.linkProgram(program);
			if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
				console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
				return null;
			}

			const vertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
			gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);
			const uniformLocations = {
				projectionMatrix: gl.getUniformLocation(program, 'uProjectionMatrix'),
				modelViewMatrix: gl.getUniformLocation(program, 'uModelViewMatrix'),
				width: gl.getUniformLocation(program, 'canvasWidth'),
				height: gl.getUniformLocation(program, 'canvasHeight'),
				tween: gl.getUniformLocation(program, 'tween'),
				preview: gl.getUniformLocation(program, 'preview'),
			};
			this.uniformLocations = uniformLocations;
			gl.enableVertexAttribArray(vertexPosition);
			gl.useProgram(program);
			gl.uniformMatrix4fv(
				uniformLocations.projectionMatrix,
				false,
				this.projectionMatrix
			);
			gl.uniformMatrix4fv(
				uniformLocations.modelViewMatrix,
				false,
				this.modelViewMatrix
			);
			gl.uniform1f(uniformLocations.width, gl.canvas.width);
			gl.uniform1f(uniformLocations.height, gl.canvas.height);

			this.types.clear();
			const animatable = generator.animatable;
			if (animatable !== undefined) {
				const continuous = animatable.continuous;
				if (continuous !== undefined) {
					for (let property of continuous) {
						this.types.set(property, inferGLType(generator[property], false));
					}
				}
				const stepped = animatable.stepped;
				if (stepped !== undefined) {
					for (let property of stepped) {
						this.types.set(property, inferGLType(generator[property], true));
					}
				}
				const pairedContinuous = animatable.pairedContinuous;
				if (pairedContinuous !== undefined) {
					for (let [property1, property2] of pairedContinuous) {
						this.types.set(property1, inferGLType(generator[property1], false));
						this.types.set(property2, inferGLType(generator[property2], false));
					}
				}
				const xy = animatable.xy;
				if (xy !== undefined) {
					for (let [property1, property2] of xy) {
						this.types.set(property1, inferGLType(generator[property1], false));
						this.types.set(property2, inferGLType(generator[property2], false));
					}
				}
				const pairedStepped = animatable.pairedStepped;
				if (pairedStepped !== undefined) {
					for (let [property1, property2] of pairedStepped) {
						this.types.set(property1, inferGLType(generator[property1], true));
						this.types.set(property2, inferGLType(generator[property2], true));
					}
				}
			}
		}

		setProperty(generator, property, value) {
			if (arguments.length === 2) {
				value = generator[property];
			} else {
				generator[property] = value;
			}
			const gl = this.gl;
			const location = gl.getUniformLocation(this.program, property);
			const type = this.types.get(property);
			type.assignValue(gl, location, value, false);
		}

		setPropertyElement(generator, property, index, value) {
			const arr = generator[property];
			if (arguments.length === 3) {
				value = arr[index];
			} else {
				arr[index] = value;
			}
			const gl = this.gl;
			const type = this.types.get(property);
			if (type.length === undefined) {
				const location = gl.getUniformLocation(this.program, property)
				type.assignValue(gl, location, arr, false);
			} else {
				const location = gl.getUniformLocation(this.program, property + '[' + index + ']');
				type.assignValue(gl, location, value, true);
			}
		}

		setProperties(generator) {
			const gl = this.gl;
			const program = this.program;
			const types = this.types;
			for (let property of types.keys()) {
				const location = gl.getUniformLocation(program, property);
				const type = types.get(property);
				type.assignValue(gl, location, generator[property], false);
			}
		}

		drawGL(tween, preview) {
			const gl = this.gl;
			gl.uniform1f(this.uniformLocations.tween, tween);
			gl.uniform1i(this.uniformLocations.preview, preview);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			this.twoD.drawImage(gl.canvas, 0, 0);
		}

	}

	const drawingContext = new DrawingContext(canvas, window.innerWidth, window.innerHeight, 1);
	const signatureBox = document.getElementById('author-hitbox');
	let signatureChanged = true;
	let signatureWidth, signatureHeight, userDisplayName;
	let signatureText = '';
	const signatureFont = 'italic 20px "Pacifico", cursive';

	function calcSignature() {
		signatureText = '';
		let sketchAuthor;
		if (currentSketch) {
			sketchAuthor = currentSketch.author;
		}
		if (sketchAuthor) {
			signatureText = sketchAuthor;
			if (userDisplayName) {
				signatureText += ' & ';
			}
		}
		if (userDisplayName) {
			signatureText += userDisplayName;
		}
		if (signatureText === '') {
			signatureWidth = 100;
			signatureHeight = 30;
		} else {
			const context = drawingContext.twoD;
			context.restore();
			context.save();
			context.font = signatureFont;
			context.textAlign = 'left';
			context.textBaseline = 'bottom';
			const metrics = context.measureText(signatureText);
			signatureWidth = 2 * 3 + Math.ceil(metrics.actualBoundingBoxRight);
			signatureHeight = 2 * 4 + Math.ceil(metrics.actualBoundingBoxAscent);
		}
		signatureBox.style.width = signatureWidth + 'px';
		signatureBox.style.height = signatureHeight + 'px';
		signatureChanged = false;
	}

	function drawSignature(contextualInfo) {
		const context = contextualInfo.twoD;
		if (signatureChanged) {
			calcSignature();
		} else {
			context.restore();
			context.save();
			context.textAlign = 'left';
			context.textBaseline = 'bottom';
		}
		if (signatureText === '') {
			return;
		}

		const backgroundColor = backgroundElement.style.backgroundColor;
		const [bgRed, bgGreen, bgBlue] = parseColor(backgroundColor)[1];
		let canvasHeight = context.canvas.height;
		const pixels = context.getImageData(0, canvasHeight - signatureHeight, signatureWidth, signatureHeight).data;
		let totalRed = 0, totalGreen = 0, totalBlue = 0;
		const numSamples = 50;
		for (let i = 0; i < numSamples; i++) {
			const x = Math.trunc(Math.random() * signatureWidth);
			const y = Math.trunc(Math.random() * signatureHeight);
			const offset = (y * signatureWidth + x) * 4;
			const alpha = pixels[offset + 3] / 255;
			const bgAmount = 1 - alpha;
			totalRed += alpha * pixels[offset] + bgAmount * bgRed;
			totalGreen += alpha * pixels[offset + 1] + bgAmount * bgGreen;
			totalBlue += alpha * pixels[offset + 2] + bgAmount * bgBlue;
		}
		const meanRed = totalRed / numSamples;
		const meanGreen = totalGreen / numSamples;
		const meanBlue = totalBlue / numSamples;

		const scale = contextualInfo.scale;
		canvasHeight /= scale;
		const fontSize = Math.ceil(20 / scale);
		context.font = signatureFont.replace('20', fontSize);
		const scaledWidth = signatureWidth / scale;
		const scaledHeight = signatureHeight / scale;
		const paddingX = Math.round(3 / scale);
		const paddingY = Math.round(4 / scale);
		context.fillStyle = rgba(meanRed, meanGreen, meanBlue, 1);
		context.fillRect(0, canvasHeight - scaledHeight, scaledWidth, scaledHeight);
		const luma = rgbToLuma(meanRed, meanGreen, meanBlue);
		context.fillStyle = luma >= 0.5 ? 'black' : '#f0f0f0';
		context.fillText(signatureText, paddingX, canvasHeight - paddingY);
	}

	function progressiveBackgroundDraw(generator, contextualInfo, width, height, preview) {
		if (generator.isShader) {
			contextualInfo.drawGL(parseFloat(animPositionSlider.value), preview);
			if (preview === 0) {
				if (document.fonts.check(signatureFont)) {
					drawSignature(contextualInfo);
				} else {
					document.fonts.load(signatureFont).then(function () {
						drawSignature(contextualInfo);
					});
				}
			}
		} else {
			random.reset();
			const redraw = generator.generate(contextualInfo.twoD, width, height, preview);
			backgroundRedraw = redraw;
			let done = false;
			function drawSection() {
				if (backgroundRedraw === redraw) {
					done = redraw.next().done;
					if (done) {
						backgroundRedraw = undefined;
						if (preview === 0) {
							if (document.fonts.check(signatureFont)) {
								drawSignature(contextualInfo);
							} else {
								document.fonts.load(signatureFont).then(function () {
									drawSignature(contextualInfo);
								});
							}
						}
					} else {
						requestAnimationFrame(drawSection);
					}
				}
			}
			drawSection();
		}
	}

	function rotateCanvas(context, width, height, rotation) {
		context.translate(width / 2, height / 2);
		context.rotate(rotation);
		context.translate(-width / 2, -height / 2);
	}

	function progressiveBackgroundGen(preview) {
		const context = drawingContext.twoD;
		const width = canvas.width;
		const height = canvas.height;
		context.restore();
		context.clearRect(0, 0, width, height);
		context.save();
		if (backgroundImage !== undefined) {
			context.drawImage(backgroundImage, 0, 0, width, height);
		}
		rotateCanvas(context, width, height, rotation);
		context.globalAlpha = opacity;
		progressiveBackgroundDraw(bgGenerator, drawingContext, width, height, preview);
	}

	generateBackground = progressiveBackgroundGen;
	setBgProperty = drawingContext.setProperty.bind(drawingContext);
	setBgPropertyElement = drawingContext.setPropertyElement.bind(drawingContext);

	function redraw() {
		progressiveBackgroundGen(0)
	}

	bgGeneratorImage.onload = redraw;

	let currentSketch, generatorURL, startFrame, endFrame, tweenData, animController;
	let helpDoc, helpContextItem;
	let helpContext = false;
	let helpContextIntermediate = false; // True after mouse down but before mouse click.

	window.inHelpContext = function () {
		return helpContext;
	};

	/* The current frame according to the interpolation, not necessarily what's displayed
	 * on screen because there can be unsaved changes. */
	let currentFrame;
	// The action requested when unsaved changes were detected.
	let animAction;
	let fullRotations = 0, loopAnim = false;

	const errorAlert = $('#error-alert');
	const successAlert = $('#success-alert');
	const videoErrorAlert = $('#video-error');

	const authorForm = document.getElementById('author-form');
	const authorInput = document.getElementById('author');

	const sketchCards = document.getElementById('sketch-list');
	const modal = document.getElementById('background-gen-modal');
	const modalHeader = document.getElementById('background-gen-modal-header');
	const rotationSlider = document.getElementById('layer-rotation');
	const opacitySlider = document.getElementById('layer-opacity');
	const toolbar = document.getElementById('toolbar');
	const seedForm = document.getElementById('random-seed-form');
	const seedInput = document.getElementById('random-seed');
	const progressBar = document.getElementById('video-progress');
	const imageUpload = document.getElementById('background-gen-image');
	imageUpload.remove();
	imageUpload.removeAttribute('hidden');

	const animPositionSlider = document.getElementById('anim-position');
	let animControlsOpen = false;
	const videoResolutionInput = document.getElementById('video-resolution');

	class FrameData {
		constructor(generator, rotation, backgroundElement, backgroundImage) {
			this.continuous = new Map();
			this.stepped = new Map();
			this.pairedContinuous = new Map();
			this.xy = new Map();
			this.pairedStepped = new Map();
			if (arguments.length === 0) {
				// Used by the fromObject method
				this.rotation = 0;
				this.opacity = 1;
				this.backgroundColor = '#ffffff';
				this.backgroundImage = undefined;
				this.random = random;
				return;
			}

			const animatable = generator.animatable
			if (animatable !== undefined) {
				const continuous = animatable.continuous;
				if (continuous !== undefined) {
					for (let property of continuous) {
						const value = deepArrayCopy(generator[property]);
						this.continuous.set(property, value);
					}
				}
				const stepped = animatable.stepped;
				if (stepped !== undefined) {
					for (let property of stepped) {
						const value = deepArrayCopy(generator[property]);
						this.stepped.set(property, value);
					}
				}
				const pairedContinuous = animatable.pairedContinuous;
				if (pairedContinuous !== undefined) {
					for (let [property1, property2] of pairedContinuous) {
						const value1 = deepArrayCopy(generator[property1]);
						const value2 = deepArrayCopy(generator[property2]);
						this.pairedContinuous.set(property1, value1);
						this.pairedContinuous.set(property2, value2);
					}
				}
				const xy = animatable.xy;
				if (xy !== undefined) {
					for (let [property1, property2] of xy) {
						const value1 = generator[property1];
						const value2 = generator[property2];
						this.xy.set(property1, value1);
						this.xy.set(property2, value2);
					}
				}
				const pairedStepped = animatable.pairedStepped;
				if (pairedStepped !== undefined) {
					for (let [property1, property2] of pairedStepped) {
						const value1 = deepArrayCopy(generator[property1]);
						const value2 = deepArrayCopy(generator[property2]);
						this.pairedStepped.set(property1, value1);
						this.pairedStepped.set(property2, value2);
					}
				}
			}
			this.rotation = rotation;
			this.opacity = opacity;
			this.backgroundColor = backgroundElement.style.backgroundColor;
			this.backgroundImage = backgroundImage;
			this.random = random;
		}

		toObject(hasRandomness) {
			const properties = {};
			const categories = [
				'continuous', 'stepped', 'pairedContinuous', 'xy', 'pairedStepped'
			];
			for (let category of categories) {
				const map = this[category];
				for (let key of map.keys()) {
					properties[key] = map.get(key);
				}
			}
			const data = {};
			data.properties = properties;
			data.rotation = this.rotation;
			data.opacity = this.opacity;
			data.backgroundColor = this.backgroundColor;
			if (this.backgroundImage !== undefined) {
				data.backgroundImageURL = this.backgroundImage.src;
			}
			if (hasRandomness) {
				data.seed = this.random.seed;
			}
			return data;
		}

		static fromObject(data, generator) {
			const frame = new FrameData();
			const animatable = generator.animatable;
			if (animatable !== undefined) {
				const values = data.properties;
				const continuous = animatable.continuous;
				if (continuous !== undefined) {
					for (let property of continuous) {
						if (property in values) {
							frame.continuous.set(property, values[property]);
						}
					}
				}
				const stepped = animatable.stepped;
				if (stepped !== undefined) {
					for (let property of stepped) {
						if (property in values) {
							frame.stepped.set(property, values[property]);
						}
					}
				}
				const maps = ['pairedContinuous', 'xy', 'pairedStepped'];
				for (let mapName of maps) {
					const list = animatable[mapName];
					if (list !== undefined) {
						const map = frame[mapName];
						for (let [property1, property2] of list) {
							if (property1 in values) {
								map.set(property1, values[property1]);
							}
							if (property2 in values) {
								map.set(property2, values[property2]);
							}
						}
					}
				}
			}
			frame.rotation = data.rotation;
			frame.backgroundColor = data.backgroundColor;
			if ('backgroundImageURL' in data) {
				const image = new Image();
				image.src = data.backgroundImageURL;
				frame.backgroundImage = image;
			}
			if ('seed' in data) {
				frame.random = new RandomNumberGenerator(data.seed);
			}
			return frame;
		}

		isCurrentFrame() {
			if (
				this.rotation !== rotation ||
				this.backgroundColor !== backgroundElement.style.backgroundColor ||
				this.backgroundImage?.src !== backgroundImage?.src
			) {
				return false;
			}
			if (
				this.random.seed !== random.seed &&
				this.random.startGenerator.seed !== random.seed &&
				this.random.endGenerator.seed !== random.seed
			) {
				return false;
			}


			const animatable = bgGenerator.animatable;
			if (animatable === undefined) {
				return this.continuous.size === 0 && this.stepped.size === 0 &&
					this.pairedContinuous.size === 0 && this.pairedStepped.size === 0;
			}

			const continuous = animatable.continuous;
			if (continuous === undefined) {
				if (this.continuous.size > 0) {
					return false;
				}
			} else {
				if (this.continuous.size !== continuous.length) {
					return false;
				}
				for (let i = 0; i < continuous.length; i++) {
					const key = continuous[i];
					const frameValue = this.continuous.get(key);
					const currentValue = bgGenerator[key];
					if (!deepEquals(frameValue, currentValue)) {
						return false;
					}
				}
			}

			const stepped = animatable.stepped;
			if (stepped === undefined) {
				if (this.stepped.size > 0) {
					return false;
				}
			} else {
				if (this.stepped.size !== stepped.length) {
					return false;
				}
				for (let i = 0; i < stepped.length; i++) {
					const key = stepped[i];
					const frameValue = this.stepped.get(key);
					const currentValue = bgGenerator[key];
					if (!deepEquals(frameValue, currentValue)) {
						return false;
					}
				}
			}

			const pairedContinuous = animatable.pairedContinuous;
			if (pairedContinuous === undefined) {
				if (this.pairedContinuous.size > 0) {
					return false;
				}
			} else {
				if (this.pairedContinuous.size !== pairedContinuous.length * 2) {
					return false;
				}
				for (let i = 0; i < pairedContinuous.length; i++) {
					const keys = pairedContinuous[i];
					const key1 = keys[0];
					const frameValue1 = this.pairedContinuous.get(key1);
					const currentValue1 = bgGenerator[key1];
					if (!deepEquals(frameValue1, currentValue1)) {
						return false;
					}
					const key2 = keys[1];
					const frameValue2 = this.pairedContinuous.get(key2);
					const currentValue2 = bgGenerator[key2];
					if (!deepEquals(frameValue2, currentValue2)) {
						return false;
					}
				}
			}

			const xy = animatable.xy;
			if (xy === undefined) {
				if (this.xy.size > 0) {
					return false;
				}
			} else {
				if (this.xy.size !== xy.length * 2) {
					return false;
				}
				for (let i = 0; i < xy.length; i++) {
					const keys = xy[i];
					const key1 = keys[0];
					const frameValue1 = this.xy.get(key1);
					const currentValue1 = bgGenerator[key1];
					if (frameValue1 !== currentValue1) {
						return false;
					}
					const key2 = keys[1];
					const frameValue2 = this.xy.get(key2);
					const currentValue2 = bgGenerator[key2];
					if (frameValue2 !== currentValue2) {
						return false;
					}
				}
			}

			const pairedStepped = animatable.pairedStepped;
			if (pairedStepped === undefined) {
				if (this.pairedStepped.size > 0) {
					return false;
				}
			} else {
				if (this.pairedStepped.size !== pairedStepped.length * 2) {
					return false;
				}
				for (let i = 0; i < pairedStepped.length; i++) {
					const keys = pairedStepped[i];
					const key1 = keys[0];
					const frameValue1 = this.pairedStepped.get(key1);
					const currentValue1 = bgGenerator[key1];
					if (!deepEquals(frameValue1, currentValue1)) {
						return false;
					}
					const key2 = keys[1];
					const frameValue2 = this.pairedStepped.get(key2);
					const currentValue2 = bgGenerator[key2];
					if (!deepEquals(frameValue2, currentValue2)) {
						return false;
					}
				}
			}
			return true;
		}

	}

	function currentFrameData() {
		return new FrameData(bgGenerator, rotation, backgroundElement, backgroundImage);
	}

	function hideAlert(jquery) {
		jquery.alert('close');
	}

	function showAlert(jquery, message, parent) {
		const elem = jquery.get(0);
		elem.children[0].innerHTML = message;
		elem.classList.add('show');
		parent.appendChild(elem);
		clearTimeout(elem.timeout);
		elem.timeout = setTimeout(hideAlert, 8000, jquery);
	}

	const modalMargin = 0;
	modal.style.left = Math.max(Math.round(window.innerWidth - 506 - modalMargin), 0) + 'px';

	function repositionModal(centre) {
		if (modal.classList.contains('show')) {
			const child = modal.children[0];
			const rect = child.getBoundingClientRect();
			const maxRight = window.innerWidth - modalMargin;
			const smallScreen = window.innerWidth < 1200;

			if (rect.right > maxRight || smallScreen) {
				modal.style.left = Math.max(Math.round(maxRight - rect.width), 0) + 'px';
			}
			if (smallScreen) {
				modal.style.top = '0px';
				return;
			}

			const maxBottom = window.innerHeight - toolbar.clientHeight;

			if (centre) {
				const grandchild = modal.children[0].children[0];
				let top = Math.max(Math.round((maxBottom - grandchild.clientHeight) / 2), 0);
				modal.style.top = top + 'px';
			} else {
				const childHeight = child.clientHeight;
				if (rect.top +  childHeight > maxBottom) {
					modal.style.top = Math.max(Math.round(maxBottom - childHeight), 0) + 'px';
				}
			}
		}
	}

	function resetControl(event) {
		const id = this.dataset.reset;
		const control = document.getElementById(id);
		const value = control.getAttribute('value');
		const property = idToProperty(id, true);
		control.value = value;
		const controlType = control.type;
		if (controlType === 'range' || controlType === 'number') {
			bgGenerator[property] = parseFloat(value);
		} else {
			bgGenerator[property] = value;
		}
		progressiveBackgroundGen(0);
	}

	function openSketch() {
		document.getElementById('btn-open-sketch').click();
	}

	function enableOpenButton() {
		document.getElementById('btn-open-sketch').disabled = false;
	}

	function loadThumbnails() {
		for (let img of sketchCards.getElementsByTagName('IMG')) {
			const input = img.parentElement.parentElement.children[0];
			img.src = 'sketch/thumbnail/' + input._sketch.thumbnail;
		}
		$('#sketches-modal').off('show.bs.modal', loadThumbnails);
	}

	$('#sketches-modal').on('show.bs.modal', loadThumbnails);

	function addSketch(sketch) {
		const label = document.createElement('LABEL');
		label.classList.add('btn' , 'p-1', 'm-1');
		const input = document.createElement('INPUT');
		input.type = 'radio';
		input.name = 'sketch';
		input._sketch = sketch;
		label.appendChild(input);
		const card = document.createElement('DIV');
		card.classList.add('card', 'm-0', 'h-100');
		label.appendChild(card);
		let thumbnail;
		if (sketch.thumbnail) {
			thumbnail = document.createElement('IMG');
			thumbnail.alt = sketch.title;
			thumbnail.height = 168;
		} else {
			thumbnail = document.createElement('DIV');
			thumbnail.classList.add('bg-dark', 'text-white', 'no-thumbnail');
			const thumbContent = document.createElement('DIV');
			thumbContent.classList.add('vertical-center', 'w-100', 'text-center');
			thumbnail.appendChild(thumbContent);
			thumbContent.innerHTML = 'No Preview Available';
		}
		thumbnail.classList.add('card-img-top');
		card.appendChild(thumbnail);
		const body = document.createElement('DIV');
		body.classList.add('card-body')
		card.appendChild(body);
		const title = document.createElement('H6');
		title.innerHTML = sketch.title;
		title.classList.add('card-title', 'text-center', 'text-dark');
		body.appendChild(title);
		sketchCards.appendChild(label);
		label.addEventListener('click', enableOpenButton);
		label.addEventListener('dblclick', openSketch);
	}

	function updateURL() {
		let envURL = document.location;
		envURL = envURL.origin + envURL.pathname + '?' + urlParameters.toString();
		history.replaceState(null, '', envURL.toString());
	}

	function findBrokenHelp() {
		for (let helpElement of helpDoc.body.children) {
			const id = helpElement.id;
			const element = document.getElementById(id);
			if (element === null) {
				console.warn('Help exists for ' + id + ' but no such element is present.');
			}
		}
	}

	function findMissingHelp() {
		const container = document.getElementById('background-gen-options');
		const ancestorIDs = new Map();
		for (let element of container.querySelectorAll('input, button')) {
			let id = element.id;
			if (id === 'background-gen-image-upload') {
					continue;
			}
			const tagName = element.tagName.toLowerCase();
			const type = tagName === 'input' ? element.type : tagName;
			let ancestor = element;
			while (id === '' && ancestor !== container) {
				ancestor = ancestor.parentElement;
				id = ancestor.id;
			}
			let foundHelp = false;
			if (helpDoc !== undefined) {
				let helpAncestor = ancestor;
				let helpID = id;
				while (
					((foundHelp = helpDoc.getElementById(helpID) !== null) === false) &&
					helpAncestor !== container
				) {
					helpAncestor = helpAncestor.parentElement;
					helpID = helpAncestor.id;
				}
			}
			if (!foundHelp) {
				if (ancestor === element) {
					console.log(id);
				} else {
					if (id === '') {
						id = 'the container';
					}
					let counts = ancestorIDs.get(id);
					if (counts === undefined) {
						counts = new Map();
						ancestorIDs.set(id, counts);
					}
					let count = counts.get(type);
					if (count === undefined) {
						count = 0;
					}
					count++;
					counts.set(type, count);
				}
			}
		}
		for (let [parentID, counts] of ancestorIDs.entries()) {
			for (let [type, count] of counts.entries()) {
				console.log(count + ' children of ' + parentID + ' with type ' + type);
			}
		}
	}
	window.findMissingHelp = findMissingHelp;

	function loadFailure() {
		if (bgGenerator === undefined) {
			$('#sketches-modal').modal('show');
		} else {
			document.getElementById('background-gen-options').hidden = false;
			document.getElementById('background-gen-modal-label').innerHTML = bgGenerator.title;
		}
		showAlert(errorAlert, 'The requested sketch could not be loaded.', document.body);
	}

	async function switchGenerator(url, pushToHistory) {
		// Hide stuff while it changes
		const container = document.getElementById('background-gen-options');
		const titleBar = document.getElementById('background-gen-modal-label');
		container.hidden = true;
		titleBar.innerHTML = 'Loading&hellip;';

		// Switch generator
		let gen;
		try {
			const resolvedURL = /^http(s)?:/.test(url) ? url : '/sketch/' + url;
			const genModule = await import(resolvedURL)
			const constructor = genModule.default;
			gen = new constructor();
		} catch {
			loadFailure();
			return;
		}
		if (gen.isShader) {
			try {
				const fragFileContent = (await Promise.all([
					requireScript('lib/gl-matrix.min.js'),
					downloadFile(url.slice(0, -3) + '.frag', 'text')
				]))[1];
				gen.shaderSource =
					fragmentShaderHeader +
					shaderDeclarations(gen) +
					fragFileContent;
				drawingContext.initializeShader(gen);
			} catch {
				loadFailure();
				return;
			}
			drawingContext.setProperties(gen);
		}

		// Set the new generator as the current one.
		bgGenerator = gen;
		generatorURL = url;
		if (currentSketch && currentSketch.url !== url) {
			currentSketch = undefined;
		}

		// Initialize sketch
		random = new RandomNumberGenerator();
		seedInput.value = random.seed;
		currentFrame = currentFrameData();
		startFrame = currentFrame;
		endFrame = startFrame;
		// Hide the save button for experimental sketches
		const enableSave = (new URL(url, document.location)).hostname === document.location.hostname;
		const saveBtn = document.getElementById('btn-save-form');
		saveBtn.hidden = !enableSave;
		// Render sketch
		const hasTween = 'tween' in gen;
		if (hasTween) {
			gen.tween = parseFloat(animPositionSlider.value);
			tweenData = new TweenData(gen, startFrame, endFrame);
		}
		signatureChanged = true;
		progressiveBackgroundGen(0);

		// Create new options dialog
		container.innerHTML = '';
		const optionsDoc = await gen.optionsDocument;
		if (optionsDoc !== undefined) {
			for (let resetButton of optionsDoc.querySelectorAll('button[data-reset]')) {
				resetButton.addEventListener('click', resetControl);
			}
			container.append(...optionsDoc.body.children);
			const imageCtrlLocation = container.querySelector('[data-attach=image]');
			if (imageCtrlLocation !== null) {
				imageCtrlLocation.appendChild(imageUpload);
			}
		}

		// Adapt the environment's UI accordingly
		document.getElementById('btn-generate-background').parentElement.hidden = !gen.hasRandomness;
		document.getElementById('btn-both-frames').hidden = !hasTween;
		document.getElementById('btn-both-frames2').hidden = !hasTween;
		toolbar.hidden = false;
		for (let close of document.getElementById('sketches-modal').querySelectorAll('button[data-dismiss=modal]')) {
			close.hidden = false;
		}
		if (pushToHistory) {
			const name = url.slice(0, -3);	// trim .js
			urlParameters.set('gen', name);
			updateURL();
		}
		titleBar.innerHTML = gen.title;
		document.title = gen.title;

		// Load help file & display new sketch options
		const helpArea = document.getElementById('help-sketch');
		helpArea.innerHTML = '';
		helpDoc = undefined;
		container.hidden = false;
		repositionModal(true);
		if (gen.helpFile) {
			try {
				helpDoc = await downloadFile(gen.helpFile, 'document');
				const intro = helpDoc.getElementById('about');
				if (intro !== null) {
					helpArea.appendChild(intro);
				}
				findBrokenHelp();
			} catch {
				console.error('Unable to load help file.');
			}
		}
	}

	async function loadDocument(documentID) {
		const data = {};
		// TODO Add user authentication
		data.user = '1';
		data.documentID = documentID;
		const options = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		};
		try {
			const response = await fetch(backendRoot + 'load', options);
			const doc = await response.json();
			if (doc) {
				await switchGenerator(doc.sketch, false);
				startFrame = FrameData.fromObject(doc.startFrame, bgGenerator);
				currentFrame = startFrame;
				random = startFrame.random;
				if ('endFrame' in doc) {
					endFrame = FrameData.fromObject(doc.endFrame, bgGenerator);
				} else {
					endFrame = startFrame;
				}
				tweenData = new TweenData(bgGenerator, startFrame, endFrame);
				setWillChange();
				renderFrame(bgGenerator, drawingContext, canvas.width, canvas.height, 0, loopAnim, false, 0);
				displaySeed();
				animPositionSlider.value = 0;
				updateAnimPositionReadout(0);
				return doc.sketch;
			} else {
				return undefined;
			}
		} catch (e) {
			console.error(e);
			return undefined;
		}
	}

	// After resizing, generate a new background to fit the new window size.
	let resizeTimer;
	function resizeWindow() {
		repositionModal(false);
		drawingContext.resize(window.innerWidth, window.innerHeight);
		if (bgGenerator !== undefined) {
			progressiveBackgroundGen(0);
		}
	}

	window.addEventListener('resize', function (event) {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(resizeWindow, 100);
	});

	let modalDrag;
	let foregroundModal = modal;
	let titleBarHeight;

	function dragWindow(event) {
		if (event.buttons !== 1) {
			window.removeEventListener('pointermove', dragWindow);
			return;
		}

		const child = foregroundModal.children[0];
		let left = Math.round(event.clientX - modalDrag[0]);
		const maxLeft = window.innerWidth - 32;
		left = Math.min(left, maxLeft);

		let top = Math.max(Math.round(event.clientY - modalDrag[1]), 0);
		const maxTop = window.innerHeight - toolbar.clientHeight - titleBarHeight;
		top = Math.min(top, maxTop);
		foregroundModal.style.left = left + 'px';
		foregroundModal.style.top = top + 'px';
	}

	function windowToFront(target) {
		foregroundModal.classList.remove('modal-floating-foreground');
		target.classList.add('modal-floating-foreground');
		foregroundModal = target;
	}

	function startWindowDrag(event) {
		const target = event.target;
		if (target === this || target.tagName === 'H6') {
			windowToFront(this.parentElement.parentElement.parentElement);
			window.addEventListener('pointermove', dragWindow);
			modalDrag = [event.offsetX, event.offsetY];
			titleBarHeight = this.clientHeight;
		}
	}

	function stopWindowDrag(event) {
		window.removeEventListener('pointermove', dragWindow);
	}

	function collapseWindow(event) {
		$(this.parentElement.querySelector('.modal-body')).collapse('toggle');
	}

	function expandWindow(event) {
		windowToFront(this);
		$(this.querySelector('.modal-body')).collapse('show');
	}

	for (let floating of document.querySelectorAll('.modal-floating')) {
		const header = floating.querySelector('.modal-header');
		header.addEventListener('pointerdown', startWindowDrag);
		header.addEventListener('pointerup', stopWindowDrag);
		header.addEventListener('dblclick', collapseWindow);
		const floatingJQ = $(floating);
		floatingJQ.on('show.bs.modal', expandWindow);
		floatingJQ.modal({focus: false, show: false});
	}

	$(modal).on('shown.bs.modal', function (event) {
		repositionModal(false);
	});

	async function init() {
		const sketchesModal = document.getElementById('sketches-modal');
		let firstDocID = urlParameters.get('doc');
		let firstGenURL = urlParameters.get('gen');
		let nextStep;

		function showParameters() {
			$(modal).modal('show');
		}

		if (firstGenURL !== null) {
			firstGenURL += '.js';
			nextStep = showParameters;
		}
		if (firstDocID !== null) {
			const sketchURL = await loadDocument(firstDocID);
			if (sketchURL !== undefined) {
				firstGenURL = sketchURL;
				nextStep = showParameters;
			} else {
				firstDocID = null;
			}
		}
		if (firstGenURL === null) {
			nextStep = function () {
				$(sketchesModal).modal('show');
			};
		}

		if (store === undefined || store.getItem('no-welcome') !== 'true') {
			const helpModal = $('#help-modal');
			function nextStepOnce(event) {
				nextStep();
				helpModal.off('hidden.bs.modal', nextStepOnce);
			}
			helpModal.on('hidden.bs.modal', nextStepOnce);
			helpModal.modal('show');
		} else {
			document.getElementById('show-welcome').checked = false;
			nextStep();
		}

		const sketchFile = await downloadFile('/sketches.json', 'json');
		for (let sketch of sketchFile.sketches) {
			addSketch(sketch);
			if (sketch.url === firstGenURL) {
				currentSketch = sketch;
			}
		}

		if (!firstDocID) {
			if (firstGenURL) {
				switchGenerator(firstGenURL, false);
			} else {
				loadThumbnails();
			}
		}
	}
	init();

	function calcTween(tween, loop) {
		if (loop) {
			if (tween > 0.5) {
				return 1 - (tween - 0.5) * 2;
			} else {
				return tween * 2;
			}
		} else {
			return tween;
		}
	}

	function interpolateValue(startValue, endValue, tween, loop) {
		if (startValue === endValue) {
			return startValue;
		} else if (Array.isArray(startValue)) {
			const numStartComponents = startValue.length;
			const numEndComponents = endValue.length;
			const numComponents = Math.min(numStartComponents, numEndComponents);
			const output = new Array(numComponents);
			for (let i = 0; i < numComponents; i++) {
				output[i] = interpolateValue(startValue[i], endValue[i], tween, loop);
			}
			const maxIndex = interpolateStep(numStartComponents, numEndComponents, tween, loop);
			if (numStartComponents > numEndComponents) {
				for (let i = numEndComponents; i < maxIndex; i++) {
					output[i] = startValue[i];
				}
			} else if (numEndComponents > numStartComponents) {
				for (let i = numStartComponents; i < maxIndex ; i++) {
					output[i] = endValue[i];
				}
			}
			return output;
		}

		tween = calcTween(tween, loop);
		const type = typeof(startValue);
		if (type === 'number') {
			return (endValue - startValue) * tween + startValue;
		} else if (type === 'string') {
			const [colorSystem, startComponents] = parseColor(startValue);
			const [, endComponents] = parseColor(endValue);
			const tweened = new Array(4);
			for (let i = 0; i < 4; i++) {
				const componentStart = startComponents[i];
				const componentEnd = endComponents[i];
				tweened[i] = (componentEnd - componentStart) * tween + componentStart;
			}
			if (colorSystem === 'rgb') {
				return 'rgba(' + tweened.join(',') + ')';
			} else {
				return hsla(...tweened);
			}
		}
	}

	function interpolateStep(startValue, endValue, tween, loop) {
		if (!loop && (tween === 1 || startValue === endValue)) {
			return endValue;
		} else if (Array.isArray(startValue)) {
			const numStartComponents = startValue.length;
			const numEndComponents = endValue.length;
			const numComponents = Math.min(numStartComponents, numEndComponents);
			const output = new Array(numComponents);
			for (let i = 0; i < numComponents; i++) {
				output[i] = interpolateStep(startValue[i], endValue[i], tween, loop);
			}
			const maxIndex = interpolateStep(numStartComponents, numEndComponents, tween, loop);
			if (numStartComponents > numEndComponents) {
				for (let i = numEndComponents; i < maxIndex; i++) {
					output[i] = startValue[i];
				}
			} else if (numEndComponents > numStartComponents) {
				for (let i = numStartComponents; i < maxIndex; i++) {
					output[i] = endValue[i];
				}
			}
			return output;
		} else if (typeof(startValue) === 'number') {
			let steps = endValue - startValue;
			if (loop) {
				if (tween <= 0.5) {
					return Math.floor(steps * tween * 2 + startValue);
				} else {
					return Math.ceil(steps * (1 - (tween - 0.5) * 2) + startValue);
				}
			} else {
				if (steps > 0) {
					return Math.floor((steps + 1) * tween + startValue);
				} else {
					// End value smaller than start value
					return Math.ceil((steps - 1) * tween + startValue);
				}
			}
		} else {
			return tween < 0.5 ? startValue : endValue;
		}
	}

	function interpolatePair(startValue1, endValue1, startValue2, endValue2, interpolate, tween) {
		let value1, value2;
		if (Array.isArray(startValue1)) {
			value1 = []; value2 = [];
			const numComponents1 = startValue1.length;
			const numComponents2 = startValue2.length;
			const numComponents = Math.min(numComponents1, numComponents2);
			const output = new Array(numComponents);
			for (let i = 0; i < numComponents; i++) {
				const start1 = startValue1[i];
				const end1 = endValue1[i];
				const start2 = startValue2[i]
				const end2 = endValue2[i];
				if (i >= endValue1.length) {
					value2[i] = interpolate(start2, end2, tween, true);
				} else if (i >= endValue2.length) {
					value1[i] = interpolate(start1, end1, tween, true);
				} else {
					[value1[i], value2[i]] = interpolatePair(start1, end1, start2, end2, interpolate, tween);
				}
			}
			const numEndComponents1 = endValue1.length;
			const numEndComponents2 = endValue2.length;
			if (numComponents1 > numComponents2) {
				for (let i = numComponents2; i < numComponents1 && i < numEndComponents1; i++) {
					value1[i] = interpolate(startValue1[i], endValue1[i], tween, true);
				}
			} else if (numComponents2 > numComponents1) {
				for (let i = numComponents1; i < numComponents2 && i < numEndComponents2; i++) {
					value2[i] = interpolate(startValue2[i], endValue2[i], tween, true);
				}
			}
			for (let i = value1.length; i < numEndComponents1; i++) {
				value1[i] = endValue1[i];
			}
			for (let i = value2.length; i < numEndComponents2; i++) {
				value2[i] = endValue2[i];
			}
		} else {
			if (startValue1 === startValue2) {
				value1 = endValue1;
				value2 = interpolate(endValue2, endValue1, (tween - 0.5) * 2, false);
			} else {
				value1 = interpolate(startValue1, endValue1, tween, true);
				value2 = interpolate(startValue2, endValue2, tween, true);
			}
		}
		return [value1, value2];
	}

	function interpolatePairs(pairProperty, stepped, tween, loop) {
		if (!(pairProperty in bgGenerator.animatable)) {
			return;
		}
		const interpolate = stepped ? interpolateStep : interpolateValue;
		if (!loop || tween <= 0.5) {
			for (let [property1, property2] of bgGenerator.animatable[pairProperty]) {
				const startValue1 = startFrame[pairProperty].get(property1);
				const endValue1 = endFrame[pairProperty].get(property1);
				bgGenerator[property1] = interpolate(startValue1, endValue1, tween, loop);
				const startValue2 = startFrame[pairProperty].get(property2);
				const endValue2 = endFrame[pairProperty].get(property2);
				bgGenerator[property2] = interpolate(startValue2, endValue2, tween, loop);
			}
		} else {
			for (let [property1, property2] of bgGenerator.animatable[pairProperty]) {
				const startValue1 = startFrame[pairProperty].get(property1);
				const endValue1 = endFrame[pairProperty].get(property1);
				const startValue2 = startFrame[pairProperty].get(property2);
				const endValue2 = endFrame[pairProperty].get(property2);
				const [value1, value2] = interpolatePair(startValue1, endValue1, startValue2, endValue2, interpolate, tween);
				bgGenerator[property1] = value1;
				bgGenerator[property2] = value2;
			}
		}
	}

	function interpolateBackgroundImage(startImage, endImage, context, tween, loop) {
		const hasStartImage = startImage !== undefined;
		const hasEndImage = endImage !== undefined;
		const canvas = context.canvas;
		const dWidth = canvas.width;
		const dHeight = canvas.height;
		if (loop) {
			tween = 1 - 2 * (tween - 0.5);
		}
		const startFade = 0.3;
		const endFade = 0.7;
		if (tween <= startFade) {
			if (hasStartImage) {
				context.drawImage(startImage, 0, 0, dWidth, dHeight);
			}
		} else if (tween < endFade) {
			if (hasEndImage) {
				context.drawImage(endImage, 0, 0, dWidth, dHeight);
			}
			if (hasStartImage) {
				context.globalAlpha = (endFade - tween)  / (endFade - startFade);
				context.drawImage(startImage, 0, 0, dWidth, dHeight);
			}
		} else {
			if (hasEndImage) {
				context.drawImage(endImage, 0, 0, dWidth, dHeight);
			}
		}
	}

	class TweenData {

		constructor(generator, startFrame, endFrame) {
			this.backgroundColorVaries =
				startFrame.backgroundColor !== endFrame.backgroundColor &&
				(startFrame.backgroundImage !== undefined || endFrame.backgroundImage !== undefined);

			// Map x property name to the calculated value.
			this.radii = new Map();
			this.startTheta = new Map();
			this.centreX1 = new Map();
			this.centreY1 = new Map();
			this.centreX2 = new Map();
			this.centreY2 = new Map();

			if (generator.animatable === undefined || generator.animatable.xy === undefined) {
				return;
			}

			const startXY = startFrame.xy;
			const endXY = endFrame.xy;

			for (let [keyX, keyY] of generator.animatable.xy) {
				const startX = startXY.get(keyX);
				const startY = startXY.get(keyY);
				const endX = endXY.get(keyX);
				const endY = endXY.get(keyY);
				const centreX1 = (startX + 3 * endX) / 4;
				const centreY1 = (startY + 3 * endY) / 4;
				const centreX2 = (3 * startX + endX) / 4;
				const centreY2 = (3 * startY + endY) / 4;
				const distX = endX - startX;
				const distY = endY - startY;
				const r = Math.hypot(distX, distY) / 4;
				const theta = Math.atan2(distY, distX);
				this.radii.set(keyX, r);
				this.startTheta.set(keyX, theta);
				this.centreX1.set(keyX, centreX1);
				this.centreY1.set(keyX, centreY1);
				this.centreX2.set(keyX, centreX2);
				this.centreY2.set(keyX, centreY2);
			}
		}

		interpolateXY(keyX, tween) {
			const r = this.radii.get(keyX);
			const startTheta = this.startTheta.get(keyX);
			let centreX, centreY, theta;
			if (tween < 0.75) {
				centreX = this.centreX1.get(keyX);
				centreY = this.centreY1.get(keyX);
				theta = 4 * (tween - 0.5) * Math.PI + startTheta;
			} else {
				centreX = this.centreX2.get(keyX);
				centreY = this.centreY2.get(keyX);
				theta = -4 * (tween - 0.75) * Math.PI + startTheta;
			}
			const x = r * Math.cos(theta) + centreX;
			const y = r * Math.sin(theta) + centreY;
			return [x, y];
		}

	}

	function setWillChange() {
		backgroundElement.style.willChange = tweenData.backgroundColorVaries ? 'background-color' : 'auto';
	}

	class InterpolatedRandom {
		constructor(startGenerator, endGenerator, tween) {
			this.startGenerator = startGenerator;
			this.endGenerator = endGenerator;
			this.tween = tween;
			this.seed = startGenerator.seed + '\n' + endGenerator.seed;
		}

		next() {
			const tween = this.tween;
			return (1 - tween) * this.startGenerator.next() + tween * this.endGenerator.next();
		}

		reset() {
			this.startGenerator.reset();
			this.endGenerator.reset();
		}
	}

	function interpolateRandom(startGenerator, endGenerator, tween) {
		switch (tween) {
		case 0:
			random = startGenerator;
			break;
		case 1:
			random = endGenerator;
			break;
		default:
			if (startGenerator === endGenerator) {
				random = startGenerator;
			} else {
				random = new InterpolatedRandom(startGenerator, endGenerator, tween);
			}
		}
	}

	const tempCanvas = document.createElement('CANVAS');
	const tempContext = tempCanvas.getContext('2d');

	function fillBackground(context, backgroundColor, width, height) {
		tempCanvas.width = context.canvas.width;
		tempCanvas.height = context.canvas.height;
		tempContext.drawImage(context.canvas, 0, 0);
		context.restore();
		context.save();
		context.fillStyle = backgroundColor;
		context.fillRect(0, 0, width, height);
		context.fillStyle = 'black';
		context.drawImage(tempCanvas, 0, 0, width, height);
	}

	function renderFrame(generator, contextualInfo, width, height, tween, loop, paintBackground, preview) {
		const tweenPrime = calcTween(tween, loop);
		for (let property of startFrame.continuous.keys()) {
			const startValue = startFrame.continuous.get(property);
			const endValue = endFrame.continuous.get(property);
			generator[property] = interpolateValue(startValue, endValue, tweenPrime, false);
		}
		for (let property of startFrame.stepped.keys()) {
			const startValue = startFrame.stepped.get(property);
			const endValue = endFrame.stepped.get(property);
			generator[property] = interpolateStep(startValue, endValue, tween, loop);
		}
		if (generator.animatable) {
			const xy = generator.animatable.xy;
			if (xy !== undefined && startFrame !== endFrame) {
				if (loop) {
					if (tween <= 0.5) {
						for (let property of startFrame.xy.keys()) {
							const startValue = startFrame.xy.get(property);
							const endValue = endFrame.xy.get(property);
							generator[property] = interpolateValue(startValue, endValue, tween, true);
						}
					} else {
						for (let [propertyX, propertyY] of xy) {
							const [x, y] = tweenData.interpolateXY(propertyX, tween);
							generator[propertyX] = x;
							generator[propertyY] = y;
						}
					}
				} else {
					for (let property of startFrame.xy.keys()) {
						const startValue = startFrame.xy.get(property);
						const endValue = endFrame.xy.get(property);
						generator[property] = interpolateValue(startValue, endValue, tween, false);
					}
				}

			}

			interpolatePairs('pairedContinuous', false, tween, loop);
			interpolatePairs('pairedStepped', true, tween, loop);
		}
		if ('tween' in generator) {
			generator.tween = tweenPrime;
		}

		const startRotation = startFrame.rotation;
		let endRotation = endFrame.rotation;
		const loopedRotation = loop && (startRotation + TWO_PI) % TWO_PI !== (endRotation + TWO_PI) % TWO_PI;
		endRotation += Math.sign(endRotation) * TWO_PI * fullRotations;
		const rotation = interpolateValue(startRotation, endRotation, tween, loopedRotation);
		interpolateRandom(startFrame.random, endFrame.random, tweenPrime);

		let backgroundColor;
		if (tweenData.backgroundColorVaries) {
			backgroundColor = interpolateValue(startFrame.backgroundColor, endFrame.backgroundColor, tweenPrime, false);
			backgroundElement.style.backgroundColor = backgroundColor;
		} else {
			backgroundColor = startFrame.backgroundColor;
		}

		const context = contextualInfo.twoD;
		context.restore();
		context.clearRect(0, 0, width, height);
		context.save();
		interpolateBackgroundImage(startFrame.backgroundImage, endFrame.backgroundImage, context, tween, loop);
		rotateCanvas(context, width, height, rotation);
		context.globalAlpha = interpolateValue(startFrame.opacity, endFrame.opacity, tweenPrime, false);
		if (generator.isShader) {
			contextualInfo.setProperties(generator);
			contextualInfo.drawGL(tweenPrime, preview);
			drawSignature(contextualInfo);
		} else if (preview === 0) {
			// Draw everything in one go when capturing video
			random.reset();
			const redraw = generator.generate(context, width, height, 0);
			let done;
			do {
				done = redraw.next().done;
			} while (!done);
			drawSignature(contextualInfo);
		} else {
			progressiveBackgroundDraw(generator, contextualInfo, width, height, preview);
		}
		if (paintBackground) {
			fillBackground(context, backgroundColor, width, height);
		}
	}

	function animate(generator, contextualInfo, width, height, startTween, length, loop, capturer) {
		const paintBackground = capturer !== undefined;
		const newAnimController = new AnimationController({});
		const promise = new Promise(function (resolve, reject) {
			const indicator = document.getElementById('recording-indicator');
			let framesRendered = 0;
			let uiUpdateInterval = 2 / animPositionSlider.clientWidth;
			if (!Number.isFinite(uiUpdateInterval)) {
				uiUpdateInterval = 0.0065;
			}
			let lastUIUpdate;

			function render(time) {
				if (capturer !== undefined) {
					time = performance.now();
				}
				let beginTime = newAnimController.beginTime;
				if (beginTime === undefined) {
					beginTime = time;
					lastUIUpdate = startTween;
					newAnimController.setup(render, reject, beginTime);
				}

				if (newAnimController.status === AnimationController.Status.ABORTED) {
					return;
				}
				let tween = startTween + (time - beginTime) / length;
				const lastFrame = tween >= 1;
				if (lastFrame) {
					tween = 1;
				}
				renderFrame(generator, contextualInfo, width, height, tween, loop, paintBackground, 0);
				newAnimController.progress = tween;

				if (capturer !== undefined) {
					capturer.capture(contextualInfo.twoD.canvas);
					let percent = (tween - startTween) / (1 - startTween) * 100;
					progressBar.style.width = percent + '%';
					percent = Math.trunc(percent);
					progressBar.innerHTML = percent + '%';
					progressBar.setAttribute('aria-valuenow', percent);
					framesRendered++;
					const iconFile = framesRendered % 2 === 0 ? 'record.png' : 'draw_ellipse.png';
					indicator.src = 'img/' + iconFile;
				} else if (animControlsOpen && tween - lastUIUpdate >= uiUpdateInterval) {
					animPositionSlider.value = tween;
					lastUIUpdate = tween;
				}
				if (lastFrame) {
					newAnimController.finish(resolve);
				} else {
					requestAnimationFrame(render);
				}
			};
			newAnimController.progress = 0;
			newAnimController.start = function () {
				render(performance.now());
			}
		});
		newAnimController.promise = promise;
		return newAnimController;
	}

	async function captureVideo(contextualInfo, width, height, startTween, length, properties) {
		const renderButton = document.getElementById('btn-render-video');
		renderButton.disabled = true;
		const closeWidget = document.getElementById('video-modal').querySelector('.close');
		closeWidget.hidden = true;
		progressBar.style.width = '0';
		progressBar.innerHTML = '0%';
		progressBar.setAttribute('aria-valuenow', '0');
		const progressRow = document.getElementById('video-progress-row');
		progressRow.classList.remove('invisible');

		await requireScript('lib/CCapture.all.min.js');
		const capturer = new CCapture(properties);
		animController = animate(bgGenerator, contextualInfo, width, height, startTween, length, loopAnim, capturer);
		const stopButton = document.getElementById('btn-cancel-video');
		stopButton.innerHTML = 'Abort';
		stopButton.classList.add('btn-danger');
		stopButton.classList.remove('btn-secondary');

		function reset() {
			capturer.stop();
			stopButton.innerHTML = 'Close';
			stopButton.classList.add('btn-secondary');
			stopButton.classList.remove('btn-danger');
			progressRow.classList.add('invisible');
			closeWidget.hidden = false;
			renderButton.disabled = false;
			if (debug.video) {
				document.body.removeChild(contextualInfo.twoD.canvas);
				canvas.hidden = false;
			}
			animController = undefined;
		}
		animController.promise = animController.promise.then(
			function () {
				capturer.save();
				$('#video-modal').modal('hide');
				reset();
			},
			reset
		);

		capturer.start();
		animController.start();
	}

	function generateFilename() {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		const hour = String(now.getHours()).padStart(2, '0');
		const minute = String(now.getMinutes()).padStart(2, '0');
		const generatorName = generatorURL.match(/(^|\/)([\w\-.]+)\.js$/)[2];
		return `${generatorName} ${year}-${month}-${day} ${hour}${minute}`;
	}

	seedInput.value = random.seed;

	if (store !== undefined) {
		document.getElementById('show-welcome').addEventListener('input', function (event) {
			try {
				store.setItem('no-welcome', !this.checked);
			} catch (e) {
				console.warn(e);
			}
		});
	}

	document.getElementById('btn-what-is-this').addEventListener('click', function (event) {
		if (helpContextItem !== undefined) {
			helpContextItem.popover('dispose');
		}

		document.body.classList.add('context-help');
		helpContext = true;
		helpContextItem = $(this);
		helpContextItem.popover({
			animation: false,
			content: 'Now click on the item you\'d like help with.',
			placement: 'left',
			trigger: 'manual',
		});
		helpContextItem.popover('show');
	});

	document.body.addEventListener('click', function (event) {
		if (helpContextIntermediate) {
			event.preventDefault();
			helpContextIntermediate = false;
		}
	});

	document.body.addEventListener('mousedown', function (event) {
		let target = event.target;
		if (target.tagName === 'LABEL' && target.control !== null) {
			target = target.control;
		}

		if (helpContextItem !== undefined) {
			if (helpContextItem.get(0).contains(target)) {
				return;
			}
			helpContextItem.popover('dispose');
			helpContextItem = undefined;
		}

		if (helpContext) {
			let popoverTitle = '';
			let popoverContent = null;
			document.body.classList.remove('context-help');
			helpContext = false;
			const rootElement = document.body.parentElement;
			do {
				if (target.tagName === 'A') {
					return;
				}
				if ('labels' in target && target.labels.length > 0) {
					popoverTitle = target.labels[0].innerText;
				} else if (target.title) {
					popoverTitle = target.title;
				}
				let id = target.id;
				if (id) {
					if (helpDoc !== undefined) {
						popoverContent = helpDoc.getElementById(id);
					}
					if (popoverContent !== null) {
						popoverContent = popoverContent.cloneNode(true);
						popoverContent.removeAttribute('id');
						break;
					}
				}
				target = target.parentElement;
			} while (target !== rootElement);

			event.preventDefault();
			if (popoverContent === null) {
				popoverTitle = 'No Help Available';
				popoverContent = 'Sorry, no help is available for this item.';
			} else {
				if (target.type === 'radio') {
					const groupNameWords = target.name.split('-');
					for (let i = 0; i < groupNameWords.length; i++) {
						const word = groupNameWords[i];
						groupNameWords[i] = word[0].toUpperCase() + word.slice(1);
					}
					popoverTitle = popoverTitle + ' ' + groupNameWords.join(' ');
				}
			}

			target = event.target;
			const targetTitle = target.title;
			const popoverHeader = document.createElement('DIV');
			const titleSpan = document.createElement('SPAN');
			titleSpan.classList.add('d-inline-block', 'mt-1');
			titleSpan.innerHTML = popoverTitle;
			popoverHeader.appendChild(titleSpan);
			const closeButton = document.createElement('BUTTON');
			closeButton.classList.add('close');
			closeButton.innerHTML = '&times;';
			popoverHeader.appendChild(closeButton);

			target.removeAttribute('title');
			helpContextItem = $(target);
			helpContextItem.popover({
				animation: false,
				content: popoverContent,
				html: true,
				offset: '[0, 20]',
				placement: 'auto',
				title: popoverHeader,
				trigger: 'manual',
				boundary: 'viewport'
			});
			helpContextItem.popover('show');
			target.title = targetTitle;
			helpContextIntermediate = true;
		}
	});

	signatureBox.addEventListener('mouseenter', function (event) {
		authorForm.hidden = false;
		authorInput.focus();
	});

	authorForm.addEventListener('submit', function (event) {
		event.preventDefault();
		this.hidden = true;
		userDisplayName = authorInput.value;
		signatureChanged = true;
		progressiveBackgroundGen(0);
	});

	authorForm.addEventListener('focusout', function (event) {
		if (!this.contains(event.relatedTarget)) {
			authorForm.hidden = true;
			if (userDisplayName !== undefined) {
				authorInput.value = userDisplayName;
			}
		}
	});

	document.getElementById('background-preset').addEventListener('input', function (event) {
		const value = this.value;
		if (value === 'color') {
			$('#background-color-row').collapse('show');
			backgroundImage = undefined;
			progressiveBackgroundGen(0);
		} else {
			$('#background-color-row').collapse('hide');
			const color = darkMode() ? '#000000' : '#ffffff';
			document.getElementById('background-color').value = color;
			backgroundElement.style.backgroundColor = color;
			backgroundImage = document.createElement('IMG');
			backgroundImage.onload = redraw;
			backgroundImage.src = 'img/texture/' + value + '.jpg';
		}
	});

	// Changing background colour.
	document.getElementById('background-color').addEventListener('input', function (event) {
		backgroundElement.style.backgroundColor = this.value;
		drawSignature(drawingContext);
	});

	opacitySlider.addEventListener('input', function (event) {
		opacity = parseFloat(this.value);
		progressiveBackgroundGen(1);
	});

	function opacityListener(event) {
		opacity = parseFloat(this.value);
		progressiveBackgroundGen(0);
	}

	opacitySlider.addEventListener('pointerup', opacityListener);
	opacitySlider.addEventListener('keyup', opacityListener);

	rotationSlider.addEventListener('input', function (event) {
		rotation = TWO_PI * parseFloat(this.value);
		progressiveBackgroundGen(1);
	});

	function rotationListener(event) {
		rotation = TWO_PI * parseFloat(this.value);
		progressiveBackgroundGen(0);
	}

	rotationSlider.addEventListener('pointerup', rotationListener);
	rotationSlider.addEventListener('keyup', rotationListener);

	document.getElementById('layer-rotation-reset').addEventListener('click', function (event) {
		rotationSlider.value = 0;
		rotation = 0;
		progressiveBackgroundGen(0);
	});

	document.getElementById('btn-open-sketch').addEventListener('click', function (event) {
		const sketchesModal = document.getElementById('sketches-modal');
		$(sketchesModal).modal('hide');
		$(modal).modal('show');
		currentSketch = queryChecked(sketchesModal, 'sketch')._sketch;
		switchGenerator(currentSketch.url, true);
	});

	// Generate new background button.
	document.getElementById('btn-generate-background').addEventListener('click', function (event) {
		random = new RandomNumberGenerator();
		seedInput.value = random.seed;
		progressiveBackgroundGen(0);
	});

	function displaySeed() {
		if (startFrame.random.seed === endFrame.random.seed) {
			seedInput.value = startFrame.random.seed;
		} else {
			seedInput.value = startFrame.random.seed + '\n' + endFrame.random.seed;
		}
	}

	function parseSeed(seed) {
		if (seed === undefined) {
			seed = seedInput.value;
		}
		seed = seed.replace(/\r/g, '');
		const match = seed.match(/(\d+\n\d+\n\d+\n\d+)(?:\n(\d+\n\d+\n\d+\n\d+))?/);
		if (match !== null) {
			if (match[2] === undefined) {
				random = new RandomNumberGenerator(seed);
			} else {
				const startGenerator = new RandomNumberGenerator(match[1]);
				startFrame.random = startGenerator;
				if (match[2] === match[1]) {
					endFrame.random = startGenerator;
					random = startGenerator;
				} else {
					const endGenerator = new RandomNumberGenerator(match[2]);
					if (startFrame === endFrame) {
						// Create start and end frames that differ only because they use different random numbers.
						endFrame = currentFrameData();
						tweenData = new TweenData(bgGenerator, startFrame, endFrame);
						setWillChange();
					}
					endFrame.random = endGenerator;
					const tween = calcTween(parseFloat(animPositionSlider.value), loopAnim);
					interpolateRandom(startGenerator, endGenerator, tween);
					currentFrame.random = random;
				}
			}
			progressiveBackgroundGen(0);
		}
	}

	seedInput.addEventListener('focus', function (event) {
		this.select();
	});

	seedInput.addEventListener('paste', function (event) {
		parseSeed(event.clipboardData.getData('text/plain'));
	});

	seedForm.addEventListener('focusout', function (event) {
		if (!this.contains(event.relatedTarget)) {
			parseSeed();
		}
	});

	seedForm.addEventListener('submit', function (event) {
		event.preventDefault();
		parseSeed();
	});

	$('#generate-btn-group').on('shown.bs.dropdown', function (event) {
		seedInput.focus();
	});

	$('#generate-btn-group').on('hide.bs.dropdown', function(event) {
		const target = document.activeElement;
		return target !== document.getElementById('btn-generate-background') && !seedForm.contains(target);
	});

	// Animation controls
	document.getElementById('btn-start-frame').addEventListener('click', function (event) {
		random = random.startGenerator;
		currentFrame = currentFrameData();
		startFrame = currentFrame;
		tweenData = new TweenData(bgGenerator, startFrame, endFrame);
		setWillChange();
		displaySeed();
		animPositionSlider.value = 0;
		updateAnimPositionReadout(0);
		if ('tween' in bgGenerator) {
			bgGenerator.tween = 0;
			progressiveBackgroundGen(0);
		}
		showAlert(successAlert, 'Start frame set.', document.body)
		videoErrorAlert.alert('close');
	});

	document.getElementById('btn-start-frame2').addEventListener('click', function (event) {
		random = random.startGenerator;
		startFrame = currentFrameData();
		tweenData = new TweenData(bgGenerator, startFrame, endFrame);
		setWillChange();
		displaySeed();
		animAction();
	});

	document.getElementById('btn-end-frame').addEventListener('click', function (event) {
		random = random.endGenerator;
		currentFrame = currentFrameData();
		endFrame = currentFrame;
		tweenData = new TweenData(bgGenerator, startFrame, endFrame);
		setWillChange();
		displaySeed();
		animPositionSlider.value = 1;
		updateAnimPositionReadout(1);
		if ('tween' in bgGenerator) {
			bgGenerator.tween = 1;
			progressiveBackgroundGen(0);
		}
		showAlert(successAlert, 'End frame set.', document.body)
		videoErrorAlert.alert('close');
	});

	document.getElementById('btn-end-frame2').addEventListener('click', function (event) {
		random = random.endGenerator;
		endFrame = currentFrameData();
		tweenData = new TweenData(bgGenerator, startFrame, endFrame);
		setWillChange();
		displaySeed();
		animAction();
	});

	document.getElementById('btn-both-frames').addEventListener('click', function (event) {
		const tween = parseFloat(animPositionSlider.value);
		if (loopAnim) {
			random = tween < 0.25 || tween > 0.75 ? random.startGenerator : random.endGenerator;
		} else {
			random = tween < 0.5 ? random.startGenerator : random.endGenerator;
		}
		currentFrame = currentFrameData();
		startFrame = currentFrame;
		endFrame = currentFrame;
		tweenData = new TweenData(bgGenerator, startFrame, endFrame);
		seedInput.value = random.seed;
		showAlert(successAlert, 'Both frames set.', document.body);
	});

	document.getElementById('btn-both-frames2').addEventListener('click', function (event) {
		const tween = parseFloat(animPositionSlider.value);
		if (loopAnim) {
			random = tween < 0.25 || tween > 0.75 ? random.startGenerator : random.endGenerator;
		} else {
			random = tween < 0.5 ? random.startGenerator : random.endGenerator;
		}
		currentFrame = currentFrameData();
		startFrame = currentFrame;
		endFrame = currentFrame;
		tweenData = new TweenData(bgGenerator, startFrame, endFrame);
		seedInput.value = random.seed;
		animAction();
	});

	document.getElementById('btn-bg-change-discard').addEventListener('click', function (event) {
		const tween = parseFloat(animPositionSlider.value);
		random = interpolateRandom(startFrame.random, endFrame.random, calcTween(tween, loopAnim));
		renderFrame(bgGenerator, drawingContext, canvas.width, canvas.height, tween, loopAnim, false, 0);
		currentFrame = currentFrameData();
		animAction();
	});

	function updateAnimPositionReadout(tween) {
		let timeStr;
		const length = parseFloat(document.getElementById('anim-length').value);
		if (length > 0) {
			let time = tween * length;
			if (length <= 60) {
				time = Math.round(time * 10) / 10;
			} else {
				time = Math.round(time);
			}
			timeStr = time + 's';
		} else {
			timeStr = '';
		}
		document.getElementById('anim-position-readout').innerHTML = timeStr;

	}

	function animFinished() {
		const playStopButton = document.getElementById('btn-play');
		playStopButton.children[0].src = 'img/control_play_blue.png';
		playStopButton.title = 'Play animation';
		const tween = animController.progress;
		animPositionSlider.value = tween;
		updateAnimPositionReadout(tween);
		syncToPosition();
		animController = undefined;
	}

	function play() {
		$(modal).modal('hide');
		const button = document.getElementById('btn-play');
		button.children[0].src = 'img/control_stop_blue.png';
		button.title = 'Stop animation';
		successAlert.alert('close');
		errorAlert.alert('close');
		document.getElementById('anim-position-readout').innerHTML = '';
		let start = 0;
		if (document.getElementById('anim-controls').classList.contains('show')) {
			start = parseFloat(animPositionSlider.value);
			if (start === 1) {
				start = 0;
			}
		}
		const length = parseFloat(document.getElementById('anim-length').value) * 1000;
		animController = animate(bgGenerator, drawingContext, canvas.width, canvas.height, start, length, loopAnim);
		animController.promise = animController.promise.then(animFinished, animFinished);
		animController.start();
	}

	const noAnimErrorMsg = `
		<p>The start and end frames are the same so there's nothing to animate. Use the
		<span class="btn btn-sm btn-black"><img src="img/timeline_marker_start.png" alt="Start Frame" width="16" height="16"></span> and
		<span class="btn btn-sm btn-black"><img src="img/timeline_marker_end.png" alt="Start Frame" width="16" height="16"></span>
		buttons to set up animation frames.</p>
	`;

	document.getElementById('btn-play').addEventListener('click', function (event) {
		if (animController && animController.status === AnimationController.Status.RUNNING) {
			// Stop
			animController.abort();
			return;
		}

		let unsavedChanges = !currentFrame.isCurrentFrame();
		let separateFrames = startFrame !== endFrame || ('tween' in bgGenerator);
		if (!separateFrames && unsavedChanges) {
			random = random.endGenerator;
			currentFrame = currentFrameData();
			endFrame = currentFrame;
			tweenData = new TweenData(bgGenerator, startFrame, endFrame);
			setWillChange();
			separateFrames = true;
			unsavedChanges = false;
		}

		const lengthInput = document.getElementById('anim-length');
		const length = parseFloat(lengthInput.value);
		if (!(length > 0)) {
			showAlert(errorAlert, 'Invalid animation duration.', document.body);
			lengthInput.focus();
			return;
		}

		if (!separateFrames) {
			showAlert(errorAlert, noAnimErrorMsg, document.body);
		} else if (unsavedChanges) {
			animAction = play;
			$('#assign-bg-change-modal').modal('show');
		} else {
			play();
		}
	});


	$('#play-btn-group').on('show.bs.dropdown', function(event) {
		animControlsOpen = true;
	});

	 $('#play-btn-group').on('hide.bs.dropdown', function(event) {
		const target = document.activeElement;
		animControlsOpen = target.dataset.toggle !== 'dropdown' || !toolbar.contains(target);
		return !animControlsOpen;
	});

	 let seeking = false;

	animPositionSlider.addEventListener('input', function (event) {
		if (!seeking) {
			let unsavedChanges = !currentFrame.isCurrentFrame();
			let separateFrames = startFrame !== endFrame || ('tween' in bgGenerator);
			if (!separateFrames && unsavedChanges) {
				random = random.endGenerator;
				currentFrame = currentFrameData();
				endFrame = currentFrame;
				tweenData = new TweenData(bgGenerator, startFrame, endFrame);
				setWillChange();
				separateFrames = true;
				unsavedChanges = false;
			}
			if (!separateFrames) {
				showAlert(errorAlert, noAnimErrorMsg, document.body);
				this.value = 1;
				return;
			} else if (unsavedChanges) {
				animAction = renderAndSync;
				$('#assign-bg-change-modal').modal('show');
				return;
			}
			seeking = true;
		}
		const tween = parseFloat(this.value);
		renderFrame(bgGenerator, drawingContext, canvas.width, canvas.height, tween, loopAnim, false, 1);
		updateAnimPositionReadout(tween);
	});

	function syncToPosition() {
		const tween = parseFloat(animPositionSlider.value);
		const startRotation = startFrame.rotation;
		const endRotation = endFrame.rotation;
		const loopedRotation = loopAnim && startRotation !== endRotation && (startRotation !== 0 || endRotation !== TWO_PI);
		rotation = interpolateValue(startRotation, endRotation + TWO_PI * fullRotations, tween, loopedRotation);
		rotationSlider.value = rotation / TWO_PI;
		seedInput.value = random.seed;
		currentFrame = currentFrameData();
	}

	function renderAndSync() {
		const tween = parseFloat(animPositionSlider.value);
		renderFrame(bgGenerator, drawingContext, canvas.width, canvas.height, tween, loopAnim, false, 0);
		updateAnimPositionReadout(tween);
		syncToPosition();
	}

	function syncAndDraw() {
		syncToPosition();
		seeking = false;
		progressiveBackgroundGen(0);
	}

	animPositionSlider.addEventListener('pointerup', syncAndDraw);
	animPositionSlider.addEventListener('keyup', syncAndDraw);

	document.getElementById('btn-rewind').addEventListener('click', function (event) {
		if (startFrame === endFrame) {
			if ('tween' in bgGenerator) {
				random = random.endGenerator;
				currentFrame = currentFrameData();
				endFrame = currentFrame;
				tweenData = new TweenData(bgGenerator, startFrame, endFrame);
				setWillChange();
			} else {
				return;
			}
		}
		animPositionSlider.value = 0;
		renderAndSync();
	});

	document.getElementById('anim-length').addEventListener('input', function (event) {
		const length = parseFloat(this.value);
		if (length > 0) {
			updateAnimPositionReadout(animPositionSlider.value);
			videoErrorAlert.alert('close');
		}
	});

	document.getElementById('btn-anim-opts').addEventListener('click', function (event) {
		$('#anim-opts-modal').modal('show');
	});

	document.getElementById('background-rotations').addEventListener('input', function (event) {
		const value = parseFloat(this.value);
		if (Number.isFinite(value)) {
			fullRotations = value;
		}
	});

	document.getElementById('anim-loop').addEventListener('input', function (event) {
		loopAnim = this.checked;
		const currentPosition = parseFloat(animPositionSlider.value);
		let newPosition;
		if (loopAnim) {
			newPosition = currentPosition / 2;
		} else if (currentPosition <= 0.5) {
			newPosition = currentPosition * 2;
		} else {
			newPosition = (1 - currentPosition) * 2;
		}
		animPositionSlider.value = newPosition;
		updateAnimPositionReadout(newPosition);
	});

	{
		const currentResStr = screen.width + 'x' + screen.height;
		let currentResOption = videoResolutionInput.querySelector('option[value="' + currentResStr +'"]');
		if (currentResOption === null) {
			currentResOption = document.createElement('OPTION');
			currentResOption.value = currentResStr;
			videoResolutionInput.appendChild(currentResOption);
		}
		currentResOption.innerHTML = 'Full Screen (' + screen.height + 'p)';
		currentResOption.selected = true;
	}

	document.getElementById('btn-video-opts').addEventListener('click', function (event) {
		if (document.getElementById('btn-render-video').disabled) {
			// Video rendering already in progress.
			$('#video-modal').modal('show');
			return;
		}
		requireScript('lib/CCapture.all.min.js');

		let unsavedChanges = !currentFrame.isCurrentFrame();
		const separateFrames = startFrame !== endFrame || ('tween' in bgGenerator);
		if (!separateFrames && unsavedChanges) {
			random = random.endGenerator;
			currentFrame = currentFrameData();
			endFrame = currentFrame;
			tweenData = new TweenData(bgGenerator, startFrame, endFrame);
			setWillChange();
			unsavedChanges = false;
		}
		if (unsavedChanges) {
			animAction = function () {
				$('#video-modal').modal('show');
			};
			$('#assign-bg-change-modal').modal('show')
		} else {
			$('#video-modal').modal('show');
		}
	});

	document.getElementById('btn-render-video').addEventListener('click', async function (event) {
		let errorMsg = '';
		if (startFrame === endFrame && !('tween' in bgGenerator)) {
			errorMsg = noAnimErrorMsg;
		}
		let length = parseFloat(document.getElementById('anim-length').value);
		if (!(length > 0)) {
			errorMsg += '<p>Invalid video duration.</p>'
		}
		const framerate = parseInt(document.getElementById('video-framerate').value);
		if (!(framerate > 0)) {
			errorMsg += '<p>Invalid frame rate.</p>'
		}
		const motionBlur = parseInt(document.getElementById('motion-blur').value) + 1;
		if (!(motionBlur >= 1)) {
			errorMsg += '<p>Invalid number of motion blur frames.</p>';
		}
		const startTime = parseFloat(document.getElementById('video-start').value);
		if (!(startTime >= 0 && startTime < length)) {
			errorMsg += '<p>Invalid start time.</p>';
		}

		if (errorMsg === '') {

			videoErrorAlert.alert('close');
			const properties = {
				framerate: framerate,
				motionBlurFrames: motionBlur,
				format: document.getElementById('video-format').value,
				quality: parseInt(document.getElementById('video-quality').value),
				name: generateFilename(),
				workersPath: 'lib/'
			};
			const startTween = startTime / length;

			const resolutionStr = videoResolutionInput.value;
			const videoWidth = parseInt(resolutionStr);
			const videoHeight = parseInt(resolutionStr.slice(resolutionStr.indexOf('x') + 1));
			const captureCanvas = document.createElement('CANVAS');
			captureCanvas.width = videoWidth;
			captureCanvas.height = videoHeight;
			if (debug.video) {
				canvas.hidden = true;
				document.body.appendChild(captureCanvas);
			}
			const scale = videoHeight / screen.height;
			const drawWidth = videoWidth / scale;
			const drawHeight = screen.height;
			const contextualInfo = new DrawingContext(captureCanvas, videoWidth, videoHeight, scale);
			contextualInfo.initializeShader(bgGenerator);
			captureVideo(contextualInfo, drawWidth, drawHeight, startTween, length * 1000, properties);

		} else {

			const element = videoErrorAlert.get(0);
			element.innerHTML = errorMsg;
			element.classList.add('show');
			document.getElementById('video-modal-body').appendChild(element);

		}
	});

	const videoQualityReadout = document.getElementById('video-quality-readout');

	document.getElementById('video-format').addEventListener('input', function (event) {
		const qualitySlider = document.getElementById('video-quality');
		const lossy = this.value === 'webm' || this.value === 'jpg';
		qualitySlider.disabled = !lossy;
		videoQualityReadout.innerHTML = lossy ? qualitySlider.value + '%' : 'N/A';
	});

	document.getElementById('video-quality').addEventListener('input', function (event) {
		videoQualityReadout.innerHTML = this.value + '%';
	});

	document.getElementById('btn-cancel-video').addEventListener('click', function (event) {
		if (animController === undefined) {
			$('#video-modal').modal('hide');
		} else {
			animController.abort();
		}
	});

	document.getElementById('btn-download').addEventListener('click', function (event) {
		const downloadModal = document.getElementById('save-pic-modal');
		const background = queryChecked(downloadModal, 'paper-type');
		let saveCanvas;
		if (background.value === 'transparent') {
			saveCanvas = canvas;
		} else {
			saveCanvas = document.createElement('CANVAS');
			saveCanvas.width = canvas.width;
			saveCanvas.height = canvas.height;
			const saveContext = saveCanvas.getContext('2d');
			saveContext.fillStyle = backgroundElement.style.backgroundColor;
			saveContext.fillRect(0, 0, canvas.width, canvas.height);
			saveContext.drawImage(canvas, 0, 0);
		}

		this.download = generateFilename() + '.png';
		this.href = saveCanvas.toDataURL();
		$(downloadModal).modal('hide');
	});

	$('#save-dropdown').on('shown.bs.dropdown', function (event) {
		document.getElementById('save-result').innerHTML = '';
		const titleInput = document.getElementById('work-title');
		if (titleInput.value.trim() === '') {
			titleInput.focus();
		} else {
			document.getElementById('work-keywords').focus();
		}
	});

	document.getElementById('save-form').addEventListener('submit', async function (event) {
		event.preventDefault();
		const data = {};
		// TODO Add user authentication
		data.user = '1';
		data.documentID = urlParameters.get('doc');
		data.title = document.getElementById('work-title').value.trim();
		const keywords = [];
		for (let keyword of document.getElementById('work-keywords').value.split(',')) {
			keyword = keyword.trim();
			if (keyword !== '' && !keywords.includes(keyword)) {
				keywords.push(keyword);
			}
		}
		data.category = currentSketch.title;
		data.keywords = keywords;
		const doc = {};
		data.document = doc;
		data.attachments = [];

		doc.sketch = currentSketch.url;
		const hasRandomness = bgGenerator.hasRandomness
		doc.startFrame = startFrame.toObject(hasRandomness);
		if (startFrame !== endFrame) {
			doc.endFrame = endFrame.toObject(hasRandomness);
		}

		const options = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		};
		let success;
		let constraint;
		try {
			const response = await fetch(backendRoot + 'save', options);
			const responseData = await response.json();
			success = responseData.success;
			constraint = responseData.constraint;
			if (success || constraint === 'unique_document') {
				urlParameters.set('doc', responseData.documentID);
				urlParameters.delete('gen');
				updateURL();
			}
		} catch (e) {
			console.error(e);
			success = false;
		}
		const resultBox = document.getElementById('save-result');
		if (success) {
			resultBox.innerHTML = 'Saved.';
			setTimeout(function () {
				resultBox.innerHTML = '';
			}, 10000);
		} else {
			switch (constraint) {
			case 'unique_document':
				resultBox.innerHTML = 'This artwork has been created before.';
				break;
			case 'unique_title':
				resultBox.innerHTML = 'You already have an artwork called <i>' + data.title + '</i>.';
				break;
			default:
				resultBox.innerHTML = 'Sorry, an error occurred.';
			}
		}
	});

	imageUpload.querySelector('#background-gen-image-upload').addEventListener('input', function (event) {
		const file = this.files[0];
		if (file) {
			if (bgGeneratorImage.src) {
				URL.revokeObjectURL(bgGeneratorImage.src);
			}
			bgGeneratorImage.src = URL.createObjectURL(file);
			this.parentElement.querySelector('#background-gen-image-label').innerText = file.name;
		}
	});

	clearComboboxesOnFocus();

}
