import { ChessGame } from '../../packages/chess-core/src/domain/ChessGame';
import { PACT_CARDS } from '../../packages/chess-core/src/domain/models/Pact';

const game = new ChessGame();
console.log('Initial Turn:', game.turn);
console.log('Initial Phase:', game.phase);

// 1. Assign Pact to White
console.log('\n--- Assigning Pact to White ---');
game.assignPact('white', PACT_CARDS[0]);
console.log('Turn:', game.turn);
console.log('Phase:', game.phase);
console.log('White Pacts:', game.pacts.white.length);

// 2. Assign Pact to Black
console.log('\n--- Assigning Pact to Black ---');
game.assignPact('black', PACT_CARDS[1]);
console.log('Turn:', game.turn);
console.log('Phase:', game.phase);
console.log('Black Pacts:', game.pacts.black.length);

// Expected: Phase playing, Turn white
if (game.phase === 'playing' && game.turn === 'white') {
    console.log('\nSUCCESS: Game transitioned to playing phase with White turn.');
} else {
    console.error('\nFAILURE: Incorrect state.');
}
