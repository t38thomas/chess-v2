import { PactEffect } from '../PactLogic';
import { Move } from '../../models/Move';
import { Coordinate } from '../../models/Coordinate';
import { MoveGenerator } from '../../rules/MoveGenerator';
import { PieceColor, PieceType } from '../../models/Piece';

/**
 * Vector utilities that respect board orientation.
 */
export const Vector = {
    getForward: (color: PieceColor, orientation: number = 0) => {
        const baseDy = color === 'white' ? 1 : -1;
        return MoveGenerator.rotateVector(0, baseDy, orientation);
    },

    getRelative: (dx: number, dy: number, orientation: number = 0) => {
        return MoveGenerator.rotateVector(dx, dy, orientation);
    },

    rotate: (dx: number, dy: number, orientation: number = 0) => {
        return MoveGenerator.rotateVector(dx, dy, orientation);
    }
};

export const PawnEffects = {
    /**
     * Allows pawns to capture straight forward instead of diagonally.
     */
    canCaptureStraight: (): PactEffect => ({
        modifiers: {
            onGetPseudoMoves: ({ board, piece, from, moves, orientation }) => {
                if (piece.type !== 'pawn') return;

                const forward = Vector.getForward(piece.color, orientation ?? 0);
                const targetCoord = new Coordinate(from.x + forward.dx, from.y + forward.dy);

                if (targetCoord.isValid()) {
                    const targetSquare = board.getSquare(targetCoord);
                    if (targetSquare?.piece && targetSquare.piece.color !== piece.color) {
                        moves.push(new Move(from, targetCoord, piece, targetSquare.piece));
                    }
                }
            },
            canCapture: (game, attacker, victim, to, from) => {
                if (attacker.type !== 'pawn') return true;

                const orientation = game?.orientation ?? 0;
                const forward = Vector.getForward(attacker.color, orientation);

                const dx = to.x - from.x;
                const dy = to.y - from.y;

                const forwardComponent = dx * forward.dx + dy * forward.dy;
                const lateralComponent = Math.abs(dx * forward.dy - dy * forward.dx);

                const isStraightForward = forwardComponent > 0 && lateralComponent === 0;
                const isDiagonal = forwardComponent > 0 && lateralComponent > 0;

                if (isStraightForward) return true;
                if (isDiagonal) return false;

                return true;
            }
        }
    }),

    /**
     * Disables the pawn's double move on the first turn.
     */
    disableDoubleMove: (): PactEffect => ({
        modifiers: {
            canDoubleMove: () => false
        }
    }),

    /**
     * Allows pawns to move diagonally without capture.
     */
    canDiagonalDash: (): PactEffect => ({
        modifiers: {
            canDiagonalDash: (piece) => piece.type === 'pawn'
        }
    }),

    /**
     * Fixes pawn promotion to a specific piece type.
     */
    presents: (pieceType: PieceType): PactEffect => ({
        modifiers: {
            getAllowedPromotionTypes: (piece) => [pieceType]
        }
    }),

    /**
     * Allows pawns to move backward one square (no capture).
     */
    backwardMovement: (): PactEffect => ({
        modifiers: {
            onGetPseudoMoves: ({ board, piece, from, moves, orientation }) => {
                if (piece.type !== 'pawn') return;
                const baseDy = piece.color === 'white' ? 1 : -1;
                const backward = Vector.rotate(0, -baseDy, orientation ?? 0);
                const targetCoord = new Coordinate(from.x + backward.dx, from.y + backward.dy);
                if (targetCoord.isValid() && !board.getSquare(targetCoord)?.piece) {
                    moves.push(new Move(from, targetCoord, piece, null));
                }
            }
        }
    })
};
