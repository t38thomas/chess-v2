import { definePact } from '../PactLogic';
import { PactUtils } from '../PactUtils';

/**
 * The Engineer Pact
 * Bonus (Turret): Rooks can move 1 square diagonally.
 * Malus (Design Flaw): Rooks cannot move horizontally.
 */
export const TheEngineer = definePact('engineer')
    .bonus('turret', {
        modifiers: {
            onGetPseudoMoves: ({ board, piece, from, moves, orientation }) => {
                if (piece.type === 'rook') {
                    const directions = [{ dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }];
                    PactUtils.addSingleStepMoves(board, piece, from, moves, directions, orientation ?? 0);
                }
            }
        }
    })
    .malus('design_flaw', {
        modifiers: {
            onGetPseudoMoves: ({ piece, from, moves, orientation }) => {
                if (piece.type === 'rook') {
                    PactUtils.blockHorizontalMoves(moves, from, orientation ?? 0);
                }
            }
        }
    })
    .build();

