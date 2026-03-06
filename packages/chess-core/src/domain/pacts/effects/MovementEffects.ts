import { PactEffect, PactPriority } from '../PactLogic';
import { PieceType, Piece } from '../../models/Piece';
import { MoveGenerator } from '../../rules/MoveGenerator';
import { RuleEngine } from '../../rules/RuleEngine';
import { MovementUtils } from '../utils/MovementUtils';
import { PactUtils } from '../PactUtils';
import { Coordinate } from '../../models/Coordinate';
import { Move } from '../../models/Move';
import { Vector } from './PawnEffects';

export const MovementEffects = {
    /**
     * Sets the maximum movement range for all pieces.
     */
    maxRange: (range: number): PactEffect => ({
        modifiers: {
            getMaxRange: () => range
        }
    }),

    /**
     * Enables echolocation (seeing through pieces) for sliding pieces.
     */
    hasEcholocation: (types: PieceType[] = ['rook', 'bishop', 'queen']): PactEffect => ({
        modifiers: {
            hasEcholocation: (piece) => types.includes(piece.type)
        }
    }),

    /**
     * Swaps the movement logic of two piece types.
     */
    swapMovement: (typeA: PieceType, typeB: PieceType): PactEffect => ({
        modifiers: {
            onModifyMoves: (currentMoves, { board, from, piece, pacts, game }) => {
                if (piece.type === typeA || piece.type === typeB) {
                    const targetType = piece.type === typeA ? typeB : typeA;
                    const newMoves: Move[] = [];

                    const rookDirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                    const bishopDirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
                    const knightDirs = [[1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [2, -1], [-2, 1], [-2, -1]];

                    const getDirs = (t: PieceType) => {
                        if (t === 'rook') return rookDirs;
                        if (t === 'bishop') return bishopDirs;
                        if (t === 'knight') return knightDirs;
                        return [];
                    };

                    const dirs = getDirs(targetType);
                    if (targetType === 'knight') {
                        MoveGenerator.addSteppingMoves(board, from, dirs, piece, newMoves);
                    } else {
                        const range = RuleEngine.getMaxRange(piece, pacts || []);
                        MoveGenerator.addSlidingMoves(board, from, dirs, piece, newMoves, range, pacts || [], game);
                    }
                    return newMoves;
                }
                return currentMoves;
            }
        }
    }),

    /**
     * Allows specific pieces to move through friendly pieces.
     */
    canMoveThroughFriendlies: (moverType: PieceType): PactEffect => ({
        modifiers: {
            canMoveThroughFriendlies: (mover, obstacle) => {
                return mover.type === moverType && mover.color === obstacle.color;
            }
        }
    }),

    /**
     * Disables diagonal movement for a piece type.
     */
    disableDiagonal: (pieceType: PieceType): PactEffect => ({
        modifiers: {
            onModifyMoves: (currentMoves, { from, piece }) => {
                if (piece.type === pieceType) {
                    return currentMoves.filter(m => {
                        const dx = Math.abs(m.to.x - from.x);
                        const dy = Math.abs(m.to.y - from.y);
                        return !(dx > 0 && dy > 0 && dx === dy);
                    });
                }
                return currentMoves;
            }
        },
        priority: PactPriority.LATE
    }),

    /**
     * Blocks moves on specific axes (horizontal, vertical, diagonal) for a specific piece type.
     */
    blockMoves: (pieceType: PieceType, axes: ('horizontal' | 'vertical' | 'diagonal')[]): PactEffect => ({
        modifiers: {
            onModifyMoves: (currentMoves, { piece, from, orientation }) => {
                if (piece.type !== pieceType) return currentMoves;
                let moves = [...currentMoves];
                for (const axis of axes) {
                    if (axis === 'horizontal') {
                        moves = MovementUtils.blockHorizontalMoves(moves, from, orientation ?? 0);
                    } else if (axis === 'vertical') {
                        moves = MovementUtils.blockVerticalMoves(moves, from, orientation ?? 0);
                    } else if (axis === 'diagonal') {
                        moves = MovementUtils.blockDiagonalMoves(moves, from);
                    }
                }
                return moves;
            }
        },
        priority: PactPriority.LATE
    }),

    /**
     * Adds single-step moves in specified relative directions for a specific piece type.
     */
    addSingleStepMoves: (pieceType: PieceType, dirs: { dx: number, dy: number }[]): PactEffect => ({
        modifiers: {
            onModifyMoves: (currentMoves, { board, piece, from, orientation }) => {
                if (piece.type !== pieceType) return currentMoves;
                const newMoves = [...currentMoves];
                MovementUtils.addSingleStepMoves(board, piece, from, newMoves, dirs, orientation ?? 0);
                return newMoves;
            }
        }
    }),

    /**
     * Prevents a piece from moving to or capturing on edge squares.
     */
    restrictFromEdge: (pieceType: PieceType): PactEffect => ({
        modifiers: {
            onModifyMoves: (currentMoves, params) => {
                if (params.piece.type !== pieceType) return currentMoves;
                return currentMoves.filter(m => !PactUtils.isEdgeSquare(m.to));
            }
        },
        priority: PactPriority.LATE
    }),

    /**
     * Allows a mover to pass through an obstacle if both filters match.
     */
    canMoveThrough: (
        moverFilter: (mover: Piece) => boolean,
        obstacleFilter: (obstacle: Piece) => boolean
    ): PactEffect => ({
        modifiers: {
            canMoveThroughFriendlies: (mover, obstacle) => {
                return moverFilter(mover) && obstacleFilter(obstacle);
            }
        }
    }),

    /**
     * Allows movement in a specific direction (relative to orientation) for certain piece types.
     */
    allowDirection: (
        pieceType: PieceType,
        direction: 'forward' | 'backward' | 'left' | 'right',
        options: { capture?: boolean, canMoveToOccupied?: boolean } = { capture: false, canMoveToOccupied: false }
    ): PactEffect => ({
        modifiers: {
            onModifyMoves: (currentMoves, { board, piece, from, orientation }) => {
                if (piece.type !== pieceType) return currentMoves;

                let dx = 0;
                let dy = 0;

                if (direction === 'forward') dy = piece.color === 'white' ? 1 : -1;
                else if (direction === 'backward') dy = piece.color === 'white' ? -1 : 1;
                else if (direction === 'left') dx = piece.color === 'white' ? -1 : 1;
                else if (direction === 'right') dx = piece.color === 'white' ? 1 : -1;

                const vector = Vector.rotate(dx, dy, orientation ?? 0);
                const targetCoord = new Coordinate(from.x + vector.dx, from.y + vector.dy);

                if (targetCoord.isValid()) {
                    const targetSquare = board.getSquare(targetCoord);
                    const occupant = targetSquare?.piece;

                    if (!occupant) {
                        return [...currentMoves, new Move(from, targetCoord, piece, null)];
                    } else if (options.capture && occupant.color !== piece.color) {
                        return [...currentMoves, new Move(from, targetCoord, piece, occupant)];
                    } else if (options.canMoveToOccupied) {
                        // Special cases where moving onto occupied square is allowed but not a capture
                        return [...currentMoves, new Move(from, targetCoord, piece, null)];
                    }
                }
                return currentMoves;
            }
        }
    })
};

