'use strict';

class AnimationController {
	static Status = Object.freeze({
		RUNNING: 1,
		FINISHED: 0,
		ABORTED: -1,
	});

	constructor(properties) {
		for (let property in properties) {
			this[property] = properties[property];
		}
		this.beginTime = undefined;
		this.status = AnimationController.Status.RUNNING;
		this.progress = 0;
	}

	setAbort(reject) {
		const me = this;
		this.abort = function () {
			if (me.status === AnimationController.Status.RUNNING) {
				me.status = AnimationController.Status.ABORTED;
				reject.call(me);
			}
		}
	}

	setContinue(work) {
		const me = this;
		this.continue = function () {
			if (me.status === AnimationController.Status.RUNNING) {
				requestAnimationFrame(work);
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

}

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

function downloadFile(url, type) {
	return new Promise(function (resolve, reject) {
		const request = new XMLHttpRequest();
		request.open("GET", url);
		request.responseType = type;
		request.timeout = 60000;
		request.addEventListener('load', function() {
			resolve(this.response);
		});
		request.addEventListener('error', reject);
		request.addEventListener('timeout', reject);
		request.send();
	});
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

	const comboboxes = document.querySelectorAll('input[list]');
	for (let combobox of comboboxes) {
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
			this.a = Math.floor(Math.random() * 4294967295);
			this.b = Math.floor(Math.random() * 4294967295);
			this.c = Math.floor(Math.random() * 4294967295);
			this.d = Math.floor(Math.random() * 4294967295);
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

function hslaToRGBA(h, s, l, alpha) {
	const a = s * Math.min(l, 1 - l);

	function f(n) {
		const k = (n + h / 30) % 12;
		return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
	}

	return [f(0), f(8), f(4), alpha];
}

function srgbToLAB(r, g, b, alpha) {
	// First convert from sRGB to CIE XYZ
	const gamma = 2.4;
	r = r <= 0.04045 ? r / 12.92 : ((r + 0.055) / 1.055) ** gamma;
	g = g <= 0.04045 ? g / 12.92 : ((g + 0.055) / 1.055) ** gamma;
	b = b <= 0.04045 ? b / 12.92 : ((b + 0.055) / 1.055) ** gamma;
	const x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
	const y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
	const z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b;

	// Now convert from XYZ to LAB
	// These three values assume a D50 standard illuminant (approx 5000k color temperature)
	const xn = 96.4212;
	const yn = 100;
	const zn = 82.5188;

	const delta = 6 / 29;
	const threeDeltaSquared = 108 / 841;
	const deltaCubed = 216 / 24389;

	function f(t) {
		if (t > deltaCubed) {
			return t ** (1/3);
		} else {
			return t / threeDeltaSquared + 4 / 29;
		}
	}

	const fy = f(y / yn);
	const l = 116 * fy - 16;
	const a = 500 * (f(x / xn) - fy);
	b = 200 * (fy - f(z / zn));

	return [l, a ,b, alpha];
}

function parseFraction(text) {
	const numerator = parseFloat(text);
	let denominator = 1;
	const slashPosition = text.indexOf('/');
	if (slashPosition !== -1) {
		denominator = parseFloat(text.slice(slashPosition + 1));
	}
	return numerator / denominator;
}

function parseLineDash(str) {
	const lengthStrs = str.split(',');
	let numValues = lengthStrs.length;
	let lineDash = new Array(numValues);
	for (let i = 0; i < numValues; i++) {
		lineDash[i] = parseInt(lengthStrs[i]);
	}
	if (numValues === 1) {
		if (lineDash[0] === 1) {
			lineDash = [1, 0];
		} else {
			lineDash[1] = lineDash[0];
		}
	} else if (numValues % 2 === 1) {
		for (let i = numValues - 2; i > 0; i--) {
			lineDash.push(lineDash[i]);
		}
	}
	return lineDash;
}

function adjustLineDash(lineDash, lineWidth) {
	const numValues = lineDash.length;
	for (let i = 0; i < numValues; i += 2) {
		lineDash[i] -= lineWidth;
		if (lineDash[i] < 1) {
			lineDash[i] = 1;
		}
	}
	for (let i = 1; i < numValues; i += 2) {
		if (lineDash[i] > 0) {
			lineDash[i] += lineWidth;
		}
	}
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
