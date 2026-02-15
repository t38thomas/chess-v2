import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LifeThirstBonus, VampireCurseMalus } from './TheVampire';
import { ChessGame } from '../../ChessGame';
import { Coordinate } from '../../models/Coordinate';
import { Piece } from '../../models/Piece';
import { Move } from '../../models/Move';

describe('The Vampire', () => {
    let game: ChessGame;
    let vampireBonus: LifeThirstBonus;
    let vampireMalus: VampireCurseMalus;

    beforeEach(() => {
        game = new ChessGame();
        vampireBonus = new LifeThirstBonus();
        vampireMalus = new VampireCurseMalus();
    });

    describe('Vampire Curse (Malus)', () => {
        it('should prevent castling', () => {
            const modifiers = vampireMalus.getRuleModifiers();
            expect(modifiers.canCastle).toBeDefined();
            // @ts-ignore
            expect(modifiers.canCastle(new Piece('king', 'white', 'white-king'))).toBe(false);
        });
    });

    describe('Life Thirst (Bonus)', () => {
        it('should resurrect a minor piece from the captured pool when enemy Queen is captured', () => {
            game.board.clear();

            // 1. Setup: A white Bishop is in the captured pool
            const whiteBishop = new Piece('bishop', 'white', 'w-b1');
            game.capturedPieces.white.push(whiteBishop);

            // 2. Setup: My Queen captures enemy Queen
            const myQueen = new Piece('queen', 'white', 'w-q');
            const enemyQueen = new Piece('queen', 'black', 'b-q');

            const myQueenPos = new Coordinate(3, 3);
            const enemyQueenPos = new Coordinate(3, 4);

            game.board.placePiece(myQueenPos, myQueen);
            game.board.placePiece(enemyQueenPos, enemyQueen);

            const move = new Move(myQueenPos, enemyQueenPos, myQueen, enemyQueen);

            // Mock emit
            const emitSpy = vi.spyOn(game, 'emit');

            // Execute the trigger
            const modifiers = vampireBonus.getRuleModifiers();
            if (modifiers.onExecuteMove) {
                modifiers.onExecuteMove(game, move);
            }

            // Verify resurrection: Should be at (2,0) or (5,0)
            const unitsOnBoard = game.board.getAllSquares()
                .filter(s => s.piece && s.piece.color === 'white' && s.piece.type === 'bishop');

            expect(unitsOnBoard.length).toBe(1);
            expect(unitsOnBoard[0].piece?.id).toBe('w-b1');

            // Verify removal from captured pool
            expect(game.capturedPieces.white).not.toContain(whiteBishop);

            // Verify toast
            expect(emitSpy).toHaveBeenCalledWith('pact_effect', expect.objectContaining({
                pactId: 'life_thirst',
                type: 'bonus'
            }));
        });

        it('should NOT resurrect if no minor pieces are captured', () => {
            game.board.clear();
            const myQueen = new Piece('queen', 'white', 'w-q');
            const enemyQueen = new Piece('queen', 'black', 'b-q');
            const myQueenPos = new Coordinate(3, 3);
            const enemyQueenPos = new Coordinate(3, 4);
            game.board.placePiece(myQueenPos, myQueen);
            game.board.placePiece(enemyQueenPos, enemyQueen);

            const move = new Move(myQueenPos, enemyQueenPos, myQueen, enemyQueen);
            const emitSpy = vi.spyOn(game, 'emit');

            const modifiers = vampireBonus.getRuleModifiers();
            if (modifiers.onExecuteMove) {
                modifiers.onExecuteMove(game, move);
            }

            const unitsOnBoard = game.board.getAllSquares()
                .filter(s => s.piece && s.piece.color === 'white' && (s.piece.type === 'bishop' || s.piece.type === 'knight'));

            expect(unitsOnBoard.length).toBe(0);
            expect(emitSpy).not.toHaveBeenCalled();
        });
    });
});
