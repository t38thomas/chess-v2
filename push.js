const { execSync } = require('child_process');

try {
    // 1. Versioning
    console.log('Esecuzione versioning...');
    execSync('node calc_version.js', { stdio: 'inherit' });

    // 2. Lettura del messaggio di commit
    const args = process.argv.slice(2);
    const commitMsg = args.length > 0 ? args.join(' ') : 'modifiche';

    // 3. Add & Commit
    console.log(`\nAggiunta modifiche e commit: "${commitMsg}"`);
    execSync('git add .', { stdio: 'inherit' });

    // Proviamo a fare il commit, se non ci sono modifiche lancerà un errore che possiamo ignorare
    try {
        execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });
    } catch (e) {
        console.log('Nessuna modifica da committare o errore nel commit.');
    }

    // 4. Push
    console.log('\nPush sul repository remoto...');
    execSync('git push', { stdio: 'inherit' });

    console.log('\nOperazione completata con successo! 🎉');
} catch (error) {
    console.error('\nErrore durante l\'esecuzione dello script push:', error.message);
    process.exit(1);
}
