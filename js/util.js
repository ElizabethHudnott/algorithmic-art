'use strict';

for (let preload of document.head.querySelectorAll('link[rel="preload"][as="style"]')) {
	const link = document.createElement('LINK');
	link.rel = 'stylesheet';
	link.href = preload.href;
	document.head.appendChild(link);
}

const rootPath = document.location.origin + document.location.pathname.replace(/\/[^/]*$/, '/');

class AnimationController {

	constructor(properties) {
		for (let property in properties) {
			this[property] = properties[property];
		}
		this.beginTime = undefined;
		this.status = AnimationController.Status.RUNNING;
		this.progress = 0;
		this.timeAccumulated = 0;
	}

	setAbort(reject) {
		const me = this;
		this.abort = function () {
			if (
				me.status === AnimationController.Status.RUNNING ||
				me.status === AnimationController.Status.PAUSED
			) {
				if (me.status === AnimationController.Status.RUNNING) {
					me.timeAccumulated = performance.now() - me.beginTime;
				}
				me.status = AnimationController.Status.ABORTED;
				reject.call(me);
			}
		}
	}

	setContinue(work) {
		const me = this;
		this.continue = function () {
			if (
				me.status === AnimationController.Status.ABORTED ||
				me.status === AnimationController.Status.PAUSED
			) {
				me.status = AnimationController.Status.RUNNING;
				const now = performance.now();
				me.beginTime = now - me.timeAccumulated;
				work(now); // Don't use requestAnimationFrame, for compatibility with CCapture.
			}
		}
	}

	setup(work, reject, beginTime) {
		this.beginTime = beginTime;
		this.setContinue(work);
		this.setAbort(reject);
	}

	finish(resolve) {
		this.status = AnimationController.Status.FINISHED;
		resolve();
	}

	pause() {
		if (this.status ===  AnimationController.Status.RUNNING) {
			if (this.beginTime !== undefined) {
				this.timeAccumulated = performance.now() - this.beginTime;
			}
			this.status =  AnimationController.Status.PAUSED;
		}
	}

}

 AnimationController.Status = Object.freeze({
	FINISHED: 0,
	RUNNING: 1,
	ABORTED: 2,
	PAUSED: 3,
});

const loadedScripts = new Map();

function requireScript(src) {
	const url = (new URL(src, document.location)).toString();
	let promise = loadedScripts.get(url);
	if (promise !== undefined) {
		return promise;
	}

	promise = new Promise(function (resolve, reject) {
		const script = document.createElement('script');
		script.async = true;
		script.src = url;
		script.addEventListener('load', resolve);
		script.addEventListener('error', () => reject('injectScript: Error loading ' + url));
		script.addEventListener('abort', () => reject('injectScript: Aborted loading ' + url));
		document.head.appendChild(script);
	});
	loadedScripts.set(url, promise);
	return promise;
}

let filePath = new URL('.', document.location);

function downloadFile(url, type) {
	const resolvedURL = /^(\w+:)?\//.test(url) ? url : filePath + url;
	return new Promise(function (resolve, reject) {
		const request = new XMLHttpRequest();
		request.open("GET", resolvedURL);
		request.responseType = type;
		request.timeout = 60000;
		request.addEventListener('load', function() {
			if (this.status === 200) {
				resolve(this.response);
			} else {
				reject();
			}
		});
		request.addEventListener('error', reject);
		request.addEventListener('timeout', reject);
		request.send();
	});
}

function darkMode() {
	return false;
	//return matchMedia('(prefers-color-scheme: dark)').matches;
}

function focusFirst() {
	const element = this.querySelector('input:enabled:not(:read-only):not([display=none])');
	if (element.type === 'radio') {
		const selected = queryChecked(this, element.name);
		if (selected === null) {
			element.focus();
		} else {
			selected.focus();
		}
	} else {
		element.focus();
		if (element.select instanceof Function) {
			element.select();
		}
	}
}

function clearComboboxesOnFocus() {
	function clear() {
		this.savedValue = this.value;
		this.value = '';
	}

	function restore() {
		if (this.value === '') {
			this.value = this.savedValue;
		}
	}

	function keyup() {
		this.savedValue = this.value;
	}

	const comboboxes = document.querySelectorAll('input[list]');
	for (let combobox of comboboxes) {
		combobox.addEventListener('keyup', keyup);
		combobox.addEventListener('focus', clear);
		combobox.addEventListener('blur', restore);
	}
}

function queryChecked(ancestor, name) {
	return ancestor.querySelector(`:checked[name="${name}"]`);
}

function checkInput(ancestor, name, value) {
	const input = ancestor.querySelector(`[name="${name}"][value="${value}"]`);
	input.checked = true;
	return input;
}

class RandomNumberGenerator {

	constructor(seed) {
		if (seed === undefined) {
			this.a = Math.floor(Math.random() * 4294967296);
			this.b = Math.floor(Math.random() * 4294967296);
			this.c = Math.floor(Math.random() * 4294967296);
			this.d = Math.floor(Math.random() * 4294967296);
			seed = this.a + '\n' + this.b + '\n' + this.c + '\n' + this.d;
		} else {
			const strings = seed.split('\n', 4);
			this.a = parseInt(strings[0]);
			this.b = parseInt(strings[1]);
			this.c = parseInt(strings[2]);
			this.d = parseInt(strings[3]);
		}
		this.originalA = this.a;
		this.originalB = this.b;
		this.originalC = this.c;
		this.originalD = this.d;
		this.seed = seed;
		this.startGenerator = this;
		this.endGenerator = this;
	}

	next() {
		const t = this.b << 9;
		let r = this.a * 5;
		r = (r << 7 | r >>> 25) * 9;
		this.c ^= this.a;
		this.d ^= this.b;
		this.b ^= this.c;
		this.a ^= this.d;
		this.c ^= t;
		this.d = this.d << 11 | this.d >>> 21;
		return (r >>> 0) / 4294967296;
	}

	reset() {
		this.a = this.originalA;
		this.b = this.originalB;
		this.c = this.originalC;
		this.d = this.originalD;
	}

}

/**
 * Doesn't check for cyclic array object references!
 */
function deepArrayCopy(arr) {
	if (!Array.isArray(arr)) {
		return arr;
	}
	const length = arr.length;
	const result = arr.slice();
	for (let i = 0; i < length; i++) {
		const element = result[i];
		if (Array.isArray(element)) {
			result[i] = deepArrayCopy(element);
		}	// handled above by slice() otherwise
	}
	return result;
}

const ESCAPE_MAP = Object.freeze({
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;'
});

/**	Escapes a string so that any HTML code contained within it is converted into plain
	text.
	@param {(string|undefined)} input The text to make safe.
*/
function escapeHTML(input) {
	if (input !== undefined) {
		return String(input).replace(/[&<>"']/g, function (match) {
			return ESCAPE_MAP[match];
		});
	} else {
		return undefined;
	}
}

/**
 * Doesn't check for cyclic array object references!
 */
function deepEquals(arr1, arr2) {
	if (!Array.isArray(arr1)) {
		return canonicalForm(arr1) === canonicalForm(arr2);
	}
	const length = arr1.length;
	if (!Array.isArray(arr2) || arr2.length !== length) {
		return false;
	}
	for (let i = 0; i < length; i++) {
		const value1 = arr1[i];
		const value2 = arr2[i];
		if (Array.isArray(value1)) {
			if (!deepEquals(value1, value2)) {
				return false;
			}
		} else if (canonicalForm(value1) !== canonicalForm(value2)) {
			return false;
		}
	}
	return true;
}

const colorFuncRE = /^(rgb|hsl)a?\((-?\d+(?:\.\d*)?),\s*(\d+(?:\.\d*)?)%?,\s*(\d+(?:\.\d*)?)%?(?:,\s*(\d+(?:\.\d*)?))?\)$/i
const hexColorRE = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i;

/** Parses color values written rgb, rgba, hsl, hsla and 6 and 8 digit hexadecimal notations.
 *	Red, green and blue values must be given using numbers between 0 and 255 and not as percentages.
 *	Alpha values must be written using hexadecimal notation or as decimal values between 0 and 1 and not as percentages.
 *	Hue values must be stated in degrees without units.
 *	Saturation and lightness values must be written as percentages (as per the CSS specification).
 */
function parseColor(str) {
	let colorSystem, components;
	let match = str.match(colorFuncRE);
	if (match !== null) {
		colorSystem = match[1];
		components = [
			parseFloat(match[2]),
			parseFloat(match[3]),
			parseFloat(match[4]),
			match[5] === undefined ? 1 : parseFloat(match[5])
		];
	} else {
		match = str.match(hexColorRE);
		if (match !== null) {
			colorSystem = 'rgb';
			components = [
				parseInt(match[1], 16),
				parseInt(match[2], 16),
				parseInt(match[3], 16),
				match[4] === undefined ? 1 : parseInt(match[4], 16) / 255
			];
		}
	}
	if (match === null) {
		return [undefined, undefined];
	}
	return [colorSystem, components];
}

function hexToRGBA(color) {
	const r = parseInt(color.slice(1, 3), 16);
	const g = parseInt(color.slice(3, 5), 16);
	const b = parseInt(color.slice(5, 7), 16);
	const alphaStr = color.slice(7,9);
	const a = alphaStr === '' ? 1 : parseInt(alphaStr) / 255;
	return [r, g, b, a];
}

function rgbToHex(r, g, b) {
	return '#' +
		r.toString(16).padStart(2, '0') +
		g.toString(16).padStart(2, '0') +
		b.toString(16).padStart(2, '0');
}

function rgba(r, g, b, a) {
	return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function hsla(hue, saturation, lightness, alpha) {
	const s = saturation * 100;
	const l = lightness * 100;
	return `hsla(${hue}, ${s}%, ${l}%, ${alpha})`;
}

function canonicalForm(value) {
	const type = typeof(value);
	if (type === 'string' && hexColorRE.test(value)) {
		const [r, g, b, a] = hexToRGBA(value);
		return rgba(r, g, b, a);
	} else {
		return value;
	}
}

function rgbToLuma(r, g, b) {
	return (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;
}

/**
 * N.B. Components of the result are in the range 0-1 for use with WebGL.
 */
function hslaToRGBA(h, s, l, alpha) {
	const a = s * Math.min(l, 1 - l);

	function f(n) {
		const k = (n + h / 30) % 12;
		return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
	}

	return [f(0), f(8), f(4), alpha];
}

function srgbToLAB(r, g, b, alpha) {
	// From https://www.w3.org/TR/css-color-4/#color-conversion-code
	// Convert from normal sRGB to its linear version
	const gamma = 2.4;
	r = r <= 0.04045 ? r / 12.92 : ((r + 0.055) / 1.055) ** gamma;
	g = g <= 0.04045 ? g / 12.92 : ((g + 0.055) / 1.055) ** gamma;
	b = b <= 0.04045 ? b / 12.92 : ((b + 0.055) / 1.055) ** gamma;
	// Convert from linear sRGB to CIE XYZ
	const x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
	const y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
	const z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b;

	// Convert from XYZ to LAB
	const epsilon = 216 / 24389;	// 6^3 / 29^3
	const k = 24389 / 27;			// 29^3 / 3^3
	const white = [0.96422, 1.00000, 0.82521]; // D50 reference white

	// Scale relative to reference white
	const xyz = [x / white[0], y / white[1], z / white[2]];

	// now compute f
	const f = xyz.map(value => value > epilson ? Math.cbrt(value) : (k * value + 16) / 116);

	return [
		(116 * f[1]) - 16, 	 // L
		500 * (f[0] - f[1]), // a
		200 * (f[1] - f[2]),  // b
		alpha
	];
}

/**
 * Derives a colour from the first argument but matches the luminosity to the second argument.
 */
function matchLuma(rgba1, rgb2) {
	const luma1 = rgba1[0] * 0.213 + rgba1[1] * 0.715 + rgba1[2] * 0.072;
	const luma2 = rgb2[0] * 0.213 + rgb2[1] * 0.715 + rgb2[2] * 0.072;
	const ratio = luma2 / luma1;
	let r = rgba1[0] * ratio;
	let g = rgba1[1] * ratio;
	let b = rgba1[2] * ratio;
	let white = 0;
	if (r > 255) {
		white = (r - 255) * 0.213;
	}
	if (g > 255) {
		white += (g - 255) * 0.715;
	}
	if (b > 255) {
		white += b * 0.072;
	}
	return [
		Math.min(r + white, 255),
		Math.min(g + white, 255),
		Math.min(b + white, 255),
		rgba1[3]
	];
}

function idToProperty(id, hasPrefix) {
	const words = id.split('-');
	if (hasPrefix) {
		words.splice(0, 1);
	}
	for (let i = 1; i < words.length; i++) {
		const word = words[i];
		words[i] = word[0].toUpperCase() + word.slice(1);
	}
	 return words.join('');
}

function capitalize(words) {
	for (let i = 0; i < words.length; i++) {
		const word = words[i];
		words[i] = word[0].toUpperCase() + word.slice(1);
	}
}

const HALF_PI = Math.PI / 2;
const TWO_PI = 2 * Math.PI;

class BoundingBox {
	constructor(minX, maxX, minY, maxY) {
		this.minX = minX;
		this.maxX = maxX;
		this.minY = minY;
		this.maxY = maxY;
	}

}
