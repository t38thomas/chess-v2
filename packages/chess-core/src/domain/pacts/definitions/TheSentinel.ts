import { definePact } from '../PactLogic';
import { PactUtils } from '../PactUtils';

/**
 * The Sentinel Pact
 * Bonus (Vigilance): Pieces adjacent to their King are immune to capture.
 * Malus (Anchored): King cannot move if he has any adjacent piece.
 */
export const TheSentinel = definePact('sentinel')
    .bonus('vigilance', {
        target: 'self',
        modifiers: {
            canBeCaptured: (params, context) => {
                const kingInfo = PactUtils.findPieces(params.game!, context.playerId, 'king', params.board)[0];
                if (!kingInfo) return true;
                return !PactUtils.isAdjacent(params.to, kingInfo.coord);
            }
        }
    })
    .malus('anchored', {
        target: 'self',
        modifiers: {
            canMovePiece: (params, context) => {
                const piece = params.board.getSquare(params.from)?.piece;
                if (piece?.type === 'king') {
                    return PactUtils.getPiecesAdjacentTo(params.game, params.from, params.board).length === 0;
                }
                return true;
            }
        }
    })
    .build();

