import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';
import { PactUtils } from '../PactUtils';

interface BerserkerState {
    isFrenzyActive: boolean;
    frenzyPieceId: string | null;
}

/**
 * The Berserker Pact
 * Bonus (Frenzy): Catching a pawn gives an extra non-capture move.
 * Malus (Missing Knight): Start with one less random knight.
 */
export const TheBerserker = definePact<BerserkerState>('berserker')
    .bonus('frenzy', {
        initialState: () => ({ isFrenzyActive: false, frenzyPieceId: null }),
        modifiers: {
            onExecuteMove: (game, move) => {
                const color = move.piece.color;
                const state = game.pactState[`frenzy_${color}`] as BerserkerState;
                if (!state) return;

                if (state.isFrenzyActive) {
                    state.isFrenzyActive = false;
                    state.frenzyPieceId = null;
                } else if (move.capturedPiece && move.capturedPiece.type === 'pawn') {
                    state.isFrenzyActive = true;
                    state.frenzyPieceId = move.piece.id;
                    PactUtils.notifyPactEffect(game, 'berserker', 'frenzy', 'bonus', 'axe');
                }
            },
            modifyNextTurn: (game, currentTurn) => {
                const state = game.pactState[`frenzy_${currentTurn}`] as BerserkerState;
                if (state?.isFrenzyActive) return currentTurn;
                return null;
            },
            canMovePiece: (game, from) => {
                const state = game.pactState[`frenzy_${game.turn}`] as BerserkerState;
                if (state?.isFrenzyActive && state.frenzyPieceId) {
                    const square = game.board.getSquare(from);
                    return square?.piece?.id === state.frenzyPieceId;
                }
                return true;
            },
            canCapture: (game, attacker) => {
                if (!game) return true;
                const state = game.pactState[`frenzy_${attacker.color}`] as BerserkerState;
                return !state?.isFrenzyActive;
            }
        }
    })
    .malus('missing_knight', {
        effects: [Effects.rules.removeRandomPiecesAtStart('knight', 1)]
    })
    .build();

