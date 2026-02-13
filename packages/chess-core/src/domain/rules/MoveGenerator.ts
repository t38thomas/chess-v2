import { BoardModel } from '../models/BoardModel';
import { Coordinate } from '../models/Coordinate';
import { Move } from '../models/Move';
import { Piece, PieceType, PieceColor } from '../models/Piece';
import { Perk } from '../models/Pact';
import { RuleEngine } from './RuleEngine';
import { ChessGame } from '../ChessGame';

export class MoveGenerator {
    public static readonly ROOK_DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    public static readonly BISHOP_DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    public static readonly KNIGHT_DIRS = [[1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [2, -1], [-2, 1], [-2, -1]];
    public static readonly KNIGHT_REACH_DIRS = [
        ...MoveGenerator.KNIGHT_DIRS,
        [1, 3], [1, -3], [-1, 3], [-1, -3], [3, 1], [3, -1], [-3, 1], [-3, -1],
        [2, 3], [2, -3], [-2, 3], [-2, -3], [3, 2], [3, -2], [-3, 2], [-3, -2]
    ];
    public static readonly QUEEN_DIRS = [...MoveGenerator.ROOK_DIRS, ...MoveGenerator.BISHOP_DIRS];

    public static getPseudoLegalMoves(board: BoardModel, piece: Piece, from: Coordinate, enPassantTarget?: Coordinate | null, perks: Perk[] = [], perkUsage: Set<string> = new Set(), game?: ChessGame): Move[] {
        const moves: Move[] = [];

        // Apply any perk-specific baseline movement restrictions (Slug Move, Heavy Crown)
        if (game && !RuleEngine.canMovePiece(game, from, perks, board)) {
            return [];
        }

        switch (piece.type) {
            case 'pawn':
                this.addPawnMoves(board, piece, from, moves, enPassantTarget, perks, game);
                break;
            case 'rook':
                const rookRange = RuleEngine.getMaxRange(piece, perks);
                this.addSlidingMoves(board, from, MoveGenerator.ROOK_DIRS, piece, moves, rookRange, perks, game);
                break;
            case 'bishop':
                const bishopRange = RuleEngine.getMaxRange(piece, perks);
                const bishopFixedDistances = RuleEngine.getFixedDistances(piece, perks);

                if (bishopFixedDistances) {
                    this.addFixedDistanceMoves(board, from, MoveGenerator.BISHOP_DIRS, piece, moves, bishopFixedDistances);
                } else {
                    this.addSlidingMoves(board, from, MoveGenerator.BISHOP_DIRS, piece, moves, bishopRange, perks, game);
                }

                // Zealous Bishops: 1 square horizontal/vertical
                if (perks.some(p => p.id === 'zealous_bishops')) { // Small inline check for unique hybrid logic
                    this.addSteppingMoves(board, from, MoveGenerator.ROOK_DIRS, piece, moves);
                }
                break;
            case 'queen':
                this.addSlidingMoves(board, from, MoveGenerator.QUEEN_DIRS, piece, moves, undefined, perks, game);
                break;
            case 'knight':
                const knightDirs = perks.some(p => p.id === 'knight_reach') ? MoveGenerator.KNIGHT_REACH_DIRS : MoveGenerator.KNIGHT_DIRS;
                this.addSteppingMoves(board, from, knightDirs, piece, moves);
                break;
            case 'king':
                this.addSteppingMoves(board, from, MoveGenerator.ROOK_DIRS, piece, moves);
                this.addSteppingMoves(board, from, MoveGenerator.BISHOP_DIRS, piece, moves);

                if (RuleEngine.canMoveLikeKnight(piece.type, perks, perkUsage)) {
                    this.addSteppingMoves(board, from, MoveGenerator.KNIGHT_DIRS, piece, moves);
                }

                // Super Pawn / Prince logic: if type is something else (or we just check if it should move like king)
                this.addCastlingMoves(board, piece, from, moves, perks);
                break;
            default:
                // Handle custom pieces like "Prince" from Super Pawn
                this.addSteppingMoves(board, from, MoveGenerator.ROOK_DIRS, piece, moves);
                this.addSteppingMoves(board, from, MoveGenerator.BISHOP_DIRS, piece, moves);
                break;
        }

        // Apply any perk-specific custom move additions
        RuleEngine.onGetPseudoMoves(board, from, piece, moves, perks, game);

        return moves;
    }

    private static isEmpty(board: BoardModel, x: number, y: number): boolean {
        const target = board.getSquare(new Coordinate(x, y));
        return !!target && !target.piece;
    }

    private static addPawnMoves(board: BoardModel, piece: Piece, from: Coordinate, moves: Move[], enPassantTarget?: Coordinate | null, perks: Perk[] = [], game?: ChessGame) {
        const { x, y } = from;
        const dy = piece.color === 'white' ? 1 : -1;
        const startY = piece.color === 'white' ? 1 : 6;
        const to = new Coordinate(x, y + dy);

        // Forward 1
        if (this.isEmpty(board, x, y + dy)) {
            // No Retreat check (small exception for now as it's very specific to position)
            const isNoRetreat = perks.some(p => p.id === 'no_retreat');
            const canMoveForward = !isNoRetreat || (piece.color === 'white' ? y < 4 : y > 3);

            if (canMoveForward) {
                moves.push(new Move(from, to, piece));

                // Double move
                if (RuleEngine.canPawnDoubleMove(piece, y, startY, perks) && this.isEmpty(board, x, y + dy * 2)) {
                    moves.push(new Move(from, new Coordinate(x, y + dy * 2), piece));
                }
            }
        }

        // Diagonal Dash
        if (RuleEngine.canPawnDiagonalDash(piece, perks)) {
            const diagL = new Coordinate(x - 1, y + dy);
            const diagR = new Coordinate(x + 1, y + dy);
            if (this.isEmpty(board, diagL.x, diagL.y)) moves.push(new Move(from, diagL, piece));
            if (this.isEmpty(board, diagR.x, diagR.y)) moves.push(new Move(from, diagR, piece));
        }

        // Scout Path: Sideways moves
        if (RuleEngine.canPawnSidewaysMove(piece, perks)) {
            const sideL = new Coordinate(x - 1, y);
            const sideR = new Coordinate(x + 1, y);
            if (this.isEmpty(board, sideL.x, sideL.y)) moves.push(new Move(from, sideL, piece));
            if (this.isEmpty(board, sideR.x, sideR.y)) moves.push(new Move(from, sideR, piece));
        }

        // Normal captures
        this.addCapture(board, x + 1, y + dy, piece, moves, from, perks, game);
        this.addCapture(board, x - 1, y + dy, piece, moves, from, perks, game);

        // En passant
        if (enPassantTarget) {
            const enPassantY = piece.color === 'white' ? y + 1 : y - 1;

            // Check left diagonal
            if (enPassantTarget.x === x - 1 && enPassantTarget.y === enPassantY) {
                const captureSquare = new Coordinate(x - 1, enPassantY);
                moves.push(new Move(from, captureSquare, piece, null, false, true));
            }

            // Check right diagonal
            if (enPassantTarget.x === x + 1 && enPassantTarget.y === enPassantY) {
                const captureSquare = new Coordinate(x + 1, enPassantY);
                moves.push(new Move(from, captureSquare, piece, null, false, true));
            }
        }
    }

    public static addCapture(board: BoardModel, x: number, y: number, piece: Piece, moves: Move[], from: Coordinate, perks: Perk[] = [], game?: ChessGame) {
        const target = board.getSquare(new Coordinate(x, y));
        if (target && target.piece && target.piece.color !== piece.color) {
            // RuleEngine check for capture restrictions
            if (!RuleEngine.canCapture(game, piece, target.piece, target.coordinate, from, board, perks)) return;

            moves.push(new Move(from, new Coordinate(x, y), piece, target.piece));
        }
    }

    public static addSlidingMoves(
        board: BoardModel,
        from: Coordinate,
        dirs: number[][],
        piece: Piece,
        moves: Move[],
        maxRange: number = BoardModel.SIZE,
        perks: Perk[] = [],
        game?: ChessGame
    ) {
        const { x: startX, y: startY } = from;
        dirs.forEach(([dx, dy]) => {
            let x = startX + dx;
            let y = startY + dy;
            let range = 1;
            while (x >= 0 && x < BoardModel.SIZE && y >= 0 && y < BoardModel.SIZE && range <= maxRange) {
                const coord = new Coordinate(x, y);
                const target = board.getSquare(coord);
                if (!target) break;

                if (!target.piece) {
                    moves.push(new Move(from, coord, piece));
                } else {
                    if (target.piece.color !== piece.color) {
                        this.addCapture(board, x, y, piece, moves, from, perks, game);
                    } else if (RuleEngine.canMoveThroughFriendlies(piece, target.piece, perks)) {
                        // Keep going if we can move through friendlies
                        x += dx;
                        y += dy;
                        range++;
                        continue;
                    }
                    break; // Blocked
                }
                x += dx;
                y += dy;
                range++;
            }
        });
    }

    public static addFixedDistanceMoves(
        board: BoardModel,
        from: Coordinate,
        dirs: number[][],
        piece: Piece,
        moves: Move[],
        distances: number[]
    ) {
        const { x: startX, y: startY } = from;
        dirs.forEach(([dx, dy]) => {
            distances.forEach(d => {
                const x = startX + dx * d;
                const y = startY + dy * d;
                if (x >= 0 && x < BoardModel.SIZE && y >= 0 && y < BoardModel.SIZE) {
                    const coord = new Coordinate(x, y);
                    const target = board.getSquare(coord);
                    if (target) {
                        // Check if path is clear (clunky way, but simple for now)
                        let isPathClear = true;
                        for (let i = 1; i < d; i++) {
                            if (!this.isEmpty(board, startX + dx * i, startY + dy * i)) {
                                isPathClear = false;
                                break;
                            }
                        }
                        if (isPathClear && (!target.piece || target.piece.color !== piece.color)) {
                            moves.push(new Move(from, coord, piece, target.piece || null));
                        }
                    }
                }
            });
        });
    }

    public static addSteppingMoves(
        board: BoardModel,
        from: Coordinate,
        dirs: number[][],
        piece: Piece,
        moves: Move[]
    ) {
        const { x: startX, y: startY } = from;
        dirs.forEach(([dx, dy]) => {
            const x = startX + dx;
            const y = startY + dy;
            if (x >= 0 && x < BoardModel.SIZE && y >= 0 && y < BoardModel.SIZE) {
                const coord = new Coordinate(x, y);
                const target = board.getSquare(coord);
                if (target) {
                    if (!target.piece || target.piece.color !== piece.color) {
                        moves.push(new Move(from, coord, piece, target.piece || null));
                    }
                }
            }
        });
    }

    private static addCastlingMoves(board: BoardModel, piece: Piece, from: Coordinate, moves: Move[], perks: Perk[] = []) {
        // King must not have moved (unless RuleEngine allows it)
        if (piece.hasMoved && !RuleEngine.canCastleWhileMoved(piece, perks)) return;

        // Check if castling is generally allowed by active pacts
        if (!RuleEngine.canCastle(piece, perks)) return;

        const { x, y } = from;
        const baseRank = piece.color === 'white' ? 0 : 7;

        // Check Delayed Castle (handing this logic via RuleEngine or caller)
        // if (perks.some(p => p.id === 'delayed_castle')) { ... }

        // King must be on starting square (e1 or e8)
        if (x !== 4 || y !== baseRank) return;

        // Check if king is in check (cannot castle out of check)
        if (this.isSquareUnderAttack(board, from, piece.color)) return;

        // Kingside castling (O-O)
        const kingsideRookSquare = board.getSquare(new Coordinate(7, baseRank));
        if (kingsideRookSquare?.piece &&
            kingsideRookSquare.piece.type === 'rook' &&
            kingsideRookSquare.piece.color === piece.color &&
            !kingsideRookSquare.piece.hasMoved) {

            // Check if squares between king and rook are empty
            if (this.isEmpty(board, 5, baseRank) && this.isEmpty(board, 6, baseRank)) {
                // Check if king passes through or ends in check
                const f = new Coordinate(5, baseRank);
                const g = new Coordinate(6, baseRank);

                if (!this.isSquareUnderAttack(board, f, piece.color) &&
                    !this.isSquareUnderAttack(board, g, piece.color)) {
                    moves.push(new Move(from, g, piece, null, true, false));
                }
            }
        }

        // Queenside castling (O-O-O)
        const queensideRookSquare = board.getSquare(new Coordinate(0, baseRank));
        if (queensideRookSquare?.piece &&
            queensideRookSquare.piece.type === 'rook' &&
            queensideRookSquare.piece.color === piece.color &&
            !queensideRookSquare.piece.hasMoved) {

            // Check if squares between king and rook are empty
            if (this.isEmpty(board, 1, baseRank) &&
                this.isEmpty(board, 2, baseRank) &&
                this.isEmpty(board, 3, baseRank)) {

                // Check if king passes through or ends in check (b-file doesn't matter)
                const c = new Coordinate(2, baseRank);
                const d = new Coordinate(3, baseRank);

                if (!this.isSquareUnderAttack(board, c, piece.color) &&
                    !this.isSquareUnderAttack(board, d, piece.color)) {
                    moves.push(new Move(from, c, piece, null, true, false));
                }
            }
        }
    }

    private static isSquareUnderAttack(board: BoardModel, square: Coordinate, byColor: PieceColor, perks: Perk[] = []): boolean {
        const opponentColor: PieceColor = byColor === 'white' ? 'black' : 'white';

        // Check all opponent pieces to see if any can attack this square
        const allSquares = board.getAllSquares();
        for (const sq of allSquares) {
            if (sq.piece && sq.piece.color === opponentColor) {
                // For attack checking, we should use the opponent's perks
                // BUT perks are currently assigned to the game, not the piece.
                // We'll assume the caller passes the relevant perks if needed.
                const opponentMoves = this.getPseudoLegalMovesSimple(board, sq.piece, sq.coordinate, perks);
                if (opponentMoves.some(m => m.to.equals(square))) {
                    return true;
                }
            }
        }
        return false;
    }

    // Simplified version without castling to avoid recursion
    private static getPseudoLegalMovesSimple(board: BoardModel, piece: Piece, from: Coordinate, perks: Perk[] = []): Move[] {
        const moves: Move[] = [];

        switch (piece.type) {
            case 'pawn':
                this.addPawnMoves(board, piece, from, moves, null, perks);
                break;
            case 'rook':
                this.addSlidingMoves(board, from, MoveGenerator.ROOK_DIRS, piece, moves, undefined, perks);
                break;
            case 'bishop':
                this.addSlidingMoves(board, from, MoveGenerator.BISHOP_DIRS, piece, moves, undefined, perks);
                break;
            case 'queen':
                this.addSlidingMoves(board, from, MoveGenerator.QUEEN_DIRS, piece, moves, undefined, perks);
                break;
            case 'knight':
                this.addSteppingMoves(board, from, MoveGenerator.KNIGHT_DIRS, piece, moves);
                break;
            case 'king':
                this.addSteppingMoves(board, from, MoveGenerator.QUEEN_DIRS, piece, moves);
                break;
        }

        return moves;
    }
}
