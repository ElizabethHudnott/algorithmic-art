export function parseFraction(text) {
	const numerator = parseFloat(text);
	let denominator = 1;
	const slashPosition = text.indexOf('/');
	if (slashPosition !== -1) {
		denominator = parseFloat(text.slice(slashPosition + 1));
	}
	return numerator / denominator;
}

export function parseLineDash(str) {
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

export function adjustLineDash(lineDash, lineWidth) {
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
