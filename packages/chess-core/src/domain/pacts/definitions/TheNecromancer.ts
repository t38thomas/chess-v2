import { PactLogic, ActiveAbilityConfig, PactContext, RuleModifiers } from '../PactLogic';
import { GameEvent } from '../../ChessGame';
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
                // TODO: Feedback to user?
                return;
            }

            const startSquare = this.getStartingSquare(lostPiece);
            if (!startSquare) return;

            // Check if square is empty
            const square = game.board.getSquare(startSquare);
            if (square && !square.piece) {
                // Resurrect
                game.board.placePiece(startSquare, lostPiece);
                game.emit('ability_activated', { abilityId: this.id, playerId });
            } else {
                // Square occupied
                // TODO: Feedback
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

        if (type === 'pawn') {
            const y = color === 'white' ? 1 : 6;
            return new Coordinate(index, y);
        }

        // Non-pawns: Backrank
        const y = color === 'white' ? 0 : 7;
        const backRank = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

        // We need to find the X for this type at this index.
        // There can be multiple pieces of same type (2 rooks, 2 knights, 2 bishops).
        // index 0 is the first one (leftmost), index 1 is the 2nd.

        let count = 0;
        for (let x = 0; x < backRank.length; x++) {
            if (backRank[x] === type) {
                if (count === index) {
                    return new Coordinate(x, y);
                }
                count++;
            }
        }

        return null;
    }
}

export class NecromancerMalus extends PactLogic {
    id = 'ascension_cost';

    onEvent(event: GameEvent, payload: any, context: PactContext): void {
        if (event === 'promotion') {
            // payload is Move
            const move = payload;
            if (move.piece && move.piece.color === context.playerId) {
                // Determine opponent color
                const opponent = context.playerId === 'white' ? 'black' : 'white';

                // Grant extra turn to opponent
                context.game.extraTurns[opponent] = (context.game.extraTurns[opponent] || 0) + 1;
            }
        }
    }
}
