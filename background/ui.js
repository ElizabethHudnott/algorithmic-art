'use strict';

let store, showWelcome;
try {
	store = window.localStorage;
	showWelcome = store.getItem('no-welcome') !== 'true'
} catch (e) {
	showWelcome = true;
}

const backgroundElement = document.body;
const backgroundGenerators = new Map();
let bgGenerator, backgroundRedraw;
let bgGeneratorRotation = 0;

const canvas = document.getElementById('background-canvas');
canvas.getContext('2d').save();

function rotateCanvas(context, width, height, rotation) {
		context.translate(width / 2, height / 2);
		context.rotate(rotation);
		context.translate(-width / 2, -height / 2);
}

function generateBackground() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	progressiveBackgroundGen(bgGenerator, 0);
}

const bgGeneratorImage = new Image();
bgGeneratorImage.onload = generateBackground;

const signatureFont = 'italic 20px "Pacifico", cursive';
let signatureWidth, signatureHeight;
let author = '';

function drawSignature(context, backgroundColor) {
	context.restore();
	context.save();
	context.shadowColor = 'transparent';
	context.font = signatureFont;
	context.textAlign = 'left';
	context.textBaseline = 'bottom';
	const text = 'Elizabeth Hudnott' + (author === '' ? '' : ' & ' + author);
	const metrics = context.measureText(text);
	const scale = context.savedScale || 1;
	const paddingX = Math.ceil(3 / scale);
	const paddingY = Math.ceil(4 / scale);
	signatureWidth = 2 * paddingX + Math.ceil(metrics.actualBoundingBoxRight);
	signatureHeight = paddingY + Math.ceil(metrics.actualBoundingBoxAscent);
	const canvasHeight = context.canvas.height / scale;
	if (backgroundColor === undefined) {
		context.clearRect(0, canvasHeight - signatureHeight, signatureWidth, signatureHeight);
		backgroundColor = backgroundElement.style.backgroundColor;
	} else {
		context.fillStyle = backgroundColor;
		context.fillRect(0, canvasHeight - signatureHeight, signatureWidth, signatureHeight);
	}
	const [colorSystem, colorComponents] = parseColor(backgroundColor);
	const luma = colorSystem === 'rgb' ?  rgbToLuma(...colorComponents) : colorComponents[2] / 100;
	context.fillStyle = luma >= 0.5 ? 'black' : 'white';
	context.fillText(text, paddingX, canvasHeight);
}

function progressiveBackgroundDraw(generator, context, width, height, preview) {
	const redraw = generator.generate(context, width, height, preview);
	backgroundRedraw = redraw;
	let done = false;
	function drawSection() {
		if (backgroundRedraw === redraw) {
			done = redraw.next().done;
			if (done) {
				if (document.fonts.check(signatureFont)) {
					drawSignature(context);
				} else {
					document.fonts.load(signatureFont).then(function () {
						drawSignature(context);
					});
				}
			} else {
				setTimeout(drawSection, 0);
			}
		}
	}
	drawSection();
}

function progressiveBackgroundGen(generator, preview) {
	const context = canvas.getContext('2d');
	const width = canvas.width;
	const height = canvas.height;
	context.restore();
	context.clearRect(0, 0, width, height);
	context.save();
	rotateCanvas(context, width, height, bgGeneratorRotation);
	progressiveBackgroundDraw(generator, context, width, height, preview);
}

function showBackgroundOptions() {
	$('#video-modal').modal('hide');
	$('#error-alert').alert('close');
	$('#background-gen-modal').modal('show');
}

{
	const urlParameters = new URLSearchParams(document.location.search);
	const backgroundGenOptionsDOM = new Map();
	let bgGeneratorName, startFrame, endFrame, animController;
	let fullRotations = 0, loopAnim = false;

	const errorAlert = $('#error-alert');
	const successAlert = $('#success-alert');
	const videoErrorAlert = $('#video-error');

	const authorForm = document.getElementById('author-form');
	const authorInput = document.getElementById('author');

	const modal = document.getElementById('background-gen-modal');
	$(modal).modal({focus: false, show: false});
	const modalHeader = document.getElementById('background-gen-modal-header');
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
			this.pairedStepped = new Map();
			const animatable = generator.animatable
			if (animatable !== undefined) {
				if ('continuous' in animatable) {
					for (let property of animatable.continuous) {
						let value = generator[property];
						if (Array.isArray(value)) {
							value = deepCopy(value);
						}
						this.continuous.set(property, value);
					}
				}
				if ('stepped' in animatable) {
					for (let property of animatable.stepped) {
						let value = generator[property];
						if (Array.isArray(value)) {
							value = deepCopy(value);
						}
						this.stepped.set(property, value);
					}
				}
				if ('pairedContinuous' in animatable) {
					for (let pair of animatable.pairedContinuous) {
						const property1 = pair[0];
						const property2 = pair[1];
						let value1 = generator[property1];
						let value2;
						if (Array.isArray(value1)) {
							value1 = deepCopy(value1);
							value2 = deepCopy(generator[property2])
						} else {
							value2 = generator[property2];
						}
						this.pairedContinuous.set(property1, value1);
						this.pairedContinuous.set(property2, value2);
					}
				}
				if ('pairedStepped' in animatable) {
					for (let pair of animatable.pairedStepped) {
						const property1 = pair[0];
						const property2 = pair[1];
						let value1 = generator[property1];
						let value2;
						if (Array.isArray(value1)) {
							value1 = deepCopy(value1);
							value2 = deepCopy(generator[property2])
						} else {
							value2 = generator[property2];
						}
						this.pairedStepped.set(property1, value1);
						this.pairedStepped.set(property2, value2);
					}
				}
			}
			this.rotation = rotation;
			this.backgroundColor = backgroundElement.style.backgroundColor;
		}

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

	function backgroundGeneratorFactory(name) {
		let generator = backgroundGenerators.get(name);
		if (generator === undefined) {
			return injectScript(name + '.js').then(function () {
				return  backgroundGenerators.get(name);
			});
		} else {
			return new Promise(function (resolve, reject) {
				return resolve(generator);
			})
		}
	}

	const modalWidth = 500
	const modalMargin = 8;
	modal.style.left = Math.max(Math.round(window.innerWidth - modalWidth - modalMargin), 0) + 'px';

	function repositionModal() {
		const grandchild = modal.children[0].children[0];
		const top = Math.max(Math.round((window.innerHeight - grandchild.clientHeight) / 2), 0);
		modal.style.top = top + 'px';
	}

	function switchBackgroundGenerator(name) {
		backgroundGeneratorFactory(name).then(function (gen) {
			document.title = gen.title;
			if (bgGenerator && bgGenerator.purgeCache) {
				bgGenerator.purgeCache();
			}
			bgGenerator = gen;
			const prevGenName = bgGeneratorName;
			bgGeneratorName = name;
			startFrame = new FrameData(bgGenerator, bgGeneratorRotation, backgroundElement);
			endFrame = startFrame;
			if ('tween' in gen) {
				gen.tween = parseFloat(animPositionSlider.value);
				animPositionSlider.disabled = false;
			} else {
				animPositionSlider.disabled = true;
			}
			generateBackground();

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
				repositionModal();
			}

			// Switch out previous DOM
			const container = document.getElementById('background-gen-options');
			const oldDOM = backgroundGenOptionsDOM.get(prevGenName);
			if (oldDOM !== undefined) {
				const elements = container.children;
				while (elements.length > 0) {
					const oldElement = container.removeChild(elements[0]);
					oldDOM.appendChild(oldElement);
				}
			}

			// Try to get from cache first.
			const dom = backgroundGenOptionsDOM.get(name);
			if (dom !== undefined) {
				attachOptionsDOM(dom);
			} else {
				const optionsDocPromise = gen.optionsDocument;
				if (optionsDocPromise !== undefined) {
					optionsDocPromise.then(function (optionsDoc) {
						const dom = optionsDoc.body;
						attachOptionsDOM(dom);
						backgroundGenOptionsDOM.set(name, dom);
					});
				}
			}
			document.getElementById('btn-generate-background').hidden = !gen.hasRandomness;

			const credits = gen.credits ? '<hr>' + gen.credits : '';
			document.getElementById('background-gen-credits').innerHTML = credits;

			urlParameters.set('gen', name);
			let url = document.location;
			url = url.origin + url.pathname + '?' + urlParameters.toString();
			history.replaceState(null, '', url.toString());
		});
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
			if (numStartComponents > numEndComponents && tween < 0.5) {
				for (let i = numEndComponents; i < numStartComponents; i++) {
					output[i] = startValue[i];
				}
			} else if (numEndComponents > numStartComponents && tween >= 0.5) {
				for (let i = numStartComponents; i < numEndComponents; i++) {
					output[i] = endValue[i];
				}
			}
			return output;
		}

		if (loop) {
			if (tween > 0.5) {
				tween = 1 - (tween - 0.5) * 2;
			} else {
				tween = tween * 2;
			}
		}
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
			if (numStartComponents > numEndComponents && tween < 0.5) {
				for (let i = numEndComponents; i < numStartComponents; i++) {
					output[i] = startValue[i];
				}
			} else if (numEndComponents > numStartComponents && tween >= 0.5) {
				for (let i = numStartComponents; i < numEndComponents; i++) {
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
					steps++;
				} else {
					// End value smaller than start value
					steps--;
				}
				return Math.floor(steps * tween + startValue);
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

	function renderFrame(context, width, height, tween, loop, paintBackground, preview) {
		for (let [property, startValue] of startFrame.continuous.entries()) {
			let endValue = endFrame.continuous.get(property);
			bgGenerator[property] = interpolateValue(startValue, endValue, tween, loop);
		}
		for (let [property, startValue] of startFrame.stepped.entries()) {
			let endValue = endFrame.stepped.get(property);
			bgGenerator[property] = interpolateStep(startValue, endValue, tween, loop);
		}
		interpolatePairs('pairedContinuous', false, tween, loop);
		interpolatePairs('pairedStepped', true, tween, loop);
		if ('tween' in bgGenerator) {
			if (loop) {
				if (tween > 0.5) {
					bgGenerator.tween = 1 - (tween - 0.5) * 2;
				} else {
					bgGenerator.tween = tween * 2;
				}
			} else {
				bgGenerator.tween = tween;
			}
		}

		const startRotation = startFrame.rotation;
		const endRotation = endFrame.rotation;
		const loopedRotation = loop && startRotation !== endRotation && (startRotation !== 0 || endRotation !== TWO_PI);
		const rotation = interpolateValue(startRotation, endRotation + TWO_PI * fullRotations, tween, loopedRotation);
		const backgroundColor = interpolateValue(startFrame.backgroundColor, endFrame.backgroundColor, tween, loop);

		context.restore();
		if (paintBackground) {
			context.fillStyle = backgroundColor;
			context.fillRect(0, 0, width, height);
			context.fillStyle = 'black';
		} else {
			backgroundElement.style.backgroundColor = backgroundColor;
			context.clearRect(0, 0, width, height);
		}
		context.save();
		rotateCanvas(context, width, height, rotation);
		if (preview === 0) {
			// Draw everything in one go when animating
			const redraw = bgGenerator.generate(context, width, height, 0);
			backgroundRedraw = redraw;
			let done;
			do {
				done = redraw.next().done;
			} while (!done);
			drawSignature(context, backgroundColor);
		} else {
			progressiveBackgroundDraw(bgGenerator, context, width, height, preview);
		}
	}

	function animate(context, width, height, startTween, length, loop, capturer) {
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
				renderFrame(context, width, height, tween, loop, paintBackground, 0);
				newAnimController.progress = tween;

				if (capturer) {
					capturer.capture(context.canvas);
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

	function captureVideo(context, width, height, startTween, length, properties) {
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
		animController = animate(context, width, height, startTween, length, loopAnim, capturer);
		function reset() {
			stopButton.disabled = true;
			capturer.stop();
			progressRow.hidden = true;
			renderButton.disabled = false;
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
		return `${bgGeneratorName} ${year}-${month}-${day} ${hour}${minute}`;
	}

	// Select a background generator based on URL.
	let firstGenName = urlParameters.get('gen');
	let nextStep;
	if (firstGenName === null) {
		firstGenName = 'ten-print';
		nextStep = function () {
			document.getElementById('btn-generator').click();
		};
	} else {
		nextStep = function () {
			$(modal).modal('show');
		}
	}
	const generatorButtonContainer = document.getElementById('generators');
	try {
		const generatorButton = checkInput(generatorButtonContainer, 'generator', firstGenName);
		const currentSelection = generatorButtonContainer.querySelector('.active');
		if (currentSelection !== null) {
			currentSelection.classList.remove('active');
		}
		generatorButton.parentElement.classList.add('active');
	} catch (e) {
		console.log(`Loaded experimental background generator ${firstGenName}. There is no UI button for activating this generator.`)
	}
	switchBackgroundGenerator(firstGenName);

	if (store !== undefined) {
		document.getElementById('show-welcome').addEventListener('input', function (event) {
			try {
				store.setItem('no-welcome', !this.checked);
			} catch (e) {
				console.log(e);
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
		author = authorInput.value;
		this.hidden = true;
		progressiveBackgroundGen(bgGenerator, 0);
	});

	authorForm.addEventListener('focusout', function (event) {
		if (!this.contains(event.relatedTarget)) {
			authorForm.hidden = true;
			authorInput.value = author;
		}
	});

	// Add events for switching between background generators.
	function generatorSwitcher(event) {
		switchBackgroundGenerator(this.value);
	}

	for (let button of generatorButtonContainer.querySelectorAll('input')) {
		button.addEventListener('click', generatorSwitcher);
	}

	document.getElementById('btn-background-gen-options').addEventListener('click', function (event) {
		$(modal).modal('show');
	});

	document.getElementById('background-rotation').addEventListener('input', function (event) {
		bgGeneratorRotation = TWO_PI * parseFloat(this.value);
		progressiveBackgroundGen(bgGenerator, 0);
	})

	// Changing background colour.
	document.getElementById('paper-color').addEventListener('input', function (event) {
		backgroundElement.style.backgroundColor = this.value;
		drawSignature(canvas.getContext('2d'));
	});

	// Generate new background button.
	document.getElementById('btn-generate-background').addEventListener('click', generateBackground);

	// Animation controls
	document.getElementById('btn-start-frame').addEventListener('click', function (event) {
		startFrame = new FrameData(bgGenerator, bgGeneratorRotation, backgroundElement);
		animPositionSlider.value = 0;
		animPositionSlider.disabled = false;
		updateAnimPositionReadout(0);
		if ('tween' in bgGenerator) {
			bgGenerator.tween = 0;
			progressiveBackgroundGen(bgGenerator, 0);
		}
		showAlert(successAlert, 'Start frame set.', document.body)
		videoErrorAlert.alert('close');
	});

	document.getElementById('btn-end-frame').addEventListener('click', function (event) {
		endFrame = new FrameData(bgGenerator, bgGeneratorRotation, backgroundElement);
		animPositionSlider.value = 1;
		animPositionSlider.disabled = false;
		updateAnimPositionReadout(1);
		if ('tween' in bgGenerator) {
			bgGenerator.tween = 1;
			progressiveBackgroundGen(bgGenerator, 0);
		}
		showAlert(successAlert, 'End frame set.', document.body)
		videoErrorAlert.alert('close');
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

	document.getElementById('btn-play').addEventListener('click', function (event) {
		if (animController && animController.status === 'running') {
			animController.abort();
			return;
		}

		let errorMsg;
		if (startFrame === endFrame && !('tween' in bgGenerator)) {
			errorMsg = 'The start and end frames are the same. Nothing to animate. <button type="button" class="btn btn-primary btn-sm align-baseline" onclick="showBackgroundOptions()">Set up Animation</button>';
		} else {
			const lengthInput = document.getElementById('anim-length');
			const length = parseFloat(lengthInput.value);
			if (length > 0) {
				$(modal).modal('hide');
				this.children[0].src = '../img/control_stop_blue.png';
				this.title = 'Stop animation';
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
				animController = animate(canvas.getContext('2d'), canvas.width, canvas.height, start, length * 1000, loopAnim);
				animController.promise = animController.promise.then(animFinished, animFinished);
				animController.start();
			} else {
				errorMsg = 'Invalid animation duration.';
			}
		}
		if (errorMsg !== undefined) {
			showAlert(errorAlert, errorMsg, document.body);
		}
	});


	 $('#play-btn-group').on('hide.bs.dropdown', function(event) {
	 	const toolbar = document.getElementById('background-gen-toolbar');
		const activeElement = document.activeElement;
		return activeElement.dataset.toggle === 'dropdown' && toolbar.contains(this);
	});

	animPositionSlider.addEventListener('input', function (event) {
		const tween = parseFloat(this.value);
		renderFrame(canvas.getContext('2d'), canvas.width, canvas.height, tween, loopAnim, false, 1);
		updateAnimPositionReadout(tween);
	});

	function syncToPosition() {
		const tween = parseFloat(animPositionSlider.value);
		const startRotation = startFrame.rotation;
		const endRotation = endFrame.rotation;
		const loopedRotation = loopAnim && startRotation !== endRotation && (startRotation !== 0 || endRotation !== TWO_PI);
		bgGeneratorRotation = interpolateValue(startRotation, endRotation + TWO_PI * fullRotations, tween, loopedRotation);
		document.getElementById('background-rotation').value = bgGeneratorRotation / TWO_PI;
	}

	function syncAndDraw() {
		syncToPosition();
		progressiveBackgroundGen(bgGenerator, 0);
	}

	animPositionSlider.addEventListener('pointerup', syncAndDraw);
	animPositionSlider.addEventListener('keyup', syncAndDraw);

	document.getElementById('anim-length').addEventListener('input', function (event) {
		const length = parseFloat(this.value);
		if (length > 0) {
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
			const captureCanvas = document.createElement('canvas');
			captureCanvas.width = videoWidth;
			captureCanvas.height = videoHeight;
			const context = captureCanvas.getContext('2d');
			const scale = videoHeight / screen.height;
			context.scale(scale, scale);
			context.savedScale = scale;
			context.save();
			captureVideo(context, videoWidth / scale, screen.height, startTween, length * 1000, properties);

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

	// After resizing, generate a new background to fit the new window size.
	let resizeTimer;
	function resizeWindow() {
		const rect = modal.getBoundingClientRect();
		const child = modal.children[0];
		const maxRight = window.innerWidth - modalMargin;
		if (rect.right > maxRight) {
			modal.style.left = Math.max(Math.round(maxRight - modalWidth), 0) + 'px';
		}
		const maxBottom = window.innerHeight - document.getElementById('background-gen-toolbar').clientHeight;
		const childHeight = child.clientHeight;
		if (rect.top +  childHeight> maxBottom) {
			modal.style.top = Math.max(Math.round(maxBottom - childHeight), 0) + 'px';
		}
		generateBackground();
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
			modal.children[0].classList.remove('modal-dialog-centered');
			modal.style.left = Math.round(event.clientX - modalDrag[0]) + 'px';
			modal.style.top = Math.round(event.clientY - modalDrag[1]) + 'px';
		}
	});

	$(modal).on('show.bs.modal', function (event) {
		$('#background-gen-modal-content').collapse('show');
	});

	$(modal).on('shown.bs.modal', function (event) {
		const classList = modal.children[0].classList;
		if (classList.contains('modal-dialog-centered')) {
			repositionModal();
			classList.remove('modal-dialog-centered');
		}
	});

	modalHeader.addEventListener('dblclick', function (event) {
		$('#background-gen-modal-content').collapse('toggle');
	});

	if (showWelcome) {
		const helpModal = $('#help-modal');
		helpModal.on('hidden.bs.modal', function (event) {
			if (nextStep !== undefined) {
				nextStep();
				nextStep = undefined;
			}
		});
		helpModal.modal('show');
	} else {
		document.getElementById('show-welcome').checked = false;
		nextStep();
		nextStep = undefined;
	}

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
