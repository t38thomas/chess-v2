import { definePact } from '../PactLogic';

/**
 * The Golem Pact
 * Bonus (Stone Skin): King is immune to attacks from more than 3 squares away.
 * Malus (Lead Feet): King cannot move diagonally.
 */
export const TheGolem = definePact('golem')
    .bonus('stone_skin', {
        modifiers: {
            canBeCaptured: (game, attacker, victim, to, from) => {
                if (victim.type !== 'king') return true;
                return from.distanceTo(to) <= 3;
            }
        }
    })
    .malus('lead_feet', {
        modifiers: {
            onGetPseudoMoves: ({ from, piece, moves }) => {
                if (piece.type === 'king') {
                    for (let i = moves.length - 1; i >= 0; i--) {
                        const m = moves[i];
                        const dx = Math.abs(m.to.x - from.x);
                        const dy = Math.abs(m.to.y - from.y);
                        if (dx > 0 && dy > 0 && dx === dy) moves.splice(i, 1);
                    }
                }
            }
        }
    })
    .build();

