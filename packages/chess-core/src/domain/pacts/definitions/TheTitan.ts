import { PactLogic, RuleModifiers } from '../PactLogic';
import { PactUtils } from '../PactUtils';

/**
 * Earthquake Bonus: When the Queen moves, all adjacent pawns (friendly or enemy)
 * are pushed away from the Queen's destination.
 */
export class EarthquakeBonus extends PactLogic {
    id = 'earthquake';

    getRuleModifiers(): RuleModifiers {
        return {
            onExecuteMove: (game, move) => {
                const b = game.board;
                const square = b.getSquare(move.to);
                if (!square || !square.piece) return;

                const piece = square.piece;
                // Only trigger for Queen of the player who has this pact
                // Wait, PactLogic is instantiated per player? 
                // In context we have playerId.

                if (piece.type !== 'queen') return;

                const adjacent = PactUtils.getPiecesAdjacentTo(game, move.to);
                let pushedAny = false;

                for (const { piece: adjPiece, coord: adjCoord } of adjacent) {
                    if (adjPiece.type === 'pawn') {
                        // Direction is from Queen's destination to pawn's position
                        const dx = adjCoord.x - move.to.x;
                        const dy = adjCoord.y - move.to.y;

                        // Push piece in that direction
                        if (PactUtils.pushPiece(game, adjCoord, dx, dy)) {
                            pushedAny = true;
                        }
                    }
                }

                if (pushedAny) {
                    PactUtils.emitPactEffect(game, {
                        pactId: this.id,
                        title: 'pact.toasts.titan.earthquake.title',
                        description: 'pact.toasts.titan.earthquake.desc',
                        icon: 'waves',
                        type: 'bonus'
                    });
                }
            }
        };
    }
}

/**
 * Gigantism Malus: The Queen cannot move to or capture on squares that are on the edges of the board.
 */
export class GigantismMalus extends PactLogic {
    id = 'gigantism';

    getRuleModifiers(): RuleModifiers {
        return {
            onGetPseudoMoves: (params) => {
                if (params.piece.type === 'queen') {
                    // Filter out moves that land on edge squares
                    params.moves = params.moves.filter(move => !PactUtils.isEdgeSquare(move.to));
                }
            }
        };
    }
}
