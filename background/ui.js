'use strict';

const backgroundGenerators = new Map();
const backgroundGenOptionsDOM = new Map();
let bgGenerator, bgGeneratorName;
let backgroundRedraw;

function injectScript(src) {
	return new Promise(function (resolve, reject) {
		const script = document.createElement('script');
		script.async = true;
		script.src = src;
		script.addEventListener('load', resolve);
		script.addEventListener('error', () => reject('injectScript: Error loading ' + src));
		script.addEventListener('abort', () => reject('injectScript: Aborted loading ' + src));
		document.head.appendChild(script);
	});
}

function downloadDocument(url) {
	return new Promise(function (resolve, reject) {
		const request = new XMLHttpRequest();
		request.onload = function() {
			resolve(this.responseXML);
		}
		request.open("GET", url);
		request.responseType = "document";
		request.send();
	});
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


const canvas = document.getElementById('background-canvas');
canvas.getContext('2d').save();
function generateBackground() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	progressiveBackgroundGen(bgGenerator, false);
}

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
			const oldDOM = backgroundGenOptionsDOM.get(prevGenName);
			let elements = container.children;
			while (elements.length > 0) {
				const oldElement = container.removeChild(elements[0]);
				oldDOM.appendChild(oldElement);
			}
			elements = dom.children;
			while (elements.length > 0) {
				container.appendChild(elements[0]);
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

const urlParameters = new URLSearchParams(document.location.search);
{
	const generatorButtonContainer = document.getElementById('generators');
	function generatorSwitcher(event) {
		switchBackgroundGenerator(this.value);
	}

	for (let button of generatorButtonContainer.querySelectorAll('input')) {
		button.addEventListener('click', generatorSwitcher);
	}

	const firstGenName = urlParameters.get('gen') || 'ten-print';
	try {
		const generatorButton = checkInput(generatorButtonContainer, 'generator', firstGenName);
		generatorButton.parentNode.classList.add('active');
	} catch (e) {
		console.log(`Loaded experimental background generator ${firstGenName}. There is no UI button for activating this generator.`)
	}
	switchBackgroundGenerator(firstGenName);
}

document.getElementById('paper-color').addEventListener('input', function (event) {
	document.body.style.backgroundColor = this.value;
});

document.getElementById('btn-generate-background').addEventListener('click', generateBackground);

setTimeout(function () {
	document.getElementById('instructions').classList.remove('show');
}, 10000);
