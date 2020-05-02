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
	return ancestor.querySelector(`:checked[name=${name}]`);
}

function checkInput(ancestor, name, value) {
	const input = ancestor.querySelector(`[name=${name}][value=${value}]`);
	input.checked = true;
	return input;
}

function deepCopy(arr) {
	const length = arr.length;
	const result = arr.slice();
	for (let i = 0; i < length; i++) {
		const element = result[i];
		if (Array.isArray(element)) {
			result[i] = deepCopy(element);
		}
	}
	return result;
}

const colorFuncRE = /^(rgb|hsl)a?\((-?\d+(?:\.\d*)?),\s*(\d+(?:\.\d*)?)%?,\s*(\d+(?:\.\d*)?)%?(?:,\s*(\d+(?:\.\d*)?))?/i
const hexColorRE = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?/;

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

function hexToRGB(color) {
	const r = parseInt(color.slice(1, 3), 16);
	const g = parseInt(color.slice(3, 5), 16);
	const b = parseInt(color.slice(5, 7), 16);
	return [r, g, b];
}

function rgba(r, g, b, a) {
	return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function hsla(hue, saturation, lightness, alpha) {
	const s = saturation * 100;
	const l = lightness * 100;
	return `hsla(${hue}, ${s}%, ${l}%, ${alpha})`;
}

function rgbToLuma(r, g, b) {
	return (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;
}

function parseFraction(text) {
	const numerator = parseFloat(text);
	let denominator = 1;
	const slashPosition = text.indexOf('/');
	if (slashPosition !== -1) {
		denominator = parseInt(text.slice(slashPosition + 1));
	}
	return numerator / denominator;
}

const HALF_PI = Math.PI / 2;
const TWO_PI = 2 * Math.PI;
