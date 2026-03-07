import { definePact } from '../PactLogic';
import { PactUtils } from '../PactUtils';

interface OracleMalusState {
    capablePieceIds: string[];
}

/**
 * The Oracle Pact
 * Bonus (Prescience): UI counter shows undefended enemy pieces.
 * Malus (Inevitable Fate): If you have an opportunity to capture an undefended piece and don't take it, you must sacrifice a piece.
 */
export const TheOracle = definePact('oracle')
    .bonus('prescience', {
        target: 'self',
        icon: 'eye',
        ranking: 3,
        category: 'special',
    })
    .malus<OracleMalusState>('inevitable_fate', {
        target: 'self',
        icon: 'skull',
        ranking: 4,
        category: 'special',
        initialState: () => ({ capablePieceIds: [] }),
        onTurnStart: (context) => {
            const { game, playerId } = context;
            const capablePieceIds = PactUtils.getCaptureOpportunities(game, playerId, true);
            context.updateState({ capablePieceIds });
        },
        onMove: (move, context) => {
            const { game, playerId } = context;
            const isPlayerMove = move?.piece?.color === playerId;

            if (isPlayerMove) {
                const capablePieceIds = context.state.capablePieceIds;
                if (capablePieceIds.length === 0) return;

                let satisfied = false;
                if (move.capturedPiece) {
                    const opponentColor = playerId === 'white' ? 'black' : 'white';
                    if (!PactUtils.isSquareAttacked(game, move.to, opponentColor)) satisfied = true;
                }

                if (!satisfied) {
                    // Use game.rng instead of Math.random for deterministic results
                    const rng = game.rng ?? Math.random;
                    let victimId: string;
                    if (capablePieceIds.includes(move.piece.id)) {
                        victimId = move.piece.id;
                        PactUtils.removePiece(game, move.to);
                    } else {
                        const idx = Math.floor(rng() * capablePieceIds.length);
                        victimId = capablePieceIds[idx];
                        const victim = context.query.pieces().friendly().byId(victimId);
                        if (victim) PactUtils.removePiece(game, victim.coord);
                    }
                    PactUtils.notifyPactEffect(game, 'oracle', 'punishment', 'malus', 'skull');
                }
            }
        },
        getTurnCounters: (context) => {
            const count = context.state.capablePieceIds.length;
            if (count > 0) {
                return [{
                    id: 'inevitable_fate_pending',
                    label: 'capture_required',
                    value: count,
                    pactId: 'oracle',
                    type: 'counter',
                }];
            }
            return [];
        }
    })
    .build();



