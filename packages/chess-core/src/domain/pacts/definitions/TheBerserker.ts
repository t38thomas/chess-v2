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
            onExecuteMove: (game, move, context) => {
                if (move.piece.color !== context?.playerId) return;
                const state = context?.state || {};

                if (state.isFrenzyActive) {
                    context.updateState({ isFrenzyActive: false, frenzyPieceId: null });
                } else if (move.capturedPiece && move.capturedPiece.type === 'pawn') {
                    context.updateState({ isFrenzyActive: true, frenzyPieceId: move.piece.id });
                    PactUtils.notifyPactEffect(game, 'berserker', 'frenzy', 'bonus', 'axe');
                }
            },
            modifyNextTurn: (game, currentTurn, eventType, context) => {
                if (currentTurn !== context?.playerId) return null;
                const state = context?.state || {};
                if (state.isFrenzyActive) return currentTurn;
                return null;
            },
            canMovePiece: (game, from, board, context) => {
                const b = board || game.board;
                const piece = b.getSquare(from)?.piece;
                if (piece?.color !== context?.playerId) return true;
                const state = context?.state || {};
                if (state.isFrenzyActive && state.frenzyPieceId) {
                    return piece?.id === state.frenzyPieceId;
                }
                return true;
            },
            canCapture: (game, attacker, victim, to, from, board, context) => {
                if (!game || attacker.color !== context?.playerId) return true;
                const state = context?.state || {};
                return !state.isFrenzyActive;
            }
        }
    })
    .malus('missing_knight', {
        effects: [Effects.rules.removeRandomPiecesAtStart('knight', 1)]
    })
    .build();

