import { IChessGame } from '../../GameTypes';
import { Coordinate } from '../../models/Coordinate';
import { Piece, PieceColor, PieceType } from '../../models/Piece';
import { BoardModel } from '../../models/BoardModel';

export class BoardUtils {
    public static swapPieces(game: IChessGame, coord1: Coordinate, coord2: Coordinate): boolean {
        const sq1 = game.board.getSquare(coord1);
        const sq2 = game.board.getSquare(coord2);
        if (!sq1 || !sq2) return false;
        const p1 = sq1.piece;
        const p2 = sq2.piece;
        game.board.removePiece(coord1);
        game.board.removePiece(coord2);
        if (p2) game.board.placePiece(coord1, p2);
        if (p1) game.board.placePiece(coord2, p1);
        return true;
    }

    public static findPieces(game: IChessGame, playerId: PieceColor, type?: PieceType, board?: BoardModel): { piece: Piece, coord: Coordinate }[] {
        const effectiveBoard = board || game.board;
        return effectiveBoard.getAllSquares()
            .map(s => ({ piece: s.piece, coord: s.coordinate }))
            .filter((item): item is { piece: Piece, coord: Coordinate } =>
                item.piece !== null &&
                item.piece.color === playerId &&
                (!type || item.piece.type === type)
            );
    }

    public static findPiecesByTypes(game: IChessGame, playerId: PieceColor, types: PieceType[], board?: BoardModel): { piece: Piece, coord: Coordinate }[] {
        const effectiveBoard = board || game.board;
        return effectiveBoard.getAllSquares()
            .map(s => ({ piece: s.piece, coord: s.coordinate }))
            .filter((item): item is { piece: Piece, coord: Coordinate } =>
                item.piece !== null &&
                item.piece.color === playerId &&
                types.includes(item.piece.type)
            );
    }

    public static isBlackSquare(coord: Coordinate): boolean {
        return (coord.x + coord.y) % 2 === 0;
    }

    public static isCentralSquare(coord: Coordinate): boolean {
        return coord.x >= 3 && coord.x <= 4 && coord.y >= 3 && coord.y <= 4;
    }

    public static isEdgeSquare(coord: Coordinate): boolean {
        return coord.x === 0 || coord.x === 7 || coord.y === 0 || coord.y === 7;
    }

    public static isAdjacent(c1: Coordinate, c2: Coordinate): boolean {
        const dx = Math.abs(c1.x - c2.x);
        const dy = Math.abs(c1.y - c2.y);
        return (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
    }

    public static getPiecesAdjacentTo(game: IChessGame, coord: Coordinate, board?: BoardModel): { piece: Piece, coord: Coordinate }[] {
        const effectiveBoard = board || game.board;
        const adjacent: { piece: Piece, coord: Coordinate }[] = [];

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;

                const nx = coord.x + dx;
                const ny = coord.y + dy;

                if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                    const targetCoord = new Coordinate(nx, ny);
                    const piece = effectiveBoard.getSquare(targetCoord)?.piece;
                    if (piece) {
                        adjacent.push({ piece, coord: targetCoord });
                    }
                }
            }
        }
        return adjacent;
    }

    public static pushPiece(game: IChessGame, from: Coordinate, dx: number, dy: number): boolean {
        const square = game.board.getSquare(from);
        if (!square || !square.piece) return false;

        const nx = from.x + dx;
        const ny = from.y + dy;

        if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) return false;

        const targetCoord = new Coordinate(nx, ny);
        const targetSquare = game.board.getSquare(targetCoord);

        if (targetSquare && !targetSquare.piece) {
            const piece = square.piece;
            game.board.removePiece(from);
            game.board.placePiece(targetCoord, piece);
            return true;
        }

        return false;
    }
}
