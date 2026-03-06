import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TheHeir } from './TheHeir';
import { ChessGame } from '../../ChessGame';
import { Coordinate } from '../../models/Coordinate';
import { Piece } from '../../models/Piece';
import { Move } from '../../models/Move';
import { PactContext } from '../PactLogic';

describe('The Heir', () => {
    let game: ChessGame;
    const bloodlineBonus = TheHeir.bonus;
    const youngQueenMalus = TheHeir.malus;

    beforeEach(() => {
        game = new ChessGame();
    });

    describe('Young Queen (Malus)', () => {
        it('should prevent initial Queen from capturing', () => {
            game.board.clear();
            const queen = new Piece('queen', 'white', 'initial-queen');
            const enemyPawn = new Piece('pawn', 'black', 'enemy-pawn');

            const queenPos = new Coordinate(3, 7);
            const enemyPos = new Coordinate(3, 3);

            game.board.placePiece(queenPos, queen);
            game.board.placePiece(enemyPos, enemyPawn);

            const modifiers = youngQueenMalus.getRuleModifiers();
            const context = youngQueenMalus.createContextWithState({ playerId: queen.color, game, pactId: 'heir' });
            const canCapture = modifiers.canCapture!({
                game, board: game.board, attacker: queen, victim: enemyPawn, from: queenPos, to: enemyPos
            }, context);

            expect(canCapture).toBe(false);
        });

        it('should allow initial Queen to capture the King (give check)', () => {
            game.board.clear();
            const queen = new Piece('queen', 'white', 'initial-queen');
            const enemyKing = new Piece('king', 'black', 'enemy-king');

            const queenPos = new Coordinate(3, 7);
            const enemyPos = new Coordinate(3, 3);

            game.board.placePiece(queenPos, queen);
            game.board.placePiece(enemyPos, enemyKing);

            const modifiers = youngQueenMalus.getRuleModifiers();
            const context = youngQueenMalus.createContextWithState({ playerId: queen.color, game, pactId: 'heir' });
            const canCapture = modifiers.canCapture!({
                game, board: game.board, attacker: queen, victim: enemyKing, from: queenPos, to: enemyPos
            }, context);

            expect(canCapture).toBe(true);
        });

        it('should allow successor Queen to capture', () => {
            game.board.clear();
            const successorQueen = new Piece('queen', 'white', 'successor-queen');
            const enemyPawn = new Piece('pawn', 'black', 'enemy-pawn');

            const queenPos = new Coordinate(3, 7);
            const enemyPos = new Coordinate(3, 3);

            game.board.placePiece(queenPos, successorQueen);
            game.board.placePiece(enemyPos, enemyPawn);

            // Mark as successor in pactState
            game.pactState[`bloodline_white`] = { successorIds: { [successorQueen.id]: true } };

            const modifiers = youngQueenMalus.getRuleModifiers();
            const context = youngQueenMalus.createContextWithState({ playerId: successorQueen.color, game, pactId: 'heir' });
            const canCapture = modifiers.canCapture!({
                game, board: game.board, attacker: successorQueen, victim: enemyPawn, from: queenPos, to: enemyPos
            }, context);

            expect(canCapture).toBe(true);
        });

    });

    describe('Bloodline (Bonus)', () => {
        it('should promote a random minor piece when Queen is captured', () => {
            game.board.clear();
            const queen = new Piece('queen', 'white', 'white-queen');
            const knight = new Piece('knight', 'white', 'white-knight');
            const bishop = new Piece('bishop', 'white', 'white-bishop');

            game.board.placePiece(new Coordinate(3, 7), queen);
            game.board.placePiece(new Coordinate(1, 7), knight);
            game.board.placePiece(new Coordinate(2, 7), bishop);

            const context = bloodlineBonus.createContextWithState({
                game: game,
                playerId: 'white',
                pactId: 'bloodline'
            });

            // Simulate capture: remove Queen first
            game.board.removePiece(new Coordinate(3, 7));
            const move = new Move(new Coordinate(3, 7), new Coordinate(3, 7), new Piece('rook', 'black', 'black-rook'), queen);
            bloodlineBonus.onEvent('capture', move, context);

            // One of the minor pieces should now be a Queen
            const whiteQueens = game.board.getAllSquares()
                .filter(s => s.piece && s.piece.color === 'white' && s.piece.type === 'queen');

            expect(whiteQueens.length).toBe(1);

            const newQueen = whiteQueens[0].piece!;
            expect(game.pactState[`bloodline_white`]?.successorIds?.[newQueen.id]).toBe(true);
        });

        it('should do nothing if no minor pieces are left', () => {
            game.board.clear();
            const queen = new Piece('queen', 'white', 'white-queen');
            const queenPos = new Coordinate(3, 7);
            game.board.placePiece(queenPos, queen);

            const context = bloodlineBonus.createContextWithState({
                game: game,
                playerId: 'white',
                pactId: 'bloodline'
            });

            // Simulate capture: remove Queen first
            game.board.removePiece(new Coordinate(3, 7));
            bloodlineBonus.onEvent('capture', new Move(new Coordinate(3, 7), new Coordinate(3, 7), new Piece('pawn', 'black', 'pawn'), queen), context);

            const whiteQueens = game.board.getAllSquares()
                .filter(s => s.piece && s.piece.color === 'white' && s.piece.type === 'queen');

            expect(whiteQueens.length).toBe(0);
        });
    });
});
