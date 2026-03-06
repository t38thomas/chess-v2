import { definePact } from '../PactLogic';
import { PactUtils } from '../PactUtils';

/** Bonus state: tracks which queen IDs are successors (not subject to Young Queen restriction). */
interface HeirBonusState {
    successorIds: Record<string, boolean>;
}

/**
 * The Heir Pact
 * Bonus (Bloodline): When your Queen is captured, a random minor piece is promoted to a new Queen.
 * Malus (Young Queen): Initial Queen cannot capture any piece except the King. Successor Queens have no such restriction.
 */
export const TheHeir = definePact('heir')
    .bonus<HeirBonusState>('bloodline', {
        target: 'self',
        initialState: () => ({ successorIds: {} }),
        onCapture: (payload, context) => {
            const { game, playerId } = context;
            const capturedPiece = payload.capturedPiece;
            if (capturedPiece?.color === playerId && capturedPiece.type === 'queen') {
                const minorPieces = context.query.pieces().ofTypes(['rook', 'bishop', 'knight']);
                if (minorPieces.length > 0) {
                    const [successor] = PactUtils.pickRandom(minorPieces, 1);
                    if (successor) {
                        PactUtils.promotePiece(game, successor.coord, 'queen');
                        context.updateState((prev) => ({
                            successorIds: {
                                ...prev.successorIds,
                                [successor.piece.id]: true
                            }
                        }));

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
                    // WHY: sibling state type (HeirBonusState) cannot be statically inferred here;
                    // we narrow manually via optional chaining.
                    const sharedState = context.getSiblingState<HeirBonusState>() ?? { successorIds: {} };
                    const isSuccessor = sharedState.successorIds?.[params.attacker.id];
                    if (!isSuccessor) return params.victim.type === 'king';
                }
                return true;
            }
        },
        getTurnCounters: (context) => {
            const queens = context.query.pieces().ofTypes(['queen']);
            if (queens.length === 0) return [];

            const sharedState = context.getSiblingState<HeirBonusState>() ?? { successorIds: {} };
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
