/**
 * The game of Othello.
 * @author Jim McGowen
 */
const readline = require('node:readline');

/**
 * A coordinate on the board.
 */
class Coordinate {
  constructor(row, col) {
    this.row = row;
    this.col = col;
  }

  toString() {
    return `Coordinate(row=${this.row}, col=${this.col})`;
  }
}

/**
 * A color of a piece/player.
 */
class Color {
  static BLACK = new Color('B');
  static WHITE = new Color('W');

  constructor(name) {
    this.name = name;
  }

  abbreviation() {
    return this.name;
  }

  toString() {
    switch (this.name) {
      case 'B':
        return 'black';
      case 'W':
        return 'white';
    }
    throw new Error(`Unknown color: ${this.name}`);
  }
}

/**
 * The game board.
 */
class Board {
  constructor(size) {
    this.size = size;
    this.positions = new Array(size).fill(null).map(() => new Array(size).fill(null));
  }

  toString() {
    let result = '';
    result += '   ';
    for (let col = 0; col < this.size; col++) {
      result += String.fromCharCode('a'.charCodeAt(0) + col);
      result += ' ';
    }
    result += '\n';
    for (let row = 0; row < this.size; row++) {
      result += (row + 1).toString();
      if (row < 9) {
        result += '  ';
      } else {
        result += ' ';
      }
      for (let col = 0; col < this.size; col++) {
        const position = this.positions[row][col];
        result += position !== null ? position.abbreviation() : ' ';
        if (col < this.size - 1) {
          result += ' ';
        }
      }
      result += '\n';
    }
    return result;
  }
}

class CoordinateParseException extends Error {}
class BoardOutOfBoundsException extends Error {}

/**
 * The game.
 */
class Othello {
  static SIZE = 8;
  static DIRECTIONS = [
    'left',
    'left-up',
    'up',
    'right-up',
    'right',
    'right-down',
    'down',
    'left-down'
  ]

  // The game board
  board = null;
  scores = {};

  /**
   * Validates the size and initializes the game board.
   */
  constructor() {
    if (Othello.SIZE > 26) {
      throw new BoardOutOfBoundsException('Max board size is 26');
    }
    this.board = new Board(Othello.SIZE);
  }

  /**
   * Parse the input into a coordinate. The input should be a letter representing the column followed by a number
   * representing the row.
   *
   * @param input The input to parse.
   * @returns {Coordinate} The parsed coordinate.
   */
  parseCoordinate(input) {
    if (input.length < 2 || input.length > 3) {
      throw new CoordinateParseException("Input must be length 2 or 3");
    }
    const col = input.slice(0, 1).charCodeAt(0) - 'a'.charCodeAt(0);
    if (col < 0 || col > Othello.SIZE - 1) {
      throw new CoordinateParseException("Column out of bounds");
    }
    const row = parseInt(input.slice(1)) - 1;
    if (row < 0 || col > Othello.SIZE - 1) {
      throw new CoordinateParseException("Row out of bounds");
    }
    return new Coordinate(row, col);
  }

  /**
   * Check if the move is valid and return the closures if so. Returns false if the move is invalid.
   *
   * @param coords The board coordinates to check.
   * @param color The color of the piece being placed.
   * @returns {boolean|*[]} False if the move is invalid, otherwise an array of closures found in all directions.
   */
  validateMove(coords, color) {
    if (this.board.positions[coords.row][coords.col] !== null) {
      // Position already taken
      return false;
    }

    const closures = this.getClosures(color, coords);
    if (closures.length === 0) {
      return false;
    }

    return closures;
  }

  /**
   * Check for closures in all directions from the given coordinates.
   *
   * @param color The end colors of the closure.
   * @param coords The coordinates to check from.
   * @returns {[]} An array of closures found (empty if none).
   */
  getClosures(color, coords) {
    let closures = [];
    for (let i = 0; i < Othello.DIRECTIONS.length; i++) {
      const closure= this.checkForClosure(color, coords, Othello.DIRECTIONS[i])
      if (closure !== null) {
        closures.push(closure);
      }
    }

    return closures;
  }

  /**
   * Check for a closure in the given direction from the given coordinates. Return null if no closure is found.
   * Otherwise, return an object with the direction, start, end, and flipCount.
   *
   * @param color The end colors of the closure.
   * @param coords The coordinates to check from.
   * @param direction The direction to check (one of this.DIRECTIONS).
   * @returns {null|{direction: *, start: *, end: *, flipCount: number}}
   */
  checkForClosure(color, coords, direction) {
    let val = 0;
    let checkCol = coords.col;
    let checkRow = coords.row;
    let flipCount = 0;

    while (val !== null && val !== color && checkCol >= 0 && checkRow >= 0
           && checkCol < Othello.SIZE && checkRow < Othello.SIZE) {
      switch (direction) {
        case 'left': {
          if (checkCol - 1 >= 0) {
            val = this.board.positions[checkRow][checkCol - 1];
            if (val !== color && val !== null) {
              flipCount++;
            }
          }
          checkCol--;
          break;
        }
        case 'left-up': {
          if (checkCol - 1 >= 0 && checkRow - 1 >= 0) {
            val = this.board.positions[checkRow - 1][checkCol - 1];
            if (val !== color && val !== null) {
              flipCount++;
            }
          }
          checkCol--;
          checkRow--;
          break;
        }
        case 'up': {
          if (checkRow - 1 >= 0) {
            val = this.board.positions[checkRow - 1][checkCol];
            if (val !== color && val !== null) {
              flipCount++;
            }
          }
          checkRow--;
          break;
        }
        case 'right-up': {
          if (checkCol + 1 < Othello.SIZE && checkRow - 1 >= 0) {
            val = this.board.positions[checkRow - 1][checkCol + 1];
            if (val !== color && val !== null) {
              flipCount++;
            }
          }
          checkCol++;
          checkRow--;
          break;
        }
        case 'right': {
          if (checkCol + 1 < Othello.SIZE) {
            val = this.board.positions[checkRow][checkCol + 1];
            if (val !== color && val !== null) {
              flipCount++;
            }
          }
          checkCol++;
          break;
        }
        case 'right-down': {
          if (checkCol + 1 < Othello.SIZE && checkRow + 1 < Othello.SIZE) {
            val = this.board.positions[checkRow + 1][checkCol + 1];
            if (val !== color && val !== null) {
              flipCount++;
            }
          }
          checkCol++;
          checkRow++;
          break;
        }
        case 'down': {
          if (checkRow + 1 < Othello.SIZE) {
            val = this.board.positions[checkRow + 1][checkCol];
            if (val !== color && val !== null) {
              flipCount++;
            }
          }
          checkRow++;
          break;
        }
        case 'left-down': {
          if (checkCol - 1 >= 0 && checkRow + 1 < Othello.SIZE) {
            val = this.board.positions[checkRow + 1][checkCol - 1];
            if (val !== color && val !== null) {
              flipCount++;
            }
          }
          checkCol--;
          checkRow++;
          break;
        }
        default: {
          console.log('invalid direction')
        }
      }
    }

    if (val === color) {
      // Found closure
      const start = [coords.col, coords.row];
      const end = [checkCol, checkRow];

      if (flipCount > 0) {
        return { direction, start, end, flipCount };
      }
    }

    // No closure found
    return null;
  }

  /**
   * Flip pieces in the given direction to color from the start coordinates to the end coordinates.
   *
   * @param start The start coordinates.
   * @param end The end coordinates.
   * @param direction The direction to flip.
   * @param color The color to flip to.
   */
  flipPieces(start, end, direction, color) {
    const [startCol, startRow] = start;
    const [endCol, endRow] = end;

    switch (direction) {
      case 'left': {
        for (let col = startCol; col >= endCol; col--) {
          this.board.positions[startRow][col] = color;
        }
        break;
      }
      case 'left-up': {
        let col = startCol;
        let row = startRow;
        while (col >= endCol && row >= endRow) {
          this.board.positions[row--][col--] = color;
        }
        break;
      }
      case 'up': {
        for (let row = startRow; row >= endRow; row--) {
          this.board.positions[row][startCol] = color;
        }
        break;
      }
      case 'right-up': {
        let col = startCol;
        let row = startRow;
        while (col <= endCol && row >= endRow) {
          this.board.positions[row--][col++] = color;
        }
        break;
      }
      case 'right': {
        for (let col = startCol; col <= endCol; col++) {
          this.board.positions[startRow][col] = color;
        }
        break;
      }
      case 'right-down': {
        let col = startCol;
        let row = startRow;
        while (col <= endCol && row <= endRow) {
          this.board.positions[row++][col++] = color;
        }
        break;
      }
      case 'down': {
        for (let row = startRow; row <= endRow; row++) {
          this.board.positions[row][startCol] = color;
        }
        break;
      }
      case 'left-down': {
        let col = startCol;
        let row = startRow;
        while (col >= endCol && row <= endRow) {
          this.board.positions[row++][col--] = color;
        }
        break;
      }
      default: {
        console.log('invalid direction')
      }
    }
  }

  /**
   * Return the scores for each player.
   *
   * @returns {{white: number, black: number}}
   */
  getScores() {
    let black = 0;
    let white = 0;
    for (let row = 0; row < Othello.SIZE; row++) {
      for (let col = 0; col < Othello.SIZE; col++) {
        if (this.board.positions[row][col] === Color.BLACK) {
          black++;
        } else if (this.board.positions[row][col] === Color.WHITE) {
          white++;
        }
      }
    }
    return {black, white};
  }

  /**
   *
   */
  drawBoardAndScores() {
    console.log(this.board.toString());
    console.log('Black: ' + this.scores.black.toString() + ', White: ' + this.scores.white.toString());
  }

  /**
   * Check if the player has any valid moves on the board.
   *
   * @returns {boolean}
   */
  playerHasAnyValidMoves(color) {
    for (let row = 0; row < Othello.SIZE; row++) {
      for (let col = 0; col < Othello.SIZE; col++) {
        if (this.validateMove(new Coordinate(row, col), color) !== false) {
          return true;
        }
      }
    }

    return false;
  }

  getAllValidMoves(color) {
    const validMoves = [];
    for (let row = 0; row < Othello.SIZE; row++) {
      for (let col = 0; col < Othello.SIZE; col++) {
        if (this.validateMove(new Coordinate(row, col), color) !== false) {
          validMoves.push(new Coordinate(row, col));
        }
      }
    }

    return validMoves;
  }

  /**
   * Start the game. Will prompt each player in turn for moves until the game is over.
   *
   * @returns {Promise<void>}
   */
  async play() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'Othello > ',
    });

    // Starting pieces placed in the middle of the board
    const middle = (Othello.SIZE / 2) - 1;
    this.board.positions[middle][middle] = Color.BLACK;
    this.board.positions[middle][middle + 1] = Color.WHITE;
    this.board.positions[middle + 1][middle] = Color.WHITE;
    this.board.positions[middle + 1][middle + 1] = Color.BLACK;

    this.scores = this.getScores();

    // Pick first player at random
    let curPlayer = Math.random() < 0.5 ? Color.BLACK : Color.WHITE;

    let autoPilot = false;

    while (true) {
      try {
        // Draw the board
        this.drawBoardAndScores();

        let input = null;
        if (!autoPilot) {
          // Wait for input
          input = await new Promise(res => rl.question(`Enter move for ${curPlayer}: `, res));
          if (input === 'autopilot') {
            autoPilot = true;
          }
        }

        if (autoPilot) {
          // Delay for dramatic effect
          await new Promise(res => setTimeout(res, 250));
        }

        let move = null;

        if (input === '-' || autoPilot) {
          // Auto move
          // Choose all the valid moves with the most flips
          const validMoves = this.getAllValidMoves(curPlayer);
          let bestMoves = [validMoves[0]];
          let bestMove = validMoves[0];
          for (let i = 0; i < validMoves.length; i++) {
            if (validMoves[i].flipCount > bestMove.flipCount) {
              bestMove = validMoves[i];
              bestMoves.push(validMoves[i]);
            } else if (validMoves[i].flipCount === bestMove.flipCount) {
              bestMoves.push(validMoves[i]);
            }
          }

          // Choose a random move from the best moves
          bestMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];

          move = new Coordinate(bestMove.row, bestMove.col);
        } else {
          move = this.parseCoordinate(input);
        }

        // Check if it's a valid move
        const closures = this.validateMove(move, curPlayer);
        if (closures === false) {
          console.log('Invalid move. Try again.');
          console.log();
          continue;
        }

        // Place the piece
        this.board.positions[move.row][move.col] = curPlayer;

        // Flip pieces
        for (let i = 0; i < closures.length; i++) {
          const { direction, start, end, flipCount } = closures[i];
          this.flipPieces(start, end, direction, curPlayer);
        }

        // Update scores
        this.scores = this.getScores();

        // Switch players
        curPlayer = curPlayer === Color.BLACK ? Color.WHITE : Color.BLACK;

        // Check if next player has any valid moves
        if (!this.playerHasAnyValidMoves(curPlayer)) {
          console.log(`No valid moves for ${curPlayer}.`);
          curPlayer = curPlayer === Color.BLACK ? Color.WHITE : Color.BLACK;
          if (!this.playerHasAnyValidMoves(curPlayer)) {
            this.drawBoardAndScores();
            console.log('No valid moves for either player.');
            if (this.scores.black === this.scores.white) {
              console.log('Tie game!');
            }
            else if (this.scores.black > this.scores.white) {
              const percent = (this.scores.black / (this.scores.black + this.scores.white) * 100).toFixed(0);
              console.log('Black wins with ' + percent + '% of the board!');
            } else {
              const percent = (this.scores.white / (this.scores.black + this.scores.white) * 100).toFixed(0);
              console.log('White wins with ' + percent + '% of the board!');
            }
            break;
          }
        }
      } catch (e) {
        if (e instanceof CoordinateParseException) {
          console.log(`Invalid move: ${e.message}`);
          console.log();
        } else {
          throw e;
        }
      }
    }
  }
}

const othello = new Othello();
othello.play();
