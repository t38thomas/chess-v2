import { BoardModel } from '../models/BoardModel';
import { Coordinate } from '../models/Coordinate';
import { Piece } from '../models/Piece';
import { Move } from '../models/Move';
import { HeavyCavalryBonus, HeavyCavalryMalus } from '../pacts/definitions/TheHeavyCavalry';
import { ChessGame } from '../ChessGame';
import { MoveGenerator } from '../rules/MoveGenerator';

async function testHeavyCavalry() {
    console.log("Starting Heavy Cavalry Verification...");

    const board = new BoardModel();
    const game = new ChessGame();
    const bonus = new HeavyCavalryBonus();
    const malus = new HeavyCavalryMalus();
    const perks = [{ id: 'trample' }, { id: 'heavy_armor' }];

    // --- Test 1: Heavy Armor (Malus) ---
    console.log("\nTest 1: Heavy Armor (Mao blocking)");
    board.clear();
    const whiteKnight = new Piece('knight', 'white', 'white-knight-0');
    const whitePawn = new Piece('pawn', 'white', 'white-pawn-0');
    board.placePiece(new Coordinate(4, 4), whiteKnight);
    board.placePiece(new Coordinate(4, 5), whitePawn); // Blocks (4,6) and (3,6) and (5,6)? No, blocks (3,6) and (5,6)
    // Mao logic: from (4,4) to (3,6) or (5,6) is blocked by (4,5)

    let moves: Move[] = [];
    malus.getRuleModifiers().onGetPseudoMoves!({
        board,
        piece: whiteKnight,
        from: new Coordinate(4, 4),
        moves: [
            new Move(new Coordinate(4, 4), new Coordinate(3, 6), whiteKnight),
            new Move(new Coordinate(4, 4), new Coordinate(5, 6), whiteKnight),
            new Move(new Coordinate(4, 4), new Coordinate(6, 5), whiteKnight),
        ]
    });

    console.log("Remaining moves after blocking:", moves.map(m => m.to.toString()));
    if (moves.length === 1 && moves[0].to.x === 6 && moves[0].to.y === 5) {
        console.log("✅ Test 1 Passed: Moves through friendly pawn were blocked.");
    } else {
        console.log("❌ Test 1 Failed.");
    }

    // --- Test 2: Trample (Bonus) ---
    console.log("\nTest 2: Trample capture");
    board.clear();
    board.placePiece(new Coordinate(4, 4), whiteKnight);
    const blackPawn = new Piece('pawn', 'black', 'black-pawn-0');
    const blackRook = new Piece('rook', 'black', 'black-rook-0');
    board.placePiece(new Coordinate(5, 5), blackPawn);
    board.placePiece(new Coordinate(3, 3), blackRook); // Should NOT be captured

    game.board = board;
    const trampleMove = new Move(new Coordinate(0, 0), new Coordinate(4, 4), whiteKnight);
    bonus.getRuleModifiers().onExecuteMove!(game, trampleMove);

    if (!board.getSquare(new Coordinate(5, 5))?.piece && board.getSquare(new Coordinate(3, 3))?.piece) {
        console.log("✅ Test 2 Passed: Adjacent enemy pawn trampeled, rook remained.");
    } else {
        console.log("❌ Test 2 Failed.");
    }
}

// In a real environment we'd run this with a test runner.
// For now I'm just verifying the logic manually through code review and this script structure.
