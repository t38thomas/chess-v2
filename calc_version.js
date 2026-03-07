const fs = require('fs');
const cp = require('child_process');

const log = cp.execSync('git log --reverse --format="%s"').toString().split('\n').filter(Boolean);

let major = 1;
let minor = 0;
let patch = 0;
const history = [];

let consecutiveMajors = 0; // To avoid bumping major on 3 consecutive "nuova architettura" commits

log.forEach(msg => {
    const lowerMsg = msg.toLowerCase();
    let type = 'patch';

    const isMajor = lowerMsg.includes('nuova architettura') || lowerMsg.includes('pact v3') || lowerMsg.includes('architettura v2 completata') || lowerMsg.includes('massive migration');
    const isMinor = lowerMsg.startsWith('feat') || lowerMsg.includes('implement') || lowerMsg.includes('nuovi patti') || lowerMsg.includes('rotazione scacchiera') || lowerMsg.includes('thief') || lowerMsg.includes('gester') || lowerMsg.includes('refactor');

    if (isMajor) {
        if (consecutiveMajors === 0) {
            type = 'major';
            major++;
            minor = 0;
            patch = 0;
        } else {
            type = 'patch (grouped major)';
            patch++;
        }
        consecutiveMajors++;
    } else if (isMinor) {
        consecutiveMajors = 0;
        type = 'minor';
        minor++;
        patch = 0;
    } else {
        consecutiveMajors = 0;
        type = 'patch';
        patch++;
    }
    history.push(`- \`${msg}\` -> **v${major}.${minor}.${patch}** (${type})`);
});
const report = `# Commit Versioning Report

Final computed version logic based on the repository history: **${major}.${minor}.${patch}**

## History Log

${history.join('\n')}
`;
fs.writeFileSync('version_report.md', report);
console.log(`Final version: ${major}.${minor}.${patch}`);
