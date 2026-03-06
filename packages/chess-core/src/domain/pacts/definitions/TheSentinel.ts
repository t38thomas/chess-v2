import { definePact } from '../PactLogic';
import { BoardUtils } from '../utils/BoardUtils';

/**
 * The Sentinel Pact
 * Bonus (Vigilance): Pieces adjacent to the King cannot be captured.
 * Malus (Anchored): The King cannot move if any friendly piece is adjacent to it.
 */
export const TheSentinel = definePact('sentinel')
    .bonus('vigilance', {
        target: 'self',
        modifiers: {
            canBeCaptured: (params, context) => {
                const king = context.query.pieces().ofTypes(['king'])[0];
                if (!king) return true;
                return !BoardUtils.isAdjacent(params.to, king.coord);
            }
        }
    })
    .malus('anchored', {
        target: 'self',
        modifiers: {
            canMovePiece: (params, context) => {
                const b = params.board;
                const piece = b.getSquare(params.from)?.piece;
                if (piece?.type === 'king') {
                    return BoardUtils.getPiecesAdjacentTo(params.game, params.from, params.board).length === 0;
                }
                return true;
            }
        }
    })
    .build();



