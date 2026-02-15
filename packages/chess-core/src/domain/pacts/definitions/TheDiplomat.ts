import { PactLogic, RuleModifiers, PactContext, TurnCounter } from '../PactLogic';
import { GameEvent } from '../../GameTypes';
import { PactUtils } from '../PactUtils';

const HAS_CAPTURED_KEY = (playerId: string) => `diplomat_has_captured_${playerId}`;

/**
 * Diplomatic Immunity Bonus: The Queen cannot be captured by Pawns
 * until she makes her first capture.
 */
export class DiplomaticImmunityBonus extends PactLogic {
    id = 'diplomatic_immunity';

    getRuleModifiers(): RuleModifiers {
        return {
            canBeCaptured: (game, attacker, victim, to, from) => {
                if (!game) return true;

                // If victim is not a Queen, immunity doesn't apply
                if (!PactUtils.isQueen(victim)) return true;

                // Check if the Queen belongs to the player with this pact
                // This is a bit tricky since RuleModifiers don't always have playerId directly
                // but we can check if the victim color has the pact.
                // However, the rule typically applies to the player who HAS the pact.
                const playerId = victim.color;
                const hasCaptured = game.pactState[HAS_CAPTURED_KEY(playerId)];

                if (!hasCaptured && PactUtils.isPawn(attacker)) {
                    return false; // Immune to pawns
                }

                return true;
            }
        };
    }

    onEvent(event: GameEvent, payload: any, context: PactContext): void {
        const { game, playerId } = context;

        if (event === 'capture' && payload) {
            const move = payload as any;
            const hasCaptured = game.pactState[HAS_CAPTURED_KEY(playerId)];

            if (!hasCaptured && move.piece && move.piece.color === playerId && PactUtils.isQueen(move.piece)) {
                game.pactState[HAS_CAPTURED_KEY(playerId)] = true;

                PactUtils.notifyPactEffect(game, 'diplomat', 'immunity_lost', 'malus', 'shield-off');
                PactUtils.notifyPactEffect(game, 'diplomat', 'sabotage_ended', 'bonus', 'horse-variant');
            }
        }
    }

    getTurnCounters(context: PactContext): TurnCounter[] {
        const { game, playerId } = context;
        const hasCaptured = game.pactState[HAS_CAPTURED_KEY(playerId)];

        return [{
            id: 'diplomatic_immunity_status',
            label: hasCaptured ? 'queen_successor' : 'queen_initial',
            value: hasCaptured ? 0 : 1,
            pactId: this.id,
            type: 'counter',
            subLabel: hasCaptured ? 'Active' : 'Protected'
        }];

    }
}

/**
 * Internal Sabotage Malus: Knights are blocked until the Queen makes her first capture.
 */
export class InternalSabotageMalus extends PactLogic {
    id = 'internal_sabotage';

    getRuleModifiers(): RuleModifiers {
        return {
            canMovePiece: (game, from, board) => {
                const square = board ? board.getSquare(from) : game.board.getSquare(from);
                const piece = square?.piece;

                if (piece && PactUtils.isKnight(piece)) {
                    const playerId = piece.color;
                    const hasCaptured = game.pactState[HAS_CAPTURED_KEY(playerId)];

                    if (!hasCaptured) {
                        return false; // Knights are sabotaged
                    }
                }

                return true;
            }
        };
    }
}
