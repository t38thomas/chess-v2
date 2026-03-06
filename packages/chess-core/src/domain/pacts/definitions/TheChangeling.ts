import { definePact } from '../PactLogic';
import { Move } from '../../models/Move';
import { MoveGenerator } from '../../rules/MoveGenerator';
import { PactUtils } from '../PactUtils';
import { Effects } from '../PactEffects';

/**
 * The Changeling Pact
 * Bonus (Mimicry): Pawns that capture a piece mimic its movement for one turn.
 * Malus (Unstable Identity): If you don't capture for 5 turns, a random piece demotes to a pawn.
 */
export const TheChangeling = definePact('changeling')
    .bonus('mimicry', {
        effects: [
            Effects.state.temporaryState<{ type: string }>({
                key: 'mimicry_activeMimics',
                durationInTurns: 1,
                triggerOn: ['capture'],
                extractData: (payload: Move, event) => {
                    if (event === 'capture' && payload.piece.type === 'pawn') {
                        return { recordKey: payload.piece.id, data: { type: payload.capturedPiece?.type || 'pawn' } };
                    }
                    return null;
                }
            })
        ],
        modifiers: {
            onGetPseudoMoves: (params, context) => {
                const state = context.state['mimicry_activeMimics'];
                if (!state) return;

                const mimicData = state[params.piece.id];
                if (mimicData) {
                    const phantomPiece = params.piece.clone();
                    phantomPiece.type = mimicData.data.type as any;

                    const moves = MoveGenerator.getPseudoLegalMoves(
                        params.board,
                        phantomPiece,
                        params.from,
                        params.game?.enPassantTarget,
                        [],
                        new Set(),
                        params.game
                    );

                    moves.forEach(m => {
                        if (!params.moves.some(existing => existing.to.equals(m.to))) {
                            params.moves.push(new Move(m.from, m.to, params.piece, m.capturedPiece, m.isCastling, m.isEnPassant, m.isSwap, false, m.promotion));
                        }
                    });
                }
            }
        },
        onCapture: (payload, context) => {
            if (payload.piece.type === 'pawn' && payload.piece.color === context.playerId) {
                PactUtils.notifyPactEffect(context.game, 'changeling', 'mimicry', 'bonus', 'cached');
            }
        }
    })
    .malus('unstable_identity', {
        effects: [
            Effects.state.onStreak({
                key: 'unstable_identity',
                maxValue: 5,
                incrementOn: ['turn_start'],
                resetOn: ['capture'],
                filter: (event, payload, context) => {
                    if (event === 'turn_start' && payload !== context.playerId) return false;
                    if (event === 'capture' && payload.piece.color !== context.playerId) return false;
                    return true;
                },
                onMax: (context) => {
                    const myPieces = context.query.pieces().friendly().filter(p => p.piece.type !== 'pawn' && p.piece.type !== 'king');

                    if (myPieces.length > 0) {
                        const victim = PactUtils.pickRandom(myPieces, 1)[0];
                        if (victim) {
                            victim.piece.type = 'pawn';
                            PactUtils.notifyPactEffect(context.game, 'changeling', 'demotion', 'malus', 'dna');
                        }
                    }
                }
            })
        ],
        getTurnCounters: (context) => {
            const val = context.state['unstable_identity'] || 0;
            return [{
                id: 'unstable_identity_counter',
                label: 'unstable_identity_progress',
                value: val,
                pactId: 'changeling',
                type: 'counter',
                maxValue: 5,
                subLabel: `${val}/5`
            }];
        }
    })
    .build();

