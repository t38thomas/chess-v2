import { PactRegistry } from './PactRegistry';
import { PactLogic, PactDefinition } from './PactLogic';
import { TheVeteran } from './definitions/TheVeteran';
import { TheSaboteur } from './definitions/TheSaboteur';
import { TheNecromancer } from './definitions/TheNecromancer';
import { TheSwarm } from './definitions/TheSwarm';
import { TheAlchemist } from './definitions/TheAlchemist';
import { TheBerserker } from './definitions/TheBerserker';
import { TheHeavyCavalry } from './definitions/TheHeavyCavalry';
import { TheSpectre } from './definitions/TheSpectre';
import { TheSniper } from './definitions/TheSniper';
import { TheChangeling } from './definitions/TheChangeling';
import { TheGolem } from './definitions/TheGolem';
import { TheJester } from './definitions/TheJester';
import { TheThief } from './definitions/TheThief';
import { TheRanger } from './definitions/TheRanger';
import { TheTidecaller } from './definitions/TheTidecaller';
import { TheHawk } from './definitions/TheHawk';
import { TheTimekeeper } from './definitions/TheTimekeeper';
import { ThePhoenix } from './definitions/ThePhoenix';
import { TheVoidJumper } from './definitions/TheVoidJumper';
import { TheIllusionist } from './definitions/TheIllusionist';
import { TheHeir } from './definitions/TheHeir';
import { TheVampire } from './definitions/TheVampire';
import { TheSentinel } from './definitions/TheSentinel';
import { TheGladiator } from './definitions/TheGladiator';
import { TheTitan } from './definitions/TheTitan';
import { TheShadow } from './definitions/TheShadow';
import { TheEngineer } from './definitions/TheEngineer';
import { TheDiplomat } from './definitions/TheDiplomat';
import { TheOracle } from './definitions/TheOracle';
import { TheBlindSeer } from './definitions/TheBlindSeer';

declare var __DEV__: boolean;

export class PactFactory {

    private static readonly PACTS: PactDefinition[] = [
        TheVeteran,
        TheSaboteur,
        TheNecromancer,
        TheSwarm,
        TheAlchemist,
        TheBerserker,
        TheHeavyCavalry,
        TheSpectre,
        TheSniper,
        TheChangeling,
        TheGolem,
        TheJester,
        TheThief,
        TheRanger,
        TheTidecaller,
        TheHawk,
        TheTimekeeper,
        ThePhoenix,
        TheVoidJumper,
        TheIllusionist,
        TheHeir,
        TheVampire,
        TheSentinel,
        TheGladiator,
        TheTitan,
        TheShadow,
        TheEngineer,
        TheDiplomat,
        TheOracle,
        TheBlindSeer
    ];

    public static initialize() {
        const registry = PactRegistry.getInstance();

        for (const pactDef of PactFactory.PACTS) {
            registry.register(pactDef.bonus);
            registry.register(pactDef.malus);
        }
    }
}
