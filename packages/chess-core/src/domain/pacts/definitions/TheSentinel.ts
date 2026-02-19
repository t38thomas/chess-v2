import { definePact } from '../PactLogic';
import { PactUtils } from '../PactUtils';

/**
 * The Sentinel Pact
 * Bonus (Vigilance): Pieces adjacent to their King are immune to capture.
 * Malus (Anchored): King cannot move if he has any adjacent piece.
 */
export const TheSentinel = definePact('sentinel')
    .bonus('vigilance', {
        modifiers: {
            canBeCaptured: (game, attacker, victim, to, from, board) => {
                if (!game) return true;
                const kingInfo = PactUtils.findPieces(game, victim.color, 'king', board)[0];
                if (!kingInfo) return true;
                return !PactUtils.isAdjacent(to, kingInfo.coord);
            }
        }
    })
    .malus('anchored', {
        modifiers: {
            canMovePiece: (game, from, board) => {
                const effectiveBoard = board || game.board;
                const piece = effectiveBoard.getSquare(from)?.piece;
                if (piece?.type === 'king') {
                    return PactUtils.getPiecesAdjacentTo(game, from, effectiveBoard).length === 0;
                }
                return true;
            }
        }
    })
    .build();

