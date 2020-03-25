'use strict';

const backgroundGenerators = new Map();
let bgGenerator;
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
function generateBackground() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	progressiveBackgroundGen(bgGenerator, false);
}

function progressiveBackgroundGen(generator, preview) {
	const beginTime = performance.now();
	const context = canvas.getContext('2d');
	context.clearRect(0, 0, canvas.width, canvas.height);
	const redraw = generator.generate(beginTime, canvas, context, preview);
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
		generateBackground();
		const optionsDocPromise = gen.optionsDocument;
		if (optionsDocPromise === undefined) {
			document.getElementById('btn-background-gen-options').disabled = true;
		} else {
			document.getElementById('background-gen-modal-label').innerHTML = gen.title + ' Options';
			optionsDocPromise.then(function (optionsDoc) {
				const container = document.getElementById('background-gen-options');
				container.innerHTML = '';
				const elements = optionsDoc.body.children;
				while (elements.length > 0) {
					container.appendChild(elements[0]);
				}
				document.getElementById('btn-background-gen-options').disabled = false;
			});
		}
	});
}

const urlParameters = new URLSearchParams(document.location.search);
{
	let firstGenName = urlParameters.get('gen') || 'ten-print';
	switchBackgroundGenerator(firstGenName);
}

document.getElementById('paper-color').addEventListener('input', function (event) {
	document.body.style.backgroundColor = this.value;
});

document.getElementById('btn-generate-background').addEventListener('click', generateBackground);

setTimeout(function () {
	document.getElementById('instructions').classList.remove('show');
}, 10000);
