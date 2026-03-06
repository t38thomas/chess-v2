import { PactRegistry } from './PactRegistry';
import { PactDefinition } from './PactLogic';
import * as PactDefinitions from './definitions';

declare var __DEV__: boolean;

export class PactFactory {

    private static readonly PACTS: PactDefinition[] = Object.values(PactDefinitions)
        .filter((v): v is PactDefinition =>
            v !== null &&
            typeof v === 'object' &&
            'bonus' in (v as object) &&
            'malus' in (v as object) &&
            'id' in (v as object)
        );

    public static initialize() {
        const registry = PactRegistry.getInstance();

        for (const pactDef of PactFactory.PACTS) {
            registry.register(pactDef.bonus);
            registry.register(pactDef.malus);
        }
    }
}
