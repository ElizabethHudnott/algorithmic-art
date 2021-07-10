export default function RandomWalk() {
	const me = this;
	this.title = 'Random Walk';
	hasRandomness(true);

	this.rows = 26;
	this.stretch = 1;
	this.borderX = 0.5;
	this.borderY = 0.5;
}

const Direction = Object.freeze({
	UP: 0,
	DOWN: 1,
	LEFT: 2,
	RIGHT: 3,
});

RandomWalk.prototype.generate = function* (context, canvasWidth, canvasHeight, preview) {
	const numRows = this.rows;
	const numColumns = Math.round((screen.width / screen.height) * (canvasWidth / screen.width) * (numRows - 1) / this.stretch) + 1;
	const explored = new Array(numColumns);
	for (let i = 0; i < numColumns; i++) {
		const column = new Array(numRows);
		explored[i] = column;
		for (let j = 0; j < numRows; j++) {
			column[j] = [false, false, false, false];
		}
		column[0][Direction.UP] = true;
		column[numRows - 1][Direction.DOWN] = true;
	}
	for (let j = 0; j < numRows; j++) {
		explored[0][j][Direction.LEFT] = true;
		explored[numColumns - 1][j][Direction.RIGHT] = true;
	}

	const path = condensePath(walk(explored));

	const cellWidth = canvasWidth / (numColumns - 1 + 2 * this.borderX);
	const cellHeight = canvasHeight / (numRows - 1 + 2 * this.borderY);
	context.translate(Math.round(this.borderX * cellWidth), Math.round(this.borderY * cellHeight));
	const [startColumn, startRow] = path[0];
	let startX = Math.round(startColumn * cellWidth);
	let startY = Math.round(startRow * cellHeight);

	context.beginPath();
	context.moveTo(startX, startY);
	const numCurves = Math.trunc((path.length - 1) / 3);
	for (let i = 0; i < numCurves; i++) {
		const [cellX1, cellY1] = path[i * 3 + 1];
		const x1 = cellX1 * cellWidth;
		const y1 = cellY1 * cellHeight;

		const [cellX2, cellY2] = path[i * 3 + 2];
		const x2 = cellX2 * cellWidth;
		const y2 = cellY2 * cellHeight;

		const [cellX3, cellY3] = path[i * 3 + 3];
		const x3 = Math.round(cellX3 * cellWidth);
		const y3 = Math.round(cellY3 * cellHeight);
		context.bezierCurveTo(x1, y1, x2, y2, x3, y3);
	}
	context.fillStyle = '#88f';
	context.fill();

	context.beginPath();
	context.moveTo(startX, startY);
	for (let i = 1; i < path.length; i++) {
		const [cellX, cellY] = path[i];
		const x = Math.round(cellX * cellWidth);
		const y = Math.round(cellY * cellHeight);
		context.lineTo(x, y);
	}
	context.strokeStyle = '#000a';
	context.lineWidth = 2;
	context.stroke();
}

function condensePath(path) {
	let [x1, y1] = path[0];
	let [x2, y2] = path[1];
	let dx = x2 - x1;
	let dy = y2 - y1;
	const newPath = [path[0], path[1]];
	let index = 1;
	for (let i = 2; i < path.length; i++) {
		x1 = x2;
		y1 = y2;
		[x2, y2] = path[i];
		let newDx = x2 - x1;
		let newDy = y2 - y1;
		if (newDx !== dx || newDy !== dy) {
			index++;
		}
		newPath[index] = path[i];
		dx = newDx;
		dy = newDy;
	}
	return newPath;
}

function addToPath(explored, path, column, row) {
	path.push([column, row]);
	if (column > 0) {
		explored[column - 1][row][Direction.RIGHT] = true;
	}
	if (column < explored.length - 1) {
		explored[column + 1][row][Direction.LEFT] = true;
	}
	if (row > 0) {
		explored[column][row - 1][Direction.DOWN] = true;
	}
	if (row < explored[0].length - 1) {
		explored[column][row + 1][Direction.UP] = true;
	}
}

function shiftLeft(explored, path) {

}

function shiftUp(explored, path) {

}

function shiftDown(explored, path) {

}

function walk(explored) {
	const numColumns = explored.length;
	const numRows = explored[0].length;
	const maxLength = numColumns * numRows;

	let backtracks = 0;
	const path = [];
	const startColumn = Math.trunc(numColumns / 2); //numColumns - 1;
	const startRow = Math.trunc(numRows / 2);
	let column = startColumn, row = startRow;
	let minCol = startColumn, minRow = startRow, maxRow = startRow;
	addToPath(explored, path, column, row);
	let preferredPath = path, preferedPathClosed = false;

	while (true) {

		const possibleDirs = [];
		const exploredDirs = explored[column][row];
		const canGoUp = !exploredDirs[Direction.UP];
		const canGoDown = !exploredDirs[Direction.DOWN];
		const canGoLeft = !exploredDirs[Direction.LEFT];
		const canGoRight = !exploredDirs[Direction.RIGHT];

		// 0 = line going left, 1 = line going right
		const xParity = Math.abs(row - startRow) % 2;
		// 0 = line going up, 1 = line going down
		const yParity = column % 2;

		if (xParity === 0 && canGoLeft) {
			possibleDirs.push(Direction.LEFT);
		} else if (xParity === 1 && canGoRight) {
			possibleDirs.push(Direction.RIGHT);
		}
		if (yParity === 0 && canGoUp) {
			possibleDirs.push(Direction.UP);
		} else if (yParity === 1 && canGoDown) {
			possibleDirs.push(Direction.DOWN);
		}

		let numOptions = possibleDirs.length;
		if (numOptions > 1 && column > startColumn) {
			let index;
			const rowDist = row - startRow;
			if (rowDist === 0 && canGoLeft) {
				index = possibleDirs.indexOf(Direction.LEFT);
			} else if (rowDist === -1 && canGoDown) {
				index = possibleDirs.indexOf(Direction.DOWN);
			} else if (rowDist === 1 && canGoUp) {
				index = possibleDirs.indexOf(Direction.UP);
			}

			if (index !== undefined) {
				possibleDirs.splice(index, 1);
				numOptions--;
			}

			// Weigh probabilities
			if (rowDist === -1 && yParity === 0 && canGoUp) {
				possibleDirs.push(Direction.UP, Direction.UP);
			} else if (rowDist === 1 && yParity === 1 && canGoDown) {
				possibleDirs.push(Direction.DOWN, Direction.DOWN);
			}

		} else if (numOptions === 0) {
			for (let i = 0; i < 4; i++) {
				if (!exploredDirs[i]) {
					possibleDirs.push(i);
				}
			}
			numOptions = possibleDirs.length;
		}

		if (numOptions === 0) {
			if (
				(column === startColumn) && (row === startRow - 1 || row === startRow + 1) ||
				(row === startRow && (column === startColumn - 1 || column === startColumn + 1))
			) {
				// Form a loop
				if (!preferedPathClosed || preferredPath.length < path.length + 1) {
					preferredPath = path.slice();
					preferredPath.push([startColumn, startRow]);
					preferedPathClosed = true;
				}
			}
			if (path.length === maxLength || backtracks === 300000) {
				// explored everywhere (or out of time) so stop
				return preferredPath;
			}

			// Backtrack
			if (preferredPath === path) {
				preferredPath = path.slice();
			}
			// Allow neighbouring cells to explore this cell
			if (column > 0) {
				explored[column - 1][row][Direction.RIGHT] = false;
			}
			if (column < explored.length - 1) {
				explored[column + 1][row][Direction.LEFT] = false;
			}
			if (row > 0) {
				explored[column][row - 1][Direction.DOWN] = false;
			}
			if (row < explored[0].length - 1) {
				explored[column][row + 1][Direction.UP] = false;
			}
			path.pop();
			if (column === minCol || row === minRow || row === maxRow) {
				[minCol, minRow] = path[0];
				maxRow = minRow;
				for (let i = 1; i < path.length; i++) {
					const [aCol, aRow] = path[i];
					minCol = Math.min(minCol, aCol);
					minRow = Math.min(minRow, aRow);
					maxRow = Math.max(maxRow, aRow);
				}
			}
			// Don't explore this route again
			const [prevColumn, prevRow] = path[path.length - 1];
			const dx = column - prevColumn;
			const dy = row - prevRow;
			if (dx === 1) {
				// If we went right then don't head rightwards from the cell on the left again.
				explored[column - 1][row][Direction.RIGHT] = true;
			} else if (dx === -1) {
				explored[column + 1][row][Direction.LEFT] = true;
			} else if (dy === 1) {
				explored[column][row - 1][Direction.DOWN] = true;
			} else {
				explored[column][row + 1][Direction.UP] = true;
			}
			column = prevColumn;
			row = prevRow;
			backtracks++;
			continue;
		}

		const direction = possibleDirs[Math.trunc(random.next() * numOptions)];
		switch (direction) {
		case Direction.UP:
			row--;
			break;
		case Direction.DOWN:
			row++;
			break;
		case Direction.LEFT:
			column--;
			break;
		default:
			column++;
		}

		addToPath(explored, path, column, row);
		if (column < minCol) {
			minCol = column;
		} else if (row < minRow) {
			minRow = row;
		} else if (row > maxRow) {
			maxRow = row;
		}
		if (!preferedPathClosed && path.length > preferredPath.length) {
			preferredPath = path;
		}
	}
}
