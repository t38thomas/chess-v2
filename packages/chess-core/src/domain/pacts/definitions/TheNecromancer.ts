import { PactLogic, ActiveAbilityConfig, PactContext, RuleModifiers } from '../PactLogic';
import { GameEvent } from '../../GameTypes';
import { Coordinate } from '../../models/Coordinate';
import { Piece, PieceColor, PieceType } from '../../models/Piece';

export class NecromancerBonus extends PactLogic {
    id = 'reclaimer';

    readonly activeAbility: ActiveAbilityConfig = {
        id: 'reclaimer',
        name: 'reclaimer', // Key for translation
        description: 'desc_reclaimer',
        icon: 'refresh',
        maxUses: 1,
        targetType: 'none',
        execute: (context: PactContext) => {
            const { game, playerId } = context;

            // Find last captured piece belonging to playerId
            let lostPiece: Piece | null = null;
            // Iterate history backwards
            for (let i = game.history.length - 1; i >= 0; i--) {
                const move = game.history[i];
                if (move.capturedPiece && move.capturedPiece.color === playerId) {
                    lostPiece = move.capturedPiece;
                    break;
                }
            }

            if (!lostPiece) {
                // No piece to resurrect
                return false;
            }

            const startSquare = this.getStartingSquare(lostPiece);
            if (!startSquare) return false;

            // Check if square is empty
            const square = game.board.getSquare(startSquare);
            if (square && !square.piece) {
                // Resurrect
                game.board.placePiece(startSquare, lostPiece);
                return true;
            } else {
                // Square occupied
                return false;
            }
        }
    };

    private getStartingSquare(piece: Piece): Coordinate | null {
        // ID format: color-type-index (e.g. white-pawn-0, black-rook-1)
        const parts = piece.id.split('-');
        if (parts.length < 3) return null;

        const color = parts[0] as PieceColor;
        const type = parts[1] as PieceType;
        const index = parseInt(parts[2], 10);

        if (isNaN(index)) return null; // Handle non-standard IDs (e.g. Swarm pawns)

        // All standard pieces (pawns and backrank) use the index as their starting X coordinate.
        const y = type === 'pawn'
            ? (color === 'white' ? 1 : 6)
            : (color === 'white' ? 0 : 7);

        return new Coordinate(index, y);
    }
}

export class NecromancerMalus extends PactLogic {
    id = 'ascension_cost';

    getRuleModifiers(): RuleModifiers {
        return {
            modifyNextTurn: (game, currentTurn, eventType) => {
                if (eventType === 'promotion') {
                    const opponent = currentTurn === 'white' ? 'black' : 'white';
                    game.extraTurns[opponent] = (game.extraTurns[opponent] || 0) + 1;

                    game.emit('pact_effect', {
                        pactId: this.id,
                        title: 'pact.toasts.necromancer.cost.title',
                        description: 'pact.toasts.necromancer.cost.desc',
                        icon: 'trending-up',
                        type: 'malus'
                    });
                }
                return null;
            }
        };
    }
}
