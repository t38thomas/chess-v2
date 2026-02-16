import { PactLogic, PactContext, RuleModifiers } from '../PactLogic';
import { GameEvent } from '../../GameTypes';
import { PactUtils } from '../PactUtils';
import { Move } from '../../models/Move';

// We use a WeakMap to store the turn-start state to avoid polluting global state
// Key is Game instance -> value is "List of Piece IDs that had capture opportunities"
const opportunities = new WeakMap<any, string[]>();

export class OracleBonus extends PactLogic {
    id = 'prescience';
}

export class OracleMalus extends PactLogic {
    id = 'inevitable_fate';

    onTurnStart(context: PactContext): void {
        const { game, playerId } = context;
        // Check which pieces have capture opportunities of an undefended piece at start of turn
        const capablePieceIds = PactUtils.getCaptureOpportunities(game, playerId, true);
        opportunities.set(game, capablePieceIds);
    }

    onEvent(event: GameEvent, payload: any, context: PactContext): void {
        const { game, playerId } = context;

        if (event === 'move') {
            const move = payload as Move;

            // Only check moves made by this player
            if (move.piece.color !== playerId) return;

            const capablePieceIds = opportunities.get(game) || [];

            // If no piece had an opportunity to capture an undefended piece, we are free.
            if (capablePieceIds.length === 0) return;

            // If we HAD an opportunity, we MUST have taken it.
            // Did we capture an undefended piece?
            let satisfied = false;

            if (move.capturedPiece) {
                const opponentColor = playerId === 'white' ? 'black' : 'white';

                // After the capture, the piece is on `move.to`.
                // If `move.to` is attacked by opponent, then the piece we captured was "defended".
                // If NOT attacked, it was "undefended".

                const isAttackedNow = PactUtils.isSquareAttacked(game, move.to, opponentColor);

                if (!isAttackedNow) {
                    satisfied = true;
                }
            }

            if (!satisfied) {
                // Punishment: 
                // We need to sacrifice a piece that missed the opportunity.
                // 1. If the moved piece was one of the capable pieces, IT is the culprit for not capturing.
                // 2. If the moved piece was NOT one of the capable pieces, then one of the capable pieces sat idle.
                //    We sacrifice one of them (e.g. random or first found).

                let victimId: string | undefined;

                if (capablePieceIds.includes(move.piece.id)) {
                    // The moved piece is guilty
                    victimId = move.piece.id;
                    // It is at move.to now
                    PactUtils.removePiece(game, move.to);
                } else {
                    // Another piece is guilty
                    // Pick the first one for simplicity/determinism or random?
                    // Let's pick random to feel like "fate".
                    victimId = capablePieceIds[Math.floor(Math.random() * capablePieceIds.length)];

                    // Find where this piece is
                    const victimSquare = game.board.getAllSquares().find(s => s.piece?.id === victimId);
                    if (victimSquare) {
                        PactUtils.removePiece(game, victimSquare.coordinate);
                    }
                }

                // Notify user
                PactUtils.emitPactEffect(game, {
                    pactId: this.id,
                    title: 'pact.toasts.oracle.punishment.title',
                    description: 'pact.toasts.oracle.punishment.desc',
                    icon: 'skull',
                    type: 'malus'
                });
            }
        }
    }
}
