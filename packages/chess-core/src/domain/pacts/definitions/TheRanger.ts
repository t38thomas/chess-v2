import { PactLogic, RuleModifiers, PactContext, MoveParams } from '../PactLogic';
import { PieceType, Piece } from '../../models/Piece';
import { GameEvent } from '../../GameTypes';
import { Move } from '../../models/Move';
import { MoveGenerator } from '../../rules/MoveGenerator';
import { Coordinate } from '../../models/Coordinate';

export class RangerBonus extends PactLogic {
    id = 'snipe';

    activeAbility = {
        id: 'snipe',
        name: 'perks.snipe.name',
        description: 'perks.snipe.description',
        icon: 'crosshairs',
        targetType: 'none' as const,
        repeatable: true,
        execute: (context: PactContext, params: any) => {
            const state = context.game.pactState;
            const key = `ranger_snipe_active_${context.playerId}`;
            state[key] = !state[key];
            return true;
        }
    };

    getRuleModifiers(): RuleModifiers {
        return {
            onGetPseudoMoves: (params: MoveParams) => {
                const { board, piece, from, moves, game } = params;
                if (piece.type !== 'bishop' || !game) return;

                const playerId = piece.color;
                const snipeKey = `ranger_snipe_active_${playerId}`;
                const isSnipeActive = game.pactState[snipeKey];

                // Snipe is available for distance 1 and 2 captures
                MoveGenerator.BISHOP_DIRS.forEach(([dx, dy]) => {
                    const d1 = new Coordinate(from.x + dx, from.y + dy);
                    const d2 = new Coordinate(from.x + dx * 2, from.y + dy * 2);

                    // Check distance 1
                    if (d1.isValid()) {
                        const target1 = board.getSquare(d1);
                        if (target1 && target1.piece && target1.piece.color !== piece.color) {
                            // Enemy at distance 1
                            // Check if a move to d1 already exists
                            const existingIndex = moves.findIndex(m => m.to.equals(d1));
                            if (existingIndex !== -1) {
                                if (isSnipeActive) {
                                    const existing = moves[existingIndex];
                                    moves[existingIndex] = new Move(
                                        existing.from,
                                        existing.to,
                                        existing.piece,
                                        existing.capturedPiece,
                                        existing.isCastling,
                                        existing.isEnPassant,
                                        existing.isSwap,
                                        true, // isSnipe
                                        existing.promotion
                                    );
                                }
                            } else {
                                // If doesn't exist (should not happen for normal capture, but just in case)
                                if (isSnipeActive) {
                                    moves.push(new Move(from, d1, piece, target1.piece, false, false, false, true));
                                }
                            }
                        } else if (target1 && !target1.piece) {
                            // Empty at d1, check d2
                            if (d2.isValid()) {
                                const target2 = board.getSquare(d2);
                                if (target2 && target2.piece && target2.piece.color !== piece.color) {
                                    // Enemy at distance 2
                                    const existingIndex = moves.findIndex(m => m.to.equals(d2));
                                    if (existingIndex !== -1) {
                                        if (isSnipeActive) {
                                            const existing = moves[existingIndex];
                                            moves[existingIndex] = new Move(
                                                existing.from,
                                                existing.to,
                                                existing.piece,
                                                existing.capturedPiece,
                                                existing.isCastling,
                                                existing.isEnPassant,
                                                existing.isSwap,
                                                true, // isSnipe
                                                existing.promotion
                                            );
                                        }
                                    } else {
                                        if (isSnipeActive) {
                                            moves.push(new Move(from, d2, piece, target2.piece, false, false, false, true));
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
            },
            onExecuteMove: (game, move) => {
                const key = `ranger_snipe_active_${move.piece.color}`;
                if (move.isSnipe && game.pactState[key]) {
                    // It's a Snipe! Move the piece back immediately.
                    // The move itself was already executed by ChessGame.
                    // We just move it back.
                    game.board.movePiece(move.to, move.from);

                    // Reset on any Bishop action to avoid saving it (turn economy rule)
                    game.pactState[key] = false;
                } else if (move.piece.type === 'bishop') {
                    // Any bishop move/capture resets the toggle to avoid "saving" it
                    game.pactState[key] = false;
                }
            }
        };
    }

    getTurnCounters(context: PactContext): any[] {
        const key = `ranger_snipe_active_${context.playerId}`;
        const active = context.game.pactState[key];
        if (active) {
            return [{
                id: 'snipe_ready',
                label: 'snipe_ready',
                value: 1,
                pactId: this.id,
                type: 'counter',
                maxValue: 1,
                subLabel: 'Active'
            }];
        }
        return [];
    }
}

export class RangerMalus extends PactLogic {
    id = 'short_sighted';

    getRuleModifiers(): RuleModifiers {
        return {
            getMaxRange: (piece: Piece) => {
                if (piece.type === 'bishop') {
                    return 4;
                }
                return 8;
            }

        };
    }
}
