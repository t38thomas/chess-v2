import { describe, it, expect, beforeEach } from 'vitest';
import { BoardModel } from '../../models/BoardModel';
import { Coordinate } from '../../models/Coordinate';
import { Piece } from '../../models/Piece';
import { Move } from '../../models/Move';
import { TheSpectre } from './TheSpectre';
import { ChessGame } from '../../ChessGame';
import { MoveGenerator } from '../../rules/MoveGenerator';

describe('The Spectre Pact', () => {
    let board: BoardModel;
    let game: ChessGame;
    const bonus = TheSpectre.bonus;
    const malus = TheSpectre.malus;

    beforeEach(() => {
        game = new ChessGame();
        board = game.board;
    });

    describe('SpectreBonus (Incorporeal)', () => {
        it('should allow a Rook to move through a friendly pawn', () => {
            board.clear();
            const whiteRook = new Piece('rook', 'white', 'white-rook-0');
            const whitePawn = new Piece('pawn', 'white', 'white-pawn-0');
            const start = new Coordinate(0, 0);

            board.placePiece(start, whiteRook);
            board.placePiece(new Coordinate(0, 1), whitePawn);

            const perks = [{ id: 'incorporeal' } as any];
            const moves = MoveGenerator.getPseudoLegalMoves(board, whiteRook, start, null, perks, new Set(), game);

            // Without the perk, it would be blocked at (0,1). 
            // With the perk, it should be able to reach (0,2), (0,3), etc.
            const moveAt02 = moves.find(m => m.to.x === 0 && m.to.y === 2);
            expect(moveAt02).toBeDefined();
        });

        it('should NOT allow a Rook to move through a friendly Knight', () => {
            board.clear();
            const whiteRook = new Piece('rook', 'white', 'white-rook-0');
            const whiteKnight = new Piece('knight', 'white', 'white-knight-0');
            const start = new Coordinate(0, 0);

            board.placePiece(start, whiteRook);
            board.placePiece(new Coordinate(0, 1), whiteKnight);

            const perks = [{ id: 'incorporeal' } as any];
            const moves = MoveGenerator.getPseudoLegalMoves(board, whiteRook, start, null, perks, new Set(), game);

            const moveAt02 = moves.find(m => m.to.x === 0 && m.to.y === 2);
            expect(moveAt02).toBeUndefined();
        });

        it('should NOT allow a Pawn to move through another friendly Pawn', () => {
            board.clear();
            const whitePawn1 = new Piece('pawn', 'white', 'white-pawn-1');
            const whitePawn2 = new Piece('pawn', 'white', 'white-pawn-2');
            const start = new Coordinate(0, 1);

            board.placePiece(start, whitePawn1);
            board.placePiece(new Coordinate(0, 2), whitePawn2);

            const perks = [{ id: 'incorporeal' } as any];
            const moves = MoveGenerator.getPseudoLegalMoves(board, whitePawn1, start, null, perks, new Set(), game);

            // Pawns cannot move through anything, even with the perk (as per implementation)
            const moveAt03 = moves.find(m => m.to.x === 0 && m.to.y === 3);
            expect(moveAt03).toBeUndefined();
        });
    });

    describe('SpectreMalus (Possession)', () => {
        it('should remove friendly pawns passed through by a Rook', () => {
            board.clear();
            const whiteRook = new Piece('rook', 'white', 'white-rook-0');
            const whitePawn = new Piece('pawn', 'white', 'white-pawn-0');
            const start = new Coordinate(0, 0);
            const target = new Coordinate(0, 3);

            board.placePiece(start, whiteRook);
            board.placePiece(new Coordinate(0, 1), whitePawn);

            const events: any[] = [];
            game.subscribe((event, payload) => {
                if (event === 'pact_effect') events.push(payload);
            });

            const move = new Move(start, target, whiteRook);
            malus.getRuleModifiers().onExecuteMove!(game, move, { playerId: 'white' } as any);

            expect(events.length).toBeGreaterThan(0);
            expect(events[0].title).toBe('pact.toasts.spectre.possession.title');
            expect(board.getSquare(new Coordinate(0, 1))?.piece).toBeNull();
        });

        it('should NOT remove friendly pawns if the piece did not pass through them (e.g. Knight jump)', () => {
            board.clear();
            const whiteKnight = new Piece('knight', 'white', 'white-knight-0');
            const whitePawn = new Piece('pawn', 'white', 'white-pawn-0');
            const start = new Coordinate(1, 0);
            const target = new Coordinate(0, 2);

            board.placePiece(start, whiteKnight);
            board.placePiece(new Coordinate(1, 1), whitePawn); // This is in the "way" but knights jump

            const move = new Move(start, target, whiteKnight);
            malus.getRuleModifiers().onExecuteMove!(game, move, { playerId: 'white' } as any);

            expect(board.getSquare(new Coordinate(1, 1))?.piece).not.toBeNull();
        });
    });
});
