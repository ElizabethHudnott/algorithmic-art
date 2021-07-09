export default function RandomWalk() {
	const me = this;
	this.title = 'Random Walk';
	hasRandomness(true);

	this.rows = 26;
	this.stretch = 1;
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
	const visited = new Array(numColumns);
	for (let i = 0; i < numColumns; i++) {
		const column = new Array(numRows);
		visited[i] = column;
		for (let j = 0; j < numRows; j++) {
			column[j] = [false, false, false, false];
		}
		column[0][Direction.UP] = true;
		column[numRows - 1][Direction.DOWN] = true;
	}
	for (let j = 0; j < numRows; j++) {
		visited[0][j][Direction.LEFT] = true;
		visited[numColumns - 1][j][Direction.RIGHT] = true;
	}

	const startColumn = Math.ceil(numColumns / 2);
	const startRow = Math.trunc(numRows / 2);
	const path = walk(visited, startColumn, startRow);

	const cellWidth = canvasWidth / (numColumns - 1);
	const cellHeight = canvasHeight / (numRows - 1);

	let x = Math.trunc(startColumn * cellWidth);
	let y = Math.trunc(startRow * cellHeight);
	context.beginPath();
	context.moveTo(x, y);
	for (let i = 1; i < path.length; i++) {
		const [cellX, cellY] = path[i];
		x = Math.trunc(cellX * cellWidth);
		y = Math.trunc(cellY * cellHeight);
		context.lineTo(x, y);
	}
	context.lineWidth = 2;
	context.stroke();
}

function addToPath(visited, path, column, row) {
	path.push([column, row]);
	if (column > 0) {
		visited[column - 1][row][Direction.RIGHT] = true;
	}
	if (column < visited.length - 1) {
		visited[column + 1][row][Direction.LEFT] = true;
	}
	if (row > 0) {
		visited[column][row - 1][Direction.DOWN] = true;
	}
	if (row < visited[0].length - 1) {
		visited[column][row + 1][Direction.UP] = true;
	}
}

function walk(visited, column, row) {
	const numColumns = visited.length;
	const numRows = visited[0].length;
	const maxLength = numColumns * numRows;

	let backtracks = 0;
	const path = [];
	const startColumn = column;
	const startRow = row;
	addToPath(visited, path, column, row);
	let longestPath = path;

	while (true) {

		const possibleDirs = [];
		const visitedDirs = visited[column][row];
		const canGoUp = !visitedDirs[Direction.UP];
		const canGoDown = !visitedDirs[Direction.DOWN];
		const canGoLeft = !visitedDirs[Direction.LEFT];
		const canGoRight = !visitedDirs[Direction.RIGHT];

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
				if (!visitedDirs[i]) {
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
				// Form a loop and stop
				path.push([startColumn, startRow]);
				return path;
			}
			if (path.length === maxLength || backtracks === 1000000) {
				// Visited everywhere (or out of time) so stop
				return longestPath;
			}

			// Backtrack
			if (longestPath === path) {
				longestPath = path.slice();
			}
			// Allow neighbouring cells to explore this cell
			if (column > 0) {
				visited[column - 1][row][Direction.RIGHT] = false;
			}
			if (column < visited.length - 1) {
				visited[column + 1][row][Direction.LEFT] = false;
			}
			if (row > 0) {
				visited[column][row - 1][Direction.DOWN] = false;
			}
			if (row < visited[0].length - 1) {
				visited[column][row + 1][Direction.UP] = false;
			}
			// Don't explore this route again
			path.pop();
			const [prevColumn, prevRow] = path[path.length - 1];
			const dx = column - prevColumn;
			const dy = row - prevRow;
			if (dx === 1) {
				// If we went right then don't head rightwards from the cell on the left again.
				visited[column - 1][row][Direction.RIGHT] = true;
			} else if (dx === -1) {
				visited[column + 1][row][Direction.LEFT] = true;
			} else if (dy === 1) {
				visited[column][row - 1][Direction.DOWN] = true;
			} else {
				visited[column][row + 1][Direction.UP] = true;
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

		addToPath(visited, path, column, row);
		if (path.length > longestPath.length) {
			longestPath = path;
		}
	}
}
