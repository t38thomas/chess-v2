import { PactLogic, RuleModifiers } from '../PactLogic';
import { PactUtils } from '../PactUtils';

/**
 * Stealth Bonus: Lateral pawns (files a, b, g, h) are immune to capture
 * as long as they haven't moved from their starting position.
 */
export class StealthBonus extends PactLogic {
    id = 'stealth';

    getRuleModifiers(): RuleModifiers {
        return {
            canBeCaptured: (game, attacker, victim, to, from) => {
                if (victim.type === 'pawn' && !victim.hasMoved) {
                    const isLateralFile = to.x === 0 || to.x === 1 || to.x === 6 || to.x === 7;
                    if (isLateralFile) {
                        return false; // Immune
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
