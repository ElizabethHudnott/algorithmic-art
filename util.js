'use strict';

class AnimationController {
	constructor(properties) {
		for (let property in properties) {
			this[property] = properties[property];
		}
		this.beginTime = undefined;
		this.status = 'running';
		this.progress = 0;
	}

	setAbort(reject) {
		const me = this;
		this.abort = function () {
			if (me.status === 'running') {
				me.status = 'aborted';
				reject.call(me);
			}
		}
	}

	setContinue(work) {
		const me = this;
		this.continue = function () {
			if (me.status === 'running') {
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
		this.status = 'finished';
		resolve();
	}

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
			if (!arrayDeepEquals(value1, value2)) {
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
	const a = alphaStr === '' ? 255 : 0;
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
