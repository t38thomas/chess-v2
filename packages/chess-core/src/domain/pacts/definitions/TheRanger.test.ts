import { describe, it, expect, beforeEach } from 'vitest';
import { BoardModel } from '../../models/BoardModel';
import { Coordinate } from '../../models/Coordinate';
import { Piece } from '../../models/Piece';
import { Move } from '../../models/Move';
import { TheRanger } from './TheRanger';
import { ChessGame } from '../../ChessGame';

describe('The Ranger Pact', () => {
    let board: BoardModel;
    let game: ChessGame;
    const bonus = TheRanger.bonus;
    const malus = TheRanger.malus;

    beforeEach(() => {
        game = new ChessGame();
        board = game.board;
    });

    describe('Short Sighted (Malus)', () => {
        it('should limit Bishop range to 4 squares', () => {
            const bishop = new Piece('bishop', 'white', 'w-bishop');
            const modifiers = malus.getRuleModifiers();
            if (modifiers.getMaxRange) {
                expect(modifiers.getMaxRange(bishop)).toBe(4);
            } else {
                expect(true).toBe(false); // Fails if getMaxRange is missing
            }
        });

        it('should NOT limit other pieces range', () => {
            const rook = new Piece('rook', 'white', 'w-rook');
            const modifiers = malus.getRuleModifiers();
            if (modifiers.getMaxRange) {
                expect(modifiers.getMaxRange(rook)).toBe(8);
            }
        });
    });

    describe('Snipe (Bonus)', () => {
        it('should generate distance 2 capture moves', () => {
            board.clear();
            const whiteBishop = new Piece('bishop', 'white', 'w-bishop');
            const blackPawn = new Piece('pawn', 'black', 'b-pawn');
            const start = new Coordinate(4, 4);
            const target = new Coordinate(6, 6);
            board.placePiece(start, whiteBishop);
            board.placePiece(target, blackPawn);

            const moves: Move[] = [];

            // Activate Snipe for the test
            game.pactState['ranger_snipe_active_white'] = true;

            const modifiers = bonus.getRuleModifiers();
            if (modifiers.onGetPseudoMoves) {
                modifiers.onGetPseudoMoves({
                    board,
                    piece: whiteBishop,
                    from: start,
                    moves,
                    game
                });
            }

            const snipeMove = moves.find(m => m.to.equals(target) && m.isSnipe);
            expect(snipeMove).toBeDefined();
        });

        it('should allow Snipe at distance 1', () => {
            board.clear();
            const whiteBishop = new Piece('bishop', 'white', 'w-bishop');
            const blackPawn = new Piece('pawn', 'black', 'b-pawn');
            const start = new Coordinate(4, 4);
            const target = new Coordinate(5, 5);
            board.placePiece(start, whiteBishop);
            board.placePiece(target, blackPawn);

            const moves: Move[] = [];

            // Activate Snipe for the test
            game.pactState['ranger_snipe_active_white'] = true;

            const modifiers = bonus.getRuleModifiers();
            if (modifiers.onGetPseudoMoves) {
                modifiers.onGetPseudoMoves({
                    board,
                    piece: whiteBishop,
                    from: start,
                    moves,
                    game
                });
            }

            const snipeMove = moves.find(m => m.to.equals(target) && m.isSnipe);
            expect(snipeMove).toBeDefined();
        });

        it('should move Bishop back if Snipe is active', () => {
            board.clear();
            const whiteBishop = new Piece('bishop', 'white', 'w-bishop');
            const blackPawn = new Piece('pawn', 'black', 'b-pawn');
            const start = new Coordinate(4, 4);
            const target = new Coordinate(6, 6);
            board.placePiece(start, whiteBishop);
            board.placePiece(target, blackPawn);

            // Activate Snipe ability
            const context = { game, playerId: 'white' as const, pactId: 'snipe' };
            bonus.activeAbility!.execute(context, {});
            expect(game.pactState['ranger_snipe_active_white']).toBe(true);

            const move = new Move(start, target, whiteBishop, blackPawn, false, false, false, true);

            // Simulate the move being executed on board first (as ChessGame would)
            board.movePiece(start, target);
            expect(board.getSquare(start)?.piece).toBeNull();
            expect(board.getSquare(target)?.piece).toBe(whiteBishop);

            // Now apply pact effect
            const modifiers = bonus.getRuleModifiers();
            if (modifiers.onExecuteMove) {
                modifiers.onExecuteMove(game, move);
            }

            // Bishop should be back at start
            expect(board.getSquare(start)?.piece).toBe(whiteBishop);
            expect(board.getSquare(target)?.piece).toBeNull();

            // Toggle should be reset
            expect(game.pactState['ranger_snipe_active_white']).toBe(false);
        });

        it('should NOT move Bishop back if Snipe is NOT active', () => {
            board.clear();
            const whiteBishop = new Piece('bishop', 'white', 'w-bishop');
            const blackPawn = new Piece('pawn', 'black', 'b-pawn');
            const start = new Coordinate(4, 4);
            const target = new Coordinate(6, 6);
            board.placePiece(start, whiteBishop);
            board.placePiece(target, blackPawn);

            // Snipe NOT activated
            expect(game.pactState['ranger_snipe_active_white']).toBeUndefined();

            const move = new Move(start, target, whiteBishop, blackPawn, false, false, false, true);

            // Simulate the move
            board.movePiece(start, target);

            // Apply pact effect
            const modifiers = bonus.getRuleModifiers();
            if (modifiers.onExecuteMove) {
                modifiers.onExecuteMove(game, move);
            }

            // Bishop should stay at target
            expect(board.getSquare(start)?.piece).toBeNull();
            expect(board.getSquare(target)?.piece).toBe(whiteBishop);
        });
    });
});
