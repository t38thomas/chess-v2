import { definePact } from '../PactLogic';
import { BoardUtils } from '../utils/BoardUtils';

/**
 * The Shadow Pact
 * Bonus (Shadow Cloak): Pieces on edge squares cannot be captured from distance > 1.
 * Malus (Blind Light): Pieces cannot capture from central squares.
 */
export const TheShadow = definePact('shadow')
    .bonus('shadow_cloak', {
        target: 'self',
        modifiers: {
            canBeCaptured: (params) => {
                if (BoardUtils.isEdgeSquare(params.to)) {
                    const distance = params.from.distanceTo(params.to);
                    if (distance > 1.5) return false;
                }
                return true;
            }
        }
    })
    .malus('blind_light', {
        target: 'self',
        modifiers: {
            canCapture: (params) => {
                return !BoardUtils.isCentralSquare(params.from);
            }
        }
    })
    .build();



