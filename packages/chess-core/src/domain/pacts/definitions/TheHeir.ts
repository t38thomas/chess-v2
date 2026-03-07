import { definePact } from '../PactLogic';
import { PactUtils } from '../PactUtils';

/** Bonus state: tracks which queen IDs are successors (not subject to Young Queen restriction). */
interface HeirBonusState {
    generations: Record<string, number>; // pieceId -> generation (0, 1, 2...)
}

/**
 * The Heir Pact
 * Bonus (Bloodline): When your Queen is captured, a random minor piece is promoted to a new Queen.
 * Malus (Young Queen): Captures are restricted by Queen generation (Gen 0: King only, Gen 1: No Queen/Rook).
 */
export const TheHeir = definePact<HeirBonusState, HeirBonusState>('heir')
    .bonus('bloodline', {
        icon: 'water-plus',
        ranking: 5,
        category: 'Board Transform',
        target: 'self',
        initialState: () => ({ generations: {} }),
        onCapture: (payload, context) => {
            const { game, playerId } = context;
            const capturedPiece = payload.capturedPiece;
            if (capturedPiece?.color === playerId && capturedPiece.type === 'queen') {
                const minorPieces = context.query.pieces().ofTypes(['rook', 'bishop', 'knight']);
                if (minorPieces.length > 0) {
                    const [successor] = PactUtils.pickRandom(minorPieces, 1, game.rng);
                    if (successor) {
                        const gens: Record<string, number> = context.state.generations;
                        const currentGen = gens[capturedPiece.id] ?? 0;
                        PactUtils.promotePiece(game, successor.coord, 'queen');
                        context.updateState((prev) => ({
                            generations: {
                                ...(prev.generations || {}),
                                [successor.piece.id]: currentGen + 1
                            }
                        }));

                        PactUtils.notifyPactEffect(game, 'heir', 'bloodline', 'bonus', 'crown');
                    }
                }
            }
        }
    })
    .malus('young_queen', {
        icon: 'baby-carriage',
        ranking: -3,
        category: 'Capture Rules',
        target: 'self',
        modifiers: {
            canCapture: (params, context) => {
                if (params.attacker.type === 'queen') {
                    const sharedState = context.getSiblingState();
                    const gens: Record<string, number> = sharedState?.generations ?? {};
                    const gen = gens[params.attacker.id] ?? 0;

                    if (gen === 0) return params.victim.type === 'king';
                    if (gen === 1) return params.victim.type !== 'queen' && params.victim.type !== 'rook';
                    return true;
                }
                return true;
            }
        },
        getTurnCounters: (context) => {
            const queens = context.query.pieces().ofTypes(['queen']);
            if (queens.length === 0) return [];

            const sharedState = context.getSiblingState();
            const gens: Record<string, number> = sharedState?.generations ?? {};
            const maxGen = Math.max(...queens.map(q => gens[q.piece.id] ?? 0));

            return [{
                id: 'queen_generation',
                label: 'queen_rank',
                value: maxGen,
                pactId: 'heir',
                type: 'counter',
                subLabel: `Gen ${maxGen}`
            }];
        }
    })
    .build();
