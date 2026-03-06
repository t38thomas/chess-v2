import { describe, it, expect, beforeEach } from 'vitest';
import { BoardModel } from '../../models/BoardModel';
import { Coordinate } from '../../models/Coordinate';
import { Piece, PieceColor } from '../../models/Piece';
import { Move } from '../../models/Move';
import { TheChangeling } from './TheChangeling';
import { ChessGame } from '../../ChessGame';
import { MoveGenerator } from '../../rules/MoveGenerator';

describe('The Changeling Pact', () => {
    let board: BoardModel;
    let game: ChessGame;
    const bonus = TheChangeling.bonus;
    const malus = TheChangeling.malus;

    beforeEach(() => {
        game = new ChessGame();
        board = game.board;
    });

    describe('ChangelingBonus (Mimicry)', () => {
        it('should trigger mimicry on pawn capture', () => {
            board.clear();
            const whitePawn = new Piece('pawn', 'white', 'white-pawn-0');
            const blackPawn = new Piece('pawn', 'black', 'black-pawn-0');
            const start = new Coordinate(3, 3);
            const captureTarget = new Coordinate(4, 4);

            board.placePiece(start, whitePawn);
            board.placePiece(captureTarget, blackPawn);

            const move = new Move(start, captureTarget, whitePawn, blackPawn, false, false, false, false);

            // Execute capture
            game.turn = 'white';
            const context = bonus.createContextWithState({ game, playerId: 'white', pactId: 'mimicry' });
            bonus.onEvent('capture', { attacker: whitePawn, victim: blackPawn, capturedPiece: blackPawn }, context);

            // Check if activeMimics has entry
            const contextWithState = bonus.createContextWithState({ game, playerId: 'white', pactId: 'changeling' });
            expect(contextWithState.state.mimicry_activeMimics[whitePawn.id]).toBeDefined();

        });

        it('should allow pawn to move like the specific mimicked piece (e.g. Bishop)', () => {
            board.clear();
            const whitePawn = new Piece('pawn', 'white', 'white-pawn-0');
            const blackBishop = new Piece('bishop', 'black', 'black-bishop-0');
            const start = new Coordinate(3, 3);
            const captureTarget = new Coordinate(4, 4);

            board.placePiece(start, whitePawn);
            board.placePiece(captureTarget, blackBishop);

            const move = new Move(start, captureTarget, whitePawn, blackBishop, false, false, false, false);

            game.turn = 'white';
            const context = bonus.createContextWithState({ game, playerId: 'white', pactId: 'mimicry' });
            bonus.onEvent('capture', { attacker: whitePawn, victim: blackBishop, capturedPiece: blackBishop }, context);

            // Verify it mimicked a BISHOP specifically
            const contextWithState = bonus.createContextWithState({ game, playerId: 'white', pactId: 'changeling' });
            expect(contextWithState.state.mimicry_activeMimics[whitePawn.id].data.type).toBe('bishop');


            const modifiers = bonus.getRuleModifiers();
            const moves: Move[] = [];
            const freshContext = bonus.createContextWithState({ game, playerId: 'white', pactId: 'mimicry' });
            if (modifiers.onGetPseudoMoves) {
                modifiers.onGetPseudoMoves({
                    board,
                    piece: whitePawn,
                    from: captureTarget, // Piece is now at captureTarget
                    moves,
                    game
                }, freshContext);
            }

            // Should have bishop moves (diagonal)
            const diagonalMove = moves.find(m => m.to.x === 6 && m.to.y === 6);
            expect(diagonalMove).toBeDefined();
        });

        it('should allow pawn to move like the mimicked piece (e.g. Rook)', () => {
            board.clear();
            const whitePawn = new Piece('pawn', 'white', 'white-pawn-0');
            const start = new Coordinate(3, 3);
            board.placePiece(start, whitePawn);

            // Force set mimicry to Rook
            const context = bonus.createContextWithState({ game, playerId: 'white', pactId: 'mimicry' });
            context.updateState({
                mimicry_activeMimics: {
                    [whitePawn.id]: {
                        data: { type: 'rook' },
                        expiresAtTurn: 100
                    }
                }
            });

            const modifiers = bonus.getRuleModifiers();
            const moves: Move[] = [];
            const freshContext = bonus.createContextWithState({ game, playerId: 'white', pactId: 'mimicry' });

            if (modifiers.onGetPseudoMoves) {
                modifiers.onGetPseudoMoves({
                    board,
                    piece: whitePawn,
                    from: start,
                    moves,
                    game
                }, freshContext);
            }

            // Should have rook moves (horizontal/vertical)
            // e.g. (3, 5) which is 2 squares up
            const rookMove = moves.find(m => m.to.x === 3 && m.to.y === 5);
            expect(rookMove).toBeDefined();
        });
    });

    describe('ChangelingMalus (Unstable Identity)', () => {
        let context: any;

        beforeEach(() => {
            context = malus.createContextWithState({ game, playerId: 'white', pactId: 'unstable_identity' });
        });

        it('should increment turns counter on turn start', () => {
            malus.onEvent('turn_start', { playerId: 'white' }, context);
            const contextWithState = malus.createContextWithState({ game, playerId: 'white', pactId: 'changeling' });
            expect(contextWithState.state.unstable_identity).toBe(1);

        });

        it('should reset turns counter on capture', () => {
            context.updateState({ unstable_identity: 3 });
            const move = new Move(new Coordinate(0, 0), new Coordinate(0, 1), new Piece('pawn', 'white', 'p1'), new Piece('pawn', 'black', 'p2'), false, false, false, false);
            malus.onEvent('capture', { attacker: move.piece, victim: move.capturedPiece!, to: move.to, from: move.from }, context);

            const contextWithState = malus.createContextWithState({ game, playerId: 'white', pactId: 'changeling' });
            expect(contextWithState.state.unstable_identity).toBe(0);
        });


        it('should demote a piece after 5 turns without capture', () => {
            board.clear();
            const whiteRook = new Piece('rook', 'white', 'white-rook-0');
            board.placePiece(new Coordinate(0, 0), whiteRook);

            context.updateState({ unstable_identity: 4 });
            let freshContext = malus.createContextWithState({ game, playerId: 'white', pactId: 'changeling' });


            // Trigger the 5th turn
            malus.onEvent('turn_start', { playerId: 'white' }, context);

            const piece = board.getSquare(new Coordinate(0, 0))?.piece;
            expect(piece?.type).toBe('pawn');
            const contextWithState = malus.createContextWithState({ game, playerId: 'white', pactId: 'changeling' });
            expect(contextWithState.state.unstable_identity).toBe(0); // Should reset

        });

        it('should not demote King or Pawn', () => {
            board.clear();
            const whiteKing = new Piece('king', 'white', 'white-king-0');
            const whitePawn = new Piece('pawn', 'white', 'white-pawn-0');
            board.placePiece(new Coordinate(0, 0), whiteKing);
            board.placePiece(new Coordinate(1, 1), whitePawn);

            context.updateState({ unstable_identity: 4 });
            let freshContext = malus.createContextWithState({ game, playerId: 'white', pactId: 'changeling' });


            malus.onEvent('turn_start', { playerId: 'white' }, context);

            expect(board.getSquare(new Coordinate(0, 0))?.piece?.type).toBe('king');
            expect(board.getSquare(new Coordinate(1, 1))?.piece?.type).toBe('pawn');
        });
        it('should return turn counters', () => {
            context.updateState({ unstable_identity: 2 });
            const counters = malus.getTurnCounters({ game, playerId: 'white', pactId: 'unstable_identity' });
            expect(counters.length).toBe(1);
            expect(counters[0].value).toBe(2);
            expect(counters[0].id).toBe('unstable_identity_counter');
        });
    });
});
