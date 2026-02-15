import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BloodlineBonus, YoungQueenMalus } from './TheHeir';
import { ChessGame } from '../../ChessGame';
import { Coordinate } from '../../models/Coordinate';
import { Piece } from '../../models/Piece';
import { PactContext } from '../PactLogic';

describe('The Heir', () => {
    let game: ChessGame;
    let bloodlineBonus: BloodlineBonus;
    let youngQueenMalus: YoungQueenMalus;

    beforeEach(() => {
        game = new ChessGame();
        bloodlineBonus = new BloodlineBonus();
        youngQueenMalus = new YoungQueenMalus();
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
            const canCapture = modifiers.canCapture!(game, queen, enemyPawn, enemyPos, queenPos);

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
            const canCapture = modifiers.canCapture!(game, queen, enemyKing, enemyPos, queenPos);

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
            game.pactState[`heir_successor_${successorQueen.id}`] = true;

            const modifiers = youngQueenMalus.getRuleModifiers();
            const canCapture = modifiers.canCapture!(game, successorQueen, enemyPawn, enemyPos, queenPos);

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

            const context: PactContext = {
                game: game,
                playerId: 'white',
                pactId: 'bloodline'
            };

            const payload = {
                capturedPiece: queen,
                attacker: new Piece('rook', 'black', 'black-rook')
            };

            // Simulate capture: remove Queen first
            game.board.removePiece(new Coordinate(3, 7));
            bloodlineBonus.onEvent('capture', payload, context);

            // One of the minor pieces should now be a Queen
            const whiteQueens = game.board.getAllSquares()
                .filter(s => s.piece && s.piece.color === 'white' && s.piece.type === 'queen');

            expect(whiteQueens.length).toBe(1);

            const newQueen = whiteQueens[0].piece!;
            expect(game.pactState[`heir_successor_${newQueen.id}`]).toBe(true);
        });

        it('should do nothing if no minor pieces are left', () => {
            game.board.clear();
            const queen = new Piece('queen', 'white', 'white-queen');
            const queenPos = new Coordinate(3, 7);
            game.board.placePiece(queenPos, queen);

            const context: PactContext = {
                game: game,
                playerId: 'white',
                pactId: 'bloodline'
            };

            // Simulate capture: remove Queen first
            game.board.removePiece(queenPos);
            bloodlineBonus.onEvent('capture', { capturedPiece: queen }, context);

            const whiteQueens = game.board.getAllSquares()
                .filter(s => s.piece && s.piece.color === 'white' && s.piece.type === 'queen');

            expect(whiteQueens.length).toBe(0);
        });
    });
});
