import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';
import { PactUtils } from '../PactUtils';

/**
 * The Titan Pact
 * Bonus (Earthquake): When the Queen moves, all adjacent pieces (except the King) are pushed away one square.
 * Malus (Gigantism): The Queen cannot move to or capture on edge squares (rank 0, 7 or file 0, 7).
 */
export const TheTitan = definePact<Record<string, unknown>>('titan')
    .bonus('earthquake', {
        icon: 'image-filter-hdr',
        ranking: 4,
        category: 'Board Transform',
        modifiers: {
            onExecuteMove: (game, move, context) => {
                const square = game.board.getSquare(move.to);
                const piece = move.piece || square?.piece;
                if (!context || piece?.color !== context.playerId) return;
                if (piece.type !== 'queen') return;

                const adjacent = PactUtils.getPiecesAdjacentTo(game, move.to);
                let pushedAny = false;

                for (const { piece: adjPiece, coord: adjCoord } of adjacent) {
                    if (adjPiece.type !== 'king') {
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
        icon: 'arrow-expand-all',
        ranking: -2,
        category: 'Movement',
        effects: [Effects.movement.restrictFromEdge('queen')]
    })
    .build();


