import { BoardModel } from '../../models/BoardModel';
import { Piece } from '../../models/Piece';
import { Coordinate } from '../../models/Coordinate';
import { Move } from '../../models/Move';
import { MoveGenerator } from '../../rules/MoveGenerator';

export class MovementUtils {
    public static addSingleStepMoves(board: BoardModel, piece: Piece, from: Coordinate, moves: Move[], directions: { dx: number, dy: number }[], orientation: number = 0): void {
        for (const dir of directions) {
            const rotated = MoveGenerator.rotateVector(dir.dx, dir.dy, orientation);
            const nx = from.x + rotated.dx;
            const ny = from.y + rotated.dy;

            if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                const targetCoord = new Coordinate(nx, ny);
                const targetSquare = board.getSquare(targetCoord);

                if (targetSquare && (!targetSquare.piece || targetSquare.piece.color !== piece.color)) {
                    moves.push(new Move(from, targetCoord, piece, targetSquare.piece || undefined));
                }
            }
        }
    }

    public static blockHorizontalMoves(moves: Move[], from: Coordinate, orientation: number = 0): Move[] {
        const isHorizontal = (orientation % 2 === 0)
            ? (m: Move) => m.to.y === from.y && m.to.x !== from.x
            : (m: Move) => m.to.x === from.x && m.to.y !== from.y;

        return moves.filter(m => !isHorizontal(m));
    }

    public static blockVerticalMoves(moves: Move[], from: Coordinate, orientation: number = 0): Move[] {
        const isVertical = (orientation % 2 === 0)
            ? (m: Move) => m.to.x === from.x && m.to.y !== from.y
            : (m: Move) => m.to.y === from.y && m.to.x !== from.x;

        return moves.filter(m => !isVertical(m));
    }

    public static blockDiagonalMoves(moves: Move[], from: Coordinate): Move[] {
        return moves.filter(m => {
            const dx = Math.abs(m.to.x - from.x);
            const dy = Math.abs(m.to.y - from.y);
            return dx !== dy || dx === 0;
        });
    }
}
