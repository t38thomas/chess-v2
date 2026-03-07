import { describe, it, expect, beforeEach } from 'vitest';
import { TheHawk } from './TheHawk';
import { ChessGame } from '../../ChessGame';
import { Coordinate } from '../../models/Coordinate';
import { Piece } from '../../models/Piece';

describe('The Hawk Pact', () => {
    let game: ChessGame;
    const bonus = TheHawk.bonus;
    const malus = TheHawk.malus;

    beforeEach(() => {
        game = new ChessGame();
    });

    describe('HawkBonus (High Flyer)', () => {
        it('should allow Bishop to move through friendly pieces', () => {
            // Setup: White Bishop at C1, White Pawn at D2. 
            // Normal chess: Bishop blocked. 
            // High Flyer: Bishop can move to E3.

            // Clear board
            game.board.clear();

            const bishop = new Piece('bishop', 'white', 'white-bishop');
            const friendlyPawn = new Piece('pawn', 'white', 'white-pawn');

            game.board.placePiece(new Coordinate(2, 0), bishop); // C1
            game.board.placePiece(new Coordinate(3, 1), friendlyPawn); // D2

            // Enable pact
            const rules = bonus.getRuleModifiers();

            const canMoveThrough = rules.canMoveThroughFriendlies!(bishop, friendlyPawn, { game, playerId: 'white', pactId: bonus.id } as any);
            expect(canMoveThrough).toBe(true);

            // Verify it doesn't apply to other pieces
            const rook = new Piece('rook', 'white', 'white-rook');
            const canRookMoveThrough = rules.canMoveThroughFriendlies!(rook, friendlyPawn, { game, playerId: 'white', pactId: bonus.id } as any);
            expect(canRookMoveThrough).toBe(false);

            // Verify it doesn't apply to enemy pieces (obstacle)
            const enemyPawn = new Piece('pawn', 'black', 'black-pawn');
            const canMoveThroughEnemy = rules.canMoveThroughFriendlies!(bishop, enemyPawn, { game, playerId: 'white', pactId: bonus.id } as any);
            expect(canMoveThroughEnemy).toBe(false);
        });
    });

    describe('HawkMalus (Distant Predator)', () => {
        it('should prevent Bishop from capturing at range 1', () => {
            const bishop = new Piece('bishop', 'white', 'white-bishop');
            const enemy = new Piece('pawn', 'black', 'black-pawn');

            const from = new Coordinate(4, 4); // E5
            const toAdjacent = new Coordinate(5, 5); // F6 (Range 1)
            const toDistant = new Coordinate(6, 6); // G7 (Range 2)

            const rules = malus.getRuleModifiers();

            // Adjacent capture
            const canCaptureAdjacent = rules.canCapture!({ game, board: game.board, attacker: bishop, victim: enemy, to: toAdjacent, from }, { game, playerId: 'white', pactId: malus.id } as any);
            expect(canCaptureAdjacent).toBe(false);

            // Distant capture
            const canCaptureDistant = rules.canCapture!({ game, board: game.board, attacker: bishop, victim: enemy, to: toDistant, from }, { game, playerId: 'white', pactId: malus.id } as any);
            expect(canCaptureDistant).toBe(true);
        });

        it('should not affect other pieces', () => {
            const queen = new Piece('queen', 'white', 'white-queen');
            const enemy = new Piece('pawn', 'black', 'black-pawn');

            const from = new Coordinate(4, 4);
            const toAdjacent = new Coordinate(5, 5);

            const rules = malus.getRuleModifiers();

            const canCapture = rules.canCapture!({ game, board: game.board, attacker: queen, victim: enemy, to: toAdjacent, from }, { game, playerId: 'white', pactId: malus.id } as any);
            expect(canCapture).toBe(true);
        });

        it('should not affect opponent bishop', () => {
            const opponentBishop = new Piece('bishop', 'black', 'black-bishop');
            const enemy = new Piece('pawn', 'white', 'white-pawn');

            const from = new Coordinate(4, 4);
            const toAdjacent = new Coordinate(5, 5);

            const rules = malus.getRuleModifiers();

            const canCapture = rules.canCapture!({ game, board: game.board, attacker: opponentBishop, victim: enemy, to: toAdjacent, from }, { game, playerId: 'white', pactId: malus.id } as any);
            expect(canCapture).toBe(true);
        });

        it('should prevent distant capture if jumped this turn', () => {
            const bishop = new Piece('bishop', 'white', 'white-bishop');
            const enemy = new Piece('pawn', 'black', 'black-pawn');

            const from = new Coordinate(4, 4);
            const toDistant = new Coordinate(6, 6); // G7 (Range 2)

            const rules = malus.getRuleModifiers();

            // Simulate having jumped this turn
            (game as any).pactState = {
                'high_flyer_white': { jumpedThisTurn: true }
            };

            const contextWithJump = {
                game,
                playerId: 'white',
                pactId: malus.id
            } as any;

            const canCaptureDistant = rules.canCapture!({ game, board: game.board, attacker: bishop, victim: enemy, to: toDistant, from }, contextWithJump);
            expect(canCaptureDistant).toBe(false); // Distant capture should be blocked if jumped
        });
    });
});
