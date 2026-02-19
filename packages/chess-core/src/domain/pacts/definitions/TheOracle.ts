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
        initialState: () => [],
        onTurnStart: (context) => {
            const { game, playerId } = context;
            const capablePieceIds = PactUtils.getCaptureOpportunities(game, playerId, true);
            game.pactState['oracle_capable'] = capablePieceIds;
        },
        onEvent: (event, payload, context) => {
            const { game, playerId } = context;
            if (event === 'move') {
                const move = payload as any;
                if (move?.piece?.color !== playerId) return;

                const capablePieceIds = game.pactState['oracle_capable'] || [];
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
                        const victimSquare = game.board.getAllSquares().find(s => s.piece?.id === victimId);
                        if (victimSquare) PactUtils.removePiece(game, victimSquare.coordinate);
                    }
                    PactUtils.notifyPactEffect(game, 'oracle', 'punishment', 'malus', 'skull');
                }
            }
        }
    })
    .build();

