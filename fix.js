const fs = require('fs');

// Fix RuleEngine
let reInfo = fs.readFileSync('packages/chess-core/src/domain/rules/RuleEngine.ts', 'utf8');
reInfo = reInfo.replace('pactLogic?.getRuleModifiers()?.onGetPseudoMoves?.({\n                board, from, piece, moves, game, perks,\n                orientation: game?.orientation ?? 0\n            }, RuleEngine.buildContext(game, piece.color, p.id));\n            //\n                board, from, piece, moves, game, perks,\n                orientation: game?.orientation ?? 0\n            });', 'pactLogic?.getRuleModifiers()?.onGetPseudoMoves?.({\n                board, from, piece, moves, game, perks,\n                orientation: game?.orientation ?? 0\n            }, RuleEngine.buildContext(game, piece.color, p.id));');
fs.writeFileSync('packages/chess-core/src/domain/rules/RuleEngine.ts', reInfo);

// Fix MoveGenerator if any syntax error
let mgInfo = fs.readFileSync('packages/chess-core/src/domain/rules/MoveGenerator.ts', 'utf8');
mgInfo = mgInfo.replace('if (!RuleEngine.canCastle(piece, perks, game))) return;', 'if (!RuleEngine.canCastle(piece, perks, game)) return;');
fs.writeFileSync('packages/chess-core/src/domain/rules/MoveGenerator.ts', mgInfo);
