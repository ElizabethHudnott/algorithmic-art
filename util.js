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

class PolarPoint {
	constructor(r, theta) {
		this.r = r;
		this.theta = theta;
	}
}

const HALF_PI = Math.PI / 2;
const TWO_PI = 2 * Math.PI;
