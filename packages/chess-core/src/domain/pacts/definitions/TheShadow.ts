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
            canBeCaptured: (params, context) => {
                if (context && params.victim.color !== context.playerId) return true;
                const isPerimeter = params.to.x === 0 || params.to.x === 7 || params.to.y === 0 || params.to.y === 7;
                if (isPerimeter) {
                    const distance = Math.max(Math.abs(params.from.x - params.to.x), Math.abs(params.from.y - params.to.y));
                    if (distance > 1) return false;
                }
                return true;
            }
        }
    })
    .malus('blind_light', {
        modifiers: {
            canCapture: (params, context) => {
                if (context && params.attacker.color !== context.playerId) return true;
                return !PactUtils.isCentralSquare(params.from);
            }
        }
    })
    .build();

