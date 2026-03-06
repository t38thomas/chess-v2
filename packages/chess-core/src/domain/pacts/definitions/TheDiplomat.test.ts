import { describe, it, expect, beforeEach } from 'vitest';
import { BoardModel } from '../../models/BoardModel';
import { Coordinate } from '../../models/Coordinate';
import { Piece } from '../../models/Piece';
import { TheDiplomat } from './TheDiplomat';
import { ChessGame } from '../../ChessGame';
import { Move } from '../../models/Move';
import { RuleEngine } from '../../rules/RuleEngine';

describe('The Diplomat Pact', () => {
    let board: BoardModel;
    let game: ChessGame;
    const bonus = TheDiplomat.bonus;
    const malus = TheDiplomat.malus;

    beforeEach(() => {
        game = new ChessGame();
        board = game.board;
    });




    describe('DiplomaticImmunityBonus', () => {
        it('should protect Queen from Pawn capture when she has not captured yet', () => {
            board.clear();
            const whiteQueen = new Piece('queen', 'white', 'white-queen');
            const blackPawn = new Piece('pawn', 'black', 'black-pawn');
            const queenPos = new Coordinate(4, 4);
            const pawnPos = new Coordinate(5, 5);

            board.placePiece(queenPos, whiteQueen);
            board.placePiece(pawnPos, blackPawn);

            game.assignPact('white', TheDiplomat as any);
            const canBeCaptured = RuleEngine.canCapture(game, blackPawn, whiteQueen, queenPos, pawnPos, board, []);
            expect(canBeCaptured).toBe(false);
        });

        it('should NOT protect Queen from Knight capture even if she has not captured yet', () => {
            board.clear();
            const whiteQueen = new Piece('queen', 'white', 'white-queen');
            const blackKnight = new Piece('knight', 'black', 'black-knight');
            const queenPos = new Coordinate(4, 4);
            const knightPos = new Coordinate(5, 6);

            board.placePiece(queenPos, whiteQueen);
            board.placePiece(knightPos, blackKnight);

            game.assignPact('white', TheDiplomat as any);
            const canBeCaptured = RuleEngine.canCapture(game, blackKnight, whiteQueen, queenPos, knightPos, board, []);
            expect(canBeCaptured).toBe(true);
        });

        it('should NOT protect Queen from Pawn capture after she has made a capture', () => {
            board.clear();
            const whiteQueen = new Piece('queen', 'white', 'white-queen');
            const blackPawn = new Piece('pawn', 'black', 'black-pawn');
            const queenPos = new Coordinate(4, 4);
            const pawnPos = new Coordinate(5, 5);

            board.placePiece(queenPos, whiteQueen);
            board.placePiece(pawnPos, blackPawn);

            // Simulate crossing
            game.pactState[`diplomatic_immunity_white`] = { has_crossed_midfield: true };

            game.assignPact('white', TheDiplomat as any);
            const canBeCaptured = RuleEngine.canCapture(game, blackPawn, whiteQueen, queenPos, pawnPos, board, []);
            expect(canBeCaptured).toBe(true);
        });

        it('should update state and notify when Queen crosses midfield', () => {
            const whiteQueen = new Piece('queen', 'white', 'white-queen');
            const from = new Coordinate(4, 3);
            const to = new Coordinate(4, 4); // Crosses midfield (y >= 4 for white)

            let notifyCount = 0;
            game.subscribe((event) => {
                if (event === 'pact_effect') notifyCount++;
            });

            const context = bonus.createContextWithState({ game, playerId: 'white', pactId: 'diplomatic_immunity' });

            // Trigger via onEvent 'move'
            bonus.onEvent('move', new Move(from, to, whiteQueen), context);

            const state = game.pactState[`diplomatic_immunity_white`] as any;
            expect(state?.has_crossed_midfield).toBe(true);
            expect(notifyCount).toBe(2); // One for immunity lost, one for sabotage ended
        });

    });

    describe('InternalSabotageMalus', () => {
        it('should block Knight movement when Queen has not captured yet', () => {
            board.clear();
            const whiteKnight = new Piece('knight', 'white', 'white-knight');
            const knightPos = new Coordinate(1, 0);
            board.placePiece(knightPos, whiteKnight);

            game.assignPact('white', TheDiplomat as any);
            const perks = game.pacts.white.flatMap(p => [p.bonus, p.malus]);
            const canMove = RuleEngine.canMovePiece(game, knightPos, perks, board);
            expect(canMove).toBe(false);
        });

        it('should allow Knight movement after Queen has made a capture', () => {
            board.clear();
            const whiteKnight = new Piece('knight', 'white', 'white-knight');
            const knightPos = new Coordinate(1, 0);
            board.placePiece(knightPos, whiteKnight);

            game.pactState[`diplomatic_immunity_white`] = { has_crossed_midfield: true };

            game.assignPact('white', TheDiplomat as any);
            const perks = game.pacts.white.flatMap(p => [p.bonus, p.malus]);
            const canMove = RuleEngine.canMovePiece(game, knightPos, perks, board);
            expect(canMove).toBe(true);
        });

        it('should NOT block other pieces movement', () => {
            board.clear();
            const whiteRook = new Piece('rook', 'white', 'white-rook');
            const rookPos = new Coordinate(0, 0);
            board.placePiece(rookPos, whiteRook);

            game.assignPact('white', TheDiplomat as any);
            const perks = game.pacts.white.flatMap(p => [p.bonus, p.malus]);
            const canMove = RuleEngine.canMovePiece(game, rookPos, perks, board);
            expect(canMove).toBe(true);
        });
    });
});
