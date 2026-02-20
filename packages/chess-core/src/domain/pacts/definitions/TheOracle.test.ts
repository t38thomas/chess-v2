import { describe, it, expect, beforeEach } from 'vitest';
import { BoardModel } from '../../models/BoardModel';
import { Coordinate } from '../../models/Coordinate';
import { Piece, PieceColor } from '../../models/Piece';
import { Move } from '../../models/Move';
import { TheOracle } from './TheOracle';
import { ChessGame } from '../../ChessGame';
import { GameEvent } from '../../GameTypes';
import { PactContext } from '../PactLogic';

describe('The Oracle Pact', () => {
    let board: BoardModel;
    let game: ChessGame;
    const malus = TheOracle.malus;
    const playerId: PieceColor = 'white';

    beforeEach(() => {
        game = new ChessGame();
        board = game.board;
        board.clear(); // Important to start with empty board
    });

    const getContext = () => malus.createContextWithState({
        game,
        playerId,
        pactId: TheOracle.id
    });

    describe('Inevitable Fate Malus', () => {
        it('should sacrifice the moving piece if an undefended capture was possible but not taken', () => {
            // Setup: White Rook at A1. Black Pawn at A5 (undefended).
            const whiteRook = new Piece('rook', 'white', 'wr');
            const blackPawn = new Piece('pawn', 'black', 'bp');
            board.placePiece(new Coordinate(0, 0), whiteRook);
            board.placePiece(new Coordinate(0, 4), blackPawn);

            // 1. Turn Start: Check opportunity
            malus.onTurnStart(getContext());

            // 2. Perform Move: Rook to B1 (missed capture)
            const move = new Move(new Coordinate(0, 0), new Coordinate(1, 0), whiteRook);
            board.removePiece(new Coordinate(0, 0));
            board.placePiece(new Coordinate(1, 0), whiteRook);

            // 3. Trigger Event
            malus.onEvent('move', move, getContext());

            // 4. Assert: Rook should be removed (sacrificed)
            const rookSquare = board.getSquare(new Coordinate(1, 0));
            expect(rookSquare?.piece).toBeNull();
        });

        it('should NOT sacrifice the piece if an undefended capture was taken', () => {
            // Setup: White Rook at A1. Black Pawn at A5 (undefended).
            const whiteRook = new Piece('rook', 'white', 'wr');
            const blackPawn = new Piece('pawn', 'black', 'bp');
            board.placePiece(new Coordinate(0, 0), whiteRook);
            board.placePiece(new Coordinate(0, 4), blackPawn);

            // 1. Turn Start
            malus.onTurnStart(getContext());

            // 2. Perform Move: Capture A5
            const move = new Move(new Coordinate(0, 0), new Coordinate(0, 4), whiteRook, blackPawn);
            board.removePiece(new Coordinate(0, 0));
            board.placePiece(new Coordinate(0, 4), whiteRook);

            // 3. Trigger Event
            malus.onEvent('move', move, getContext());

            // 4. Assert: Rook should remain
            const rookSquare = board.getSquare(new Coordinate(0, 4));
            expect(rookSquare?.piece).toBe(whiteRook);
        });

        it('should sacrifice the piece if a DEFENDED capture was taken while an UNDEFENDED one was available', () => {
            // Setup: 
            // White Rook at A1.
            // Black Pawn at A5 (defended by Black Rook at B5).
            // Black Pawn at C1 (undefended).
            const whiteRook = new Piece('rook', 'white', 'wr');
            const blackPawnDefended = new Piece('pawn', 'black', 'bp1');
            const blackRook = new Piece('rook', 'black', 'br');
            const blackPawnUndefended = new Piece('pawn', 'black', 'bp2');

            board.placePiece(new Coordinate(0, 0), whiteRook); // A1
            board.placePiece(new Coordinate(0, 4), blackPawnDefended); // A5
            board.placePiece(new Coordinate(1, 4), blackRook); // B5 guards A5
            board.placePiece(new Coordinate(2, 0), blackPawnUndefended); // C1 (undefended)

            // 1. Turn Start
            malus.onTurnStart(getContext());

            // 2. Perform Move: Capture A5 (defended)
            const move = new Move(new Coordinate(0, 0), new Coordinate(0, 4), whiteRook, blackPawnDefended);
            board.removePiece(new Coordinate(0, 0));
            board.placePiece(new Coordinate(0, 4), whiteRook); // Rook is now at A5

            // 3. Trigger Event
            // Note: After move, Rook is at A5. Is A5 attacked by Black? Yes, by Black Rook at B5.
            malus.onEvent('move', move, getContext());

            // 4. Assert: Rook should be removed because we ignored C1 (undefended)
            const rookSquare = board.getSquare(new Coordinate(0, 4));
            expect(rookSquare?.piece).toBeNull();
        });

        it('should sacrifice the IDLE piece that had an opportunity if the MOVED piece had none', () => {
            // Setup:
            // White Rook at A1 (can capture A5 undefended).
            // White Pawn at H2 (blocked, cannot capture).
            // Black Pawn at A5 (undefended).
            const whiteRook = new Piece('rook', 'white', 'wr');
            const whitePawn = new Piece('pawn', 'white', 'wp');
            const blackPawn = new Piece('pawn', 'black', 'bp');

            board.placePiece(new Coordinate(0, 0), whiteRook); // A1
            board.placePiece(new Coordinate(7, 1), whitePawn); // H2
            board.placePiece(new Coordinate(0, 4), blackPawn); // A5

            // 1. Turn Start
            malus.onTurnStart(getContext());

            // 2. Perform Move: Pawn H2 -> H3 (safe move, but ignored Rook's opportunity)
            const move = new Move(new Coordinate(7, 1), new Coordinate(7, 2), whitePawn);
            board.removePiece(new Coordinate(7, 1));
            board.placePiece(new Coordinate(7, 2), whitePawn);

            // 3. Trigger Event
            malus.onEvent('move', move, getContext());

            // 4. Assert:
            // The moved pawn should be safe (it wasn't the one ignoring fate).
            // The Rook should be sacrificed (it was the one that could have captured).

            const pawnSquare = board.getSquare(new Coordinate(7, 2));
            expect(pawnSquare?.piece).toBe(whitePawn);

            const rookSquare = board.getSquare(new Coordinate(0, 0));
            expect(rookSquare?.piece).toBeNull();
        });

        it('should NOT sacrifice if NO captured piece was undefended available', () => {
            // Setup: White Rook at A1. No enemies.
            const whiteRook = new Piece('rook', 'white', 'wr');
            board.placePiece(new Coordinate(0, 0), whiteRook);

            // 1. Turn Start
            malus.onTurnStart(getContext());

            // 2. Perform Move: A1 to A2
            const move = new Move(new Coordinate(0, 0), new Coordinate(0, 1), whiteRook);
            board.removePiece(new Coordinate(0, 0));
            board.placePiece(new Coordinate(0, 1), whiteRook);

            // 3. Trigger Event
            malus.onEvent('move', move, getContext());

            // 4. Assert: Rook remains
            const rookSquare = board.getSquare(new Coordinate(0, 1));
            expect(rookSquare?.piece).toBe(whiteRook);
        });
    });
});
