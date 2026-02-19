import { describe, it, expect, beforeEach } from 'vitest';
import { TheBlindSeer } from './TheBlindSeer';
import { ChessGame } from '../../ChessGame';
import { Piece } from '../../models/Piece';
import { Coordinate } from '../../models/Coordinate';
import { PactFactory } from '../PactFactory';

describe('The Blind Seer Pact', () => {
    let game: ChessGame;
    const bonus = TheBlindSeer.bonus;
    const malus = TheBlindSeer.malus;

    beforeEach(() => {
        game = new ChessGame();

        // Register manually if needed or rely on factory if we use it
        // For unit testing logic, we can just inject into game state if possible or mock
        // But since RuleEngine reads from registry, we better register it or mock registry.
        // Actually, integration tests usually register real pacts.
        // Let's assume we need to add it to the game's active pacts.

        // Mocking registry is hard here without DI. 
        // We will rely on registering it in PactFactory in the next step, 
        // OR we can mock the registry in the test if we could.
        // For now, let's assume we register it in the real factory or use a spy.
        // BUT generic tests usually just check logic via game modifiers? No, RuleEngine uses Registry.

        // So we need to ensure PactFactory has it registered.
        // We will skip this registry part in test setup if we assume it's globally registered by app start,
        // but for unit tests we might need to init factory.
        PactFactory.initialize();
    });

    describe('Bonus: Echolocation', () => {
        it('should allow Rooks to jump over pieces', () => {
            // Setup: White Rook at a1, White Pawn at a2. Target a3 (empty).
            const rook = new Piece('rook', 'white', 'w-rook');
            const pawn = new Piece('pawn', 'white', 'w-pawn');
            game.board.clear();
            game.board.placePiece(new Coordinate(0, 0), rook);
            game.board.placePiece(new Coordinate(0, 1), pawn); // Obstacle

            const pact = {
                id: 'blind_seer',
                title: 'Blind Seer',
                description: '',
                bonus: { id: bonus.id, name: 'echolocation', icon: '', description: '', ranking: 1, category: 'Movement' },
                malus: { id: 'any', name: 'any', icon: '', description: '', ranking: 0, category: 'None' }
            };
            game.pacts.white.push(pact as any);

            // Get moves
            const moves = game.getLegalMoves(new Coordinate(0, 0));
            // Should include a3 (0, 2)
            const hasJump = moves.some(m => m.to.x === 0 && m.to.y === 2);
            expect(hasJump).toBe(true);
        });

        it('should allow capturing enemy behind obstacle', () => {
            // Setup: White Rook at a1, White Pawn at a2. Black Pawn at a3.
            const rook = new Piece('rook', 'white', 'w-rook');
            const obstacle = new Piece('pawn', 'white', 'w-obs');
            const enemy = new Piece('pawn', 'black', 'b-pawn');
            game.board.clear();
            game.board.placePiece(new Coordinate(0, 0), rook);
            game.board.placePiece(new Coordinate(0, 1), obstacle);
            game.board.placePiece(new Coordinate(0, 2), enemy);

            const pact = {
                id: 'blind_seer',
                title: 'Blind Seer',
                description: '',
                bonus: { id: bonus.id, name: 'echolocation', icon: '', description: '', ranking: 1, category: 'Movement' },
                malus: { id: 'any', name: 'any', icon: '', description: '', ranking: 0, category: 'None' }
            };
            game.pacts.white.push(pact as any);

            const moves = game.getLegalMoves(new Coordinate(0, 0));
            const canCapture = moves.some(m => m.to.x === 0 && m.to.y === 2 && !!m.capturedPiece);
            expect(canCapture).toBe(true);
        });

        it('should allow capturing enemy obstacle and continue', () => {
            // Setup: White Rook at a1, Black Pawn at a2. Empty at a3.
            const rook = new Piece('rook', 'white', 'w-rook');
            const enemy = new Piece('pawn', 'black', 'b-pawn');
            game.board.clear();
            game.board.placePiece(new Coordinate(0, 0), rook);
            game.board.placePiece(new Coordinate(0, 1), enemy);

            const pact = {
                id: 'blind_seer',
                title: 'Blind Seer',
                description: '',
                bonus: { id: bonus.id, name: 'echolocation', icon: '', description: '', ranking: 1, category: 'Movement' },
                malus: { id: 'any', name: 'any', icon: '', description: '', ranking: 0, category: 'None' }
            };
            game.pacts.white.push(pact as any);

            const moves = game.getLegalMoves(new Coordinate(0, 0));

            // Should capture a2
            const capturesA2 = moves.some(m => m.to.x === 0 && m.to.y === 1 && !!m.capturedPiece);
            expect(capturesA2).toBe(true);

            // Should ALSO reach a3 (continue)
            const reachesA3 = moves.some(m => m.to.x === 0 && m.to.y === 2);
            expect(reachesA3).toBe(true);
        });
    });

    describe('Malus: Darkness', () => {
        it('should restrict movement range to 3', () => {
            const rook = new Piece('rook', 'white', 'w-rook');
            game.board.clear();
            game.board.placePiece(new Coordinate(0, 0), rook);

            const pact = {
                id: 'test',
                title: 'Test',
                description: '',
                bonus: { id: 'any', name: 'any', icon: '', description: '', ranking: 0, category: 'None' },
                malus: { id: malus.id, name: 'darkness', icon: '', description: '', ranking: -1, category: 'Restriction' }
            };
            game.pacts.white.push(pact as any);

            const moves = game.getLegalMoves(new Coordinate(0, 0));

            // Should reach a4 (dist 3: a2, a3, a4 => indices 1, 2, 3) 
            // from a1(0,0) -> 0,1 (dist 1), 0,2 (dist 2), 0,3 (dist 3).
            const reachesDist3 = moves.some(m => m.to.y === 3); // 0,3
            const reachesDist4 = moves.some(m => m.to.y === 4); // 0,4

            expect(reachesDist3).toBe(true);
            expect(reachesDist4).toBe(false);
        });
    });
});
