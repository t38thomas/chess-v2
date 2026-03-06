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
                const state = context.state || {};
                context.updateState({ snipeActive: !state.snipeActive });
                return true;
            }
        },
        modifiers: {
            onGetPseudoMoves: ({ board, piece, from, moves, game }, context) => {
                if (piece.type !== 'bishop' || !game || !context) return;

                const state = context.state || {};
                const isSnipeActive = state.snipeActive;
                if (!isSnipeActive) return;

                MoveGenerator.BISHOP_DIRS.forEach(([dx, dy]) => {
                    const d1 = new Coordinate(from.x + dx, from.y + dy);
                    const d2 = new Coordinate(from.x + dx * 2, from.y + dy * 2);

                    const checkSquare = (coord: Coordinate) => {
                        if (coord.isValid()) {
                            const target = board.getSquare(coord);
                            if (target?.piece && target.piece.color !== piece.color) {
                                const existingIndex = moves.findIndex(m => m.to.equals(coord));
                                if (existingIndex !== -1) {
                                    const existing = moves[existingIndex];
                                    moves[existingIndex] = new Move(existing.from, existing.to, existing.piece, existing.capturedPiece, existing.isCastling, existing.isEnPassant, existing.isSwap, true, existing.promotion);
                                } else {
                                    moves.push(new Move(from, coord, piece, target.piece, false, false, false, true));
                                }
                                return true; // Piece found (blocked)
                            }
                            return target?.piece !== null; // Any piece blocks
                        }
                        return true;
                    };

                    if (!checkSquare(d1)) checkSquare(d2);
                });
            },
            onExecuteMove: (game, move, context) => {
                if (!context) return;
                const state = context.state || {};
                if (move.isSnipe && state.snipeActive) {
                    game.board.movePiece(move.to, move.from);
                }
                if (move.piece.type === 'bishop') {
                    context.updateState({ snipeActive: false });
                }
            }
        },
        getTurnCounters: (context) => {
            const state = context.state || {};
            if (state.snipeActive) {
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
            getMaxRange: (piece, context) => piece.type === 'bishop' ? 4 : 8
        }
    })
    .build();

