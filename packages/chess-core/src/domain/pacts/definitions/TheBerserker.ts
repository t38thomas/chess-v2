import { PactLogic, RuleModifiers } from '../PactLogic';
import { PieceColor } from '../../models/Piece';
import { GameEvent } from '../../GameTypes';
import { PactContext } from '../PactLogic';
import { PactUtils } from '../PactUtils';

interface BerserkerState {
    isFrenzyActive: boolean;
    frenzyPieceId: string | null;
}

/**
 * BerserkerBonus — "Pawn Hunter" (frenzy)
 *
 * When you capture an enemy PAWN, you gain one extra move with the same piece.
 * The extra move cannot be another capture.
 * If there are no pawns to capture, the bonus never triggers.
 */
export class BerserkerBonus extends PactLogic {
    id = 'frenzy';

    private getState(game: any, color: PieceColor): BerserkerState {
        const key = `frenzy_${color}`;
        if (!game.pactState[key]) {
            game.pactState[key] = { isFrenzyActive: false, frenzyPieceId: null };
        }
        return game.pactState[key];
    }

    getRuleModifiers(): RuleModifiers {
        return {
            onExecuteMove: (game, move) => {
                const color = move.piece.color;
                const state = this.getState(game, color);

                if (state.isFrenzyActive) {
                    // The extra move has been played — reset frenzy
                    state.isFrenzyActive = false;
                    state.frenzyPieceId = null;
                } else if (move.capturedPiece && move.capturedPiece.type === 'pawn') {
                    // Only trigger on pawn captures
                    state.isFrenzyActive = true;
                    state.frenzyPieceId = move.piece.id;

                    game.emit('pact_effect', {
                        pactId: this.id,
                        title: 'pact.toasts.berserker.frenzy.title',
                        description: 'pact.toasts.berserker.frenzy.desc',
                        icon: 'axe',
                        type: 'bonus'
                    });
                }
            },

            modifyNextTurn: (game, currentTurn) => {
                const state = this.getState(game, currentTurn);
                if (state.isFrenzyActive) {
                    // Keep the same player's turn for the extra move
                    return currentTurn;
                }
                return null;
            },

            canMovePiece: (game, from) => {
                const color = game.turn;
                const state = this.getState(game, color);

                if (state.isFrenzyActive && state.frenzyPieceId) {
                    const square = game.board.getSquare(from);
                    if (square && square.piece) {
                        return square.piece.id === state.frenzyPieceId;
                    }
                    return false;
                }
                return true;
            },

            canCapture: (game, attacker) => {
                // During the extra frenzy move, capturing is not allowed
                if (!game) return true;
                const state = this.getState(game, attacker.color);
                if (state.isFrenzyActive) {
                    return false;
                }
                return true;
            }
        };
    }
}

/**
 * BerserkerMalus — "One-Handed" (missing_knight)
 *
 * At the start of the game you are missing one random knight.
 */
export class BerserkerMalus extends PactLogic {
    id = 'missing_knight';

    onEvent(event: GameEvent, _payload: any, context: PactContext): void {
        const { game, playerId } = context;

        if (event === 'pact_assigned') {
            const knights = PactUtils.findPieces(game, playerId, 'knight');

            if (knights.length > 0) {
                // Pick one at random and remove it
                const [victim] = PactUtils.pickRandom(knights, 1);
                if (victim) {
                    PactUtils.removePiece(game, victim.coord);
                }
            }
        }
    }

    getRuleModifiers(): RuleModifiers {
        return {};
    }
}
