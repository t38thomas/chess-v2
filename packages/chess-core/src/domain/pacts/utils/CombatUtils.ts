import { IChessGame } from '../../GameTypes';
import { Coordinate } from '../../models/Coordinate';
import { Piece, PieceColor } from '../../models/Piece';
import { MoveGenerator } from '../../rules/MoveGenerator';
import { CheckDetector } from '../../rules/CheckDetector';
import { BoardUtils } from './BoardUtils';

export class CombatUtils {
    public static isSquareAttacked(game: IChessGame, square: Coordinate, attackerColor: PieceColor): boolean {
        const targetSquare = game.board.getSquare(square);
        const originalPiece = targetSquare?.piece;
        const needsRemoval = originalPiece && originalPiece.color === attackerColor;

        if (needsRemoval) {
            game.board.removePiece(square);
        }

        try {
            const attackerPieces = BoardUtils.findPieces(game, attackerColor);
            const playerPacts = game.pacts[attackerColor].map(p => [p.bonus, p.malus]).flat();

            for (const { piece, coord } of attackerPieces) {
                if (piece.type === 'pawn') {
                    const direction = piece.color === 'white' ? 1 : -1;
                    const attackY = coord.y + direction;
                    const leftAttack = new Coordinate(coord.x - 1, attackY);
                    const rightAttack = new Coordinate(coord.x + 1, attackY);
                    if (leftAttack.equals(square) || rightAttack.equals(square)) {
                        return true;
                    }
                } else {
                    const moves = MoveGenerator.getPseudoLegalMoves(
                        game.board,
                        piece,
                        coord,
                        game.enPassantTarget,
                        playerPacts,
                        game.perkUsage[attackerColor],
                        game
                    );

                    if (piece.type === 'king') {
                        if (moves.some(m => m.to.equals(square) && Math.abs(m.to.x - coord.x) <= 1)) {
                            return true;
                        }
                    } else {
                        if (moves.some(m => m.to.equals(square))) {
                            return true;
                        }
                    }
                }
            }
        } finally {
            if (needsRemoval && originalPiece) {
                game.board.placePiece(square, originalPiece);
            }
        }

        return false;
    }

    public static getCaptureOpportunities(game: IChessGame, color: PieceColor, onlyUndefended: boolean = true): string[] {
        const myPieces = BoardUtils.findPieces(game, color);
        const opponentColor = color === 'white' ? 'black' : 'white';
        const playerPacts = game.pacts[color].map(p => [p.bonus, p.malus]).flat();
        const capablePieceIds = new Set<string>();

        for (const { piece, coord } of myPieces) {
            const moves = MoveGenerator.getPseudoLegalMoves(
                game.board,
                piece,
                coord,
                game.enPassantTarget,
                playerPacts,
                game.perkUsage[color],
                game
            );

            const legalMoves = moves.filter(m =>
                !CheckDetector.wouldLeaveKingInCheck(game.board, m.from, m.to, color, [], false, game)
            );

            for (const move of legalMoves) {
                if (move.capturedPiece) {
                    if (!onlyUndefended) {
                        capablePieceIds.add(piece.id);
                        break;
                    }

                    const isDefended = CombatUtils.isSquareAttacked(game, move.to, opponentColor);
                    if (!isDefended) {
                        capablePieceIds.add(piece.id);
                        break;
                    }
                }
            }
        }

        return Array.from(capablePieceIds);
    }
}
