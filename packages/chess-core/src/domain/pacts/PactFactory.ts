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

declare var __DEV__: boolean;

export class PactFactory {
    private static readonly RELEASE_READY_PACTS = [
        'bayonet', 'old_guard',
        'diagonal_dash', 'cut_supplies',
        'reclaimer', 'ascension_cost',
        'hydra', 'hive_queen',
        'transmutation', 'volatile_reagents',
        'frenzy', 'defenseless',
        'trample', 'heavy_armor',
        'incorporeal', 'possession',
        'long_sight', 'reload',
        'mimicry', 'unstable_identity',
        'stone_skin', 'lead_feet',
        'chaos', 'jester',
        'pickpocket', 'wanted',
        'snipe', 'short_sighted',
        'flow', 'ebb'
    ];

    public static initialize() {
        const registry = PactRegistry.getInstance();
        const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

        const register = (pact: any) => {
            if (isDev || PactFactory.RELEASE_READY_PACTS.includes(pact.id)) {
                registry.register(pact);
            }
        };

        // 1. Il Veterano
        register(new VeteranBonus());
        register(new VeteranMalus());

        // 2. Il Sabotatore
        register(new SaboteurBonus());
        register(new SaboteurMalus());

        // 3. Il Negromante
        register(new NecromancerBonus());
        register(new NecromancerMalus());

        // 4. Lo Sciame
        register(new SwarmBonus());
        register(new SwarmMalus());

        // 5. L'Alchimista
        register(new AlchemistBonus());
        register(new AlchemistMalus());

        // 6. Il Berserker
        register(new BerserkerBonus());
        register(new BerserkerMalus());

        // 7. Cavalleria Pesante
        register(new HeavyCavalryBonus());
        register(new HeavyCavalryMalus());

        // 8. Lo Spettro
        register(new SpectreBonus());
        register(new SpectreMalus());

        // 9. Il Cecchino
        register(new SniperBonus());
        register(new SniperMalus());

        // 10. Il Mutaforma
        register(new ChangelingBonus());
        register(new ChangelingMalus());

        // 11. Il Golem
        register(new StoneSkinBonus());
        register(new LeadFeetMalus());

        // 12. Il Giullare
        register(new ChaosBonus());
        register(new JesterMalus());

        // 13. Il Ladro
        register(new ThiefBonus());
        register(new ThiefMalus());

        // 14. L'Arciere
        register(new RangerBonus());
        register(new RangerMalus());

        // 15. Il Richiamo della Marea (The Tidecaller)
        register(new TidecallerBonus());
        register(new TidecallerMalus());
    }
}
