import { definePact } from '../PactLogic';
import { PactUtils } from '../PactUtils';

/**
 * The Heir Pact
 * Bonus (Bloodline): When your Queen is captured, a random minor piece is promoted to a new Queen.
 * Malus (Young Queen): Initial Queen cannot capture any piece except the King. Successor Queens have no such restriction.
 */
export const TheHeir = definePact('heir')
    .bonus('bloodline', {
        target: 'self',
        onCapture: (payload, context) => {
            const { game, playerId } = context;
            const capturedPiece = payload.victim;
            if (capturedPiece?.color === playerId && capturedPiece.type === 'queen') {
                const minorPieces = PactUtils.findPiecesByTypes(game, playerId, ['rook', 'bishop', 'knight']);
                if (minorPieces.length > 0) {
                    const [successor] = PactUtils.pickRandom(minorPieces, 1);
                    if (successor) {
                        PactUtils.promotePiece(game, successor.coord, 'queen');
                        const ctx = context as import('../PactLogic').PactContextWithState<any>;
                        const state = ctx.state || {};
                        ctx.updateState({
                            successorIds: {
                                ...(state.successorIds || {}),
                                [successor.piece.id]: true
                            }
                        });

                        PactUtils.notifyPactEffect(game, 'heir', 'bloodline', 'bonus', 'crown');
                    }
                }
            }
        }
    })
    .malus('young_queen', {
        target: 'self',
        modifiers: {
            canCapture: (params, context) => {
                if (params.attacker.type === 'queen') {
                    const sharedState = params.game?.pactState[`bloodline_${params.attacker.color}`] || {};
                    const isSuccessor = sharedState.successorIds?.[params.attacker.id];
                    if (!isSuccessor) return params.victim.type === 'king';
                }
                return true;
            }
        },
        getTurnCounters: (context) => {
            const { game, playerId } = context;
            const queens = PactUtils.findPieces(game, playerId, 'queen');
            if (queens.length === 0) return [];

            const sharedState = game.pactState[`bloodline_${playerId}`] || {};
            const isSuccessor = queens.some(q => sharedState.successorIds?.[q.piece.id]);

            return [{
                id: 'queen_status',
                label: isSuccessor ? 'queen_successor' : 'queen_initial',
                value: isSuccessor ? 100 : 0,
                pactId: 'heir',
                type: 'counter'
            }];
        }
    })
    .build();

