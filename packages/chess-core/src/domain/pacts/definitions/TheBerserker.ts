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
        target: 'self',
        initialState: () => ({ isFrenzyActive: false, frenzyPieceId: null as string | null }),
        modifiers: {
            onExecuteMove: (game, move, context) => {
                if (move.piece.color !== context.playerId) return;
                const state = context.state;

                if (state.isFrenzyActive) {
                    context.updateState({ isFrenzyActive: false, frenzyPieceId: null });
                } else if (move.capturedPiece?.type === 'pawn') {
                    context.updateState({ isFrenzyActive: true, frenzyPieceId: move.piece.id });
                    PactUtils.notifyPactEffect(game, 'berserker', 'frenzy', 'bonus', 'axe');
                }


            },


            modifyNextTurn: (params, context) => {
                if (context.state.isFrenzyActive) return params.currentTurn;
                return null;
            },
            canMovePiece: (params, context) => {
                const b = params.board;
                const piece = b.getSquare(params.from)?.piece;
                const state = context.state;
                if (state.isFrenzyActive && state.frenzyPieceId) {
                    return piece?.id === state.frenzyPieceId;
                }
                return true;
            },
            canCapture: (params, context) => {
                return !context.state.isFrenzyActive;
            }
        }
    })
    .malus('missing_knight', {
        effects: [Effects.rules.removeRandomPiecesAtStart('knight', 1)]
    })
    .build();


