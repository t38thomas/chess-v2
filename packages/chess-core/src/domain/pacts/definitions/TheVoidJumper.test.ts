import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChessGame } from '../../ChessGame';
import { VoidJumpBonus } from './TheVoidJumper';
import { Coordinate } from '../../models/Coordinate';
import { PieceColor } from '../../models/Piece';
import { PactContext } from '../PactLogic';

describe('The Void Jumper Pact', () => {
    let game: ChessGame;
    let bonus: VoidJumpBonus;

    beforeEach(() => {
        game = new ChessGame();
        bonus = new VoidJumpBonus();
    });

    const createContext = (playerId: PieceColor): PactContext => ({
        game,
        playerId,
        pactId: 'void_jump'
    });

    // Helper to clear board
    const clearBoard = () => {
        game.board.getAllSquares().forEach(s => {
            if (s.piece) {
                game.board.removePiece(s.coordinate);
            }
        });
    };

    // Helper to create a mock piece
    const createMockPiece = (type: any, color: PieceColor, id: string, hasMoved: boolean = false) => ({
        type,
        color,
        id,
        hasMoved,
        clone: function () { return { ...this }; }
    });

    describe('Void Jump Ability', () => {
        it('should swap two friendly pieces and sacrifice a third most advanced piece', () => {
            clearBoard();

            // Setup: 
            // Pawn1 at A2 (0, 1)
            // Rook1 at A1 (0, 0)
            // Victim Pawn at H7 (7, 6) - Most advanced
            const p1Coord = new Coordinate(0, 1);
            const p2Coord = new Coordinate(0, 0);
            const victimCoord = new Coordinate(7, 6);

            game.board.placePiece(p1Coord, createMockPiece('pawn', 'white', 'p1'));
            game.board.placePiece(p2Coord, createMockPiece('rook', 'white', 'r1'));
            game.board.placePiece(victimCoord, createMockPiece('pawn', 'white', 'v1'));

            const context = createContext('white');
            const result = bonus.activeAbility.execute(context, { from: p1Coord, to: p2Coord });

            expect(result).toBe(true);

            // Verify Swap
            // p1Coord (A2) should have Rook
            // p2Coord (A1) should have Pawn
            const newP1 = game.board.getSquare(p1Coord)?.piece;
            const newP2 = game.board.getSquare(p2Coord)?.piece;

            expect(newP1?.type).toBe('rook');
            expect(newP2?.type).toBe('pawn');

            // Verify Sacrifice
            const victim = game.board.getSquare(victimCoord)?.piece;
            expect(victim).toBeNull();
        });

        it('should sacrifice the most advanced piece (excluding King)', () => {
            clearBoard();

            const pNear = new Coordinate(0, 1);
            const pFar = new Coordinate(0, 3);
            const kingCoord = new Coordinate(4, 0);

            game.board.placePiece(kingCoord, createMockPiece('king', 'white', 'k1'));
            game.board.placePiece(pNear, createMockPiece('pawn', 'white', 'p1'));
            game.board.placePiece(pFar, createMockPiece('pawn', 'white', 'p2'));

            const context = createContext('white');
            const emitSpy = vi.spyOn(game, 'emit');

            // Swap King and Near Pawn
            const result = bonus.activeAbility.execute(context, { from: pNear, to: kingCoord });

            expect(result).toBe(true);

            // Verify Swap
            expect(game.board.getSquare(pNear)?.piece?.type).toBe('king');
            expect(game.board.getSquare(kingCoord)?.piece?.type).toBe('pawn');

            // Verify Sacrifice (pFar should be gone)
            const farPiece = game.board.getSquare(pFar)?.piece;
            expect(farPiece).toBeNull();

            // Toast should be emitted
            expect(emitSpy).toHaveBeenCalledWith('pact_effect', expect.objectContaining({
                pactId: 'ritual_sacrifice',
                type: 'malus'
            }));
        });

        it('should NOT sacrifice the King even if it is most advanced', () => {
            clearBoard();

            const kingPos = new Coordinate(4, 6);
            const pawnPos = new Coordinate(0, 5);
            const pawn2Pos = new Coordinate(1, 2);

            game.board.placePiece(kingPos, createMockPiece('king', 'white', 'k1', true));
            game.board.placePiece(pawnPos, createMockPiece('pawn', 'white', 'p1'));
            game.board.placePiece(pawn2Pos, createMockPiece('pawn', 'white', 'p2'));

            const context = createContext('white');

            // Swap pawnPos (0,5) and pawn2Pos (1,2)
            const res = bonus.activeAbility.execute(context, { from: pawnPos, to: pawn2Pos });
            expect(res).toBe(true);

            // State after swap:
            // At 0,5: Pawn2 (was at 1,2)
            // At 1,2: Pawn1 (was at 0,5)
            // King at 4,6 (Rank 6)

            // Sacrifice check:
            // Candidates: King(Rank 6), Pawn2(Rank 5), Pawn1(Rank 2)
            // King is most advanced but excluded.
            // Pawn2 is next most advanced. It should die.

            expect(game.board.getSquare(kingPos)?.piece?.type).toBe('king'); // King survives

            expect(game.board.getSquare(pawnPos)?.piece).toBeNull(); // Pawn 2 (at 0,5) sacrificed
            expect(game.board.getSquare(pawn2Pos)?.piece?.type).toBe('pawn'); // Pawn 1 (at 1,2) safe
        });

        it('should fail if trying to swap enemy pieces', () => {
            const whitePawn = new Coordinate(0, 1);
            const blackPawn = new Coordinate(0, 6);

            const context = createContext('white');
            const result = bonus.activeAbility.execute(context, { from: whitePawn, to: blackPawn });

            expect(result).toBe(false);
        });
    });
});
