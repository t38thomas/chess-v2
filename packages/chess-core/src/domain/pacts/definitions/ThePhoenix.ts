import { PactLogic, ActiveAbilityConfig, PactContext, RuleModifiers } from '../PactLogic';
import { GameEvent } from '../../GameTypes';
import { Coordinate } from '../../models/Coordinate';
import { PactUtils } from '../PactUtils';

export class PhoenixBonus extends PactLogic {
    id = 'rebirth';

    getRuleModifiers(): RuleModifiers {
        return {};
    }

    onEvent(event: GameEvent, payload: any, context: PactContext): void {
        const { game, playerId } = context;

        if (event === 'capture' && payload) {
            const move = payload as any;
            const capturedPiece = move.capturedPiece;

            // If the captured piece is OUR Queen
            if (capturedPiece && capturedPiece.color === playerId && capturedPiece.type === 'queen') {

                // Check if already used
                const stateKey = `phoenix_rebirth_used_${playerId}`;
                if (game.pactState[stateKey]) return;

                // Find all friendly pawns
                const myPawnDetails = PactUtils.findPieces(game, playerId, 'pawn');

                if (myPawnDetails.length > 0) {
                    // Pick a random pawn
                    const [victim] = PactUtils.pickRandom(myPawnDetails, 1);

                    if (victim) {
                        // Promote to Queen
                        PactUtils.promotePiece(game, victim.coord, 'queen');

                        // Mark as used
                        game.pactState[stateKey] = true;

                        // Notification
                        PactUtils.emitPactEffect(game, {
                            pactId: this.id,
                            title: 'pact.toasts.phoenix.rebirth.title',
                            description: 'pact.toasts.phoenix.rebirth.desc',
                            icon: 'fire',
                            type: 'bonus'
                        });
                    }
                }
            }
        }
    }
}

export class PhoenixMalus extends PactLogic {
    id = 'wingless';

    // Remove rooks immediately when assigned
    onEvent(event: GameEvent, payload: any, context: PactContext): void {
        const { game, playerId } = context;

        if (event === 'pact_assigned') {
            const rooks = PactUtils.findPieces(game, playerId, 'rook');

            for (const { coord } of rooks) {
                PactUtils.removePiece(game, coord);
            }
        }
    }
}
