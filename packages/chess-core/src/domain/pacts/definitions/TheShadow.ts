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
        },
        getTurnCounters: (context) => {
            const edgePieces = context.query.pieces().friendly().filter(p => BoardUtils.isEdgeSquare(p.coord));
            if (edgePieces.length > 0) {
                return [{
                    id: 'shadow_cloak_active',
                    label: 'shadow_protected',
                    value: edgePieces.length,
                    pactId: 'shadow',
                    type: 'counter'
                }];
            }
            return [];
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



