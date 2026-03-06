import { PactLogic, PactDefinition, RuleModifiers } from './PactLogic';

export class PactRegistry {
    private static instance: PactRegistry;
    private pacts: Map<string, PactLogic> = new Map();
    private definitions: Map<string, PactDefinition> = new Map();
    private modifierCache: Map<string, RuleModifiers> = new Map();

    private constructor() { }

    public static getInstance(): PactRegistry {
        if (!PactRegistry.instance) {
            PactRegistry.instance = new PactRegistry();
        }
        return PactRegistry.instance;
    }

    public register(pact: PactLogic) {
        this.pacts.set(pact.id, pact);
        this.modifierCache.delete(pact.id);
    }

    public registerDefinition(definition: PactDefinition) {
        this.definitions.set(definition.id, definition);
        this.register(definition.bonus);
        this.register(definition.malus);
    }

    public get(id: string): PactLogic | undefined {
        return this.pacts.get(id);
    }

    public getDefinition(id: string): PactDefinition | undefined {
        return this.definitions.get(id);
    }

    public getAll(): PactLogic[] {
        return Array.from(this.pacts.values());
    }

    public getAllDefinitions(): PactDefinition[] {
        return Array.from(this.definitions.values());
    }

    /**
     * Recupera (e se necessario calcola e cachea) i RuleModifiers di un patto per evitare la ricomposizione ad ogni tick.
     */
    public getCachedModifiers(id: string): RuleModifiers | undefined {
        if (!this.modifierCache.has(id)) {
            const pact = this.pacts.get(id);
            if (pact) {
                this.modifierCache.set(id, pact.getRuleModifiers());
            }
        }
        return this.modifierCache.get(id);
    }

    /**
     * Resets the singleton instance. Use only in test environments.
     */
    public static reset(): void {
        PactRegistry.instance = new PactRegistry();
    }
}

