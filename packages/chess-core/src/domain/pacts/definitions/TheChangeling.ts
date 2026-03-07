import { definePact } from '../PactLogic';
import { Move } from '../../models/Move';
import { MoveGenerator } from '../../rules/MoveGenerator';
import { PactUtils } from '../PactUtils';
import { Effects } from '../PactEffects';
import { PieceType } from '../../models/Piece';

interface ChangelingState extends Record<string, unknown> {
    'mimicry_activeMimics'?: Record<string, { data: { type: PieceType }; expiresAtTurn: number }>;
    'unstable_identity'?: number;
}

/**
 * The Changeling Pact
 * Bonus (Mimicry): Pawns that capture a piece mimic its movement for one turn (with UI counter).
 * Malus (Unstable Identity): If you don't capture for 5 turns, your most advanced piece demotes to a pawn.
 */
export const TheChangeling = definePact<ChangelingState, ChangelingState>('changeling')
    .bonus('mimicry', {
        icon: 'shape',
        ranking: 4,
        category: 'Movement',
        effects: [
            Effects.state.temporaryState<{ type: PieceType }, ChangelingState>({
                key: 'mimicry_activeMimics',
                durationInTurns: 1,
                triggerOn: ['capture'],
                extractData: (payload: unknown, event) => {
                    if (event === 'capture' && payload) {
                        const move = payload as Move;
                        if (move.piece.type === 'pawn') {
                            return { recordKey: move.piece.id, data: { type: move.capturedPiece?.type || 'pawn' } };
                        }
                    }
                    return null;
                }
            })
        ],
        modifiers: {
            onModifyMoves: (currentMoves, params, context) => {
                const state = context.state.mimicry_activeMimics;
                if (!state) return currentMoves;

                const mimicData = state[params.piece.id];
                if (mimicData) {
                    const phantomPiece = params.piece.clone();
                    phantomPiece.type = mimicData.data.type as PieceType;

                    const additionalMoves = MoveGenerator.getPseudoLegalMoves(
                        params.board,
                        phantomPiece,
                        params.from,
                        params.game?.enPassantTarget,
                        [],
                        new Set(),
                        params.game
                    );

                    const newMoves = [...currentMoves];
                    additionalMoves.forEach(m => {
                        if (!newMoves.some(existing => existing.to.equals(m.to))) {
                            newMoves.push(new Move(m.from, m.to, params.piece, m.capturedPiece, m.isCastling, m.isEnPassant, m.isSwap, false, m.promotion));
                        }
                    });
                    return newMoves;
                }
                return currentMoves;
            }
        },
        onCapture: (payload, context) => {
            if (payload.piece.type === 'pawn' && payload.piece.color === context.playerId) {
                PactUtils.notifyPactEffect(context.game, 'changeling', 'mimicry', 'bonus', 'cached');
            }
        }
    })
    .malus('unstable_identity', {
        icon: 'alert-circle-outline',
        ranking: -3,
        category: 'Board Transform',
        effects: [
            Effects.state.onStreak({
                key: 'unstable_identity',
                maxValue: 5,
                incrementOn: ['turn_start'],
                resetOn: ['capture'],
                filter: (event, payload, context) => {
                    if (event === 'turn_start' && payload !== context.playerId) return false;
                    if (event === 'capture' && payload) {
                        const move = payload as Move;
                        if (move.piece.color !== context.playerId) return false;
                    }
                    return true;
                },
                onMax: (context, _payload) => {
                    const myPieces = context.query.pieces().friendly().filter(p => p.piece.type !== 'pawn' && p.piece.type !== 'king');

                    if (myPieces.length > 0) {
                        // Deterministic: pick the one most advanced (highest Y for white, lowest for black)
                        // then leftmost (lowest X).
                        const sorted = [...myPieces].sort((a, b) => {
                            const dy = context.playerId === 'white' ? b.coord.y - a.coord.y : a.coord.y - b.coord.y;
                            if (dy !== 0) return dy;
                            return a.coord.x - b.coord.x;
                        });
                        const victim = sorted[0];
                        if (victim) {
                            victim.piece.type = 'pawn';
                            PactUtils.notifyPactEffect(context.game, 'changeling', 'demotion', 'malus', 'dna');
                        }
                    }
                }
            })
        ],
        getTurnCounters: (context) => {
            const counters: any[] = [];

            const val = context.state.unstable_identity || 0;

            counters.push({
                id: 'unstable_identity_counter',
                label: 'unstable_identity_progress',
                value: val,
                pactId: 'changeling',
                type: 'counter',
                maxValue: 5,
                subLabel: `${val}/5`
            });

            const mimics = context.state.mimicry_activeMimics;
            if (mimics) {
                const mimicCount = Object.keys(mimics).length;
                if (mimicCount > 0) {
                    counters.push({
                        id: 'mimicry_counter',
                        label: 'mimicry_active_mimics',
                        value: mimicCount,
                        pactId: 'changeling',
                        type: 'counter'
                    });
                }
            }
            return counters;
        }
    })
    .build();

