'use strict';

const backgroundGenerators = new Map();
let bgGenerator, backgroundRedraw, bgGeneratorRotation = 0;

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

function progressiveBackgroundGen(generator, preview) {
	const context = canvas.getContext('2d');
	const width = canvas.width;
	const height = canvas.height;
	context.restore();
	context.clearRect(0, 0, width, height);
	context.save();
	rotateCanvas(context, width, height, bgGeneratorRotation);
	const redraw = generator.generate(context, width, height, preview);
	backgroundRedraw = redraw;
	let done = false;
	function drawSection() {
		if (backgroundRedraw === redraw) {
			done = redraw.next().done;
			if (!done) {
				setTimeout(drawSection, 0);
			}
		}
	}
	drawSection();
}

{
	const urlParameters = new URLSearchParams(document.location.search);
	const backgroundGenOptionsDOM = new Map();
	let bgGeneratorName;
	let startFrame, endFrame;

	const instructions = $('#instructions-alert');
	const errorAlert = $('#error-alert');
	const successAlert = $('#success-alert');
	const videoErrorAlert = $('#video-error');

	function hideAlert(jquery) {
		jquery.alert('close');
	}

	function showAlert(jquery, message, parent) {
		const elem = jquery.get(0);
		elem.children[0].innerHTML = message;
		elem.classList.add('show');
		parent.append(elem);
		clearTimeout(elem.timeout);
		elem.timeout = setTimeout(hideAlert, 5000, jquery);
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

	function captureFrameData(backgroundElement) {
		const frame = new Map();
		for (let property of bgGenerator.animatable) {
			let value = bgGenerator[property];
			if (Array.isArray(value)) {
				value = value.slice();
			}
			frame.set(property, value);
		}
		frame.set('backgroundColor', backgroundElement.style.backgroundColor);
		return frame;
	}

	function switchBackgroundGenerator(name) {
		backgroundGeneratorFactory(name).then(function (gen) {
			if (bgGenerator && bgGenerator.purgeCache) {
				bgGenerator.purgeCache();
			}
			bgGenerator = gen;
			const prevGenName = bgGeneratorName;
			bgGeneratorName = name;
			if (gen.animatable) {
				startFrame = captureFrameData(document.body);
				endFrame = startFrame;
				document.getElementById('anim-position').disabled = true;
			}
			generateBackground();

			const optionsButton = document.getElementById('btn-background-gen-options');
			document.getElementById('background-gen-modal-label').innerHTML = gen.title + ' Options';

			function attachOptionsDOM(dom) {
				const container = document.getElementById('background-gen-options');
				const elements = dom.children;
				while (elements.length > 0) {
					container.appendChild(elements[0]);
				}
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
				optionsButton.classList.remove('d-none');
			} else {
				const optionsDocPromise = gen.optionsDocument;
				if (optionsDocPromise === undefined) {
					optionsButton.classList.toggle('d-none', !gen.hasCustomImage);
				} else {
					optionsDocPromise.then(function (optionsDoc) {
						const dom = optionsDoc.body;
						attachOptionsDOM(dom);
						optionsButton.classList.remove('d-none');
						backgroundGenOptionsDOM.set(name, dom);
					});
				}
			}
			document.getElementById('background-gen-image-controls').classList.toggle('d-none', !gen.hasCustomImage);
			document.getElementById('anim-btns').classList.toggle('d-none', gen.animatable === undefined);
			document.getElementById('btn-generate-background').classList.toggle('d-none', !gen.hasRandomness);

			const credits = gen.credits ? '<hr>' + gen.credits : '';
			document.getElementById('background-gen-credits').innerHTML = credits;

			urlParameters.set('gen', name);
			let url = document.location;
			url = url.origin + url.pathname + '?' + urlParameters.toString();
			history.replaceState(null, '', url.toString());
		});
	}

	const colorFuncRE = /^(rgb|hsl)a?\((-?\d+(?:\.\d*)?),\s*(\d+(?:\.\d*)?)%?,\s*(\d+(?:\.\d*)?)%?(?:,\s*(\d+(?:\.\d*)?))?/i
	const hexColorRE = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?/;

	function interpolateValue(startValue, endValue, tween) {
		const type = typeof(startValue);
		if (type === 'number') {
			return (endValue - startValue) * tween + startValue;
		} else if (type === 'string') {
			let colorSys, startComponents, endComponents;
			let match = startValue.match(colorFuncRE);
			if (match !== null) {
				colorSys = match[1];
				startComponents = match.slice(2, 6);
			} else {
				match = startValue.match(hexColorRE);
				if (match !== null) {
					colorSys = 'rgb';
					startComponents = match.slice(1, 5);
				}
			}
			if (match !== null) {
				if (startComponents[3] === undefined) {
					startComponents[3] = '1';
				}
				match = endValue.match(colorFuncRE);
				if (match !== null) {
					endComponents = match.slice(2, 6);
				} else {
					match = endValue.match(hexColorRE);
					if (match !== null) {
						endComponents = match.slice(1, 5);
					}
				}
				if (endComponents[3] === undefined) {
					endComponents[3] = '1';
				}
				const tweened = new Array(4);
				for (let i = 0; i < 4; i++) {
					const componentStart = parseFloat(startComponents[i]);
					const componentEnd = parseFloat(endComponents[i]);
					tweened[i] = (componentEnd - componentStart) * tween + componentStart;
				}
				if (colorSys === 'rgb') {
					return 'rgba(' + tweened.join(',') + ')';
				} else {
					return hsla(...tweened);
				}
			}
		} else if (Array.isArray(startValue)) {
			const numComponents = startValue.length;
			const output = new Array(numComponents);
			for (let i = 0; i < numComponents; i++) {
				output[i] = interpolateValue(startValue[i], endValue[i], tween);
			}
			return output;
		}
	}

	function setFrameData(tween) {
		let backgroundColor, rotation = 0;
		for (let [property, startValue] of startFrame.entries()) {
			const endValue = endFrame.get(property);
			const value = interpolateValue(startValue, endValue, tween);
			switch (property) {
			case 'backgroundColor':
				backgroundColor = value;
				break;
			case 'frameRotation':
				rotation = value;
				break;
			default:
				bgGenerator[property] = value;
			}
		}
		bgGenerator.animate();
		return [backgroundColor, rotation];
	}

	function renderFrame(backgroundElement, context, tween) {
		const [backgroundColor, rotation] = setFrameData(tween);
		const canvas = context.canvas;
		const width = canvas.width;
		const height = canvas.height;
		context.restore();
		if (backgroundElement) {
			backgroundElement.style.backgroundColor = backgroundColor;
			context.clearRect(0, 0, width, height);
		} else {
			context.fillStyle = backgroundColor;
			context.fillRect(0, 0, width, height);
			context.fillStyle = 'black';
		}
		context.save();
		rotateCanvas(context,width, height, rotation);
		const redraw = bgGenerator.generate(context, width, height, 0);
		backgroundRedraw = redraw;
		let done;
		do {
			done = redraw.next().done;
		} while (!done);
	}

	const progressBar = document.getElementById('video-progress');
	let animController;

	function animate(obj, canvas, length) {
		let capturer, backgroundElement;
		if (obj instanceof Element) {
			backgroundElement = obj;
		} else {
			capturer = obj;
		}
		const context = canvas.getContext('2d');
		const newAnimController = new AnimationController({});
		const promise = new Promise(function (resolve, reject) {
			function render() {
				const time = performance.now();
				let beginTime = newAnimController.beginTime;
				if (beginTime === undefined) {
					newAnimController.setup(render, reject, time);
					beginTime = time;
				}

				const tween = Math.min((time - beginTime) / length, 1);
				newAnimController.progress = tween;
				if (newAnimController.status === 'aborted') {
					return;
				}
				renderFrame(backgroundElement, context, tween);

				if (capturer) {
					capturer.capture(canvas);
					let percent = tween * 100;
					progressBar.style.width = percent + '%';
					percent = Math.trunc(percent);
					progressBar.innerHTML = percent + '%';
					progressBar.setAttribute('aria-valuenow', percent)
				}
				if (tween < 1) {
					requestAnimationFrame(render);
				} else {
					newAnimController.finish(resolve);
				}
			};
			newAnimController.start = render;
		});
		newAnimController.promise = promise;
		return newAnimController;
	}

	function captureVideo(width, height, length, properties) {
		progressBar.style.width = '0';
		progressBar.innerHTML = '0%';
		progressBar.setAttribute('aria-valuenow', '0');
		const progressRow = document.getElementById('video-progress-row');
		progressRow.classList.remove('d-none');

		const stopButton = document.getElementById('btn-stop-video-render');
		const renderButton = document.getElementById('btn-render-video');
		renderButton.disabled = true;
		stopButton.disabled = false;

		const captureCanvas = document.createElement('canvas');
		captureCanvas.width = width;
		captureCanvas.height = height;

		const capturer = new CCapture(properties);
		animController = animate(capturer, captureCanvas, length);
		function reset() {
			stopButton.disabled = true;
			capturer.stop();
			progressRow.classList.add('d-none');
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

	// Select a background generator based on URL.
	const firstGenName = urlParameters.get('gen') || 'ten-print';
	const generatorButtonContainer = document.getElementById('generators');
	try {
		const generatorButton = checkInput(generatorButtonContainer, 'generator', firstGenName);
		const currentSelection = generatorButtonContainer.querySelector('.active');
		if (currentSelection !== null) {
			currentSelection.classList.remove('active');
		}
		generatorButton.parentNode.classList.add('active');
	} catch (e) {
		console.log(`Loaded experimental background generator ${firstGenName}. There is no UI button for activating this generator.`)
	}
	switchBackgroundGenerator(firstGenName);

	const modal = document.getElementById('background-gen-modal');

	// Add events for switching between background generators.
	function generatorSwitcher(event) {
		switchBackgroundGenerator(this.value);
	}

	for (let button of generatorButtonContainer.querySelectorAll('input')) {
		button.addEventListener('click', generatorSwitcher);
	}

	document.getElementById('background-rotation').addEventListener('input', function (event) {
		bgGeneratorRotation = 2 * Math.PI * parseFloat(this.value);
		progressiveBackgroundGen(bgGenerator, 0);
	})

	// Changing background colour.
	document.getElementById('paper-color').addEventListener('input', function (event) {
		document.body.style.backgroundColor = this.value;
	});

	// Animation controls
	document.getElementById('btn-start-frame').addEventListener('click', function (event) {
		startFrame = captureFrameData(document.body);
		startFrame.set('frameRotation', bgGeneratorRotation);
		const positionSlider = document.getElementById('anim-position')
		positionSlider.value = 0;
		positionSlider.disabled = false;
		showAlert(successAlert, 'Start frame set.', document.body)
		videoErrorAlert.alert('close');
	});

	document.getElementById('btn-end-frame').addEventListener('click', function (event) {
		endFrame = captureFrameData(document.body);
		endFrame.set('frameRotation', bgGeneratorRotation);
		const positionSlider = document.getElementById('anim-position')
		positionSlider.value = 1;
		positionSlider.disabled = false;
		showAlert(successAlert, 'End frame set.', document.body)
		videoErrorAlert.alert('close');
	});

	function animFinished() {
		document.getElementById('btn-play').children[0].src = '../img/control_play_blue.png';
		document.getElementById('anim-position').value = animController.progress;
	}

	document.getElementById('btn-play').addEventListener('click', function (event) {
		if (animController && animController.status === 'running') {
			animController.abort();
			return;
		}

		let errorMsg;
		if (startFrame === endFrame) {
			errorMsg = 'The start and end frames are the same. Nothing to animate.';
		} else {
			const length = parseFloat(document.getElementById('anim-length').value);
			if (length > 0) {
				this.children[0].src = '../img/control_stop_blue.png';
				animController = animate(document.body, canvas, length * 1000);
				animController.promise = animController.promise.then(animFinished, animFinished);
				animController.start();
			} else {
				errorMsg = 'Invalid animation duration.'
			}
		}
		if (errorMsg === undefined) {
			errorAlert.alert('close');
		} else {
			showAlert(errorAlert, errorMsg, document.body);
		}
	});

	document.getElementById('anim-position').addEventListener('input', function (event) {
		const tween = parseFloat(this.value);
		setFrameData(tween);
		progressiveBackgroundGen(bgGenerator, 1);
	});

	document.getElementById('anim-length').addEventListener('input', function (event) {
		const length = parseFloat(this.value);
		if (length > 0) {
			videoErrorAlert.alert('close');
		}
	});

	function hideConfig() {
		$('#background-gen-modal').modal('hide');
	}

	$('#anim-opts-modal').on('show.bs.modal', hideConfig);
	$('#video-modal').on('show.bs.modal', hideConfig);

	document.getElementById('btn-render-video').addEventListener('click', function (event) {
		let errorMsg, length, framerate, format;
		if (startFrame === endFrame) {
			errorMsg = 'The start and end frames are the same. Nothing to render.';
		}
		if (errorMsg === undefined) {
			length = parseFloat(document.getElementById('anim-length').value);
			if (!(length > 0)) {
				errorMsg = 'Invalid video duration.'
			}
		}
		if (errorMsg === undefined) {
			framerate = parseInt(document.getElementById('video-framerate').value);
			if (!(framerate > 0)) {
				errorMsg = 'Invalid frame rate.'
			}
		}

		if (errorMsg === undefined) {
			const properties = {
				framerate: framerate,
				format: document.getElementById('video-format').value,
				workersPath: '../lib/'
			};
			captureVideo(canvas.width, canvas.width, length * 1000, properties);
		} else {
			const element = videoErrorAlert.get(0);
			element.innerHTML = errorMsg;
			element.classList.add('show');
			document.getElementById('video-modal-body').append(element);
		}
	});

	document.getElementById('btn-stop-video-render').addEventListener('click', function (event) {
		animController.abort();
	});

	// Generate new background button.
	document.getElementById('btn-generate-background').addEventListener('click', generateBackground);

	function removeInstructions() {
		instructions.alert('close');
	}

	document.querySelectorAll('#background-gen-toolbar button').forEach(function (item) {
		item.addEventListener('click', removeInstructions);
	})

	setTimeout(removeInstructions, 10000);

	// After resizing, generate a new background to fit the new window size.
	let resizeTimer;
	window.addEventListener('resize', function (event) {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(generateBackground, 100);
	});

	modal.style.left = Math.max(Math.round(window.innerWidth - 508), 0) + 'px';
	const modalHeader = document.getElementById('background-gen-modal-header');
	let modalDrag;

	modalHeader.addEventListener('mousedown', function (event) {
		const target = event.target;
		if (target === this || target.tagName === 'H5') {
			modalDrag = [event.offsetX, event.offsetY];
		}
	});

	modalHeader.addEventListener('mouseup', function (event) {
		modalDrag = undefined;
	});

	window.addEventListener('mousemove', function (event) {
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
		const child = modal.children[0];
		const classList = child.classList;
		if (classList.contains('modal-dialog-centered')) {
			modal.style.left = modal.offsetLeft + 'px';
			modal.style.top = Math.round((window.innerHeight - child.children[0].clientHeight) / 2) + 'px';
			classList.remove('modal-dialog-centered');
		}
	});

	modalHeader.addEventListener('dblclick', function (event) {
		$('#background-gen-modal-content').collapse('toggle');
	});

	document.getElementById('background-gen-image').addEventListener('input', function (event) {
		const file = this.files[0];
		if (file) {
			if (bgGeneratorImage.src) {
				URL.revokeObjectURL(bgGeneratorImage.src);
			}
			bgGeneratorImage.src = URL.createObjectURL(file);
			document.getElementById('background-gen-image-label').innerText = file.name;
		}
	});

	clearComboboxesOnFocus();

}
