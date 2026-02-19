import { definePact } from '../PactLogic';
import { Move } from '../../models/Move';
import { MoveGenerator } from '../../rules/MoveGenerator';
import { PactUtils } from '../PactUtils';

/**
 * The Changeling Pact
 * Bonus (Mimicry): Pawns that capture a piece mimic its movement for one turn.
 * Malus (Unstable Identity): If you don't capture for 5 turns, a random piece demotes to a pawn.
 */
export const TheChangeling = definePact('changeling')
    .bonus('mimicry', {
        modifiers: {
            onGetPseudoMoves: (params) => {
                const game = params.game as any;
                if (!game?.pactState?.mimicry_activeMimics) return;

                const mimicData = game.pactState.mimicry_activeMimics[params.piece.id];
                if (mimicData) {
                    const phantomPiece = params.piece.clone();
                    phantomPiece.type = mimicData.type;

                    const moves = MoveGenerator.getPseudoLegalMoves(
                        params.board,
                        phantomPiece,
                        params.from,
                        params.game?.enPassantTarget,
                        []
                    );

                    moves.forEach(m => {
                        if (!params.moves.some(existing => existing.to.equals(m.to))) {
                            params.moves.push(new Move(m.from, m.to, params.piece, m.capturedPiece, m.isCastling, m.isEnPassant, m.isSwap, false, m.promotion));
                        }
                    });
                }
            },
            onExecuteMove: (game: any, move) => {
                if (move.piece.type === 'pawn' && move.capturedPiece) {
                    if (!game.pactState) game.pactState = {};
                    if (!game.pactState.mimicry_activeMimics) game.pactState.mimicry_activeMimics = {};

                    game.pactState.mimicry_activeMimics[move.piece.id] = {
                        type: move.capturedPiece.type,
                        expiresAtTurn: game.totalTurns + 1
                    };
                    PactUtils.notifyPactEffect(game, 'changeling', 'mimicry', 'bonus', 'cached');
                }
            }
        },
        onEvent: (event, payload, context) => {
            if (event === 'turn_start') {
                const mimics = (context.game as any).pactState?.mimicry_activeMimics;
                if (!mimics) return;
                for (const id in mimics) {
                    if (context.game.totalTurns > mimics[id].expiresAtTurn) {
                        delete mimics[id];
                    }
                }
            }
        }
    })
    .malus('unstable_identity', {
        initialState: () => 0,
        onEvent: (event, payload, context) => {
            const { game, playerId } = context;
            const key = `unstable_identity_${playerId}`;

            if (event === 'capture') {
                const move = payload as Move;
                if (move.piece.color === playerId) {
                    game.pactState[key] = 0;
                }
            } else if (event === 'turn_start' && payload === playerId) {
                game.pactState[key] = (game.pactState[key] || 0) + 1;

                if (game.pactState[key] >= 5) {
                    const myPieces = game.board.getAllSquares()
                        .map(s => s.piece)
                        .filter(p => p && p.color === playerId && p.type !== 'pawn' && p.type !== 'king');

                    if (myPieces.length > 0) {
                        const victim = myPieces[Math.floor(Math.random() * myPieces.length)];
                        victim!.type = 'pawn';
                        PactUtils.notifyPactEffect(game, 'changeling', 'demotion', 'malus', 'dna');
                    }
                    game.pactState[key] = 0;
                }
            }
        },
        getTurnCounters: (context) => {
            const val = context.game.pactState[`unstable_identity_${context.playerId}`] || 0;
            return [{
                id: 'unstable_identity_counter',
                label: 'unstable_identity_progress',
                value: val,
                pactId: 'unstable_identity',
                type: 'counter',
                maxValue: 5,
                subLabel: `${val}/5`
            }];
        }
    })
    .build();

