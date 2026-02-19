import { describe, it, expect, beforeEach } from 'vitest';
import { BoardModel } from '../../models/BoardModel';
import { Coordinate } from '../../models/Coordinate';
import { Piece } from '../../models/Piece';
import { Move } from '../../models/Move';
import { TheSniper } from './TheSniper';
import { ChessGame } from '../../ChessGame';
import { MoveGenerator } from '../../rules/MoveGenerator';
import { CheckDetector } from '../../rules/CheckDetector';
import { PactFactory } from '../PactFactory';

describe('The Sniper Pact', () => {
    let board: BoardModel;
    let game: ChessGame;
    const bonus = TheSniper.bonus;
    const malus = TheSniper.malus;

    beforeEach(() => {
        game = new ChessGame();
        board = game.board;
    });

    describe('SniperBonus (Long Sight)', () => {
        it('should allow Rook to see through one obstacle', () => {
            board.clear();
            const whiteRook = new Piece('rook', 'white', 'white-rook-1');
            const whitePawn = new Piece('pawn', 'white', 'white-pawn-1');
            const start = new Coordinate(0, 0);
            board.placePiece(start, whiteRook);
            board.placePiece(new Coordinate(0, 1), whitePawn);

            const moves: Move[] = [];
            bonus.getRuleModifiers().onGetPseudoMoves!({
                board,
                piece: whiteRook,
                from: start,
                moves
            });

            // Should be able to move to (0,2), (0,3), etc.
            expect(moves.some(m => m.to.toString() === '0,2')).toBe(true);
            expect(moves.some(m => m.to.toString() === '0,7')).toBe(true);
        });

        it('should allow Rook to capture behind one obstacle', () => {
            board.clear();
            const whiteRook = new Piece('rook', 'white', 'white-rook-1');
            const whitePawn = new Piece('pawn', 'white', 'white-pawn-1');
            const blackPawn = new Piece('pawn', 'black', 'black-pawn-1');

            const start = new Coordinate(4, 4);
            board.placePiece(start, whiteRook);
            board.placePiece(new Coordinate(4, 5), whitePawn); // Friendly obstacle
            board.placePiece(new Coordinate(4, 7), blackPawn); // Target

            const moves: Move[] = [];
            bonus.getRuleModifiers().onGetPseudoMoves!({
                board,
                piece: whiteRook,
                from: start,
                moves
            });

            const captureMove = moves.find(m => m.to.toString() === '4,7');
            expect(captureMove).toBeDefined();
            expect(captureMove?.capturedPiece).toBeDefined();
        });

        it('should be blocked by two obstacles', () => {
            board.clear();
            const whiteRook = new Piece('rook', 'white', 'white-rook-1');
            board.placePiece(new Coordinate(0, 0), whiteRook);
            board.placePiece(new Coordinate(0, 1), new Piece('pawn', 'white', 'p1'));
            board.placePiece(new Coordinate(0, 2), new Piece('pawn', 'white', 'p2'));

            const moves: Move[] = [];
            bonus.getRuleModifiers().onGetPseudoMoves!({
                board,
                piece: whiteRook,
                from: new Coordinate(0, 0),
                moves
            });

            // Should NOT be able to move to (0,3)
            expect(moves.some(m => m.to.toString() === '0,3')).toBe(false);
        });
    });

    describe('SniperMalus (Reload)', () => {
        it('should set cooldown after a Rook capture', () => {
            const whiteRook = new Piece('rook', 'white', 'white-rook-1');
            const blackPawn = new Piece('pawn', 'black', 'black-pawn-1');
            const move = new Move(new Coordinate(0, 0), new Coordinate(0, 5), whiteRook, blackPawn);

            malus.getRuleModifiers().onExecuteMove!(game, move);

            expect(game.pieceCooldowns.get(whiteRook.id)).toBe(2);
        });

        it('should block move if cooldown is active', () => {
            const whiteRook = new Piece('rook', 'white', 'white-rook-1');
            board.placePiece(new Coordinate(0, 0), whiteRook);
            game.pieceCooldowns.set(whiteRook.id, 1);

            const canMove = malus.getRuleModifiers().canMovePiece!(game, new Coordinate(0, 0));
            expect(canMove).toBe(false);
        });
    });

    describe('Integration', () => {
        const getLegalMoves = (game: ChessGame, from: Coordinate) => {
            const piece = game.board.getSquare(from)?.piece;
            if (!piece) return [];

            const playerPacts = game.pacts[piece.color].map(p => [p.bonus, p.malus]).flat();
            const opponentColor = piece.color === 'white' ? 'black' : 'white';
            const opponentPacts = game.pacts[opponentColor].map(p => [p.bonus, p.malus]).flat();

            const pseudoMoves = MoveGenerator.getPseudoLegalMoves(
                game.board,
                piece,
                from,
                game.enPassantTarget,
                playerPacts,
                game.perkUsage[piece.color],
                game
            );

            return pseudoMoves.filter(m =>
                !CheckDetector.wouldLeaveKingInCheck(game.board, m.from, m.to, piece.color, opponentPacts, m.isSwap, game)
            );
        };

        beforeEach(() => {
            PactFactory.initialize();

            // Assign pact to white
            game.pacts.white = [
                // @ts-ignore
                { id: TheSniper.id, name: 'The Sniper', bonus: { id: bonus.id, name: 'Long Sight', description: '' }, malus: { id: malus.id, name: 'Reload', description: '' }, category: 'Passive', description: '' }
            ];
            game.pacts.black = [];

            game.phase = 'playing';

            game.board.clear();

            // Clear cooldowns
            game.pieceCooldowns.clear();
        });

        it('should allow a Sniper Rook to capture through an obstacle', () => {
            const whiteRook = new Piece('rook', 'white', 'white-rook-1');
            const whitePawn = new Piece('pawn', 'white', 'white-pawn-1'); // Obstacle
            const blackPawn = new Piece('pawn', 'black', 'black-pawn-1'); // Target
            const whiteKing = new Piece('king', 'white', 'white-king');
            const blackKing = new Piece('king', 'black', 'black-king');

            // Setup: R P . . . . . p
            game.board.placePiece(new Coordinate(0, 0), whiteRook);
            game.board.placePiece(new Coordinate(0, 1), whitePawn);
            game.board.placePiece(new Coordinate(0, 7), blackPawn);
            game.board.placePiece(new Coordinate(7, 7), whiteKing);
            game.board.placePiece(new Coordinate(7, 1), blackKing);

            game.turn = 'white';

            const moves = getLegalMoves(game, new Coordinate(0, 0));
            const captureMove = moves.find(m => m.to.x === 0 && m.to.y === 7);

            expect(captureMove).toBeDefined();

            if (captureMove) {
                const success = game.makeMove(captureMove.from, captureMove.to);
                expect(success).toBe(true);

                // Check capture
                const targetSquare = game.board.getSquare(new Coordinate(0, 7));
                expect(targetSquare?.piece?.id).toBe(whiteRook.id);
                // pieceCooldowns check
                expect(game.pieceCooldowns.get(whiteRook.id)).toBe(2);
            }
        });

        it('should decrement cooldown after full round', () => {
            const whiteRook = new Piece('rook', 'white', 'white-rook-1');
            const whiteKing = new Piece('king', 'white', 'white-king');
            const blackKing = new Piece('king', 'black', 'black-king');
            const blackPawn = new Piece('pawn', 'black', 'black-pawn-dummy');

            game.board.placePiece(new Coordinate(0, 0), whiteRook);
            game.board.placePiece(new Coordinate(7, 7), whiteKing);
            game.board.placePiece(new Coordinate(7, 1), blackKing); // Moved to row 1 to be safe
            game.board.placePiece(new Coordinate(1, 1), blackPawn); // Something for black to move

            game.turn = 'white';
            // Manually set cooldown
            game.pieceCooldowns.set(whiteRook.id, 2);

            // White moves King (Rook is on cooldown2)
            game.makeMove(new Coordinate(7, 7), new Coordinate(6, 7)); // White moves

            // Now it's Black's turn. 
            expect(game.turn).toBe('black');

            // Cooldown for White should NOT decrement yet, because it's Black's turn.
            expect(game.pieceCooldowns.get(whiteRook.id)).toBe(2);

            // Black moves
            // Black pawn at (1, 1). Standard move is to (1, 0)
            game.makeMove(new Coordinate(1, 1), new Coordinate(1, 0));

            // Now it's White's turn again.
            // Listener should decrement White's cooldowns.
            expect(game.turn).toBe('white');
            expect(game.pieceCooldowns.get(whiteRook.id)).toBe(1);
        });
    });
});
