import { PactLogic, RuleModifiers } from '../PactLogic';
import { PieceColor } from '../../models/Piece';

interface BerserkerState {
    isFrenzyActive: boolean;
    frenzyPieceId: string | null;
}

export class BerserkerBonus extends PactLogic {
    id = 'frenzy';

    // State per player to avoid interference in local games or if both choose Berserker
    private states: Map<PieceColor, BerserkerState> = new Map([
        ['white', { isFrenzyActive: false, frenzyPieceId: null }],
        ['black', { isFrenzyActive: false, frenzyPieceId: null }]
    ]);

    private getState(color: PieceColor): BerserkerState {
        return this.states.get(color)!;
    }

    getRuleModifiers(): RuleModifiers {
        return {
            onExecuteMove: (game, move) => {
                const color = move.piece.color;
                const state = this.getState(color);

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
                const state = this.getState(currentTurn);
                if (state.isFrenzyActive) {
                    // Force the turn to stay with the current player
                    return currentTurn;
                }
                return null;
            },

            canMovePiece: (game, from) => {
                const color = game.turn;
                const state = this.getState(color);

                if (state.isFrenzyActive && state.frenzyPieceId) {
                    const square = game.board.getSquare(from);
                    if (square && square.piece) {
                        return square.piece.id === state.frenzyPieceId;
                    }
                    return false;
                }
                return true;
            },

            canCapture: (attacker, victim, to, from, board) => {
                const state = this.getState(attacker.color);
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
