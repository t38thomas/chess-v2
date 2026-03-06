import { definePact } from '../PactLogic';
import { BoardUtils } from '../utils/BoardUtils';

export const TheShadow = definePact('shadow')
    .bonus('shadow_cloak', {
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
        modifiers: {
            canCapture: (params) => {
                return !BoardUtils.isCentralSquare(params.from);
            }
        }
    })
    .build();



