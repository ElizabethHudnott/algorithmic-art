'use strict';

const backgroundGenerators = new Map();
let bgGenerator;
let backgroundRedraw;

const canvas = document.getElementById('background-canvas');
canvas.getContext('2d').save();

function progressiveBackgroundGen(generator, preview) {
	const beginTime = performance.now();
	const context = canvas.getContext('2d');
	const width = canvas.width;
	const height = canvas.height;
	context.restore();
	context.clearRect(0, 0, width, height);
	context.save();
	const redraw = generator.generate(beginTime, context, width, height, preview);
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
	function generateBackground() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		progressiveBackgroundGen(bgGenerator, false);
	}

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
			bgGenerator = gen;
			const prevGenName = bgGeneratorName;
			bgGeneratorName = name;
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
				optionsButton.disabled = false;
			} else {
				const optionsDocPromise = gen.optionsDocument;
				if (optionsDocPromise === undefined) {
					optionsButton.disabled = true;
				} else {
					optionsDocPromise.then(function (optionsDoc) {
						const dom = optionsDoc.body;
						attachOptionsDOM(dom);
						optionsButton.disabled = false;
						backgroundGenOptionsDOM.set(name, dom);
					});
				}
			}
			document.getElementById('btn-generate-background').disabled = !gen.hasRandomness;
		});
	}

	// Select a background generator based on URL.
	const urlParameters = new URLSearchParams(document.location.search);
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

}
