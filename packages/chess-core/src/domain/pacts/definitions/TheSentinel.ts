import { definePact } from '../PactLogic';
import { BoardUtils } from '../utils/BoardUtils';
import { CheckDetector } from '../../rules/CheckDetector';
import { PieceColor } from '../../models/Piece';

/**
 * The Sentinel Pact
 * Bonus (Vigilance): Pieces adjacent to the King (except when in check) cannot be captured.
 * Malus (Anchored): The King cannot move if any friendly piece is adjacent to it (except to escape check).
 */
export const TheSentinel = definePact('sentinel')
    .bonus('vigilance', {
        target: 'self',
        modifiers: {
            canBeCaptured: (params, context) => {
                const king = context.query.pieces().ofTypes(['king'])[0];
                if (!king) return true;

                // The King is never protected by its own Vigilance, and checking its captureability
                // is the primary cause of recursion in isKingInCheck.
                if (params.victim.type === 'king') return true;

                // Only pieces adjacent to the King are protected.
                if (!BoardUtils.isAdjacent(params.to, king.coord)) return true;

                // Recursion Guard: If we are already calculating check, we skip the check-based escape hatch.
                // This prevents infinite loops when isKingInCheck calls RuleEngine.canCapture.
                const guardKey = `sentinel_guard_${context.playerId}`;
                if (context.game.pactState[guardKey]) return true;

                context.game.pactState[guardKey] = true;
                try {
                    const opponentColor: PieceColor = king.piece.color === 'white' ? 'black' : 'white';
                    const opponentPacts = context.game.pacts[opponentColor].map(p => [p.bonus, p.malus]).flat();
                    const isInCheck = CheckDetector.isKingInCheck(context.game.board, king.piece.color, opponentPacts, context.game);
                    if (isInCheck) return true;
                } finally {
                    context.game.pactState[guardKey] = false;
                }

                return false;
            }
        }
    })
    .malus('anchored', {
        target: 'self',
        modifiers: {
            canMovePiece: (params, context) => {
                const b = params.board;
                const square = b.getSquare(params.from);
                const piece = square?.piece;

                if (piece?.type === 'king') {
                    // Previene soft-lock: il Re può muoversi se è sotto scacco, anche se ha adiacenti
                    const opponentColor: PieceColor = piece.color === 'white' ? 'black' : 'white';
                    const opponentPacts = params.game.pacts[opponentColor].map(p => [p.bonus, p.malus]).flat();
                    const isInCheck = CheckDetector.isKingInCheck(params.board, piece.color, opponentPacts, params.game);

                    if (isInCheck) return true;
                    return BoardUtils.getPiecesAdjacentTo(params.game, params.from, params.board).length === 0;
                }
                return true;
            }
        }
    })
    .build();



