import { IChessGame, GameEvent } from '../GameTypes';
import { Coordinate } from '../models/Coordinate';
import { Piece, PieceColor, PieceType } from '../models/Piece';

export class PactUtils {
    /**
     * Swaps the pieces at two coordinates.
     * @param game The game instance.
     * @param coord1 The first coordinate.
     * @param coord2 The second coordinate.
     * @returns True if swap was successful, false otherwise.
     */
    public static swapPieces(game: IChessGame, coord1: Coordinate, coord2: Coordinate): boolean {
        const sq1 = game.board.getSquare(coord1);
        const sq2 = game.board.getSquare(coord2);

        if (!sq1 || !sq2) return false;

        const p1 = sq1.piece;
        const p2 = sq2.piece;

        game.board.removePiece(coord1);
        game.board.removePiece(coord2);

        if (p2) game.board.placePiece(coord1, p2);
        if (p1) game.board.placePiece(coord2, p1);

        return true;
    }

    /**
     * Sacrifices (removes) the most advanced friendly piece.
     * @param game The game instance.
     * @param playerId The color of the player.
     * @param excludeIds Array of piece IDs to exclude from sacrifice (e.g. King).
     * @returns The piece that was sacrificed, or null if none found.
     */
    public static sacrificeMostAdvancedPiece(game: IChessGame, playerId: PieceColor, excludeIds: string[] = []): Piece | null {
        const allPieces = game.board.getAllSquares()
            .map(s => s.piece)
            .filter((p): p is Piece => p !== null && p.color === playerId);

        // Filter out King and excluded IDs
        const candidates = allPieces.filter(p =>
            p.type !== 'king' && !excludeIds.includes(p.id)
        );

        if (candidates.length === 0) return null;

        const candidateDetails = candidates.map(p => {
            const coord = game.board.getAllSquares().find(s => s.piece === p)?.coordinate;
            return { piece: p, coord };
        }).filter(d => d.coord !== undefined);

        if (candidateDetails.length === 0) return null;

        // Group by rank
        // White: higher Y is better. Black: lower Y is better.
        const bestRank = playerId === 'white'
            ? Math.max(...candidateDetails.map(c => c.coord!.y))
            : Math.min(...candidateDetails.map(c => c.coord!.y));

        const bestCandidates = candidateDetails.filter(c => c.coord!.y === bestRank);

        // Pick random victim from best candidates
        const randomIndex = Math.floor(Math.random() * bestCandidates.length);
        const victim = bestCandidates[randomIndex];

        game.board.removePiece(victim.coord!);

        return victim.piece;
    }

    /**
     * Finds all pieces on the board matching the criteria.
     * @param game The game instance.
     * @param playerId The owner of the pieces.
     * @param type Optional piece type to filter by.
     * @returns Array of objects containing the piece and its coordinate.
     */
    public static findPieces(game: IChessGame, playerId: PieceColor, type?: PieceType): { piece: Piece, coord: Coordinate }[] {
        return game.board.getAllSquares()
            .map(s => ({ piece: s.piece, coord: s.coordinate }))
            .filter((item): item is { piece: Piece, coord: Coordinate } =>
                item.piece !== null &&
                item.piece.color === playerId &&
                (!type || item.piece.type === type)
            );
    }

    /**
     * Finds all pieces on the board matching the criteria (multiple types).
     * @param game The game instance.
     * @param playerId The owner of the pieces.
     * @param types Array of piece types to filter by.
     * @returns Array of objects containing the piece and its coordinate.
     */
    public static findPiecesByTypes(game: IChessGame, playerId: PieceColor, types: PieceType[]): { piece: Piece, coord: Coordinate }[] {
        return game.board.getAllSquares()
            .map(s => ({ piece: s.piece, coord: s.coordinate }))
            .filter((item): item is { piece: Piece, coord: Coordinate } =>
                item.piece !== null &&
                item.piece.color === playerId &&
                types.includes(item.piece.type)
            );
    }

    /**
     * Picks a random number of items from an array.
     * @param items The array of items to pick from.
     * @param count The number of items to pick.
     * @returns An array of randomly selected items.
     */
    public static pickRandom<T>(items: T[], count: number): T[] {
        if (items.length === 0) return [];
        const shuffled = [...items].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    /**
     * Removes a piece from the board.
     * @param game The game instance.
     * @param coord The coordinate of the piece to remove.
     */
    public static removePiece(game: IChessGame, coord: Coordinate): void {
        game.board.removePiece(coord);
    }

    /**
     * Promotes a piece at the given coordinate to a new type.
     * @param game The game instance.
     * @param coord The coordinate of the piece.
     * @param newType The new piece type.
     * @returns True if promotion was successful, false otherwise.
     */
    public static promotePiece(game: IChessGame, coord: Coordinate, newType: PieceType): boolean {
        const square = game.board.getSquare(coord);
        if (square && square.piece) {
            square.piece.type = newType;
            return true;
        }
        return false;
    }

    /**
     * Sets the type of a piece at a coordinate.
     * @param game The game instance.
     * @param coord The coordinate.
     * @param type The new type.
     */
    public static setPieceType(game: IChessGame, coord: Coordinate, type: PieceType): void {
        const square = game.board.getSquare(coord);
        if (square && square.piece) {
            square.piece.type = type;
        }
    }

    /**
     * Emits a pact effect (toast notification).
     * @param game The game instance.
     * @param config The effect configuration.
     */
    public static emitPactEffect(game: IChessGame, config: {
        pactId: string;
        title: string;
        description: string;
        icon: string;
        type: 'bonus' | 'malus';
        payload?: any;
    }): void {
        game.emit('pact_effect', config);
    }

    /**
     * Gets all pieces captured that belong to a specific player.
     * @param game The game instance.
     * @param color The color of the player whose pieces were captured.
     * @returns Array of captured pieces.
     */
    public static getCapturedPieces(game: IChessGame, color: PieceColor): Piece[] {
        return game.capturedPieces[color];
    }

    /**
     * Finds a valid starting square for a piece of a given type and color.
     * @param game The game instance.
     * @param type The piece type.
     * @param color The piece color.
     * @returns A coordinate if an empty starting square is found, null otherwise.
     */
    public static getEmptyStartingSquare(game: IChessGame, type: PieceType, color: PieceColor): Coordinate | null {
        const startingRanks = {
            white: { major: 0, pawn: 1 },
            black: { major: 7, pawn: 6 }
        };

        const rank = type === 'pawn' ? startingRanks[color].pawn : startingRanks[color].major;
        let files: number[] = [];

        switch (type) {
            case 'rook': files = [0, 7]; break;
            case 'knight': files = [1, 6]; break;
            case 'bishop': files = [2, 5]; break;
            case 'queen': files = [3]; break;
            case 'king': files = [4]; break;
            case 'pawn': files = [0, 1, 2, 3, 4, 5, 6, 7]; break;
        }

        for (const file of files) {
            const coord = new Coordinate(file, rank);
            if (!game.board.getSquare(coord)?.piece) {
                return coord;
            }
        }

        return null;
    }

    /**
     * Resurrects a captured piece of the given type and places it on the board.
     * @param game The game instance.
     * @param color The color of the piece to resurrect.
     * @param type The type of the piece to resurrect.
     * @returns The resurrected piece or null if failed.
     */
    public static resurrectPiece(game: IChessGame, color: PieceColor, type: PieceType): Piece | null {
        // 1. Find the piece in the captured pool (most recently captured of that type)
        const captured = PactUtils.getCapturedPieces(game, color);
        const index = [...captured].reverse().findIndex(p => p.type === type);

        if (index === -1) return null;
        const actualIndex = captured.length - 1 - index;
        const victim = captured[actualIndex];

        // 2. Find an empty starting square
        const targetCoord = PactUtils.getEmptyStartingSquare(game, type, color);
        if (!targetCoord) return null;

        // 3. Remove from captured list
        game.capturedPieces[color].splice(actualIndex, 1);

        // 4. Place the piece back
        game.board.placePiece(targetCoord, victim);

        return victim;
    }

    /**
     * Resurrects a random piece from the captured pool that matches any of the allowed types.
     * @param game The game instance.
     * @param color The color of the piece to resurrect.
     * @param allowedTypes The allowed piece types.
     * @returns The resurrected piece or null if none available.
     */
    public static resurrectRandomPiece(game: IChessGame, color: PieceColor, allowedTypes: PieceType[]): Piece | null {
        const captured = PactUtils.getCapturedPieces(game, color);
        const candidates = captured.filter(p => allowedTypes.includes(p.type));

        if (candidates.length === 0) return null;

        const victim = PactUtils.pickRandom(candidates, 1)[0];
        const victimIndex = captured.indexOf(victim);

        // Find an empty starting square
        const targetCoord = PactUtils.getEmptyStartingSquare(game, victim.type, color);
        if (!targetCoord) return null;

        // Remove from captured list
        game.capturedPieces[color].splice(victimIndex, 1);

        // Place the piece back
        game.board.placePiece(targetCoord, victim);

        return victim;
    }
}
