# Guida alla Creazione di Patti in Chess V2

Questa guida spiega come creare nuovi patti utilizzando il DSL `definePact`, il sistema degli `Effects` e le funzionalità avanzate come lo stato tipizzato e le abilità attive, seguendo i nuovi standard di refactoring (Parameter Objects e Mandatory Context).

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
            // NOTA: Il context è sempre il secondo argomento
            getMaxRange: (piece, context) => {
                return piece.type === 'pawn' ? 2 : undefined;
            },
            // NOTA: I modificatori complessi usano Parameter Objects
            onGetPseudoMoves: (params, context) => {
                const { piece, moves, from } = params;
                // Logica personalizzata...
            }
        }
    })
    .malus('my_malus', {
        // Hook specifici per eventi (preferiti rispetto al generico onEvent)
        onCapture: (payload, context) => {
            // payload è un CaptureContext { attacker, victim, from, to }
            const { attacker, victim } = payload;
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

## 3. Sistema degli Parameter Objects

Tutte le funzioni di manipolazione delle regole (modifiers) e gli hook degli eventi sono stati standardizzati per ricevere oggetti descrittivi invece di lunghe liste di argomenti posizionali.

### Modificatori comuni:
- `onGetPseudoMoves(params: MoveGeneratorContext, context: PactContextWithState)`
- `canCapture(params: CaptureContext, context: PactContextWithState)`
- `canMovePiece(params: MoveContext, context: PactContextWithState)`
- `modifyNextTurn(params: TurnModifierContext, context: PactContextWithState)`

Il `context` fornisce sempre l'accesso a:
- `game`: L'istanza corrente del ChessGame.
- `playerId`: L'owner del patto ('white' | 'black').
- `state`: Lo stato persistente del patto.
- `updateState`: Funzione per aggiornare lo stato.

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
            const currentCharges = context.state.charges;
            context.updateState({ charges: currentCharges + 1 });
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

- **Context Everywhere**: Non accedere mai a variabili globali o stati di gioco fuori dal `context` fornito. Questo garantisce che il patto funzioni correttamente sia in locale che online.
- **Parameter Objects**: Non usare mai argomenti posizionali. Se devi aggiungere dati a un hook, aggiungili all'interfaccia corrispondente in `PactLogic.ts`.
- **Target Filtering**: Il `RuleEngine` filtra automaticamente l'esecuzione dei patti in base al `playerId`, a meno che non si specifichi un `target` (es. 'opponent') nella definizione.
- **Localizzazione**: Usa sempre chiavi di traduzione (`pact.toasts...`) invece di stringhe hardcoded.
- **Test**: Ogni patto deve avere un file `.test.ts`. Assicurati di passare un oggetto `context` completo (usando `any` se necessario ma includendo `state` e `updateState`) nelle chiamate ai modifiers nei test.
