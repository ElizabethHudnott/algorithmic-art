'use strict';

class AnimationController {
	constructor(properties) {
		for (let property in properties) {
			this[property] = properties[property];
		}
		this.beginTime = undefined;
		this.status = 'running';
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

function queryChecked(ancestor, name) {
	return ancestor.querySelector(`:checked[name=${name}]`);
}

function checkInput(ancestor, name, value) {
	const input = ancestor.querySelector(`[name=${name}][value=${value}]`);
	input.checked = true;
	return input;
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
