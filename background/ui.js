'use strict';

const backgroundGenerators = new Map();
let bgGenerator, backgroundRedraw;
let startFrame, endFrame;

const canvas = document.getElementById('background-canvas');
canvas.getContext('2d').save();

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
	const redraw = generator.generate(context, width, height, preview);
	backgroundRedraw = redraw;
	let done = false;
	function drawSection() {
		if (backgroundRedraw === redraw) {
			done = redraw.next().done;
			if (!done) {
				setTimeout(drawSection, 0);
			} else if (generator.animatable && startFrame === undefined) {
				startFrame = captureFrameData();
				endFrame = startFrame;
			}
		}
	}
	drawSection();
}

function captureFrameData() {
	const frame = new Map();
	for (let property of bgGenerator.animatable) {
		frame.set(property, bgGenerator[property]);
	}
	return frame;
}

function setFrameData(tween) {
	for (let [property, startValue] of startFrame.entries()) {
		const endValue = endFrame.get(property);
		const value = (endValue - startValue) * tween + startValue;
		bgGenerator[property] = value;
	}
	bgGenerator.animate();
}

function renderFrame(context, tween, backgroundColor) {
	setFrameData(tween);
	const canvas = context.canvas;
	const width = canvas.width;
	const height = canvas.height;
	context.restore();
	if (backgroundColor) {
		context.fillStyle = backgroundColor;
		context.fillRect(0, 0, width, height);
		context.fillStyle = 'black';
	} else {
		context.clearRect(0, 0, width, height);
	}
	context.save();
	const redraw = bgGenerator.generate(context, width, height, 0);
	backgroundRedraw = redraw;
	let done;
	do {
		done = redraw.next().done;
	} while (!done);
}

let animController;

function animate(canvas, length, backgroundColor, capturer) {
	const context = canvas.getContext('2d');
	const newAnimController = new AnimationController({});
	const promise = new Promise(function (resolve, reject) {
		function render(time) {
			if (newAnimController.status === 'aborted') {
				return;
			}
			let beginTime = newAnimController.beginTime;
			if (beginTime === undefined) {
				newAnimController.setup(render, reject, time);
				beginTime = time;
			}

			const tween = Math.min((time - beginTime) / length, 1);
			renderFrame(context, tween, backgroundColor);

			if (capturer) {
				capturer.capture(canvas);
			}
			if (tween < 1) {
				requestAnimationFrame(render);
			} else {
				newAnimController.finish(resolve);
			}
		};
		requestAnimationFrame(render);
	});
	newAnimController.promise = promise;
	return newAnimController;
}

function captureVideo(width, height, length, properties) {
	const backgroundColor = document.body.style.backgroundColor || 'white';
	const captureCanvas = document.createElement('canvas');
	captureCanvas.width = width;
	captureCanvas.height = height;
	if (!('format' in properties)) {
		properties.format = 'webm';
	}
	const capturer = new CCapture(properties);
	animController = animate(captureCanvas, length, backgroundColor, capturer);
	animController.promise = animController.promise.then(
		function () {
			capturer.stop();
			capturer.save();
		},
		function () {
			console.log('Video rendering aborted.')
		}
	);
	capturer.start();
}

{
	const urlParameters = new URLSearchParams(document.location.search);
	const backgroundGenOptionsDOM = new Map();
	let bgGeneratorName;

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

	function switchBackgroundGenerator(name) {
		backgroundGeneratorFactory(name).then(function (gen) {
			if (bgGenerator && bgGenerator.purgeCache) {
				bgGenerator.purgeCache();
			}
			bgGenerator = gen;
			const prevGenName = bgGeneratorName;
			bgGeneratorName = name;
			startFrame = undefined;
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

			urlParameters.set('gen', name);
			let url = document.location;
			url = url.origin + url.pathname + '?' + urlParameters.toString();
			history.replaceState(null, '', url.toString());
		});
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

	// Add events for switching between background generators.
	function generatorSwitcher(event) {
		switchBackgroundGenerator(this.value);
	}

	for (let button of generatorButtonContainer.querySelectorAll('input')) {
		button.addEventListener('click', generatorSwitcher);
	}

	// Changing background colour.
	document.getElementById('paper-color').addEventListener('input', function (event) {
		document.body.style.backgroundColor = this.value;
	});

	// Animation controls
	document.getElementById('btn-start-frame').addEventListener('click', function (event) {
		startFrame = captureFrameData();
		document.getElementById('anim-position').value = 0;
	});

	document.getElementById('btn-end-frame').addEventListener('click', function (event) {
		endFrame = captureFrameData();
		document.getElementById('anim-position').value = 1;
	});


	function animFinished() {
		document.getElementById('btn-play').children[0].src = '../img/control_play_blue.png';
		if (animController.status === 'finished') {
			document.getElementById('anim-position').value = 1;
		}
	}

	document.getElementById('btn-play').addEventListener('click', function (event) {
		if (animController && animController.status === 'running') {
			animController.abort();
			return;
		}

		if (startFrame !== endFrame) {
			const length = parseFloat(document.getElementById('anim-length').value);
			if (length > 0) {
				this.children[0].src = '../img/control_stop_blue.png';
				animController = animate(canvas, length * 1000);
				animController.promise = animController.promise.then(animFinished, animFinished);
			}
		}
	});

	document.getElementById('anim-position').addEventListener('input', function (event) {
		const tween = parseFloat(this.value);
		setFrameData(tween);
		progressiveBackgroundGen(bgGenerator, 1);
	});

	// Generate new background button.
	document.getElementById('btn-generate-background').addEventListener('click', generateBackground);

	// Remove initial instructions prompt after a few seconds.
	function removeInstructions() {
		const instructions = document.getElementById('instructions');
		if (instructions !== null) {
			instructions.classList.remove('show');
		}
	}

	document.getElementById('btn-background-gen-options').addEventListener('click', removeInstructions);
	setTimeout(removeInstructions, 10000);

	// After resizing, generate a new background to fit the new window size.
	let resizeTimer;
	window.addEventListener('resize', function (event) {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(generateBackground, 100);
	});

	const modal = document.getElementById('background-gen-modal');
	modal.style.left = Math.max(Math.round(window.innerWidth - 508), 0) + 'px';
	const modalHeader = document.getElementById('background-gen-modal-header');
	let modalDrag;

	modalHeader.addEventListener('mousedown', function (event) {
		modalDrag = [event.offsetX, event.offsetY];
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
		}
	});

}
