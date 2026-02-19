import { PactLogic, PactDefinition } from './PactLogic';

export class PactRegistry {
    private static instance: PactRegistry;
    private pacts: Map<string, PactLogic> = new Map();

    private constructor() { }

    public static getInstance(): PactRegistry {
        if (!PactRegistry.instance) {
            PactRegistry.instance = new PactRegistry();
        }
        return PactRegistry.instance;
    }

    public register(pact: PactLogic) {
        this.pacts.set(pact.id, pact);
    }

    public registerDefinition(definition: PactDefinition) {
        this.register(definition.bonus);
        this.register(definition.malus);
    }

    public get(id: string): PactLogic | undefined {
        return this.pacts.get(id);
    }

    public getAll(): PactLogic[] {
        return Array.from(this.pacts.values());
    }
}

