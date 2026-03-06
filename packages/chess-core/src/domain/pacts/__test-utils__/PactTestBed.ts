import { ChessGame } from '../../ChessGame';
import { PieceColor } from '../../models/Piece';
import { PactDefinition } from '../PactLogic';
import { PactRegistry } from '../PactRegistry';
import { Coordinate } from '../../models/Coordinate';
import { Move } from '../../models/Move';

/**
 * A utility class to easily set up and test PactLogic.
 * It provides a fluent and easy way to simulate game turns and assert pact states.
 */
export class PactTestBed<TBonusState = any, TMalusState = any> {
    public game: ChessGame;

    /**
     * @param pactDef The pact definition to test
     * @param owner The color that owns the pact (default: 'white')
     * @param setup The initial board setup (default: 'standard')
     */
    constructor(
        private pactDef?: PactDefinition,
        private owner: PieceColor = 'white',
        setup: 'standard' | 'empty' = 'standard'
    ) {
        this.game = new ChessGame();

        if (setup === 'standard') {
            this.game.board.setupStandardGame();
        } else {
            this.game.board.clear();
        }

        if (this.pactDef) {
            const registry = PactRegistry.getInstance();
            registry.register(this.pactDef.bonus);
            registry.register(this.pactDef.malus);

            this.game.pacts[this.owner].push({
                id: this.pactDef.id,
                bonus: { id: this.pactDef.bonus.id },
                malus: { id: this.pactDef.malus.id }
            } as any);

            // Initialize states
            const bonusInitial = this.pactDef.bonus.getInitialState();
            if (bonusInitial !== null && bonusInitial !== undefined) {
                this.game.pactState[`${this.pactDef.bonus.id}_${this.owner}`] = bonusInitial;
            }

            const malusInitial = this.pactDef.malus.getInitialState();
            const opponent = this.owner === 'white' ? 'black' : 'white';
            if (malusInitial !== null && malusInitial !== undefined) {
                this.game.pactState[`${this.pactDef.malus.id}_${opponent}`] = malusInitial;
            }
        }
    }

    /**
     * Executes a move using algebraic notation (e.g. 'e2', 'e4').
     * @returns boolean true se la mossa ha avuto successo
     */
    move(fromAlgebraic: string, toAlgebraic: string, promoteTo: 'queen' | 'rook' | 'bishop' | 'knight' = 'queen'): boolean {
        const from = this.parseAlgebraic(fromAlgebraic);
        const to = this.parseAlgebraic(toAlgebraic);
        if (!from || !to) return false;

        return this.game.makeMove(from, to, promoteTo);
    }

    /**
     * Returns the state for the bonus part of the pact.
     */
    getBonusState(): TBonusState {
        if (!this.pactDef) throw new Error("No pact defined");
        const key = `${this.pactDef.bonus.id}_${this.owner}`;
        return this.game.pactState[key] as TBonusState;
    }

    /**
     * Returns the state for the malus part of the pact.
     */
    getMalusState(): TMalusState {
        if (!this.pactDef) throw new Error("No pact defined");
        const opponent = this.owner === 'white' ? 'black' : 'white';
        const key = `${this.pactDef.malus.id}_${opponent}`;
        return this.game.pactState[key] as TMalusState;
    }

    /**
     * Helper to parse algebraic notation. 
     * E.g. "a1" -> { x: 0, y: 0 }
     */
    public parseAlgebraic(alg: string): Coordinate | null {
        if (alg.length !== 2) return null;
        const file = alg.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
        const rank = parseInt(alg[1]) - 1;
        if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
        return new Coordinate(file, rank);
    }
}
