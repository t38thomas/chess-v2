import { PactLogic, RuleModifiers } from '../PactLogic';
import { Piece } from '../../models/Piece';
import { IChessGame } from '../../GameTypes';
import { Move } from '../../models/Move';
import { Coordinate } from '../../models/Coordinate';

export class SpectreBonus extends PactLogic {
    id = 'incorporeal';

    getRuleModifiers(): RuleModifiers {
        return {
            canMoveThroughFriendlies: (mover: Piece, obstacle: Piece) => {
                // Non-pawn pieces can move through friendly pawns
                return mover.type !== 'pawn' && obstacle.type === 'pawn';
            }
        };
    }
}

export class SpectreMalus extends PactLogic {
    id = 'possession';

    getRuleModifiers(): RuleModifiers {
        return {
            onExecuteMove: (game: IChessGame, move: Move) => {
                // If a piece moves through friendly pawns, they are killed (removed)
                if (move.isCastling || move.isEnPassant || move.isSwap || move.piece.type === 'knight') {
                    return;
                }

                const from = move.from;
                const to = move.to;
                const dx = Math.sign(to.x - from.x);
                const dy = Math.sign(to.y - from.y);

                let curX = from.x + dx;
                let curY = from.y + dy;

                while (curX !== to.x || curY !== to.y) {
                    const coord = new Coordinate(curX, curY);
                    const square = game.board.getSquare(coord);

                    if (square?.piece && square.piece.color === move.piece.color && square.piece.type === 'pawn') {
                        // Kill the friendly pawn
                        game.board.removePiece(coord);
                        game.emit('pact_effect', {
                            pactId: this.id,
                            title: 'pact.toasts.spectre.possession.title',
                            description: 'pact.toasts.spectre.possession.desc',
                            icon: 'ghost',
                            type: 'malus'
                        });
                    }

                    curX += dx;
                    curY += dy;
                }
            }
        };
    }
}
