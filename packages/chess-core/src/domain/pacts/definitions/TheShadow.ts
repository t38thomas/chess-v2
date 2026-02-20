import { definePact } from '../PactLogic';
import { PactUtils } from '../PactUtils';

/**
 * The Shadow Pact
 * Bonus (Shadow Cloak): Pieces on the perimeter are immune to ranged captures.
 * Malus (Blind Light): Pieces in the center cannot capture.
 */
export const TheShadow = definePact('shadow')
    .bonus('shadow_cloak', {
        modifiers: {
            canBeCaptured: (game, attacker, victim, to, from, board, context) => {
                if (context && victim.color !== context.playerId) return true;
                const isPerimeter = to.x === 0 || to.x === 7 || to.y === 0 || to.y === 7;
                if (isPerimeter) {
                    const distance = Math.max(Math.abs(from.x - to.x), Math.abs(from.y - to.y));
                    if (distance > 1) return false;
                }
                return true;
            }
        }
    })
    .malus('blind_light', {
        modifiers: {
            canCapture: (game, attacker, victim, to, from, board, context) => {
                if (context && attacker.color !== context.playerId) return true;
                return !PactUtils.isCentralSquare(from);
            }
        }
    })
    .build();

