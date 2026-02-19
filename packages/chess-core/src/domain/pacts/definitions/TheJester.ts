import { definePact } from '../PactLogic';
import { MoveGenerator } from '../../rules/MoveGenerator';
import { RuleEngine } from '../../rules/RuleEngine';

/**
 * The Jester Pact
 * Bonus (Chaos): Bishops move like Knights.
 * Malus (Jester): Knights move like Bishops.
 */
export const TheJester = definePact('jester')
    .bonus('chaos', {
        modifiers: {
            onGetPseudoMoves: ({ board, piece, from, moves }) => {
                if (piece.type === 'bishop') {
                    moves.length = 0;
                    MoveGenerator.addSteppingMoves(board, from, MoveGenerator.KNIGHT_DIRS, piece, moves);
                }
            }
        }
    })
    .malus('jester', {
        modifiers: {
            onGetPseudoMoves: ({ board, piece, from, moves, perks, game }) => {
                if (piece.type === 'knight') {
                    moves.length = 0;
                    const range = RuleEngine.getMaxRange(piece, perks || []);
                    MoveGenerator.addSlidingMoves(board, from, MoveGenerator.BISHOP_DIRS, piece, moves, range, perks || [], game);
                }
            }
        }
    })
    .build();
