import { describe, it, expect, beforeEach } from 'vitest';
import { TheTitan } from './TheTitan';
import { ChessGame } from '../../ChessGame';
import { Coordinate } from '../../models/Coordinate';
import { Move } from '../../models/Move';

describe('The Titan', () => {
    let game: ChessGame;
    const earthquakeBonus = TheTitan.bonus;
    const gigantismMalus = TheTitan.malus;

    beforeEach(() => {
        game = new ChessGame();
    });

    describe('Earthquake (Bonus)', () => {
        it('should push adjacent pawns when Queen moves', () => {
            game.reset();
            game.board.clear();

            // Set up: Queen at (3,3), friendly pawn at (3,4), enemy pawn at (4,3)
            const queenPos = new Coordinate(3, 3);
            const friendlyPawnPos = new Coordinate(3, 4);
            const enemyPawnPos = new Coordinate(4, 3);

            game.board.placePiece(queenPos, { type: 'queen', color: 'white', id: 'w-q' } as any);
            game.board.placePiece(friendlyPawnPos, { type: 'pawn', color: 'white', id: 'w-p' } as any);
            game.board.placePiece(enemyPawnPos, { type: 'pawn', color: 'black', id: 'b-p1' } as any);

            const queen = game.board.getSquare(queenPos)!.piece!;
            const move = { from: new Coordinate(3, 2), to: queenPos, piece: queen } as Move;

            earthquakeBonus.getRuleModifiers().onExecuteMove!(game, move, { game, playerId: 'white', pactId: 'titan', state: {}, updateState: () => { } } as any);

            // Pawns should be pushed:
            // Friendly (3,4) pushed in direction (0, 1) from (3,3) -> becomes (3,5)
            expect(game.board.getSquare(new Coordinate(3, 4))?.piece).toBeNull();
            expect(game.board.getSquare(new Coordinate(3, 5))?.piece?.id).toBe('w-p');

            // Enemy (4,3) pushed in direction (1, 0) from (3,3) -> becomes (5,3)
            expect(game.board.getSquare(new Coordinate(4, 3))?.piece).toBeNull();
            expect(game.board.getSquare(new Coordinate(5, 3))?.piece?.id).toBe('b-p1');
        });

        it('should not push if destination square is blocked', () => {
            game.reset();
            game.board.clear();
            const queenPos = new Coordinate(3, 3);
            const pawnPos = new Coordinate(3, 4);
            const blockerPos = new Coordinate(3, 5);

            game.board.placePiece(queenPos, { type: 'queen', color: 'white', id: 'w-q' } as any);
            game.board.placePiece(pawnPos, { type: 'pawn', color: 'white', id: 'w-p' } as any);
            game.board.placePiece(blockerPos, { type: 'knight', color: 'white', id: 'w-n' } as any);

            const queen = game.board.getSquare(queenPos)!.piece!;
            earthquakeBonus.getRuleModifiers().onExecuteMove!(game, { to: queenPos, piece: queen } as any, { game, playerId: 'white', pactId: 'titan', state: {}, updateState: () => { } } as any);

            // Pawn at (3,4) stays at (3,4) because (3,5) is blocked
            expect(game.board.getSquare(pawnPos)?.piece?.id).toBe('w-p');
        });

        it('should not push if it would go off board', () => {
            game.reset();
            game.board.clear();
            const queenPos = new Coordinate(6, 6);
            const pawnPos = new Coordinate(7, 7);

            game.board.placePiece(queenPos, { type: 'queen', color: 'white', id: 'w-q' } as any);
            game.board.placePiece(pawnPos, { type: 'pawn', color: 'white', id: 'w-p' } as any);

            const queen = game.board.getSquare(queenPos)!.piece!;
            earthquakeBonus.getRuleModifiers().onExecuteMove!(game, { to: queenPos, piece: queen } as any, { game, playerId: 'white', pactId: 'titan', state: {}, updateState: () => { } } as any);

            // Pawn at (7,7) stays at (7,7) because pushing it would go to (8,8) which is invalid
            expect(game.board.getSquare(pawnPos)?.piece?.id).toBe('w-p');
        });
    });

    describe('Gigantism (Malus)', () => {
        it('should filter out moves to edge squares for Queen', () => {
            const modifiers = gigantismMalus.getRuleModifiers();
            const params = {
                piece: { type: 'queen' } as any,
                moves: [
                    { to: new Coordinate(1, 1) }, // Valid
                    { to: new Coordinate(0, 1) }, // Edge (file 0)
                    { to: new Coordinate(1, 0) }, // Edge (rank 0)
                    { to: new Coordinate(7, 7) }, // Edge (rank 7, file 7)
                ] as Move[]
            } as any;

            modifiers.onGetPseudoMoves!(params, { game, playerId: 'white', pactId: 'titan', state: {}, updateState: () => { } } as any);

            expect(params.moves.length).toBe(1);
            expect(params.moves[0].to.x).toBe(1);
            expect(params.moves[0].to.y).toBe(1);
        });

        it('should not filter moves for non-queen pieces', () => {
            const modifiers = gigantismMalus.getRuleModifiers();
            const params = {
                piece: { type: 'rook' } as any,
                moves: [
                    { to: new Coordinate(0, 0) },
                    { to: new Coordinate(7, 7) },
                ] as Move[]
            } as any;

            modifiers.onGetPseudoMoves!(params, { game, playerId: 'white', pactId: 'titan', state: {}, updateState: () => { } } as any);

            expect(params.moves.length).toBe(2);
        });
    });
});
