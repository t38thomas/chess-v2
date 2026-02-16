import { IChessGame, GameEvent } from '../GameTypes';
import { Coordinate } from '../models/Coordinate';
import { Piece, PieceColor, PieceType } from '../models/Piece';
import { BoardModel } from '../models/BoardModel';
import { Move } from '../models/Move';
import { MoveGenerator } from '../rules/MoveGenerator';
import { CheckDetector } from '../rules/CheckDetector';

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

    /**
     * Gets all pieces adjacent to a given coordinate.
     * @param game The game instance.
     * @param coord The coordinate to check around.
     * @returns Array of pieces and their coordinates.
     */
    public static getPiecesAdjacentTo(game: IChessGame, coord: Coordinate): { piece: Piece, coord: Coordinate }[] {
        const adjacent: { piece: Piece, coord: Coordinate }[] = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;

                const targetCoord = new Coordinate(coord.x + dx, coord.y + dy);
                if (targetCoord.isValid()) {
                    const piece = game.board.getSquare(targetCoord)?.piece;
                    if (piece) {
                        adjacent.push({ piece, coord: targetCoord });
                    }
                }
            }
        }
        return adjacent;
    }

    /**
     * Checks if two coordinates are adjacent (including diagonals).
     * @param c1 First coordinate.
     * @param c2 Second coordinate.
     * @returns True if they are adjacent, false otherwise.
     */
    public static isAdjacent(c1: Coordinate, c2: Coordinate): boolean {
        return Math.abs(c1.x - c2.x) <= 1 && Math.abs(c1.y - c2.y) <= 1 && !c1.equals(c2);
    }

    /**
     * Checks if a coordinate represents a black (dark) square.
     * @param coord The coordinate to check.
     * @returns True if it's a black square, false if it's white.
     */
    public static isBlackSquare(coord: Coordinate): boolean {
        // In most chess board representations:
        // (0,0) is black if (x+y) is even or odd depending on the convention.
        // Standard: a1 (0,0) is black. So x+y being even = black.
        return (coord.x + coord.y) % 2 === 0;
    }

    /**
     * Checks if a coordinate is one of the four center squares (d4, d5, e4, e5).
     * @param coord The coordinate to check.
     * @returns True if it's in the center.
     */
    public static isCentralSquare(coord: Coordinate): boolean {
        return coord.x >= 3 && coord.x <= 4 && coord.y >= 3 && coord.y <= 4;
    }

    /**
     * Checks if a coordinate is on the edge of the board.
     * @param coord The coordinate to check.
     * @returns True if it's on the edge.
     */
    public static isEdgeSquare(coord: Coordinate): boolean {
        return coord.x === 0 || coord.x === 7 || coord.y === 0 || coord.y === 7;
    }

    /**
     * Pushes a piece from a coordinate in a given direction.
     * @param game The game instance.
     * @param coord The current coordinate of the piece.
     * @param dx The x direction of the push.
     * @param dy The y direction of the push.
     * @returns True if the piece was successfully pushed, false otherwise.
     */
    public static pushPiece(game: IChessGame, coord: Coordinate, dx: number, dy: number): boolean {
        const targetCoord = new Coordinate(coord.x + dx, coord.y + dy);

        if (!targetCoord.isValid()) return false;

        const targetSquare = game.board.getSquare(targetCoord);
        if (targetSquare && !targetSquare.piece) {
            const piece = game.board.getSquare(coord)?.piece;
            if (piece) {
                game.board.removePiece(coord);
                game.board.placePiece(targetCoord, piece);
                return true;
            }
        }

        return false;
    }

    /**
     * Adds single-step moves in given directions if the squares are empty or contain an enemy piece.
     * @param board The board model.
     * @param piece The moving piece.
     * @param from The starting coordinate.
     * @param moves The moves array to append to.
     * @param directions The directions to check.
     */
    public static addSingleStepMoves(board: BoardModel, piece: Piece, from: Coordinate, moves: Move[], directions: { dx: number, dy: number }[]): void {
        for (const dir of directions) {
            const nx = from.x + dir.dx;
            const ny = from.y + dir.dy;

            if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                const targetCoord = new Coordinate(nx, ny);
                const targetSquare = board.getSquare(targetCoord);

                if (targetSquare && (!targetSquare.piece || targetSquare.piece.color !== piece.color)) {
                    moves.push(new Move(from, targetCoord, piece, targetSquare.piece || undefined));
                }
            }
        }
    }

    /**
     * Removes horizontal moves from a moves array.
     * @param moves The moves array.
     * @param from The starting coordinate.
     */
    public static blockHorizontalMoves(moves: Move[], from: Coordinate): void {
        for (let i = moves.length - 1; i >= 0; i--) {
            const m = moves[i];
            if (m.to.y === from.y && m.to.x !== from.x) {
                moves.splice(i, 1);
            }
        }
    }

    /**
     * Removes vertical moves from a moves array.
     * @param moves The moves array.
     * @param from The starting coordinate.
     */
    public static blockVerticalMoves(moves: Move[], from: Coordinate): void {
        for (let i = moves.length - 1; i >= 0; i--) {
            const m = moves[i];
            if (m.to.x === from.x && m.to.y !== from.y) {
                moves.splice(i, 1);
            }
        }
    }

    /**
     * Removes diagonal moves from a moves array.
     * @param moves The moves array.
     * @param from The starting coordinate.
     */
    public static blockDiagonalMoves(moves: Move[], from: Coordinate): void {
        for (let i = moves.length - 1; i >= 0; i--) {
            const m = moves[i];
            const dx = Math.abs(m.to.x - from.x);
            const dy = Math.abs(m.to.y - from.y);
            if (dx === dy && dx !== 0) {
                moves.splice(i, 1);
            }
        }
    }

    /**
     * Checks if a piece is a Queen.
     */
    public static isQueen(piece: Piece | null): boolean {
        return piece?.type === 'queen';
    }

    /**
     * Checks if a piece is a Knight.
     */
    public static isKnight(piece: Piece | null): boolean {
        return piece?.type === 'knight';
    }

    /**
     * Checks if a piece is a Pawn.
     */
    public static isPawn(piece: Piece | null): boolean {
        return piece?.type === 'pawn';
    }

    /**
     * Emits a pact effect (toast notification) using translation keys.
     */
    public static notifyPactEffect(game: IChessGame, pactId: string, eventKey: string, type: 'bonus' | 'malus', icon: string): void {
        game.emit('pact_effect', {
            pactId,
            title: `pact.toasts.${pactId}.${eventKey}.title`,
            description: `pact.toasts.${pactId}.${eventKey}.desc`,
            icon,
            type
        });
    }
    /**
     * Checks if a square is attacked by any piece of the attackerColor.
     * @param game The game instance.
     * @param square The coordinate to check.
     * @param attackerColor The color of the attacking player.
     * @returns True if the square is attacked.
     */
    public static isSquareAttacked(game: IChessGame, square: Coordinate, attackerColor: PieceColor): boolean {
        // We can reuse CheckDetector logic or similar
        // Ideally, we want to know if any piece of attackerColor can move to 'square' 
        // effectively capturing whatever is there (or just hitting the empty square).

        // However, CheckDetector usually checks if KING is attacked.
        // We need a more general check.

        // Fix: If square contains a piece of attackerColor (e.g. checking if a Black piece is defended by other Black pieces), 
        // we must temporarily remove said piece to see if others cover the square.
        // This is crucial for "Is piece defended?" checks.

        const targetSquare = game.board.getSquare(square);
        const originalPiece = targetSquare?.piece;
        const needsRemoval = originalPiece && originalPiece.color === attackerColor;

        if (needsRemoval) {
            game.board.removePiece(square);
        }

        try {
            const attackerPieces = PactUtils.findPieces(game, attackerColor);
            const playerPacts = game.pacts[attackerColor].map(p => [p.bonus, p.malus]).flat();

            for (const { piece, coord } of attackerPieces) {
                // SPECIAL HANDLING FOR PAWNS
                // Pawns move forward but capture diagonally. 
                // "Attacking" a square means threatening to capture on it.
                if (piece.type === 'pawn') {
                    const direction = piece.color === 'white' ? 1 : -1;
                    const attackY = coord.y + direction;

                    // Check diagonals
                    const leftAttack = new Coordinate(coord.x - 1, attackY);
                    const rightAttack = new Coordinate(coord.x + 1, attackY);

                    if (leftAttack.equals(square) || rightAttack.equals(square)) {
                        return true;
                    }
                    // Explicitly do NOT use MoveGenerator for pawns
                } else {
                    // For all other pieces, use MoveGenerator
                    // Optimization: Get pseudo moves for each piece and see if 'square' is a target
                    // This might be expensive if called frequently for all squares.
                    const moves = MoveGenerator.getPseudoLegalMoves(
                        game.board,
                        piece,
                        coord,
                        game.enPassantTarget,
                        playerPacts,
                        game.perkUsage[attackerColor],
                        game
                    );

                    // SPECIAL HANDLING FOR KING
                    // King attacks only adjacent squares. Castling moves (dist > 1) are not attacks.
                    if (piece.type === 'king') {
                        if (moves.some(m => m.to.equals(square) && Math.abs(m.to.x - coord.x) <= 1)) {
                            return true;
                        }
                    } else {
                        if (moves.some(m => m.to.equals(square))) {
                            return true;
                        }
                    }
                }
            }
        } finally {
            if (needsRemoval && originalPiece) {
                game.board.placePiece(square, originalPiece);
            }
        }

        return false;
    }

    /**
     * Checks if a player has any opportunity to capture an undefended enemy piece.
     * @param game The game instance.
     * @param color The player color to check.
     * @returns Array of IDs of pieces that have at least one move capturing an undefended piece.
     */
    public static getCaptureOpportunities(game: IChessGame, color: PieceColor, onlyUndefended: boolean = true): string[] {
        const myPieces = PactUtils.findPieces(game, color);
        const opponentColor = color === 'white' ? 'black' : 'white';
        const playerPacts = game.pacts[color].map(p => [p.bonus, p.malus]).flat();

        const capablePieceIds = new Set<string>();

        for (const { piece, coord } of myPieces) {
            const moves = MoveGenerator.getPseudoLegalMoves(
                game.board,
                piece,
                coord,
                game.enPassantTarget,
                playerPacts,
                game.perkUsage[color],
                game
            );

            // Filter only legal moves (checks)
            const legalMoves = moves.filter(m =>
                !CheckDetector.wouldLeaveKingInCheck(game.board, m.from, m.to, color, [], false, game)
            );

            for (const move of legalMoves) {
                if (move.capturedPiece) {
                    if (!onlyUndefended) {
                        capablePieceIds.add(piece.id);
                        break;
                    }

                    const isDefended = PactUtils.isSquareAttacked(game, move.to, opponentColor);
                    if (!isDefended) {
                        capablePieceIds.add(piece.id);
                        break;
                    }
                }
            }
        }

        return Array.from(capablePieceIds);
    }
}
