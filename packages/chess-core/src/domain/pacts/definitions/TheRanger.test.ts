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
            const initialContext = bonus.createContextWithState({ game, playerId: 'white', pactId: 'snipe' });
            initialContext.updateState({ snipeActive: true });

            const freshContext = bonus.createContextWithState({ game, playerId: 'white', pactId: 'snipe' });

            const modifiers = bonus.getRuleModifiers();
            if (modifiers.onGetPseudoMoves) {
                modifiers.onGetPseudoMoves({
                    board,
                    piece: whiteBishop,
                    from: start,
                    moves,
                    game
                }, freshContext);
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
            const initialContext = bonus.createContextWithState({ game, playerId: 'white', pactId: 'snipe' });
            initialContext.updateState({ snipeActive: true });

            const freshContext = bonus.createContextWithState({ game, playerId: 'white', pactId: 'snipe' });

            const modifiers = bonus.getRuleModifiers();
            if (modifiers.onGetPseudoMoves) {
                modifiers.onGetPseudoMoves({
                    board,
                    piece: whiteBishop,
                    from: start,
                    moves,
                    game
                }, freshContext);
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
            const context = bonus.createContextWithState({ game, playerId: 'white', pactId: 'snipe' });
            bonus.activeAbility!.execute(context, {});
            expect(bonus.createContextWithState({ game, playerId: 'white', pactId: bonus.id }).state?.snipeActive).toBe(true);

            const move = new Move(start, target, whiteBishop, blackPawn, false, false, false, true);

            // Simulate the move being executed on board first (as ChessGame would)
            board.movePiece(start, target);
            expect(board.getSquare(start)?.piece).toBeNull();
            expect(board.getSquare(target)?.piece).toBe(whiteBishop);

            const freshContext = bonus.createContextWithState({ game, playerId: 'white', pactId: 'snipe' });

            // Now apply pact effect
            const modifiers = bonus.getRuleModifiers();
            if (modifiers.onExecuteMove) {
                modifiers.onExecuteMove(game, move, freshContext);
            }

            // Bishop should be back at start
            expect(board.getSquare(start)?.piece).toBe(whiteBishop);
            expect(board.getSquare(target)?.piece).toBeNull();

            // Toggle should be reset
            expect(bonus.createContextWithState({ game, playerId: 'white', pactId: bonus.id }).state?.snipeActive).toBe(false);
        });

        it('should NOT move Bishop back if Snipe is NOT active', () => {
            board.clear();
            const whiteBishop = new Piece('bishop', 'white', 'w-bishop');
            const blackPawn = new Piece('pawn', 'black', 'b-pawn');
            const start = new Coordinate(4, 4);
            const target = new Coordinate(6, 6);
            board.placePiece(start, whiteBishop);
            board.placePiece(target, blackPawn);

            const context = bonus.createContextWithState({ game, playerId: 'white', pactId: 'snipe' });

            // Snipe NOT activated
            expect(bonus.createContextWithState({ game, playerId: 'white', pactId: bonus.id }).state?.snipeActive).toBeFalsy();

            const move = new Move(start, target, whiteBishop, blackPawn, false, false, false, true);

            // Simulate the move
            board.movePiece(start, target);

            // Apply pact effect
            const modifiers = bonus.getRuleModifiers();
            if (modifiers.onExecuteMove) {
                modifiers.onExecuteMove(game, move, context);
            }

            // Bishop should stay at target
            expect(board.getSquare(start)?.piece).toBeNull();
            expect(board.getSquare(target)?.piece).toBe(whiteBishop);
        });
    });
});
