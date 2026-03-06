import { definePact } from '../PactLogic';
import { PactUtils } from '../PactUtils';

/**
 * The Oracle Pact
 * Bonus (Prescience): (No active logic yet)
 * Malus (Inevitable Fate): If you have an opportunity to capture an undefended piece and don't take it, you must sacrifice a piece.
 */
export const TheOracle = definePact('oracle')
    .bonus('prescience', {})
    .malus('inevitable_fate', {
        onTurnStart: (context) => {
            const { game, playerId } = context;
            const capablePieceIds = PactUtils.getCaptureOpportunities(game, playerId, true);
            context.updateState({ capablePieceIds });
        },
        onMove: (move, context) => {
            const { game, playerId } = context;
            const isPlayerMove = move?.piece?.color === playerId;

            if (isPlayerMove) {
                const state = context.state || {};
                const capablePieceIds = state.capablePieceIds || [];
                if (capablePieceIds.length === 0) return;

                let satisfied = false;
                if (move.capturedPiece) {
                    const opponentColor = playerId === 'white' ? 'black' : 'white';
                    if (!PactUtils.isSquareAttacked(game, move.to, opponentColor)) satisfied = true;
                }

                if (!satisfied) {
                    let victimId: string;
                    if (capablePieceIds.includes(move.piece.id)) {
                        victimId = move.piece.id;
                        PactUtils.removePiece(game, move.to);
                    } else {
                        victimId = capablePieceIds[Math.floor(Math.random() * capablePieceIds.length)];
                        const victim = context.query.pieces().friendly().byId(victimId);
                        if (victim) PactUtils.removePiece(game, victim.coord);
                    }
                    PactUtils.notifyPactEffect(game, 'oracle', 'punishment', 'malus', 'skull');
                }
            }
        }
    })
    .build();


