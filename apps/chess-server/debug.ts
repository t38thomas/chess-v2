import { ChessGame, DEFAULT_MATCH_CONFIG } from 'chess-core';

const game = new ChessGame(DEFAULT_MATCH_CONFIG);
console.log('ChessGame instance:', game);
console.log('rotateBoard function:', game.rotateBoard);
if (typeof game.rotateBoard === 'function') {
    console.log('rotateBoard is a function');
} else {
    console.log('rotateBoard is NOT a function');
}
