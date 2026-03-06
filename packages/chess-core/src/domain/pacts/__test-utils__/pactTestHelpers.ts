/**
 * Shared test helpers for Pact unit tests.
 *
 * Usage:
 *   import { createTestGame, createPactContext, seededRng } from '../__test-utils__/pactTestHelpers';
 */
import { ChessGame } from '../../ChessGame';
import { IChessGame } from '../../GameTypes';
import { PactContext } from '../PactLogic';
import { PieceColor } from '../../models/Piece';
import { vi } from 'vitest';

/**
 * Creates a fresh ChessGame with the standard board position.
 * Use this as the base for all pact tests.
 */
export function createTestGame(setup: 'standard' | 'empty' = 'standard'): ChessGame {
    const game = new ChessGame();
    if (setup === 'standard') {
        game.board.setupStandardGame();
    } else {
        game.board.clear();
    }
    return game;
}

/**
 * Builds a minimal PactContext for testing.
 */
export function createPactContext(
    game: ChessGame,
    playerId: PieceColor,
    pactId: string
): PactContext {
    return { game, playerId, pactId };
}

/**
 * A simple Lehmer/LCG PRNG seeded with a fixed value.
 * Pass as the `rng` parameter to PactUtils.pickRandom to get deterministic results.
 *
 * @example
 *   const rng = seededRng(42);
 *   PactUtils.pickRandom(items, 1, rng);
 */
export function seededRng(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
        // Knuth's multiplicative hash (simple LCG)
        s = Math.imul(s, 1664525) + 1013904223;
        return (s >>> 0) / 0x100000000;
    };
}

/** Fixed seed used across all pact tests for reproducibility. */
export const TEST_RNG_SEED = 42;

/**
 * Creates a fully-featured mock of the IChessGame interface.
 * Useful for tests that need to verify calls to domain methods or that
 * don't need a full ChessGame instance.
 */
export function createGameMock(overrides?: Partial<IChessGame>): IChessGame {
    const mock: any = {
        matchConfig: {} as any,
        board: {
            getSquare: vi.fn(),
            placePiece: vi.fn(),
            removePiece: vi.fn(),
            getAllSquares: vi.fn(() => []),
        } as any,
        turn: 'white' as PieceColor,
        history: [],
        status: 'active',
        phase: 'playing',
        pacts: { white: [], black: [] },
        perkUsage: { white: new Set(), black: new Set() },
        pieceCooldowns: new Map(),
        pactState: {},
        capturedPieces: { white: [], black: [] },
        totalTurns: 0,
        extraTurns: { white: 0, black: 0 },
        kingMoves: { white: 0, black: 0 },
        enPassantTarget: null,
        orientation: 0,

        emit: vi.fn(),
        undo: vi.fn(() => true),
        rotateBoard: vi.fn(() => true),
        endMatch: vi.fn(),
        applyCooldown: vi.fn(),
        grantExtraTurn: vi.fn(),
        ...overrides
    };
    return mock as IChessGame;
}
