import { describe, it, expect, beforeEach } from 'vitest';
import { TheSentinel } from './TheSentinel';
import { ChessGame } from '../../ChessGame';
import { Coordinate } from '../../models/Coordinate';
import { Piece } from '../../models/Piece';
import { RuleEngine } from '../../rules/RuleEngine';

describe('The Sentinel', () => {
    let game: ChessGame;
    const vigilanceBonus = TheSentinel.bonus;
    const anchoredMalus = TheSentinel.malus;

    beforeEach(() => {
        game = new ChessGame();
    });

    describe('Vigilance (Bonus)', () => {
        it('should prevent piece adjacent to King from being captured', () => {
            game.board.clear();
            const king = new Piece('king', 'white', 'white-king');
            const pawn = new Piece('pawn', 'white', 'white-pawn');
            const attacker = new Piece('rook', 'black', 'black-rook');

            const kingPos = new Coordinate(4, 0);
            const pawnPos = new Coordinate(4, 1);
            const attackerPos = new Coordinate(0, 1);

            game.board.placePiece(kingPos, king);
            game.board.placePiece(pawnPos, pawn);
            game.board.placePiece(attackerPos, attacker);

            game.assignPact('white', TheSentinel as any);
            const canBeCaptured = RuleEngine.canCapture(game, attacker, pawn, pawnPos, attackerPos, game.board, []);

            expect(canBeCaptured).toBe(false);
        });

        it('should allow capture if piece is not adjacent to King', () => {
            game.board.clear();
            const king = new Piece('king', 'white', 'white-king');
            const pawn = new Piece('pawn', 'white', 'white-pawn');
            const attacker = new Piece('rook', 'black', 'black-rook');

            const kingPos = new Coordinate(4, 0);
            const pawnPos = new Coordinate(4, 4);
            const attackerPos = new Coordinate(0, 4);

            game.board.placePiece(kingPos, king);
            game.board.placePiece(pawnPos, pawn);
            game.board.placePiece(attackerPos, attacker);

            game.assignPact('white', TheSentinel as any);
            const canBeCaptured = RuleEngine.canCapture(game, attacker, pawn, pawnPos, attackerPos, game.board, []);

            expect(canBeCaptured).toBe(true);
        });
    });

    describe('Anchored (Malus)', () => {
        it('should prevent King from moving if he has adjacent pieces', () => {
            game.board.clear();
            const king = new Piece('king', 'white', 'white-king');
            const friendlyPawn = new Piece('pawn', 'white', 'white-pawn');

            const kingPos = new Coordinate(4, 0);
            const pawnPos = new Coordinate(4, 1);

            game.board.placePiece(kingPos, king);
            game.board.placePiece(pawnPos, friendlyPawn);

            game.assignPact('white', TheSentinel as any);
            const perks = game.pacts.white.flatMap(p => [p.bonus, p.malus]);
            const canMove = RuleEngine.canMovePiece(game, kingPos, perks, game.board);

            expect(canMove).toBe(false);
        });

        it('should prevent King from moving if he has adjacent enemy pieces', () => {
            game.board.clear();
            const king = new Piece('king', 'white', 'white-king');
            const enemyKnight = new Piece('knight', 'black', 'black-knight');

            const kingPos = new Coordinate(4, 0);
            const knightPos = new Coordinate(5, 2); // Not adjacent
            const adjacentKnightPos = new Coordinate(5, 1); // Adjacent

            game.board.placePiece(kingPos, king);
            game.board.placePiece(adjacentKnightPos, enemyKnight);

            game.assignPact('white', TheSentinel as any);
            const perks = game.pacts.white.flatMap(p => [p.bonus, p.malus]);
            const canMove = RuleEngine.canMovePiece(game, kingPos, perks, game.board);

            expect(canMove).toBe(false);
        });

        it('should allow King to move if no adjacent pieces', () => {
            game.board.clear();
            const king = new Piece('king', 'white', 'white-king');

            const kingPos = new Coordinate(4, 0);
            game.board.placePiece(kingPos, king);

            game.assignPact('white', TheSentinel as any);
            const perks = game.pacts.white.flatMap(p => [p.bonus, p.malus]);
            const canMove = RuleEngine.canMovePiece(game, kingPos, perks, game.board);

            expect(canMove).toBe(true);
        });
    });
});
