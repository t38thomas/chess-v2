import { PactRegistry } from './PactRegistry';
import { VeteranBonus, VeteranMalus } from './definitions/TheVeteran';
import { SaboteurBonus, SaboteurMalus } from './definitions/TheSaboteur';
import { NecromancerBonus, NecromancerMalus } from './definitions/TheNecromancer';
import { SwarmBonus, SwarmMalus } from './definitions/TheSwarm';
import { AlchemistBonus, AlchemistMalus } from './definitions/TheAlchemist';
import { BerserkerBonus, BerserkerMalus } from './definitions/TheBerserker';

import { HeavyCavalryBonus, HeavyCavalryMalus } from './definitions/TheHeavyCavalry';
import { SpectreBonus, SpectreMalus } from './definitions/TheSpectre';
import { SniperBonus, SniperMalus } from './definitions/TheSniper';
import { ChangelingBonus, ChangelingMalus } from './definitions/TheChangeling';
import { StoneSkinBonus, LeadFeetMalus } from './definitions/TheGolem';
import { ChaosBonus, JesterMalus } from './definitions/TheJester';
import { ThiefBonus, ThiefMalus } from './definitions/TheThief';
import { RangerBonus, RangerMalus } from './definitions/TheRanger';
import { TidecallerBonus, TidecallerMalus } from './definitions/TheTidecaller';

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

        // 5. L'Alchimista
        registry.register(new AlchemistBonus());
        registry.register(new AlchemistMalus());

        // 6. Il Berserker
        registry.register(new BerserkerBonus());
        registry.register(new BerserkerMalus());

        // 7. Cavalleria Pesante
        registry.register(new HeavyCavalryBonus());
        registry.register(new HeavyCavalryMalus());

        // 8. Lo Spettro
        registry.register(new SpectreBonus());
        registry.register(new SpectreMalus());

        // 9. Il Cecchino
        registry.register(new SniperBonus());
        registry.register(new SniperMalus());

        // 10. Il Mutaforma
        registry.register(new ChangelingBonus());
        registry.register(new ChangelingMalus());

        // 11. Il Golem
        registry.register(new StoneSkinBonus());
        registry.register(new LeadFeetMalus());

        // 12. Il Giullare
        registry.register(new ChaosBonus());
        registry.register(new JesterMalus());

        // 13. Il Ladro
        registry.register(new ThiefBonus());
        registry.register(new ThiefMalus());

        // 14. L'Arciere
        registry.register(new RangerBonus());
        registry.register(new RangerMalus());

        // 15. Il Richiamo della Marea (The Tidecaller)
        registry.register(new TidecallerBonus());
        registry.register(new TidecallerMalus());

        // ... more to come
    }
}
