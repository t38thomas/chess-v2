import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';
import { PactUtils } from '../PactUtils';

/**
 * The Titan Pact
 * Bonus (Earthquake): When the Queen moves, all adjacent pawns are pushed away.
 * Malus (Gigantism): The Queen cannot move to or capture on edge squares.
 */
export const TheTitan = definePact('titan')
    .bonus('earthquake', {
        modifiers: {
            onExecuteMove: (game, move, context) => {
                const b = game.board;
                const square = b.getSquare(move.to);
                if (context && move.piece.color !== context.playerId) return;
                if (!square || !square.piece || square.piece.type !== 'queen') return;

                const adjacent = PactUtils.getPiecesAdjacentTo(game, move.to);
                let pushedAny = false;

                for (const { piece: adjPiece, coord: adjCoord } of adjacent) {
                    if (adjPiece.type === 'pawn') {
                        const dx = adjCoord.x - move.to.x;
                        const dy = adjCoord.y - move.to.y;

                        if (PactUtils.pushPiece(game, adjCoord, dx, dy)) {
                            pushedAny = true;
                        }
                    }
                }

                if (pushedAny) {
                    PactUtils.notifyPactEffect(game, 'titan', 'earthquake', 'bonus', 'waves');
                }
            }
        }
    })
    .malus('gigantism', {
        effects: [Effects.movement.restrictFromEdge('queen')]
    })
    .build();

