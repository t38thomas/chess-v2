import { IChessGame } from '../../GameTypes';
import { Coordinate } from '../../models/Coordinate';
import { Piece, PieceColor, PieceType } from '../../models/Piece';

export class PieceUtils {
    public static removePiece(game: IChessGame, coord: Coordinate): void {
        game.board.removePiece(coord);
    }

    public static promotePiece(game: IChessGame, coord: Coordinate, newType: PieceType): boolean {
        const square = game.board.getSquare(coord);
        if (square && square.piece) {
            square.piece.type = newType;
            return true;
        }
        return false;
    }

    public static getEmptyStartingSquare(game: IChessGame, type: PieceType, color: PieceColor): Coordinate | null {
        const startingRanks = {
            white: { major: 0, pawn: 1 },
            black: { major: 7, pawn: 6 }
        };
        const rank = type === 'pawn' ? startingRanks[color].pawn : startingRanks[color].major;
        let files: number[] = [];

        switch (type) {
            case 'rook': files = [0, 7]; break;
            case 'knight': files = [1, 6]; break;
            case 'bishop': files = [2, 5]; break;
            case 'queen': files = [3]; break;
            case 'king': files = [4]; break;
            case 'pawn': files = [0, 1, 2, 3, 4, 5, 6, 7]; break;
        }

        for (const file of files) {
            const coord = new Coordinate(file, rank);
            if (!game.board.getSquare(coord)?.piece) {
                return coord;
            }
        }
        return null;
    }

    public static resurrectPiece(game: IChessGame, color: PieceColor, type: PieceType): Piece | null {
        const captured = game.capturedPieces[color];
        const index = [...captured].reverse().findIndex(p => p.type === type);
        if (index === -1) return null;
        const actualIndex = captured.length - 1 - index;
        const victim = captured[actualIndex];
        const targetCoord = PieceUtils.getEmptyStartingSquare(game, type, color);
        if (!targetCoord) return null;
        game.capturedPieces[color].splice(actualIndex, 1);
        game.board.placePiece(targetCoord, victim);
        return victim;
    }

    public static sacrificeMostAdvancedPiece(game: IChessGame, playerId: PieceColor, excludeIds: string[] = []): Piece | null {
        const allPieces = game.board.getAllSquares()
            .map(s => s.piece)
            .filter((p): p is Piece => p !== null && p.color === playerId);

        const candidates = allPieces.filter(p => p.type !== 'king' && !excludeIds.includes(p.id));
        if (candidates.length === 0) return null;

        const candidateDetails = candidates.map(p => {
            const coord = game.board.getAllSquares().find(s => s.piece === p)?.coordinate;
            return { piece: p, coord };
        }).filter(d => d.coord !== undefined);

        if (candidateDetails.length === 0) return null;

        const bestRank = playerId === 'white'
            ? Math.max(...candidateDetails.map(c => c.coord!.y))
            : Math.min(...candidateDetails.map(c => c.coord!.y));

        const bestCandidates = candidateDetails.filter(c => c.coord!.y === bestRank);
        const victim = bestCandidates[Math.floor(Math.random() * bestCandidates.length)];
        game.board.removePiece(victim.coord!);
        return victim.piece;
    }

    public static resurrectRandomPiece(game: IChessGame, color: PieceColor, types: PieceType[]): Piece | null {
        const captured = game.capturedPieces[color];
        const candidates = captured.filter(p => types.includes(p.type));
        if (candidates.length === 0) return null;

        const victim = candidates[Math.floor(Math.random() * candidates.length)];
        return PieceUtils.resurrectPiece(game, color, victim.type);
    }
}
