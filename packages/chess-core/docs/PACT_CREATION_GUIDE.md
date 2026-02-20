# Guida alla Creazione di Patti in Chess V2

Questa guida spiega come creare nuovi patti utilizzando il nuovo DSL `definePact`, il sistema degli `Effects` e le funzionalità avanzate come lo stato tipizzato e le abilità attive.

## 1. Struttura di un Patto

Un Patto è l'unione di un **Bonus** e di un **Malus**. Utilizziamo `definePact` per creare una definizione completa in modo dichiarativo.

### Esempio Base

Crea un nuovo file in `packages/chess-core/src/domain/pacts/definitions/NomePatto.ts`.

```typescript
import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';

export const TheMyPact = definePact('my_pact_id')
    .bonus('my_bonus', {
        // Effects predefiniti (opzionali)
        effects: [
            Effects.movement.canMoveThroughFriendlies('knight')
        ],
        // Modificatori di regole personalizzati
        modifiers: {
            getMaxRange: (piece) => piece.type === 'pawn' ? 2 : undefined
        }
    })
    .malus('my_malus', {
        // Hook sugli eventi
        onCapture: (payload, context) => {
            // Logica quando avviene una cattura
        }
    })
    .build();
```

## 2. Registrazione del Patto

I patti devono essere aggiunti manualmente all'array `PACTS` in `PactFactory.ts`.

1.  Apri `packages/chess-core/src/domain/pacts/PactFactory.ts`.
2.  Importa la costante del nuovo patto.
3.  Aggiungila all'array `PACTS`.

```typescript
// ...
import { TheMyPact } from './definitions/TheMyPact';

export class PactFactory {
    // ...
    private static readonly PACTS: PactDefinition[] = [
        // ...
        TheMyPact
    ];
    // ...
}
```

## 3. Sistema degli Effects

Il sistema `Effects` fornisce blocchi riutilizzabili per le logiche più comuni.
Puoi trovarli tutti in `PactEffects.ts`.

Esempi comuni:
- `Effects.movement.canMoveThrough(moverFilter, obstacleFilter)`
- `Effects.state.counter(initialValue)`
- `Effects.rules.extraMoveOnCapture()`
- `Effects.ui.toast(title, desc, icon)`

## 4. Gestione dello Stato

Il nuovo sistema supporta lo stato tipizzato e serializzabile automaticamente.

```typescript
interface MyState {
    charges: number;
}

export const TheChargedPact = definePact<MyState, any>('charged_pact')
    .bonus('charge_up', {
        initialState: () => ({ charges: 0 }),
        onMove: (move, context) => {
            // context.state è tipizzato
            // context.updateState({ charges: context.state.charges + 1 });
        }
    })
    // ...
```

## 5. Abilità Attivabili (Active Abilities)

Puoi definire abilità che il giocatore può attivare manualmente.

```typescript
    .bonus('active_power', {
        activeAbility: {
            id: 'my_action',
            name: 'pact.ability.name',
            description: 'pact.ability.desc',
            icon: 'flash',
            cooldown: 3,
            targetType: 'square', // 'none', 'piece', 'square'
            execute: (context, params) => {
                // Logica di esecuzione
                return true; // Ritorna true se l'azione è validata
            }
        }
    })
```

## 6. Best Practices

- **DSL vs Custom Logic**: Usa gli `Effects` quando possibile. Se la logica è complessa, usa i `modifiers` o gli hook `onEvent` (`onMove`, `onCapture`, etc.).
- **Localizzazione**: Usa sempre chiavi di traduzione (`pact.toasts...`) invece di stringhe hardcoded.
- **PactUtils**: Consulta `PactUtils.ts` per funzioni helper (es. `notifyPactEffect`, `findPieces`, `isEdgeSquare`).
- **Test**: Ogni patto deve avere un file `.test.ts` dedicato che verifichi sia il bonus che il malus.
