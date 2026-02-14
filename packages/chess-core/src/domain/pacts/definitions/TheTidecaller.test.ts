import { describe, it, expect, beforeEach } from 'vitest';
import { ChessGame } from '../../ChessGame';
import { TidecallerBonus, TidecallerMalus } from './TheTidecaller';
import { Coordinate } from '../../models/Coordinate';
import { MoveGenerator } from '../../rules/MoveGenerator';
import { Move } from '../../models/Move';

describe('The Tidecaller Pact', () => {
    let game: ChessGame;

    beforeEach(() => {
        game = new ChessGame();
        // game.startNewGame(); // Removed, constructor does this
        game.phase = 'playing';
    });

    // Helper to get moves using logic similar to ChessGame internals but exposed for testing
    // Helper to get moves using logic similar to ChessGame internals but exposed for testing
    const getMoves = (game: ChessGame, from: Coordinate): Move[] => {
        const square = game.board.getSquare(from);
        if (!square || !square.piece) return [];

        const piece = square.piece;
        const playerPacts = game.pacts[piece.color].map(p => [p.bonus, p.malus]).flat();

        return MoveGenerator.getPseudoLegalMoves(
            game.board,
            piece,
            from,
            game.enPassantTarget,
            playerPacts,
            game.perkUsage[piece.color],
            game
        );
    };

    describe('Bonus: Flow', () => {
        it('should allow pawns to move backward 1 square if empty', () => {
            const bonus = new TidecallerBonus();
            game.pacts.white.push({
                id: 'tidecaller',
                name: 'The Tidecaller',
                description: '...',
                category: 'Passive',
                // @ts-ignore
                bonus: { id: bonus.id, name: 'Flow', description: '...' },
                // @ts-ignore
                malus: { id: 'ebb', name: 'Ebb', description: '...' }
            });

            // Setup: Move a white pawn forward so it has space to move back
            // e2 -> e4
            const p1 = new Coordinate(4, 1);
            const p2 = new Coordinate(4, 3);
            const moveSuccess = game.makeMove(p1, p2);
            if (!moveSuccess) {
                throw new Error('makeMove failed for ' + p1.toString() + ' to ' + p2.toString() + ' Turn: ' + game.turn);
            }
            // Now White pawn is at e4 (4,3). Previous square e2 (4,1) is empty.
            // Turn passed to Black.

            const moves = getMoves(game, p2);

            // Backward move: (4, 3) -> (4, 2)
            // Wait, flow says backward 1 square.
            // White forward is y+1. Backward is y-1.
            // From (4,3), backward is (4,2).
            const backwardMove = moves.find(m => m.to.x === 4 && m.to.y === 2);

            expect(backwardMove).toBeDefined();
        });

        it('should allow pawns to capture backward vertically', () => {
            const bonus = new TidecallerBonus();
            game.pacts.white.push({
                id: 'tidecaller',
                name: 'The Tidecaller',
                description: '...',
                category: 'Passive',
                // @ts-ignore
                bonus: { id: bonus.id, name: 'Flow', description: '...' },
                // @ts-ignore
                malus: { id: 'ebb', name: 'Ebb', description: '...' }
            });

            // Setup: White Pawn at e4 (4,3). Black Pawn at e3 (4,2).
            const p1 = new Coordinate(4, 1);
            const p2 = new Coordinate(4, 3);
            game.makeMove(p1, p2); // White pawn moves to e4

            // Place black pawn at e3 manually or via moves
            // Harder to move black pawn there legally without it being captured or blocking.
            // Let's just override the board for testing specific scenario
            const blackPawn = game.board.getSquare(new Coordinate(3, 6))?.piece; // d7 pawn
            if (blackPawn) {
                // Move logic manually for setup
                game.board.movePiece(new Coordinate(3, 6), new Coordinate(4, 2));
                // Update piece position if needed (BoardModel handles it)
            }

            // Verify setup
            expect(game.board.getSquare(new Coordinate(4, 2))?.piece?.color).toBe('black');
            expect(game.board.getSquare(new Coordinate(4, 3))?.piece?.color).toBe('white');

            const moves = getMoves(game, p2);
            const backwardCapture = moves.find(m => m.to.x === 4 && m.to.y === 2 && m.capturedPiece);

            expect(backwardCapture).toBeDefined();
        });

        it('should allow pawns to capture forward vertically', () => {
            const bonus = new TidecallerBonus();
            game.pacts.white.push({
                id: 'tidecaller',
                name: 'The Tidecaller',
                description: '...',
                category: 'Passive',
                // @ts-ignore
                bonus: { id: bonus.id, name: 'Flow', description: '...' },
                // @ts-ignore
                malus: { id: 'ebb', name: 'Ebb', description: '...' }
            });

            // Setup: White Pawn at e4 (4,3). Black Pawn at e5 (4,4).
            const p1 = new Coordinate(4, 1);
            const p2 = new Coordinate(4, 3);
            game.makeMove(p1, p2); // White pawn moves to e4

            // Place black pawn at e5 (4,4)
            // Move d7 pawn to e5
            const blackPawnSource = new Coordinate(3, 6);
            const blackPawnTarget = new Coordinate(4, 4);
            game.board.movePiece(blackPawnSource, blackPawnTarget);

            const moves = getMoves(game, p2);
            const forwardCapture = moves.find(m => m.to.x === 4 && m.to.y === 4 && m.capturedPiece);

            expect(forwardCapture).toBeDefined();
        });

        it('should NOT allow pawns to move backward into a piece', () => {
            const bonus = new TidecallerBonus();
            game.pacts.white.push({
                id: 'tidecaller',
                name: 'The Tidecaller',
                description: '...',
                category: 'Passive',
                // @ts-ignore
                bonus: { id: bonus.id, name: 'Flow', description: '...' },
                // @ts-ignore
                malus: { id: 'ebb', name: 'Ebb', description: '...' }
            });

            // White pawn at e2 (4,1). Backward is (4,0).
            // (4,0) has the King (Friendly).

            const moves = getMoves(game, new Coordinate(4, 1));
            const backwardMove = moves.find(m => m.to.x === 4 && m.to.y === 0);

            expect(backwardMove).toBeUndefined();
        });
    });

    describe('Malus: Ebb', () => {
        it('should prevent diagonal captures for pawns', () => {
            const malus = new TidecallerMalus();
            game.pacts.white.push({
                id: 'tidecaller',
                name: 'The Tidecaller',
                description: '...',
                category: 'Passive',
                // @ts-ignore
                bonus: { id: 'flow', name: 'Flow', description: '...' },
                // @ts-ignore
                malus: { id: malus.id, name: 'Ebb', description: '...' }
            });

            // Setup capture scenario
            // White pawn e4 (4,3)
            // We need a target.
            // Place a black pawn at d5 (3,4).

            // 1. White moves e2->e4
            game.makeMove(new Coordinate(4, 1), new Coordinate(4, 3));

            // 2. Black moves d7->d5
            game.makeMove(new Coordinate(3, 6), new Coordinate(3, 4));

            // Now it's White's turn again.
            // White pawn at e4 should NOT be able to capture d5.

            const moves = getMoves(game, new Coordinate(4, 3));
            const captureMove = moves.find(m => m.to.x === 3 && m.to.y === 4);

            expect(captureMove).toBeUndefined();
        });

        it('should still allow forward movement', () => {
            const malus = new TidecallerMalus();
            game.pacts.white.push({
                id: 'tidecaller',
                name: 'The Tidecaller',
                description: '...',
                category: 'Passive',
                // @ts-ignore
                bonus: { id: 'flow', name: 'Flow', description: '...' },
                // @ts-ignore
                malus: { id: malus.id, name: 'Ebb', description: '...' }
            });

            // White pawn at e2 (4,1).
            const moves = getMoves(game, new Coordinate(4, 1)); // White starts

            // e3 (single step)
            const forwardMove = moves.find(m => m.to.x === 4 && m.to.y === 2);
            expect(forwardMove).toBeDefined();
        });
    });
});
