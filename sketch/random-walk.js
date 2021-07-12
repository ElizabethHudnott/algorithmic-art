export default function RandomWalk() {
	const me = this;
	this.title = 'Random Walk';
	hasRandomness(true);

	this.rows = 26;
	this.stretch = 1;
	this.borderX = 0.5;
	this.borderY = 0.5;
	this.perturbationX = 0.9;
	this.perturbationY = 0.9;
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

	const perturbations = new Array(numColumns);
	for (let i = 0; i < numColumns; i++) {
		const column = new Array(numRows);
		perturbations[i] = column;
		for (let j = 0; j < numRows; j++) {
			let perturbationX;
			if (i === 0) {

			} else if (i === numColumns - 1) {

			} else {

			}
			let perturbationY;
			if (j === 0) {

			} else if (j === numRows - 1) {

			} else {

			}
			column[j] = [perturbationX, perturbationY];
		}
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
	const [lastCellX, lastCellY] = path[path.length - 1];
	context.lineTo(Math.round(lastCellX * cellWidth), Math.round(lastCellY * cellHeight));
	if (lastCellX === 0) {
		context.lineTo(0, startY);
	} else if (lastCellX === numColumns - 1) {
		context.lineTo(Math.round(lastCellX * cellWidth), startY);
	} else if (lastCellY === 0) {
		context.lineTo(startX, 0);
	} else if (lastCellY === numRows - 1) {
		context.lineTo(startX, Math.round(lastCellY * cellHeight));
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
	context.strokeStyle = '#777';
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
			dx = newDx;
			dy = newDy;
		}
		newPath[index] = path[i];
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

function shiftLeft(explored, path, preferredPath) {
	explored.shift();	// Delete leftmost column
	// Add new column on the right
	const numRows = explored[0].length;
	const newColumn = new Array(numRows);
	explored.push(newColumn);

	const firstColumn = explored[0];
	const penultimateColNum = explored.length - 2;
	const penultimateColumn = explored[penultimateColNum];

	for (let j = 0; j < numRows; j++) {
		newColumn[j] = [false, false, false, true];		// Cannot explore further right
		penultimateColumn[j][Direction.RIGHT] = false;	// Can now go right from here
		firstColumn[j][Direction.LEFT] = true;	 		// Can no longer go left from here
	}
	newColumn[0][Direction.UP] = true;
	newColumn[numRows - 1][Direction.DOWN] = true;

	for (let i = 0; i < path.length; i++) {
		path[i][0]--;
		const [x, y] = path[i];
		if (x === penultimateColNum) {
			newColumn[y][Direction.LEFT] = true; // Cannot go left onto existing path
		}
	}
	if (path !== preferredPath) {
		for (let i = 0; i < preferredPath.length; i++) {
			preferredPath[i][0]--;
		}
	}
}

function shiftUp(explored, path, preferredPath) {
	const numColumns = explored.length;
	const maxRowNum = explored[0].length - 1;

	for (let i = 0; i < numColumns; i++) {
		const column = explored[i];
		column.shift();									// Remove 1st row.
		column.push([false, true, false, false]);		// Cannot explore further down
		column[maxRowNum - 1][Direction.DOWN] = false;	// Can now go down from here
		column[0][Direction.UP] = true;					// Can no longer go up from here
	}
	explored[0][maxRowNum][Direction.LEFT] = true;
	explored[numColumns - 1][maxRowNum][Direction.RIGHT] = true;

	for (let i = 0; i < path.length; i++) {
		path[i][1]--;
		const [x, y] = path[i];
		if (y === maxRowNum - 1) {
			explored[x][maxRowNum][Direction.UP] = true; // Cannot go up onto existing path
		}
	}
	if (path !== preferredPath) {
		for (let i = 0; i < preferredPath.length; i++) {
			preferredPath[i][1]--;
		}
	}
}

function shiftDown(explored, path, preferredPath) {
	const numColumns = explored.length;
	const maxRowNum = explored[0].length - 1;

	for (let i = 0; i < numColumns; i++) {
		const column = explored[i];
		column.pop();									// Remove last row
		column.unshift([true, false, false, false]);	// Cannot explore further up
		column[1][Direction.UP] = false;				// Can now go up from here
		column[maxRowNum][Direction.DOWN] = true;		// Can no longer go down from here
	}
	explored[0][0][Direction.LEFT] = true;
	explored[numColumns - 1][0][Direction.RIGHT] = true;

	for (let i = 0; i < path.length; i++) {
		path[i][1]++;
		const [x, y] = path[i];
		if (y === 1) {
			explored[x][0][Direction.DOWN] = true;		// Cannot go down onto existing path
		}
	}
	if (path !== preferredPath) {
		for (let i = 0; i < preferredPath.length; i++) {
			preferredPath[i][1]++;
		}
	}
}

function walk(explored) {
	const numColumns = explored.length;
	const numRows = explored[0].length;
	const maxLength = numColumns * numRows;

	let backtracks = 0;
	const path = [];
	let startColumn = numColumns - 1;
	let startRow = Math.trunc(numRows / 2);
	let column = startColumn, row = startRow;
	let minCol = startColumn, minRow = startRow, maxRow = startRow;
	addToPath(explored, path, column, row);
	let preferredPath = path, preferedPathClosed = false;

	while (true) {

		const possibleDirs = [];
		const exploredDirs = explored[column][row];
		const canGoUp = !exploredDirs[Direction.UP] ||
			(row === 0 && maxRow < numRows - 1);
		const canGoDown = !exploredDirs[Direction.DOWN] ||
			(row === numRows - 1 && minRow > 0);
		const canGoLeft = !exploredDirs[Direction.LEFT];
		const canGoRight = !exploredDirs[Direction.RIGHT] ||
			(column === numColumns - 1 && minCol > 0);

		// 0 = line going left, 1 = line going right
		const xParity = Math.abs(row - startRow) % 2;
		// 0 = line going up, 1 = line going down
		const yParity = Math.abs(column - startColumn) % 2;

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

			// Avoid returning to the start point prematurely.
			let index;
			const rowDist = row - startRow;
			if (rowDist === 0 && canGoLeft) {
				index = possibleDirs.indexOf(Direction.LEFT);
			} else if (rowDist === -1 && canGoDown) {
				index = possibleDirs.indexOf(Direction.DOWN);
			} else if (rowDist === 1 && canGoUp) {
				index = possibleDirs.indexOf(Direction.UP);
			}

			if (index >= 0) {
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
			if (path.length === maxLength || backtracks === 200000) {
				// Explored everywhere (or out of time) so stop.
				return preferredPath;
			}

			// Backtrack
			if (preferredPath === path) {
				preferredPath = path.slice();
			}
			path.pop();
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
		} // End of backtracking

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

		if (column === numColumns) {
			shiftLeft(explored, path, preferredPath);
			column--;
			startColumn--;
			minCol--;
		}
		if (row === -1) {
			shiftDown(explored, path, preferredPath);
			row++;
			startRow++;
			maxRow++;
		} else if (row === numRows) {
			shiftUp(explored, path, preferredPath);
			row--;
			startRow--;
			minRow--;
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
