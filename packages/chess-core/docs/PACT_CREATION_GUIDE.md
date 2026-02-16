# Guida alla Creazione di Patti in Chess V2

Questa guida spiega come creare nuovi patti (Bonus e Malus) in modo agile e come utilizzare le funzionalità avanzate come counter, toast e abilità attivabili.

## 1. Struttura di un Patto

Un Patto è composto da due parti:
- **Bonus**: Vantaggio per il giocatore.
- **Malus**: Svantaggio per il giocatore.

Entrambi estendono la classe astratta `PactLogic`.

### Esempio Base

Crea un nuovo file in `src/domain/pacts/definitions/nome_patto.ts`.

```typescript
import { PactLogic, PactContext, RuleModifiers } from '../PactLogic';
import { GameEvent } from '../../GameTypes';

export class MyPactBonus extends PactLogic {
    id = 'my_pact_bonus_id'; // ID univoco per il bonus

    // Modifica le regole del gioco
    getRuleModifiers(): RuleModifiers {
        return {
            // Esempio: i pedoni possono muoversi all'indietro
            // ...
        };
    }

    // Reagisce agli eventi
    onEvent(event: GameEvent, payload: any, context: PactContext): void {
        if (event === 'capture') {
            // Fai qualcosa quando avviene una cattura
        }
    }
}

export class MyPactMalus extends PactLogic {
    id = 'my_pact_malus_id'; // ID univoco per il malus
    
    // Implementazione simile...
}
```

## 2. Registrazione del Patto

Per rendere il patto disponibile nel gioco:

1.  Apri `src/domain/pacts/PactFactory.ts`.
2.  Importa le classi del nuovo patto.
3.  Aggiungi le istanze nel metodo `initialize`:

```typescript
// ... imports
import { MyPactBonus, MyPactMalus } from './definitions/MyPact';

export class PactFactory {
    // ...
    public static initialize() {
        // ...
        register(new MyPactBonus());
        register(new MyPactMalus());
    }
}
```

## 3. Funzionalità Avanzate

### Toast (Notifiche)

Per mostrare una notifica in gioco (toast) quando si attiva un effetto, usa `PactUtils.emitPactEffect`.

```typescript
import { PactUtils } from '../PactUtils';

// ... dentro onEvent o altra logica
PactUtils.emitPactEffect(context.game, {
    pactId: this.id,
    title: 'Titolo della notifica (o chiave di traduzione)',
    description: 'Descrizione dell\'effetto (o chiave)',
    icon: 'icon-name', // Nome icona (es. 'shimmer', 'fire', etc.)
    type: 'bonus' // o 'malus'
});
```

Oppure usa l'helper per le traduzioni automatiche:

```typescript
PactUtils.notifyPactEffect(context.game, this.id, 'event_key', 'bonus', 'icon-name');
// Questo cercherà le chiavi:
// Titolo: pact.toasts.{pactId}.{event_key}.title
// Desc:   pact.toasts.{pactId}.{event_key}.desc
```

### Counter (Indicatori Turni/Accumuli)

Se il tuo patto deve mostrare un contatore o un cooldown nell'interfaccia, implementa `getTurnCounters`.

```typescript
import { TurnCounter } from '../PactLogic';

// ... nella classe PactLogic
getTurnCounters(context: PactContext): TurnCounter[] {
    const { game, playerId } = context;
    
    // Calcola il valore, ad esempio basato su una variabile di stato
    const charges = game.pactState[`${this.id}_charges_${playerId}`] || 0;

    if (charges > 0) {
        return [{
            id: `${this.id}_counter`,
            label: 'translation.key.for.label',
            value: charges,
            pactId: this.id,
            type: 'counter', // o 'cooldown'
            // subLabel: 'optional'
        }];
    }
    return [];
}
```

### Abilità Attivabili (Active Abilities)

Per dare al giocatore un pulsante per attivare un'abilità manualmente.

Definisci la proprietà `activeAbility` nella tua classe `PactLogic`.

```typescript
import { ActiveAbilityConfig } from '../PactLogic';

export class MyActivePact extends PactLogic {
    id = 'active_power';

    readonly activeAbility: ActiveAbilityConfig = {
        id: 'active_power_action',
        name: 'translation.key.name',
        description: 'translation.key.desc',
        icon: 'flash',
        cooldown: 3, // Turni di ricarica
        targetType: 'piece', // 'piece', 'square', o 'none'
        maxTargets: 1,
        
        // La funzione che esegue l'abilità
        execute: (context: PactContext, targetPos: Coordinate): boolean => {
            const { game } = context;
            // Logica dell'abilità...
            // Ritorna true se l'abilità è stata eseguita con successo
            return true; 
        }
    };
}
```

## 4. Best Practices

- **Stato**: Usa `context.game.pactState` per salvare dati persistenti tra i turni (es. cooldown speciali, flag, contatori). Usa chiavi univoche (es. `pactId_variableName_playerId`).
- **PactUtils**: Usa `PactUtils` per operazioni comuni come trovare pezzi, rimuovere pezzi, spawnare pezzi, controllare adiacenze, etc.
- **RuleModifiers**: Usa i modifier esistenti in `RuleModifiers` (in `PactLogic.ts`) invece di hackare la logica di gioco se possibile. Se manca un hook, considerane l'aggiunta.
