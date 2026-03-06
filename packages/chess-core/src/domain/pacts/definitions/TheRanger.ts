import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';
import { Move } from '../../models/Move';
import { MoveGenerator } from '../../rules/MoveGenerator';
import { Coordinate } from '../../models/Coordinate';

/**
 * The Ranger Pact
 * Bonus (Snipe): Active toggle. While active, Bishops capture at distance 1-2 without moving.
 * Malus (Short Sighted): Bishops have a maximum range of 4 squares.
 */
export const TheRanger = definePact('ranger')
    .bonus('snipe', {
        activeAbility: {
            id: 'snipe',
            name: 'perks.snipe.name',
            description: 'perks.snipe.description',
            icon: 'crosshairs',
            targetType: 'none',
            repeatable: true,
            execute: (context) => {
                context.updateState((prev) => ({ ...prev, snipeActive: !prev.snipeActive }));
                return true;
            }
        },
        modifiers: {
            onModifyMoves: (currentMoves, { board, piece, from }, context) => {
                if (piece.type !== 'bishop') return currentMoves;
                if (!context.state.snipeActive) return currentMoves;

                const newMoves = [...currentMoves];

                MoveGenerator.BISHOP_DIRS.forEach(([dx, dy]) => {
                    const d1 = new Coordinate(from.x + dx, from.y + dy);
                    const d2 = new Coordinate(from.x + dx * 2, from.y + dy * 2);

                    const checkSquare = (coord: Coordinate) => {
                        if (coord.isValid()) {
                            const target = board.getSquare(coord);
                            if (target?.piece && target.piece.color !== piece.color) {
                                const existingIndex = newMoves.findIndex(m => m.to.equals(coord));
                                if (existingIndex !== -1) {
                                    const existing = newMoves[existingIndex];
                                    newMoves[existingIndex] = new Move(existing.from, existing.to, existing.piece, existing.capturedPiece, existing.isCastling, existing.isEnPassant, existing.isSwap, true, existing.promotion);
                                } else {
                                    newMoves.push(new Move(from, coord, piece, target.piece, false, false, false, true));
                                }
                                return true; // Piece found (blocked)
                            }
                            return target?.piece !== null; // Any piece blocks
                        }
                        return true;
                    };

                    if (!checkSquare(d1)) checkSquare(d2);
                });

                return newMoves;
            },
            onExecuteMove: (game, move, context) => {
                if (move.isSnipe && context.state.snipeActive) {
                    game.board.movePiece(move.to, move.from);
                }
            }
        },
        getTurnCounters: (context) => {
            if (context.state.snipeActive) {
                return [{
                    id: 'snipe_ready',
                    label: 'snipe_ready',
                    value: 1,
                    pactId: 'ranger',
                    type: 'counter',
                    maxValue: 1,
                    subLabel: 'Active'
                }];
            }
            return [];
        }
    })
    .malus('short_sighted', {
        modifiers: {
            getMaxRange: (piece) => piece.type === 'bishop' ? 4 : 8
        }
    })
    .build();


