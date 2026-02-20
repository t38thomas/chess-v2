const fs = require('fs');
let content = fs.readFileSync('packages/chess-core/src/domain/rules/RuleEngine.ts', 'utf8');

content = content.replace(/import \{ PactLogic \} from '\.\.\/pacts\/PactLogic';/g, "import { PactLogic, PactContextWithState } from '../pacts/PactLogic';");

const helper = `
    private static buildContext(game: IChessGame | undefined, playerId: PieceColor, pactId: string): PactContextWithState<any> | undefined {
        if (!game) return undefined;
        const logic = PactRegistry.getInstance().get(pactId) as PactLogic;
        return logic?.createContextWithState({ game, playerId, pactId });
    }

    // --- PAWN RULES ---`;
content = content.replace('    // --- PAWN RULES ---', helper);

// Add game to signatures
content = content.replace(/canPawnDoubleMove\(piece: Piece, y: number, startY: number, perks: Perk\[\]\): boolean/g, 'canPawnDoubleMove(piece: Piece, y: number, startY: number, perks: Perk[], game?: IChessGame): boolean');
content = content.replace(/canPawnDiagonalDash\(piece: Piece, perks: Perk\[\]\): boolean/g, 'canPawnDiagonalDash(piece: Piece, perks: Perk[], game?: IChessGame): boolean');
content = content.replace(/canPawnSidewaysMove\(piece: Piece, perks: Perk\[\]\): boolean/g, 'canPawnSidewaysMove(piece: Piece, perks: Perk[], game?: IChessGame): boolean');
content = content.replace(/getMaxRange\(piece: Piece, perks: Perk\[\]\): number/g, 'getMaxRange(piece: Piece, perks: Perk[], game?: IChessGame): number');
content = content.replace(/getFixedDistances\(piece: Piece, perks: Perk\[\]\): number\[\] \| null/g, 'getFixedDistances(piece: Piece, perks: Perk[], game?: IChessGame): number[] | null');
content = content.replace(/canMoveLikeKnight\(pieceType: PieceType, perks: Perk\[\], usedPerks: Set<string>\): boolean/g, 'canMoveLikeKnight(pieceType: PieceType, perks: Perk[], usedPerks: Set<string>, game?: IChessGame): boolean');
content = content.replace(/getAllowedPromotionTypes\(piece: Piece, perks: Perk\[\]\): PieceType\[\]/g, 'getAllowedPromotionTypes(piece: Piece, perks: Perk[], game?: IChessGame): PieceType[]');
content = content.replace(/canMoveThroughFriendlies\(mover: Piece, obstacle: Piece, perks: Perk\[\]\): boolean/g, 'canMoveThroughFriendlies(mover: Piece, obstacle: Piece, perks: Perk[], game?: IChessGame): boolean');
content = content.replace(/hasEcholocation\(piece: Piece, perks: Perk\[\]\): boolean/g, 'hasEcholocation(piece: Piece, perks: Perk[], game?: IChessGame): boolean');
content = content.replace(/canCastleWhileMoved\(piece: Piece, perks: Perk\[\]\): boolean/g, 'canCastleWhileMoved(piece: Piece, perks: Perk[], game?: IChessGame): boolean');
content = content.replace(/canCastle\(piece: Piece, perks: Perk\[\]\): boolean/g, 'canCastle(piece: Piece, perks: Perk[], game?: IChessGame): boolean');
content = content.replace(/mustMoveKingInCheck\(color: PieceColor, perks: Perk\[\]\): boolean/g, 'mustMoveKingInCheck(color: PieceColor, perks: Perk[], game?: IChessGame): boolean');

// Add context calls
content = content.replace(/allowed = modifier\(piece, y, startY\);/g, 'allowed = modifier(piece, y, startY, RuleEngine.buildContext(game, piece.color, perk.id));');
content = content.replace(/return pactLogic\?.getRuleModifiers\(\)\?.canDiagonalDash\?\.\(piece\);/g, 'return pactLogic?.getRuleModifiers()?.canDiagonalDash?.(piece, RuleEngine.buildContext(game, piece.color, p.id)) || false;');
content = content.replace(/return pactLogic\?.getRuleModifiers\(\)\?.canSidewaysMove\?\.\(piece\);/g, 'return pactLogic?.getRuleModifiers()?.canSidewaysMove?.(piece, RuleEngine.buildContext(game, piece.color, p.id)) || false;');
content = content.replace(/max = Math\.min\(max, modifier\(piece\)\);/g, 'max = Math.min(max, modifier(piece, RuleEngine.buildContext(game, piece.color, perk.id)));');
content = content.replace(/const dists = modifier\(piece\);/g, 'const dists = modifier(piece, RuleEngine.buildContext(game, piece.color, perk.id));');
content = content.replace(/if \(pactLogic\?.getRuleModifiers\(\)\?.canMoveLikeKnight\?\.\(pieceType\)\) return true;/g, 'if (pactLogic?.getRuleModifiers()?.canMoveLikeKnight?.(pieceType, RuleEngine.buildContext(game, "white", perk.id))) return true; // TODO correct color mapping later? Knight is symmetric');
content = content.replace(/if \(modifier && modifier\(game, from, targetBoard\) === false\) return false;/g, 'if (modifier && modifier(game, from, targetBoard, RuleEngine.buildContext(game, square?.piece?.color || "white", perk.id)) === false) return false;');
content = content.replace(/const types = modifier\(piece\);/g, 'const types = modifier(piece, RuleEngine.buildContext(game, piece.color, perk.id));');
content = content.replace(/return pactLogic\?.getRuleModifiers\(\)\?.canMoveThroughFriendlies\?\.\(mover, obstacle\);/g, 'return pactLogic?.getRuleModifiers()?.canMoveThroughFriendlies?.(mover, obstacle, RuleEngine.buildContext(game, mover.color, p.id)) || false;');
content = content.replace(/return pactLogic\?.getRuleModifiers\(\)\?.hasEcholocation\?\.\(piece\);/g, 'return pactLogic?.getRuleModifiers()?.hasEcholocation?.(piece, RuleEngine.buildContext(game, piece.color, p.id)) || false;');

content = content.replace(/if \(modifier && modifier\(game, attacker, victim, to, from, board\) === false\) return false;/g, `if (modifier && modifier(game, attacker, victim, to, from, board, RuleEngine.buildContext(game, attacker.color, perk.id)) === false) return false;`);

// Second replacement for the victim loop:
content = content.replace(/if \(modifier && modifier\(game, attacker, victim, to, from, board\) === false\) return false;/g, `if (modifier && modifier(game, attacker, victim, to, from, board, RuleEngine.buildContext(game, victim.color, perk.id)) === false) return false;`);

content = content.replace(/return pactLogic\?.getRuleModifiers\(\)\?.canCastleWhileMoved\?\.\(piece\);/g, 'return pactLogic?.getRuleModifiers()?.canCastleWhileMoved?.(piece, RuleEngine.buildContext(game, piece.color, p.id)) || false;');
content = content.replace(/if \(modifier && modifier\(piece\) === false\) return false;/g, 'if (modifier && modifier(piece, RuleEngine.buildContext(game, piece.color, perk.id)) === false) return false;');
content = content.replace(/return pactLogic\?.getRuleModifiers\(\)\?.mustMoveKingInCheck\?\.\(color\);/g, 'return pactLogic?.getRuleModifiers()?.mustMoveKingInCheck?.(color, RuleEngine.buildContext(game, color, p.id)) || false;');
content = content.replace(/pactLogic\?.getRuleModifiers\(\)\?.onExecuteMove\?\.\(game, move\);/g, 'pactLogic?.getRuleModifiers()?.onExecuteMove?.(game, move, RuleEngine.buildContext(game, move.piece?.color || "white", perk.id));');
content = content.replace(/const res = modifier\(game, currentTurn, eventType\);/g, 'const res = modifier(game, currentTurn, eventType, RuleEngine.buildContext(game, currentTurn, perk.id));');

content = content.replace(/pactLogic\?.getRuleModifiers\(\)\?.onGetPseudoMoves\?\.\(\{/g, 'pactLogic?.getRuleModifiers()?.onGetPseudoMoves?.({\\n                board, from, piece, moves, game, perks,\\n                orientation: game?.orientation ?? 0\\n            }, RuleEngine.buildContext(game, piece.color, p.id));\\n            //');

fs.writeFileSync('packages/chess-core/src/domain/rules/RuleEngine.ts', content);
