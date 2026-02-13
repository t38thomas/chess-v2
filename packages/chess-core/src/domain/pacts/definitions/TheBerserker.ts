import { PactLogic, RuleModifiers } from '../PactLogic';
import { PieceColor } from '../../models/Piece';

interface BerserkerState {
    isFrenzyActive: boolean;
    frenzyPieceId: string | null;
}

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
                    // Completing the extra move
                    state.isFrenzyActive = false;
                    state.frenzyPieceId = null;
                } else if (move.capturedPiece) {
                    // Initial capture triggered frenzy
                    state.isFrenzyActive = true;
                    state.frenzyPieceId = move.piece.id;
                }
            },

            modifyNextTurn: (game, currentTurn, eventType) => {
                const state = this.getState(game, currentTurn);
                if (state.isFrenzyActive) {
                    // Force the turn to stay with the current player
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

            canCapture: (game, attacker, victim, to, from) => {
                // If game context is missing (e.g. strict analysis), default to allow or restrictive?
                // Allow capture if we can't check state to avoid breaking generic analysis.
                if (!game) return true;

                const state = this.getState(game, attacker.color);
                if (state.isFrenzyActive) {
                    // Cannot capture during the extra turn
                    return false;
                }
                return true;
            }
        };
    }
}

export class BerserkerMalus extends PactLogic {
    id = 'defenseless';

    getRuleModifiers(): RuleModifiers {
        return {
            canCastle: (piece) => false
        };
    }
}
