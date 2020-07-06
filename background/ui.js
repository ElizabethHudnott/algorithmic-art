'use strict';

let bgGenerator, generateBackground, setBgProperty, setBgPropertyElement;
let random = new RandomNumberGenerator();
const bgGeneratorImage = new Image();

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

function showBackgroundOptions() {
	$('#video-modal').modal('hide');
	$('#error-alert').alert('close');
	$('#background-gen-modal').modal('show');
}

{
	const backendRoot = 'http://localhost/';
	const backgroundElement = document.body;
	let backgroundRedraw;
	let bgGeneratorRotation = 0;

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

		assignValue(gl, location, value, isArrayElement) {
			let baseType = this.baseType;
			if (baseType === 'b') {
				baseType = 'f';
			}
			if (!isArrayElement && this.length !== undefined) {
				value = value.flat();
			}
			if (this.category === GLTypeCategory.SCALAR && this.length === undefined) {
				gl['uniform1' + baseType](location, value);
			} else if (this.category === GLTypeCategory.MATRIX) {
				value = new Float32Array(value.flat());
				if (this.width === this.height) {
					gl['uniformMatrix' + this.width + 'fv'](location, false, value);
				} else {
					gl['uniformMatrix' + this.height + 'x' + this.width + 'fv'](location, false, value);
				}
			} else {
				if (baseType === 'i') {
					value = new Int32Array(value);
				}
				gl['uniform' + this.width + baseType + 'v'](location, value);
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
			const glCanvas = document.createElement('CANVAS');
			const gl = glCanvas.getContext('webgl2', {premultipliedAlpha : false});
			this.gl = gl;
			this.scale = scale;
			this.resize(width, height);
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
			if (uniformLocations) {
				gl.uniformMatrix4fv(
					uniformLocations.projectionMatrix,
					false,
					projectionMatrix
				);
				gl.uniform1f(uniformLocations.width, glCanvas.width);
				gl.uniform1f(uniformLocations.height, glCanvas.height);
			}
        }

		initializeShader(generator) {
			if (generator.shaderSource === undefined) {
				return;
			}
			const gl = this.gl;
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
			for (let [property, type] of this.types.entries()) {
				const location = gl.getUniformLocation(program, property);
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

	const signatureFont = 'italic 20px "Pacifico", cursive';

	function drawSignature(contextualInfo) {
		let text = '';
		let sketchAuthor;
		if (currentSketch) {
			sketchAuthor = currentSketch.author;
		}
		if (sketchAuthor) {
			text = sketchAuthor;
			if (userDisplayName) {
				text += ' & ';
			}
		}
		if (userDisplayName) {
			text += userDisplayName;
		}
		if (text == '') {
			// For mouse zoning
			signatureWidth = 100;
			signatureHeight = 30;
		} else {
			const context = contextualInfo.twoD;
			const scale = contextualInfo.scale;
			context.restore();
			context.save();
			context.shadowColor = 'transparent';
			const fontSize = Math.ceil(20 / scale);
			context.font = signatureFont.replace('20', fontSize);
			context.textAlign = 'left';
			context.textBaseline = 'bottom';
			const metrics = context.measureText(text);
			const paddingX = Math.ceil(3 / scale);
			const paddingY = Math.ceil(4 / scale);
			signatureWidth = 2 * paddingX + Math.ceil(metrics.actualBoundingBoxRight);
			signatureHeight = paddingY + Math.ceil(metrics.actualBoundingBoxAscent);
			const canvasHeight = context.canvas.height / scale;
			context.clearRect(0, canvasHeight - signatureHeight, signatureWidth, signatureHeight);
			const backgroundColor = backgroundElement.style.backgroundColor;
			const [colorSystem, colorComponents] = parseColor(backgroundColor);
			const luma = colorSystem === 'rgb' ?  rgbToLuma(...colorComponents) : colorComponents[2] / 100;
			context.fillStyle = luma >= 0.5 ? 'black' : 'white';
			context.fillText(text, paddingX, canvasHeight);
		}
	}

	function progressiveBackgroundDraw(generator, contextualInfo, width, height, preview) {
		if (generator.isShader) {
			contextualInfo.drawGL(parseFloat(animPositionSlider.value), preview);
			if (document.fonts.check(signatureFont)) {
				drawSignature(contextualInfo);
			} else {
				document.fonts.load(signatureFont).then(function () {
					drawSignature(contextualInfo);
				});
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
						if (document.fonts.check(signatureFont)) {
							drawSignature(contextualInfo);
						} else {
							document.fonts.load(signatureFont).then(function () {
								drawSignature(contextualInfo);
							});
						}
					} else {
						setTimeout(drawSection, 0);
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
		rotateCanvas(context, width, height, bgGeneratorRotation);
		progressiveBackgroundDraw(bgGenerator, drawingContext, width, height, preview);
	}
	generateBackground = progressiveBackgroundGen;
	setBgProperty = drawingContext.setProperty.bind(drawingContext);
	setBgPropertyElement = drawingContext.setPropertyElement.bind(drawingContext);

	bgGeneratorImage.onload = function () {
		progressiveBackgroundGen(0);
	};

	const backgroundGenerators = new Map();
	const urlParameters = new URLSearchParams(document.location.search);
	let currentSketch;
	const backgroundGenOptionsDOM = new Map();
	let generatorURL, startFrame, endFrame, tweenData, animController;
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
	$(modal).modal({focus: false, show: false});
	const modalHeader = document.getElementById('background-gen-modal-header');
	const rotationSlider = document.getElementById('background-rotation');
	const generateButton = document.getElementById('btn-generate-background');
	const seedForm = document.getElementById('random-seed-form');
	const seedInput = document.getElementById('random-seed');
	const progressBar = document.getElementById('video-progress');
	const imageUpload = document.getElementById('background-gen-image');
	imageUpload.remove();
	imageUpload.removeAttribute('hidden');

	const animPositionSlider = document.getElementById('anim-position');
	const videoResolutionInput = document.getElementById('video-resolution');

	class FrameData {
		constructor(generator, rotation, backgroundElement) {
			this.continuous = new Map();
			this.stepped = new Map();
			this.pairedContinuous = new Map();
			this.xy = new Map();
			this.pairedStepped = new Map();
			if (arguments.length === 0) {
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
			this.backgroundColor = backgroundElement.style.backgroundColor;
			this.random = random;
		}

		toObject(hasRandomness) {
			const properties = {};
			const categories = [
				'continuous', 'stepped', 'pairedContinuous', 'xy', 'pairedStepped'
			];
			for (let category of categories) {
				for (let [key, value] of this[category].entries()) {
					properties[key] = value;
				}
			}
			const data = {};
			data.properties = properties;
			data.rotation = this.rotation;
			data.backgroundColor = this.backgroundColor;
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
						frame.continuous.set(property, values[property]);
					}
				}
				const stepped = animatable.stepped;
				if (stepped !== undefined) {
					for (let property of stepped) {
						frame.stepped.set(property, values[property]);
					}
				}
				const maps = ['pairedContinuous', 'xy', 'pairedStepped'];
				for (let mapName of maps) {
					const list = animatable[mapName];
					if (list !== undefined) {
						const map = frame[mapName];
						for (let [property1, property2] of list) {
							map.set(property1, values[property1]);
							map.set(property2, values[property2]);
						}
					}
				}
			}
			frame.rotation = data.rotation;
			frame.backgroundColor = data.backgroundColor;
			if ('random' in data) {
				frame.random = data.random;
			} else {
				frame.random = random;
			}
			return frame;
		}

		isCurrentFrame() {
			if (
				this.rotation !== bgGeneratorRotation ||
				this.backgroundColor !== backgroundElement.style.backgroundColor
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
		return new FrameData(bgGenerator, bgGeneratorRotation, backgroundElement);
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
		elem.timeout = setTimeout(hideAlert, 6000, jquery);
	}

	let signatureWidth, signatureHeight;
	let userDisplayName = undefined;

	function generatorFactory(url) {
		let generator = backgroundGenerators.get(url);
		if (generator === undefined) {
			return downloadFile(url, 'text').then(function (sourceCode) {
				const constructor = Function("'use strict';" + sourceCode)();
				const generator = new constructor();
				backgroundGenerators.set(url, generator);
				return generator;
			});
		} else {
			return Promise.resolve(generator);
		}
	}

	const modalMargin = 0;
	modal.style.left = Math.max(Math.round(window.innerWidth - 500 - modalMargin), 0) + 'px';

	function repositionModal(centre) {
		if (modal.classList.contains('show')) {
			const child = modal.children[0];
			const rect = child.getBoundingClientRect();
			const maxRight = window.innerWidth - modalMargin;
			if (rect.right > maxRight) {
				modal.style.left = Math.max(Math.round(maxRight - rect.width), 0) + 'px';
			}

			const maxBottom = window.innerHeight - document.getElementById('background-gen-toolbar').clientHeight;

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

	function openSketch() {
		document.getElementById('btn-open-sketch').click();
	}

	function enableOpenButton() {
		document.getElementById('btn-open-sketch').disabled = false;
	}

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
			thumbnail.src = sketch.thumbnail;
			thumbnail.alt = sketch.title;
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

	async function switchGenerator(url, pushToHistory) {
		if (currentSketch && currentSketch.url !== url) {
			currentSketch = undefined;
		}
		const enableSave = (new URL(url, document.location)).hostname === document.location.hostname;
		const saveBtn = document.getElementById('btn-save-form');
		saveBtn.hidden = !enableSave;

		const gen = await generatorFactory(url)
		document.title = gen.title;
		if (bgGenerator && bgGenerator.purgeCache) {
			bgGenerator.purgeCache();
		}
		bgGenerator = gen;
		const prevGenURL = generatorURL;
		generatorURL = url;
		random = new RandomNumberGenerator();
		seedInput.value = random.seed;
		currentFrame = currentFrameData();
		startFrame = currentFrame;
		endFrame = startFrame;
		if ('tween' in gen) {
			gen.tween = parseFloat(animPositionSlider.value);
			document.getElementById('btn-both-frames').hidden = false;
			document.getElementById('btn-both-frames2').hidden = false;
		} else {
			document.getElementById('btn-both-frames').hidden = true;
			document.getElementById('btn-both-frames2').hidden = true;
		}
		if (gen.isShader && !gen.shaderSource) {
			const fragFileContent = await downloadFile(url.slice(0, -3) + '.frag', 'text');
			gen.shaderSource = fragmentShaderHeader + shaderDeclarations(gen) + fragFileContent;
			drawingContext.initializeShader(bgGenerator);
			drawingContext.setProperties(bgGenerator);
		}
		progressiveBackgroundGen(0);

		document.getElementById('background-gen-modal-label').innerHTML = gen.title + ' Options';

		function attachOptionsDOM(dom) {
			const container = document.getElementById('background-gen-options');
			const elements = dom.children;
			while (elements.length > 0) {
				container.appendChild(elements[0]);
			}
			const imageCtrlLocation = container.querySelector('[data-attach=image]');
			if (imageCtrlLocation !== null) {
				imageCtrlLocation.appendChild(imageUpload);
			}
			repositionModal(true);
		}

		// Switch out previous DOM
		const container = document.getElementById('background-gen-options');
		const oldDOM = backgroundGenOptionsDOM.get(prevGenURL);
		if (oldDOM !== undefined) {
			const elements = container.children;
			while (elements.length > 0) {
				const oldElement = container.removeChild(elements[0]);
				oldDOM.appendChild(oldElement);
			}
		}

		// Try to get from cache first.
		const dom = backgroundGenOptionsDOM.get(url);
		if (dom !== undefined) {
			attachOptionsDOM(dom);
		} else {
			const optionsDocPromise = gen.optionsDocument;
			if (optionsDocPromise !== undefined) {
				optionsDocPromise.then(function (optionsDoc) {
					const dom = optionsDoc.body;
					attachOptionsDOM(dom);
					backgroundGenOptionsDOM.set(url, dom);
				});
			}
		}
		generateButton.parentElement.hidden = !gen.hasRandomness;

		const credits = gen.credits ? '<hr>' + gen.credits : '';
		document.getElementById('background-gen-credits').innerHTML = credits;

		if (pushToHistory) {
			const name = url.slice(0, -3);	// trim .js
			urlParameters.set('gen', name);
			updateURL();
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

	async function init() {
		let firstDocID = urlParameters.get('doc');
		let firstGenURL = urlParameters.get('gen');
		let nextStep;
		if (firstGenURL) {
			firstGenURL += '.js';
			nextStep = function () {
				$(modal).modal('show');
			}
		} else {
			firstGenURL = 'ten-print.js';
			nextStep = function () {
				$('#sketches-modal').modal('show');
			};
		}
		if (firstDocID) {
			const sketchURL = await loadDocument(firstDocID);
			if (sketchURL !== undefined) {
				firstGenURL = sketchURL;
				nextStep = function () {
					$(modal).modal('show');
				}
			} else {
				firstDocID = null;
			}
		}
		if (!firstDocID) {
			switchGenerator(firstGenURL, false);
		}

		const sketchFile = await downloadFile('sketches.json', 'json');
		for (let sketch of sketchFile.sketches) {
			addSketch(sketch);
			if (sketch.url === firstGenURL) {
				currentSketch = sketch;
			}
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
		if (Array.isArray(startValue)) {
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

	class TweenData {

		constructor(generator, startFrame, endFrame) {
			// Map x property name to the calculated value.
			this.radii = new Map();
			this.startTheta = new Map();
			this.centreX = new Map();
			this.centreY = new Map();

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
				const centreX = (startX + endX) / 2;
				const centreY = (startY + endY) / 2;
				const distX = startX - centreX;
				const distY = startY - centreY;
				const r = Math.hypot(distX, distY);
				const theta = Math.atan2(distY, distX);
				this.radii.set(keyX, r);
				this.startTheta.set(keyX, theta);
				this.centreX.set(keyX, centreX);
				this.centreY.set(keyX, centreY);
			}
		}

		interpolateXY(keyX, tween) {
			const r = this.radii.get(keyX);
			const startTheta = this.startTheta.get(keyX);
			const theta = tween * TWO_PI + startTheta;
			const x = r * Math.cos(theta) + this.centreX.get(keyX);
			const y = r * Math.sin(theta) + this.centreY.get(keyX);
			return [x, y];
		}

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
		for (let [property, startValue] of startFrame.continuous.entries()) {
			const endValue = endFrame.continuous.get(property);
			generator[property] = interpolateValue(startValue, endValue, tweenPrime, false);
		}
		for (let [property, startValue] of startFrame.stepped.entries()) {
			const endValue = endFrame.stepped.get(property);
			generator[property] = interpolateStep(startValue, endValue, tween, loop);
		}
		if (generator.animatable) {
			const xy = generator.animatable.xy;
			if (xy !== undefined && startFrame !== endFrame) {
				if (loop) {
					for (let [propertyX, propertyY] of xy) {
						const [x, y] = tweenData.interpolateXY(propertyX, tween);
						generator[propertyX] = x;
						generator[propertyY] = y;
					}
				} else {
					for (let [property, startValue] of startFrame.xy.entries()) {
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
		const backgroundColor = interpolateValue(startFrame.backgroundColor, endFrame.backgroundColor, tweenPrime, false);
		interpolateRandom(startFrame.random, endFrame.random, tweenPrime);

		const context = contextualInfo.twoD;
		context.restore();
		backgroundElement.style.backgroundColor = backgroundColor;
		context.clearRect(0, 0, width, height);
		context.save();
		rotateCanvas(context, width, height, rotation);
		if (generator.isShader) {
			contextualInfo.setProperties(generator);
			contextualInfo.drawGL(tweenPrime, preview);
			drawSignature(contextualInfo);
		} else if (preview === 0) {
			// Draw everything in one go when capturing video
			random.reset();
			const redraw = generator.generate(context, width, height, 0);
			backgroundRedraw = redraw;
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

			function render() {
				const time = performance.now();
				let beginTime = newAnimController.beginTime;
				if (beginTime === undefined) {
					beginTime = time;
					newAnimController.setup(render, reject, beginTime);
				}

				const tween = Math.min(startTween + (time - beginTime) / length, 1);
				if (newAnimController.status === 'aborted') {
					return;
				}
				renderFrame(generator, contextualInfo, width, height, tween, loop, paintBackground, 0);
				newAnimController.progress = tween;

				if (capturer) {
					capturer.capture(contextualInfo.twoD.canvas);
					let percent = (tween - startTween) / (1 - startTween) * 100;
					progressBar.style.width = percent + '%';
					percent = Math.trunc(percent);
					progressBar.innerHTML = percent + '%';
					progressBar.setAttribute('aria-valuenow', percent);
					framesRendered++;
					const iconFile = framesRendered % 2 === 0 ? 'record.png' : 'draw_ellipse.png';
					indicator.src = '../img/' + iconFile;
				} else {
					animPositionSlider.value = tween;
				}
				if (tween < 1) {
					requestAnimationFrame(render);
				} else {
					newAnimController.finish(resolve);
				}
			};
			newAnimController.progress = 0;
			newAnimController.start = render;
		});
		newAnimController.promise = promise;
		return newAnimController;
	}

	function captureVideo(contextualInfo, width, height, startTween, length, properties) {
		progressBar.style.width = '0';
		progressBar.innerHTML = '0%';
		progressBar.setAttribute('aria-valuenow', '0');
		const progressRow = document.getElementById('video-progress-row');
		progressRow.hidden = false;

		const stopButton = document.getElementById('btn-stop-video-render');
		const renderButton = document.getElementById('btn-render-video');
		renderButton.disabled = true;
		stopButton.disabled = false;

		const capturer = new CCapture(properties);
		animController = animate(bgGenerator, contextualInfo, width, height, startTween, length, loopAnim, capturer);
		function reset() {
			stopButton.disabled = true;
			capturer.stop();
			progressRow.hidden = true;
			renderButton.disabled = false;
			if (debug.video) {
				document.body.removeChild(contextualInfo.twoD.canvas);
			}
			canvas.style.display = 'block';
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

	let mouseZone;
	function checkMouseZone(event) {
		const x = event.clientX;
		const y = event.clientY;
		if (x < signatureWidth && y > canvas.height - signatureHeight) {
			if (mouseZone !== 'signature') {
				authorForm.hidden = false;
				authorInput.focus();
				mouseZone = 'signature';
			}
		} else if (mouseZone !== '') {
			mouseZone = '';
		}
	}
	canvas.addEventListener('pointermove', checkMouseZone);
	canvas.addEventListener('click', checkMouseZone);

	authorForm.addEventListener('submit', function (event) {
		event.preventDefault();
		userDisplayName = authorInput.value;
		this.hidden = true;
		progressiveBackgroundGen(0);
	});

	authorForm.addEventListener('focusout', function (event) {
		if (!this.contains(event.relatedTarget)) {
			authorForm.hidden = true;
			authorInput.value = userDisplayName;
		}
	});

	document.getElementById('btn-open-sketch').addEventListener('click', function (event) {
		const sketchesModal = document.getElementById('sketches-modal');
		$(sketchesModal).modal('hide');
		$(modal).modal('show');
		currentSketch = queryChecked(sketchesModal, 'sketch')._sketch;
		switchGenerator(currentSketch.url, true);
	});

	rotationSlider.addEventListener('input', function (event) {
		bgGeneratorRotation = TWO_PI * parseFloat(this.value);
		progressiveBackgroundGen(0);
	});

	document.getElementById('background-rotation-reset').addEventListener('click', function (event) {
		rotationSlider.value = 0;
		bgGeneratorRotation = 0;
		progressiveBackgroundGen(0);
	});

	// Changing background colour.
	document.getElementById('paper-color').addEventListener('input', function (event) {
		backgroundElement.style.backgroundColor = this.value;
		drawSignature(drawingContext);
	});

	// Generate new background button.
	generateButton.addEventListener('click', function (event) {
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
						endFrame = currentFrameData();
						tweenData = new TweenData(bgGenerator, startFrame, endFrame);
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
		return target !== generateButton && !seedForm.contains(target);
	});

	// Animation controls
	document.getElementById('btn-start-frame').addEventListener('click', function (event) {
		random = random.startGenerator;
		currentFrame = currentFrameData();
		startFrame = currentFrame;
		tweenData = new TweenData(bgGenerator, startFrame, endFrame);
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
		displaySeed();
		animAction();
	});

	document.getElementById('btn-end-frame').addEventListener('click', function (event) {
		random = random.endGenerator;
		currentFrame = currentFrameData();
		endFrame = currentFrame;
		tweenData = new TweenData(bgGenerator, startFrame, endFrame);
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
		playStopButton.children[0].src = '../img/control_play_blue.png';
		playStopButton.title = 'Play animation';
		updateAnimPositionReadout(animController.progress);
		syncToPosition();
	}

	function play() {
		$(modal).modal('hide');
		const button = document.getElementById('btn-play');
		button.children[0].src = '../img/control_stop_blue.png';
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

	document.getElementById('btn-play').addEventListener('click', function (event) {
		if (animController && animController.status === 'running') {
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
			const errorMsg = 'The start and end frames are the same. Nothing to animate. <button type="button" class="btn btn-primary btn-sm align-baseline" onclick="showBackgroundOptions()">Set up Animation</button>';
			showAlert(errorAlert, errorMsg, document.body);
		} else if (unsavedChanges) {
			animAction = play;
			$('#assign-bg-change-modal').modal('show');
		} else {
			play();
		}
	});


	 $('#play-btn-group').on('hide.bs.dropdown', function(event) {
	 	const toolbar = document.getElementById('background-gen-toolbar');
		const target = document.activeElement;
		return target.dataset.toggle === 'dropdown' && toolbar.contains(target);
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
				separateFrames = true;
				unsavedChanges = false;
			}
			if (!separateFrames) {
				const errorMsg = 'The start and end frames are the same. Nothing to animate. <button type="button" class="btn btn-primary btn-sm align-baseline" onclick="showBackgroundOptions()">Set up Animation</button>';
				showAlert(errorAlert, errorMsg, document.body);
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
		bgGeneratorRotation = interpolateValue(startRotation, endRotation + TWO_PI * fullRotations, tween, loopedRotation);
		rotationSlider.value = bgGeneratorRotation / TWO_PI;
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

	function hideConfig() {
		$('#background-gen-modal').modal('hide');
	}

	$('#sketches-modal').on('show.bs.modal', hideConfig);
	$('#anim-opts-modal').on('show.bs.modal', hideConfig);
	$('#video-modal').on('show.bs.modal', hideConfig);

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

		let unsavedChanges = !currentFrame.isCurrentFrame();
		const separateFrames = startFrame !== endFrame || ('tween' in bgGenerator);
		if (!separateFrames && unsavedChanges) {
			random = random.endGenerator;
			currentFrame = currentFrameData();
			endFrame = currentFrame;
			tweenData = new TweenData(bgGenerator, startFrame, endFrame);
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

	document.getElementById('btn-render-video').addEventListener('click', function (event) {
		let errorMsg = '';
		if (startFrame === endFrame && !('tween' in bgGenerator)) {
			errorMsg += '<p>The start and end frames are the same. Nothing to render.</p><p><button type="button" class="btn btn-primary btn-sm" onclick="showBackgroundOptions()">Set up Animation</button></p>';
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
				workersPath: '../lib/'
			};
			const startTween = startTime / length;

			const resolutionStr = videoResolutionInput.value;
			const videoWidth = parseInt(resolutionStr);
			const videoHeight = parseInt(resolutionStr.slice(resolutionStr.indexOf('x') + 1));
			const captureCanvas = document.createElement('CANVAS');
			captureCanvas.width = videoWidth;
			captureCanvas.height = videoHeight;
			if (debug.video) {
				canvas.style.display = 'none';
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

	document.getElementById('btn-stop-video-render').addEventListener('click', function (event) {
		animController.abort();
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

	// After resizing, generate a new background to fit the new window size.
	let resizeTimer;
	function resizeWindow() {
		repositionModal(false);
		drawingContext.resize(window.innerWidth, window.innerHeight);
		progressiveBackgroundGen(0);
	}

	window.addEventListener('resize', function (event) {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(resizeWindow, 100);
	});

	let modalDrag;

	modalHeader.addEventListener('pointerdown', function (event) {
		const target = event.target;
		if (target === this || target.tagName === 'H5') {
			modalDrag = [event.offsetX, event.offsetY];
		}
	});

	modalHeader.addEventListener('pointerup', function (event) {
		modalDrag = undefined;
	});

	window.addEventListener('pointermove', function (event) {
		if (modalDrag !== undefined) {
			if (event.buttons !== 1) {
				modalDrag = undefined;
				return;
			}

			const child = modal.children[0];
			let left = Math.round(event.clientX - modalDrag[0]);
			const maxLeft = window.innerWidth - 32;
			left = Math.min(left, maxLeft);

			let top = Math.max(Math.round(event.clientY - modalDrag[1]), 0);
			const maxTop = window.innerHeight - document.getElementById('background-gen-toolbar').clientHeight - modalHeader.clientHeight;
			top = Math.min(top, maxTop);
			modal.style.left = left + 'px';
			modal.style.top = top + 'px';
		}
	});

	$(modal).on('show.bs.modal', function (event) {
		$('#background-gen-modal-content').collapse('show');
	});

	$(modal).on('shown.bs.modal', function (event) {
		repositionModal(false);
	});

	modalHeader.addEventListener('dblclick', function (event) {
		$('#background-gen-modal-content').collapse('toggle');
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
