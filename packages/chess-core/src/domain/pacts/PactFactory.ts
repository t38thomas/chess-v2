import { PactRegistry } from './PactRegistry';
import { VeteranBonus, VeteranMalus } from './definitions/TheVeteran';
import { SaboteurBonus, SaboteurMalus } from './definitions/TheSaboteur';
import { NecromancerBonus, NecromancerMalus } from './definitions/TheNecromancer';
import { SwarmBonus, SwarmMalus } from './definitions/TheSwarm';

export class PactFactory {
    public static initialize() {
        const registry = PactRegistry.getInstance();

        // 1. Il Veterano
        registry.register(new VeteranBonus());
        registry.register(new VeteranMalus());

        // 2. Il Sabotatore
        registry.register(new SaboteurBonus());
        registry.register(new SaboteurMalus());

        // 3. Il Negromante
        registry.register(new NecromancerBonus());
        registry.register(new NecromancerMalus());

        // 4. Lo Sciame
        registry.register(new SwarmBonus());
        registry.register(new SwarmMalus());

        // ... more to come
    }
}
