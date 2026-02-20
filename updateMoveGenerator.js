const fs = require('fs');
let content = fs.readFileSync('packages/chess-core/src/domain/rules/MoveGenerator.ts', 'utf8');

// 1. addCastlingMoves signature & calls
content = content.replace(
    /private static addCastlingMoves\(board: BoardModel, piece: Piece, from: Coordinate, moves: Move\[\], perks: Perk\[\] = \[\]\) \{/g,
    'private static addCastlingMoves(board: BoardModel, piece: Piece, from: Coordinate, moves: Move[], perks: Perk[] = [], game?: IChessGame) {'
);
content = content.replace(
    /this\.addCastlingMoves\(board, piece, from, moves, perks\);/g,
    'this.addCastlingMoves(board, piece, from, moves, perks, game);'
);

// 2. isSquareUnderAttack signature & calls
content = content.replace(
    /private static isSquareUnderAttack\(board: BoardModel, square: Coordinate, byColor: PieceColor, perks: Perk\[\] = \[\]\): boolean \{/g,
    'private static isSquareUnderAttack(board: BoardModel, square: Coordinate, byColor: PieceColor, perks: Perk[] = [], game?: IChessGame): boolean {'
);
content = content.replace(
    /this\.isSquareUnderAttack\(board, from, piece\.color\)/g,
    'this.isSquareUnderAttack(board, from, piece.color, perks, game)'
);
content = content.replace(
    /this\.isSquareUnderAttack\(board, ([fgcd]), piece\.color\)/g,
    'this.isSquareUnderAttack(board, $1, piece.color, perks, game)'
);

// 3. getPseudoLegalMovesSimple signature & calls
content = content.replace(
    /private static getPseudoLegalMovesSimple\(board: BoardModel, piece: Piece, from: Coordinate, perks: Perk\[\] = \[\]\): Move\[\] \{/g,
    'private static getPseudoLegalMovesSimple(board: BoardModel, piece: Piece, from: Coordinate, perks: Perk[] = [], game?: IChessGame): Move[] {'
);
content = content.replace(
    /const opponentMoves = this\.getPseudoLegalMovesSimple\(board, sq\.piece, sq\.coordinate, perks\);/g,
    'const opponentMoves = this.getPseudoLegalMovesSimple(board, sq.piece, sq.coordinate, perks, game);'
);

// 4. Update calls inside getPseudoLegalMovesSimple
content = content.replace(
    /this\.addPawnMoves\(board, piece, from, moves, null, perks\);/g,
    'this.addPawnMoves(board, piece, from, moves, null, perks, game);'
);
content = content.replace(
    /this\.addSlidingMoves\(board, from, MoveGenerator\.([A-Z_]+), piece, moves, undefined, perks\);/g,
    'this.addSlidingMoves(board, from, MoveGenerator.$1, piece, moves, undefined, perks, game);'
);
content = content.replace(
    /this\.addSteppingMoves\(board, from, MoveGenerator\.([A-Z_]+), piece, moves, perks\);/g,
    'this.addSteppingMoves(board, from, MoveGenerator.$1, piece, moves, perks, game);'
);

// 5. Update direct RuleEngine calls globally
content = content.replace(/RuleEngine\.getMaxRange\(piece, perks\)/g, 'RuleEngine.getMaxRange(piece, perks, game)');
content = content.replace(/RuleEngine\.getFixedDistances\(piece, perks\)/g, 'RuleEngine.getFixedDistances(piece, perks, game)');
content = content.replace(/RuleEngine\.canMoveLikeKnight\(piece\.type, perks, perkUsage\)/g, 'RuleEngine.canMoveLikeKnight(piece.type, perks, perkUsage, game)');
content = content.replace(/RuleEngine\.canPawnDoubleMove\(piece, onStartRank \? 1 : 0, 1, perks\)/g, 'RuleEngine.canPawnDoubleMove(piece, onStartRank ? 1 : 0, 1, perks, game)');
content = content.replace(/RuleEngine\.canPawnDiagonalDash\(piece, perks\)/g, 'RuleEngine.canPawnDiagonalDash(piece, perks, game)');
content = content.replace(/RuleEngine\.canPawnSidewaysMove\(piece, perks\)/g, 'RuleEngine.canPawnSidewaysMove(piece, perks, game)');
content = content.replace(/RuleEngine\.hasEcholocation\(piece, perks\)/g, 'RuleEngine.hasEcholocation(piece, perks, game)');
content = content.replace(/RuleEngine\.canMoveThroughFriendlies\(piece, target\.piece, perks\)/g, 'RuleEngine.canMoveThroughFriendlies(piece, target.piece, perks, game)');
content = content.replace(/RuleEngine\.canCastleWhileMoved\(piece, perks\)/g, 'RuleEngine.canCastleWhileMoved(piece, perks, game)');
content = content.replace(/(!?RuleEngine\.canCastle\(piece, perks)(?!\s*,)/g, '$1, game)'); // handle !RuleEngine.canCastle(piece, perks) -> ...perks, game)

fs.writeFileSync('packages/chess-core/src/domain/rules/MoveGenerator.ts', content);
console.log("Updated MoveGenerator.ts!");
