import { PactLogic, RuleModifiers } from '../PactLogic';
import { PactUtils } from '../PactUtils';

/**
 * Shadow Cloak Bonus: Pieces on the perimeter are immune to capture from non-adjacent enemies.
 */
export class ShadowCloakBonus extends PactLogic {
    id = 'shadow_cloak';

    getRuleModifiers(): RuleModifiers {
        return {
            canBeCaptured: (game, attacker, victim, to, from) => {
                const isPerimeter = to.x === 0 || to.x === 7 || to.y === 0 || to.y === 7;

                if (isPerimeter) {
                    // Calculate distance using Chebyshev distance (max of dx, dy)
                    // If distance > 1, it's a ranged attack
                    const dx = Math.abs(from.x - to.x);
                    const dy = Math.abs(from.y - to.y);
                    const distance = Math.max(dx, dy);

                    if (distance > 1) {
                        return false; // Immune to ranged attacks
                    }
                }

                return true;
            }
        };
    }
}

/**
 * Blind Light Malus: Central pieces cannot perform captures.
 */
export class BlindLightMalus extends PactLogic {
    id = 'blind_light';

    getRuleModifiers(): RuleModifiers {
        return {
            canCapture: (game, attacker, victim, to, from) => {
                // If the attacker is in the center
                if (PactUtils.isCentralSquare(from)) {
                    return false; // Cannot capture
                }
                return true;
            }
        };
    }
}
