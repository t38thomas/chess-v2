import { PactLogic, RuleModifiers } from '../PactLogic';
import { MoveGenerator } from '../../rules/MoveGenerator';
import { RuleEngine } from '../../rules/RuleEngine';

export class ChaosBonus extends PactLogic {
    id = 'chaos';

    getRuleModifiers(): RuleModifiers {
        return {
            onGetPseudoMoves: ({ board, piece, from, moves }) => {
                // Chaos: Bishops move like Knights
                if (piece.type === 'bishop') {
                    // Clear default Bishop moves
                    moves.length = 0;
                    MoveGenerator.addSteppingMoves(board, from, MoveGenerator.KNIGHT_DIRS, piece, moves);
                }
            }
        };
    }
}

export class JesterMalus extends PactLogic {
    id = 'jester';

    getRuleModifiers(): RuleModifiers {
        return {
            onGetPseudoMoves: ({ board, piece, from, moves, perks, game }) => {
                // Jester: Knights move like Bishops
                if (piece.type === 'knight') {
                    // Clear default Knight moves
                    moves.length = 0;

                    // Add Bishop moves (sliding)
                    const range = RuleEngine.getMaxRange(piece, perks || []);
                    MoveGenerator.addSlidingMoves(board, from, MoveGenerator.BISHOP_DIRS, piece, moves, range, perks || [], game);
                }
            }
        };
    }
}
