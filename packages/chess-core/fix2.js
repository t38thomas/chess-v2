const fs = require('fs');
let s = fs.readFileSync('packages/chess-core/src/domain/pacts/effects/StateEffects.ts', 'utf8');
s = s.replace(/};\r?\n\s+\/\*\*/, '},\n\n    /**');
fs.writeFileSync('packages/chess-core/src/domain/pacts/effects/StateEffects.ts', s);
