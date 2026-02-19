import { PactEffect } from '../PactLogic';
import { PieceType, Piece } from '../../models/Piece';
import { MoveGenerator } from '../../rules/MoveGenerator';
import { RuleEngine } from '../../rules/RuleEngine';
import { MovementUtils } from '../utils/MovementUtils';
import { PactUtils } from '../PactUtils';

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
            onGetPseudoMoves: ({ board, from, piece, moves, perks, game }) => {
                if (piece.type === typeA || piece.type === typeB) {
                    const targetType = piece.type === typeA ? typeB : typeA;
                    moves.length = 0;

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
                        MoveGenerator.addSteppingMoves(board, from, dirs, piece, moves);
                    } else {
                        const range = RuleEngine.getMaxRange(piece, perks || []);
                        MoveGenerator.addSlidingMoves(board, from, dirs, piece, moves, range, perks || [], game);
                    }
                }
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
            onGetPseudoMoves: ({ from, piece, moves }) => {
                if (piece.type === pieceType) {
                    for (let i = moves.length - 1; i >= 0; i--) {
                        const m = moves[i];
                        const dx = Math.abs(m.to.x - from.x);
                        const dy = Math.abs(m.to.y - from.y);
                        if (dx > 0 && dy > 0 && dx === dy) moves.splice(i, 1);
                    }
                }
            }
        }
    }),

    /**
     * Blocks moves on specific axes (horizontal, vertical, diagonal) for a specific piece type.
     */
    blockMoves: (pieceType: PieceType, axes: ('horizontal' | 'vertical' | 'diagonal')[]): PactEffect => ({
        modifiers: {
            onGetPseudoMoves: ({ piece, from, moves, orientation }) => {
                if (piece.type !== pieceType) return;
                for (const axis of axes) {
                    if (axis === 'horizontal') {
                        MovementUtils.blockHorizontalMoves(moves, from, orientation ?? 0);
                    } else if (axis === 'vertical') {
                        MovementUtils.blockVerticalMoves(moves, from, orientation ?? 0);
                    } else if (axis === 'diagonal') {
                        MovementUtils.blockDiagonalMoves(moves, from);
                    }
                }
            }
        }
    }),

    /**
     * Adds single-step moves in specified relative directions for a specific piece type.
     */
    addSingleStepMoves: (pieceType: PieceType, dirs: { dx: number, dy: number }[]): PactEffect => ({
        modifiers: {
            onGetPseudoMoves: ({ board, piece, from, moves, orientation }) => {
                if (piece.type !== pieceType) return;
                MovementUtils.addSingleStepMoves(board, piece, from, moves, dirs, orientation ?? 0);
            }
        }
    }),

    /**
     * Prevents a piece from moving to or capturing on edge squares.
     */
    restrictFromEdge: (pieceType: PieceType): PactEffect => ({
        modifiers: {
            onGetPseudoMoves: (params) => {
                if (params.piece.type !== pieceType) return;
                for (let i = params.moves.length - 1; i >= 0; i--) {
                    if (PactUtils.isEdgeSquare(params.moves[i].to)) {
                        params.moves.splice(i, 1);
                    }
                }
            }
        }
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
    })
};
