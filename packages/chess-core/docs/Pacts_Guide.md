# Guida Completa alla Creazione di un Patto in PactChess

> **Versione:** 3.0 (Type-Safe State) · **Lingua:** Italiano (codice/identificatori in inglese)  
> **Pubblico:** Sviluppatori TypeScript con conoscenza base del dominio scacchistico

---

## Assunzioni sul Progetto

Prima di iniziare, le seguenti assunzioni sono state dedotte dal codice sorgente. Se qualcosa non corrisponde, adatta di conseguenza.

| Assunzione | File di riferimento |
|---|---|
| Il sistema usa un DSL builder basato su `definePact()` | `PactLogic.ts` |
| La registrazione avviene tramite `PactFactory.ts` add `PactRegistry` (Singleton) | `PactFactory.ts`, `PactRegistry.ts` |
| Gli effetti riutilizzabili sono raggruppati nel namespace `Effects.*` | `PactEffects.ts` + `effects/` |
| Il motore di gioco consulta i `RuleModifiers` di ogni `PactLogic` attivo | `RuleEngine` (dedotto) |
| Lo stato persistente per turno è serializzato in `game.pactState[key]` | `PactLogic.ts`, `getState()` |
| Il bilanciamento rank non è ancora codificato: i valori qui sono **proposta** | *(nessun file esistente)* |

---

## 1. Introduzione

### Cos'è un Patto?

Un **Patto** è un modificatore di regole asimmetrico che altera il comportamento del gioco per un singolo giocatore. Ogni Patto è composto da **due lati**:

- **Bonus** — un vantaggio: abilità extra, movimento potenziato, promozioni speciali, ecc.
- **Malus** — uno svantaggio: restrizioni di movimento, pezzi rimossi, catture limitate, ecc.

I due lati vengono assegnati ai giocatori separatamente (il bonus di un giocatore non è il malus dell'avversario dello stesso patto), creando partite con dinamiche di gioco asimmetriche.

### Terminologia

| Termine | Definizione |
|---|---|
| **Pact** | L'entità contenitore con un `id`, un `bonus` e un `malus` |
| **PactLogic** | La classe base astratta che implementa il comportamento di un lato del Patto |
| **bonus** | Il lato vantaggioso del Patto (assegnato a un giocatore) |
| **malus** | Il lato svantaggioso del Patto (assegnato all'altro giocatore) |
| **effect** | Un blocco di logica riutilizzabile (da `Effects.*`) incapsulato in `PactEffect` |
| **trigger** | L'evento di gioco che attiva la logica del Patto (`onMove`, `onCapture`, ecc.) |
| **scope / target** | A chi si applica il Patto: `'self'` (il portatore), `'enemy'` (l'avversario), `'global'` |
| **duration** | Quanto dura l'effetto: permanente, N turni, condizionale |
| **state** | Dati serializzabili persistenti per patto+giocatore, memorizzati in `game.pactState` |
| **RuleModifiers** | Interfaccia con hook che il `RuleEngine` chiama per alterare le regole base |
| **PactPriority** | Enum (`EARLY`, `NORMAL`, `LATE`) che definisce l'ordine di esecuzione nella pipeline |
| **PactRegistry** | Singleton che contiene tutte le `PactLogic` istanze attive |

---

## 2. Anatomia di un Patto (Schema Dati)

### 2.1 Schema TypeScript Completo

```typescript
// packages/chess-core/src/domain/pacts/PactLogic.ts (estratto semplificato)

/** Identifica il Patto come entità completa (bonus + malus). */
export interface PactDefinition {
    id: string;       // ID univoco del Patto, es. "hawk", "berserker"
    bonus: PactLogic; // Istanza PactLogic per il lato vantaggioso
    malus: PactLogic; // Istanza PactLogic per il lato svantaggioso
}

/** Opzioni per costruire un lato (bonus o malus) tramite il builder. */
export interface PactLogicOptions<TState = any, TSiblingState = any> {
    // --- Scope ---
    target?: 'self' | 'enemy' | 'global';   // Default: 'self'

    // --- Modificatori di Regola (hook statici/deterministici) ---
    modifiers?: RuleModifiers<TState, TSiblingState>;

    // --- Event Hooks (logica imperativa a runtime) ---
    onMove?:     (payload: Move,     ctx: PactContextWithState<TState, TSiblingState>) => void;
    onCapture?:  (payload: Move,     ctx: PactContextWithState<TState, TSiblingState>) => void;
    onPromotion?:(payload: { piece: Piece, type: PieceType, coord: Coordinate }, ctx: PactContextWithState<TState, TSiblingState>) => void;
    onTurnStart?:(payload: PieceColor, ctx: PactContextWithState<TState, TSiblingState>) => void;
    onTurnEnd?:  (payload: PieceColor, ctx: PactContextWithState<TState, TSiblingState>) => void;
    onCheckmate?:(payload: { winner: PieceColor }, ctx: PactContextWithState<TState, TSiblingState>) => void;

    // --- Effetti Riutilizzabili (dal namespace Effects.*) ---
    effects?: PactEffect<TState>[];

    // --- Stato Persistente ---
    initialState?: () => TState;  // Factory dell'initial state serializzabile

    // --- Abilità Attiva (opzionale) ---
    activeAbility?: ActiveAbilityConfig<TState>;

    // --- UI Counters (opzionale) ---
    getTurnCounters?: (ctx: PactContextWithState<TState, TSiblingState>) => TurnCounter[];
}
```

### 2.2 Esempio JSON/TS Commentato (Patto Immaginario: "Il Falco")

```typescript
// packages/chess-core/src/domain/pacts/definitions/TheHawk.ts

import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';

/**
 * Patto: The Hawk
 * 
 * BONUS "High Flyer":
 *   Gli alfieri possono saltare sopra i pezzi amici.
 *   → Modifica stateless: basta un RuleModifier.
 * 
 * MALUS "Distant Predator":
 *   Gli alfieri non possono catturare pezzi adiacenti.
 *   → Anch'esso stateless, usa un Effect predefinito.
 * 
 * Rank bonus: +2 | Rank malus: -2
 */
export const TheHawk = definePact<HawkBonusState, {}>('hawk')
    .bonus('high_flyer', {
        target: 'self',
        effects: [Effects.movement.canMoveThroughFriendlies('bishop')]
    })
    .malus('distant_predator', {
        target: 'self',
        modifiers: {
            canCapture: (params, context) => {
                const sharedState = context.getSiblingState();
                if (sharedState?.jumpedThisTurn) return true;
                // ...
                return true;
            }
        }
    })
    .build();
```

### 2.3 Campi Obbligatori per un Nuovo Patto

| Campo | Dove | Obbligatorio |
|---|---|---|
| `id` (pact) | `definePact('id')` | ✅ |
| `id` (bonus/malus) | `.bonus('id', ...)` | ✅ |
| `target` | `PactLogicOptions` | ❌ (default `'self'`) |
| Almeno un modifier/effect/hook | `PactLogicOptions` | ✅ (altrimenti il Patto è vuoto) |
| Entry in `PactFactory.PACTS` | `PactFactory.ts` | ✅ |
| Traduzione UI (IT + EN) | `i18n` files | ✅ per produzione |

---

## 3. Tipi di Effetti Supportati (Catalogo)

Gli effetti sono raggruppati nel namespace `Effects` in `PactEffects.ts`:

```typescript
export const Effects = {
    pawn:     PawnEffects,     // Pedoni
    movement: MovementEffects, // Movimento generale
    combat:   CombatEffects,   // Catture e combattimento
    rules:    RulesEffects,    // Regole globali (setup, turni)
    board:    BoardEffects,    // Manipolazioni scacchiera
    game:     GameEffects,     // Meccaniche di partita
    state:    StateEffects,    // Scrittura/lettura state
    ui:       UiEffects,       // Notifiche e counters visivi
};
```

### 3.1 Piece-Specific (Solo certi tipi di pezzo)

Modificano il comportamento di uno o più tipi di pezzo specifici.

```typescript
// Permette agli alfieri di saltare i pezzi amici
Effects.movement.canMoveThroughFriendlies('bishop')

// Limita il range massimo delle torri a 3 caselle
Effects.movement.maxRange(3)  // Nota: si applica a tutti i pezzi con range sliding

// Permette ai pedoni di catturare in avanti invece che in diagonale
Effects.pawn.canCaptureStraight()

// Disabilita la mossa doppia iniziale del pedone
Effects.pawn.disableDoubleMove()

// Fissa la promozione del pedone a un solo tipo
Effects.pawn.presents('knight')  // Il pedone può promuovere solo a cavallo
```

### 3.2 Global Ruleset (Cambia regole generali)

Influenzano meccaniche di gioco globali.

```typescript
// Rimuove N pezzi casuali all'inizio della partita
Effects.rules.removeRandomPiecesAtStart('knight', 1)

// Permette all'echolocation: i pezzi "vedono attraverso" gli ostacoli
Effects.movement.hasEcholocation(['rook', 'bishop'])

// Scambia il movimento tra due tipi di pezzo
Effects.movement.swapMovement('rook', 'bishop')
```

### 3.3 Action/Ability (Abilità attivabile)

Richiede che il giocatore attivi manualmente l'effetto, consumando (o meno) il turno.

```typescript
// Definita tramite activeAbility in PactLogicOptions:
activeAbility: {
    id: 'void_jump',
    name: 'ability.void_jump.name',
    description: 'ability.void_jump.desc',
    icon: 'zap',
    targetType: 'square',   // Richiede una casella di destinazione
    consumesTurn: true,
    execute: (context, params) => {
        // params.to = Coordinate target
        // Ritorna true se l'abilità ha avuto successo
        return true;
    }
}
```

### 3.4 Conditional/Stateful (Effetti con stato/condizioni)

Effetti che cambiano in base allo stato della partita o a eventi accaduti.

```typescript
// Esempio da TheBerserker: Frenzy si attiva dopo una cattura di pedone
// Lo stato traccia se la frenzy è attiva e quale pezzo è in frenzy.

interface BerserkerState {
    isFrenzyActive: boolean;
    frenzyPieceId: string | null;
}

// Nell'opzione modifiers:
modifiers: {
    onExecuteMove: (game, move, context) => {
        if (context.state.isFrenzyActive) {
            context.updateState({ isFrenzyActive: false, frenzyPieceId: null });
        } else if (move.capturedPiece?.type === 'pawn') {
            context.updateState({ isFrenzyActive: true, frenzyPieceId: move.piece.id });
        }
    },
    modifyNextTurn: (params, context) => {
        if (context.state.isFrenzyActive) return params.currentTurn; // turno extra
        return null;
    }
}
```

---

## 4. Trigger & Lifecycle

### 4.1 Tipi di Trigger

Il sistema distingue due categorie di hook:

#### Hook Event-Based (`onEvent`)

Chiamati da `game.emit(event, payload)`. Ogni `PactLogic` attiva riceve l'evento:

| Trigger | Quando | Payload |
|---|---|---|
| `'move'` → `onMove` | Dopo che una mossa è stata eseguita | `Move` |
| `'capture'` → `onCapture` | Quando un pezzo viene catturato | `Move` (con `capturedPiece` popolato) |
| `'promotion'` → `onPromotion` | Quando un pedone promuove | `{ piece, type, coord }` |
| `'turn_start'` → `onTurnStart` | All'inizio di ogni turno | `PieceColor` |
| `'turn_end'` → `onTurnEnd` | Alla fine di ogni turno | `PieceColor` |
| `'checkmate'` → `onCheckmate` | Quando viene dichiarato scacco matto | `{ winner }` |

#### Hook Rule-Based (`RuleModifiers`)

Chiamati dal `RuleEngine` in modo sincrono durante il calcolo delle mosse legali:

| Hook | Quando | Ritorna |
|---|---|---|
| `onModifyMoves` | Generazione mosse (Pipeline Pura) | `Move[]` (ritorna l'array modificato) |
| `canCapture` | Prima di ogni cattura | `boolean` |
| `canBeCaptured` | Quando un pezzo sta per essere catturato | `boolean` |
| `canMovePiece` | Prima che un pezzo si muova | `boolean` |
| `canMoveThroughFriendlies` | Quando un pezzo sliding incontra un amico | `boolean` |
| `modifyNextTurn` | Dopo l'esecuzione di una mossa | `PieceColor \| null` |
| `onExecuteMove` | Dopo che una mossa è stata eseguita nella logica | `void` |
| `getAllowedPromotionTypes` | Quando un pedone raggiunge l'ultima riga | `PieceType[]` |
| `getMaxRange` | Calcolo range pezzi sliding | `number` |
| `canCastle` | Prima dell'arrocco | `boolean` |
| `mustMoveKingInCheck` | Sotto scacco, può muovere altri pezzi? | `boolean` |
| `isImmuneToCheckmate` | Ha uno scacco matto speciale? | `boolean` |

### 4.2 Durata degli Effetti

| Durata | Come implementarla |
|---|---|
| **permanent** | Logica sempre attiva in `RuleModifiers` |
| **immediate** | Eseguita in `onCapture`/`onMove`/ecc. una sola volta |
| **N turni** | Stato con contatore: `state.turnsLeft`, decrementato in `onTurnEnd` |
| **per condizione** | Stato booleano/condizionale, es. `state.isFrenzyActive` |
| **whileCondition** | RuleModifier che controlla una condizione ogni volta |

### 4.3 Persistenza dello Stato

Lo stato è memorizzato in `game.pactState`:

```typescript
// Chiave: `{pactLogicId}_{playerColor}` es. "frenzy_white"
game.pactState["frenzy_white"] = { isFrenzyActive: true, frenzyPieceId: "p1" };
```

La classe `PactLogic` fornisce `getState()` e `setState()` come helper protetti. Nel builder (`GenericPact`), il context già espone `context.state` e `context.updateState()`. Grazie ai generics di `definePact<TBonus, TMalus>`, `context.state` è automaticamente tipizzato correttamente senza bisogno di cast.

> [!IMPORTANT]
> **Type Safety**: Non usare mai cast `as` per accedere allo stato. Se un effetto richiede una chiave specifica (es. `oncePerMatch`), assicurati che tale chiave sia dichiarata nell'interfaccia dello stato passata a `definePact`.

> ⚠️ **Importante**: Lo stato deve essere serializzabile in JSON (no funzioni, no classi). Questo è necessario per la sincronizzazione online e la replay delle partite.

---

## 5. API Per Implementare un Patto

### 5.1 Il Builder `definePact()`

Il modo **raccomandato** per creare un Patto è il builder fluente:

```typescript
import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';

export const MioPatto = definePact<BonusState, MalusState>('mio_patto')
    .bonus('mio_bonus_id', { /* PactLogicOptions<BonusState> */ })
    .malus('mio_malus_id', { /* PactLogicOptions<MalusState> */ })
    .build();
// Risultato: PactDefinition { id, bonus: GenericPact, malus: GenericPact }
```

### 5.2 Estendere `PactLogic` (Modalità Classe)

Per Patti molto complessi con logica condivisa tra metodi, puoi estendere direttamente la classe astratta:

```typescript
import { PactLogic, PactContextWithState, RuleModifiers } from '../PactLogic';

export class MyComplexBonus extends PactLogic<MyState> {
    id = 'my_complex_bonus';
    
    getInitialState(): MyState {
        return { count: 0 };
    }
    
    getRuleModifiers(): RuleModifiers {
        return {
            canCapture: (params, context) => {
                // context.state.count è disponibile qui
                return context.state.count < 3;
            }
        };
    }
    
    protected onCapture(payload, context: PactContextWithState<MyState>): void {
        context.updateState({ count: context.state.count + 1 });
    }
}
```

> 💡 **Suggerimento**: Usa il builder (`definePact`) quando la logica è semplice/media. Usa la classe quando hai bisogno di metodi helper privati o logica molto articolata.

### 5.3 Come il RuleEngine Integra i Patti (senza if/else)

Il `RuleEngine` raccoglie tutti i `RuleModifiers` dei Patti attivi e li applica tramite dispatching per ogni hook:

```typescript
// Pseudo-codice semplificato del RuleEngine
class RuleEngine {
    canCapture(params: CaptureContext): boolean {
        const activePacts = getActivePerks(params.game, params.attacker.color);
        for (const pactLogic of activePacts) {
            const ctx = pactLogic.createContextWithState({ ... });
            const modifiers = pactLogic.getRuleModifiers();
            if (modifiers.canCapture) {
                const result = modifiers.canCapture(params, ctx);
                if (result === false) return false; // Short-circuit
            }
        }
        return true;
    }
}
```

Ogni hook nei `RuleModifiers` è **opzionale** — il RuleEngine lo invoca solo se definito. 

> [!NOTE]
> **Pipeline & Priority (10/10 Architecture)**:
> - **Pipeline Immutabile**: I modifier che trasformano dati (come `onModifyMoves`) non lavorano più in-place. Ogni patto riceve l'array di mosse prodotto dal patto precedente e ne restituisce una nuova versione (Pattern `reduce`).
> - **Execution Priority**: Esiste un sistema di priorità (`PactPriority`). 
>   - `EARLY` (100): Per patti che aggiungono mosse.
>   - `NORMAL` (0): Default.
>   - `LATE` (-100): Per patti che filtrano o rimuovono mosse (assicura che vedano anche le mosse aggiunte da altri patti).
> - **Robustezza**: Se un patto crasha, la pipeline prosegue con l'input originale, evitando interruzioni di gioco.

---

## 6. Tutorial Step-by-Step: Implementare un Nuovo Patto

### Struttura File

```
packages/chess-core/src/domain/pacts/
├── definitions/
│   ├── TheHawk.ts          ← ogni patto in un file separato
│   ├── TheBerserker.ts
│   └── MioPatto.ts         ← il tuo nuovo file
├── effects/
│   ├── MovementEffects.ts
│   ├── PawnEffects.ts
│   └── ...
├── PactFactory.ts           ← registra qui il tuo Patto
├── PactLogic.ts             ← tipi e builder
├── PactRegistry.ts          ← singleton registry
└── PactEffects.ts           ← namespace Effects
```

---

### Step 1: Crea il File `pacts/definitions/MioPatto.ts`

```bash
# Windows PowerShell
New-Item h:\Progetti\chess-v2\packages\chess-core\src\domain\pacts\definitions\MioPatto.ts
```

### Step 2: Definisci Metadata — Name, Descrizione Interna, Tags

```typescript
// packages/chess-core/src/domain/pacts/definitions/MioPatto.ts

import { definePact } from '../PactLogic';
import { Effects }    from '../PactEffects';
import { PactUtils }  from '../PactUtils';

/**
 * Patto: The Wanderer (Il Vagabondo)
 * 
 * BONUS "Nomad" (rank: +2):
 *   I cavalieri possono muoversi anche come alfieri (un passo diagonale).
 * 
 * MALUS "Uprooted" (rank: -2):
 *   I cavalieri non possono muoversi se rimangono nella stessa colonna per 2 turni.
 * 
 * Tags: movement, knight
 */
```

### Step 3: Implementa `bonusEffect` e `malusEffect`

```typescript
// ... continua MioPatto.ts

export const MioPatto = definePact('wanderer')
    .bonus('nomad', {
        target: 'self',
        effects: [
            // I cavalieri si muovono anche di un passo diagonale
            Effects.movement.addSingleStepMoves('knight', [
                { dx:  1, dy:  1 },
                { dx:  1, dy: -1 },
                { dx: -1, dy:  1 },
                { dx: -1, dy: -1 },
            ])
        ]
    })
    .malus('uprooted', {
        target: 'self',
        initialState: () => ({
            // key = "knightId", value = colonna dove si trovava al turno precedente
            lastKnightColumns: {} as Record<string, number | null>,
            stuckTurns: {} as Record<string, number>,
        }),
        modifiers: {
            onModifyMoves: (currentMoves, { piece, from }, context) => {
                if (piece.type !== 'knight') return currentMoves;
                const state = context.state;
                const stuckFor = state.stuckTurns[piece.id] ?? 0;
                if (stuckFor >= 2) {
                    return []; // Blocca tutte le mosse restituendo un array vuoto
                }
                return currentMoves;
            },
        },
        onMove: (move, context) => {
            if (move.piece.type !== 'knight') return;
            const { state, updateState } = context;
            const id = move.piece.id;
            const prevCol = state.lastKnightColumns[id] ?? null;
            const currCol = move.to.x;

            const newStuck = (prevCol === currCol)
                ? (state.stuckTurns[id] ?? 0) + 1
                : 0;

            updateState({
                lastKnightColumns: { ...state.lastKnightColumns, [id]: currCol },
                stuckTurns:        { ...state.stuckTurns,        [id]: newStuck },
            });
        }
    })
    .build();
```

### Step 4: Registra il Patto nel `PactFactory`

```typescript
// packages/chess-core/src/domain/pacts/PactFactory.ts

import { MioPatto } from './definitions/MioPatto'; // ← aggiungi import

export class PactFactory {
    private static readonly PACTS: PactDefinition[] = [
        // ... tutti gli altri patti ...
        MioPatto, // ← aggiungi qui
    ];

    public static initialize() {
        const registry = PactRegistry.getInstance();
        for (const pactDef of PactFactory.PACTS) {
            registry.register(pactDef.bonus);
            registry.register(pactDef.malus);
        }
    }
}
```

### Step 5: Aggiorna i18n (IT/EN)

Aggiungi le chiavi di traduzione ai file di localizzazione. La convenzione di naming usata in `PactUtils.notifyPactEffect` è:

```json
// it.json (italiano)
{
  "pact": {
    "wanderer": {
      "name": "Il Vagabondo",
      "bonus": {
        "name": "Nomade",
        "description": "I tuoi cavalieri acquisiscono la capacità di muoversi di un passo diagonale."
      },
      "malus": {
        "name": "Sradicato",
        "description": "I cavalieri che rimangono nella stessa colonna per 2 turni consecutivi rimangono bloccati."
      },
      "toasts": {
        "nomad": {
          "title": "pact.wanderer.toasts.nomad.title",
          "desc":  "pact.wanderer.toasts.nomad.desc"
        }
      }
    }
  }
}
```

```json
// en.json (inglese)
{
  "pact": {
    "wanderer": {
      "name": "The Wanderer",
      "bonus": {
        "name": "Nomad",
        "description": "Your knights gain the ability to move one step diagonally."
      },
      "malus": {
        "name": "Uprooted",
        "description": "Knights that stay in the same column for 2 consecutive turns become immobilized."
      }
    }
  }
}
```

### Step 6: Aggiorna UI (se necessario)

Se il Patto ha:
- **Un'abilità attiva** → aggiungi l'icona nel pannello abilità e la logica di dispatching
- **Counters visivi** → usa `getTurnCounters` nel `PactLogicOptions` (già disponibile)
- **Icone personalizzate** → aggiungi l'asset ai file di immagini dell'app

```typescript
// Esempio di getTurnCounters per mostrare "turni bloccato"
getTurnCounters: (context) => {
    const { game, playerId } = context;
    const knights = PactUtils.findPieces(game, playerId, 'knight');
    return knights
        .filter(k => (context.state.stuckTurns[k.piece.id] ?? 0) > 0)
        .map(k => ({
            id: `stuck_${k.piece.id}`,
            label: 'wanderer_stuck',
            value: context.state.stuckTurns[k.piece.id],
            pactId: 'wanderer',
            type: 'counter' as const,
            maxValue: 2,
        }));
}
```

### Step 7: Test e Checklist

Vedi **Sezione 8** per i test completi.

**Checklist rapida:**
- [ ] File creato in `definitions/`
- [ ] `definePact().bonus().malus().build()` funziona senza errori TypeScript
- [ ] Aggiunto a `PactFactory.PACTS`
- [ ] Chiavi i18n aggiunte (IT + EN)
- [ ] Unit test per bonus (movimento atteso)
- [ ] Unit test per malus (restrizione attesa)
- [ ] Test manuale in partita (singolo player o online)

---

## 6A. Esempio Completo A — Patto Semplice: The Veteran

Modifica il movimento del pedone (promozione limitata a soli cavalieri).

```typescript
// packages/chess-core/src/domain/pacts/definitions/TheVeteranExample.ts
// NB: TheVeteran esiste già. Questo è a scopo didattico.

import { definePact } from '../PactLogic';
import { Effects }    from '../PactEffects';

/**
 * BONUS "Heavy Advance" (+2):
 *   I pedoni possono catturare in avanti (non solo in diagonale).
 * 
 * MALUS "Knight's Path" (-2):
 *   I pedoni possono promuovere solo a cavallo.
 */
export const TheVeteranExample = definePact('veteran_example')
    .bonus('heavy_advance', {
        target: 'self',
        effects: [Effects.pawn.canCaptureStraight()]
    })
    .malus('knights_path', {
        target: 'self',
        effects: [Effects.pawn.presents('knight')]
    })
    .build();
```

**Perché funziona:**
- `Effects.pawn.canCaptureStraight()` aggiunge il modifier `canCapture` che permette la cattura dritta.
- `Effects.pawn.presents('knight')` sovrascrive `getAllowedPromotionTypes` per restituire solo `['knight']`.
- Nessuno stato persistente necessario: entrambi gli effetti sono **stateless** e **deterministici**.

---

## 6B. Esempio Completo B — Patto Stateful/Condizionale: The Berserker

Effetto "Frenzy": catturare un pedone concede un turno extra con quel pezzo (no cattura).

```typescript
// packages/chess-core/src/domain/pacts/definitions/TheBerserker.ts

import { definePact } from '../PactLogic';
import { Effects }    from '../PactEffects';
import { PactUtils }  from '../PactUtils';

interface BerserkerState {
    isFrenzyActive: boolean;
    frenzyPieceId: string | null;
}

/**
 * BONUS "Frenzy" (+3):
 *   Catturare un pedone nemico concede un turno extra al pezzo catturante.
 *   Nel turno extra il pezzo non può catturare.
 * 
 * MALUS "Missing Knight" (-2):
 *   Inizio partita con un cavaliere in meno (rimosso casualmente).
 * 
 * Rank: bonus +3, malus -2 → bilanciamento asimmetrico: bonus leggermente superiore.
 */
export const TheBerserker = definePact<BerserkerState>('berserker')
    .bonus('frenzy', {
        target: 'self',
        initialState: () => ({ isFrenzyActive: false, frenzyPieceId: null }),

        modifiers: {
            // ① Dopo ogni mossa, controlla se è stata catturata una pedone
            onExecuteMove: (game, move, context) => {
                if (move.piece.color !== context.playerId) return;
                const state = context.state || {};

                if (state.isFrenzyActive) {
                    // Fine del turno extra: reset stato
                    context.updateState({ isFrenzyActive: false, frenzyPieceId: null });
                } else if (move.capturedPiece?.type === 'pawn') {
                    // Attiva frenzy per il prossimo turno
                    context.updateState({ isFrenzyActive: true, frenzyPieceId: move.piece.id });
                    // Notifica visiva nell'UI
                    PactUtils.notifyPactEffect(game, 'berserker', 'frenzy', 'bonus', 'flame');
                }
            },

            // ② Se frenzy attiva, il turno appartiene ancora al giocatore corrente
            modifyNextTurn: (params, context) => {
                if ((context.state || {}).isFrenzyActive) return params.currentTurn;
                return null;
            },

            // ③ Nel turno extra, solo il pezzo in frenzy può muoversi
            canMovePiece: (params, context) => {
                const piece = params.board.getSquare(params.from)?.piece;
                const state = context.state || {};
                if (state.isFrenzyActive && state.frenzyPieceId) {
                    return piece?.id === state.frenzyPieceId;
                }
                return true;
            },

            // ④ Nel turno extra, il pezzo non può catturare
            canCapture: (params, context) => {
                return !(context.state || {}).isFrenzyActive;
            }
        }
    })
    .malus('missing_knight', {
        target: 'self',
        // Effect predefinito: rimuove N pezzi casuali del tipo dato all'inizio
        effects: [Effects.rules.removeRandomPiecesAtStart('knight', 1)]
    })
    .build();
```

**Diagramma di Flusso Frenzy:**

```
Mossa eseguita (onExecuteMove)
          │
   ┌──────┴──────┐
   │  Frenzy     │  No → ha catturato un pedone?
   │  Attiva?    │        │
   │             │  No → nulla accade
   └──────┬──────┘
      Sì  │          Sì → isFrenzyActive = true
          │              frenzyPieceId = move.piece.id
          ▼
   Reset frenzy    ──────► modifyNextTurn → stesso giocatore
   isFrenzyActive = false  canMovePiece → solo il pezzo frenzy
   frenzyPieceId = null    canCapture → false
```

---

## 7. Ranking Rules (Bilanciamento)

> ⚠️ **Nota**: Il sistema di ranking non è ancora codificato in TypeScript. I valori qui sono una **proposta** di bilanciamento da documentare e implementare nel backend/metadata.

### 7.1 Valori Validi

| Tipo | Range | Significato |
|---|---|---|
| **Bonus rank** | `+1` → `+5` | Quanto è forte il vantaggio |
| **Malus rank** | `-1` → `-5` | Quanto è pesante lo svantaggio |
| **Zero** | ❌ vietato | Né bonus né malus: invalido |

### 7.2 Regola di Abbinamento

Dato un **bonus rank = k**, il **malus rank** deve rientrare nel range **`[-(k-1) .. -(k+1)]`** (bilanciamento ±1):

| Bonus Rank | Malus Rank Ammissibili |
|---|---|
| `+1` | `-1`, `-2` |
| `+2` | `-1`, `-2`, `-3` |
| `+3` | `-2`, `-3`, `-4` |
| `+4` | `-3`, `-4`, `-5` |
| `+5` | `-4`, `-5` |

**Perché ±1?** Un Patto perfettamente bilanciato (k, -k) è ideale, ma una leggera asimmetria crea Patti "offensivi" (bonus > -malus) e "difensivi" (bonus < -malus), aggiungendo varietà strategica.

### 7.3 Esempi di Bilanciamento

```
The Hawk:
  Bonus "High Flyer" (+2): gli alfieri saltano i pezzi amici
    → vantaggio moderato: +2
  Malus "Distant Predator" (-2): gli alfieri non catturano adiacenti
    → svantaggio moderato: -2
  → Patto simmetrico, bilanciato

The Berserker:
  Bonus "Frenzy" (+3): turno extra dopo cattura pedone
    → vantaggio forte: +3
  Malus "Missing Knight" (-2): inizio con un cavallo in meno
    → svantaggio moderato: -2
  → Patto offensivo, usa una meccanica complessa per compensare

The Heir:
  Bonus "Bloodline" (+4): regina rimpiazzata automaticamente
    → vantaggio molto forte: +4
  Malus "Young Queen" (-3): la regina iniziale non può catturare (tranne il Re)
    → svantaggio pesante: -3
  → Patto offensivo con compromesso sulla regina
```

### 7.4 Come Scegliere un Bilanciamento "Giusto"

1. **Valuta il frequency impact**: quanto spesso si attiva l'effetto? (ogni turno = alto, su condizione rara = basso)
2. **Valuta il game-changing potential**: l'effetto modifica una meccanica core (es. scacco)? Alto rank assoluto.
3. **Considera il counterplay**: l'avversario può giocare per contrastare l'effetto?
4. **Testa con playtesters**: rank finali devono emergere dal playtesting.

### 7.5 Rappresentazione in Codice (Proposta)

```typescript
// Aggiungere a PactDefinition (proposta futura):
export interface PactDefinition {
    id: string;
    bonus: PactLogic;
    malus: PactLogic;
    // Metadati di bilanciamento (da aggiungere):
    bonusRank: 1 | 2 | 3 | 4 | 5;          // Obbligatorio, > 0
    malusRank: -1 | -2 | -3 | -4 | -5;     // Obbligatorio, < 0
    tags?: string[];                          // es. ['movement', 'pawn']
}
```

---

## 8. Testing

### 8.1 Struttura Unit Test (Pattern Consigliato)

```typescript
// packages/chess-core/src/domain/pacts/definitions/MioPatto.test.ts

import { MioPatto } from './MioPatto';
import { PactRegistry } from '../PactRegistry';
import { buildTestGame, buildTestBoard } from '../../test-utils/GameBuilder'; // helper

describe('MioPatto', () => {
    describe('Bonus: nomad', () => {
        it('deve permettere al cavallo di muoversi in diagonale di 1 passo', () => {
            const game = buildTestGame({
                perks: { white: ['nomad'] }
            });
            const board = buildTestBoard({
                white: { knight: ['e4'] }
            });

            // Genera le mosse per il cavallo in e4
            const moves = game.getLegalMoves(board, 'e4');

            // Normalizza in notazione algebrica
            const targets = moves.map(m => m.to.toAlgebraic());

            // Il cavallo "nomad" deve potersi muovere nelle caselle diagonali adiacenti
            expect(targets).toContain('d3');
            expect(targets).toContain('f3');
            expect(targets).toContain('d5');
            expect(targets).toContain('f5');
        });
    });

    describe('Malus: uprooted', () => {
        it('deve bloccare il cavallo che è rimasto nella stessa colonna per 2 turni', () => {
            const game = buildTestGame({
                perks: { black: ['uprooted'] }
            });
            // Simula lo stato di "bloccato da 2 turni"
            game.pactState['uprooted_black'] = {
                lastKnightColumns: { 'knight-1': 4 },
                stuckTurns: { 'knight-1': 2 }
            };
            const board = buildTestBoard({
                black: { knight: ['e5'] } // colonna 4 (0-indexed)
            });

            const moves = game.getLegalMoves(board, 'e5');
            expect(moves).toHaveLength(0); // Nessuna mossa disponibile
        });
    });
});
```

### 8.2 Test degli RuleModifiers

```typescript
it('canCapture deve restituire false durante frenzy attiva', () => {
    const bonusLogic = TheBerserker.bonus;
    const ctx = bonusLogic.createContextWithState({
        game: buildMockGame({ pactState: {
            'frenzy_white': { isFrenzyActive: true, frenzyPieceId: 'p1' }
        }}),
        playerId: 'white',
        pactId: 'berserker'
    });

    const modifiers = bonusLogic.getRuleModifiers();
    const result = modifiers.canCapture!({
        game: ctx.game,
        board: buildTestBoard({}),
        attacker: buildPiece('white', 'queen'),
        victim: buildPiece('black', 'rook'),
        from: coord('d4'),
        to:   coord('d8'),
    }, ctx);

    expect(result).toBe(false);
});
```

### 8.3 Test degli Event Hook

```typescript
it('deve attivare frenzy dopo cattura di un pedone', () => {
    const game = buildMockGame({});
    const bonusLogic = TheBerserker.bonus;

    bonusLogic.onEvent('capture', {
        attacker: buildPiece('white', 'queen', 'q1'),
        victim:   buildPiece('black', 'pawn'),
        from: coord('d4'),
        to:   coord('e5'),
    }, { game, playerId: 'white', pactId: 'berserker' });

    // Lo stato deve essere aggiornato
    expect(game.pactState['frenzy_white']).toMatchObject({
        isFrenzyActive: true,
        frenzyPieceId: 'q1'
    });
});
```

### 8.4 Manual Test Checklist in Gioco

Prima di considerare un Patto pronto per la produzione, esegui i seguenti test manuali:

```
□ Avvia una partita con il Bonus attivato
  □ Il vantaggio funziona come atteso
  □ Nessun errore/crash visivo
  □ La notifica UI (toast) appare correttamente

□ Avvia una partita con il Malus attivato
  □ La restrizione funziona come atteso
  □ Il giocatore non può aggirare il malus

□ Test online (se applicabile)
  □ Lo stato è sincronizzato tra client e server
  □ La partita è ripristinabile da replay

□ Test di edge case
  □ Il bonus non rompe lo scacco matto
  □ Il malus non rende impossibile il gioco (no deadlock)
  □ Performance: la generazione mosse dura < 5ms per turno (usa DevTools profiler)
```

---

## 9. Common Pitfalls

### ❌ Effetti che Rompono Scacco/Matto

Se il tuo `canBeCaptured` o `isImmuneToCheckmate` protegge il Re stesso, potresti rendere impossibile il matto.

```typescript
// ⛔ SBAGLIATO: protegge tutti i pezzi incluso il Re
canBeCaptured: (params) => false

// ✅ CORRETTO: esclude il Re
canBeCaptured: (params, context) => {
    if (params.victim.type === 'king') return true; // Il Re può sempre essere catturato
    return checkMyCondition(params);
}
```

### ❌ Effetti che Creano Loop Infiniti

`modifyNextTurn` che ritorna **sempre** `currentTurn` crea un loop infinito di turni.

```typescript
// ⛔ SBAGLIATO: turno infinito
modifyNextTurn: (params) => params.currentTurn

// ✅ CORRETTO: usa uno stato con flag che si consuma
modifyNextTurn: (params, context) => {
    if (context.state.extraTurnGranted) return params.currentTurn;
    return null;
}
// E nel hook onExecuteMove, resetta context.updateState({ extraTurnGranted: false })
```

### ❌ Mutazione In-Place Diretta (Obsoleto)

Con la nuova architettura 10/10, non devi tentare di modificare l'array `moves` tramite `.push` o `.splice` se vuoi che la pipeline funzioni correttamente.

```typescript
// ⛔ SBAGLIATO (Stile vecchio/rischioso):
onModifyMoves: (moves, params) => {
    moves.push(newMove); 
    // Dimenticare il return o sperare nella mutazione può causare bug
}

// ✅ CORRETTO:
onModifyMoves: (currentMoves, params) => {
    return [...currentMoves, newMove]; // Ritorna sempre un NUOVO array
}
```

### ❌ Calcoli Pesanti per Ogni Hook

`onModifyMoves` viene chiamato **per ogni pezzo, ad ogni turno**. Evita ricerche O(n²) qui.

```typescript
// ⛔ SBAGLIATO: ricerca su tutta la scacchiera per ogni pezzo
onModifyMoves: (currentMoves, { board }) => {
    const allPieces = board.getAllPieces(); // O(64)
    // ...
    return currentMoves;
}
```

### ❌ Non-Determinismo

Gli effetti devono essere **deterministici**: stesso input → stesso output. Non usare `Math.random()` dentro `RuleModifiers`.

```typescript
// ⛔ SBAGLIATO: canCapture non-deterministico
canCapture: () => Math.random() > 0.5

// ✅ CORRETTO: usa Math.random() solo negli event hook (onCapture, onMove, ecc.)
// che non influenzano la validità delle mosse ma solo gli effetti applicati
```

### ❌ Stato Non Inizializzato

Se non definisci `initialState`, `context.state` sarà `null`. Usa sempre un default.

```typescript
// ⛔ SBAGLIATO:
modifiers: {
    canCapture: (params, context) => context.state.count < 3 // TypeError se state è null
}

// ✅ CORRETTO:
initialState: () => ({ count: 0 }),
modifiers: {
    canCapture: (params, context) => (context.state?.count ?? 0) < 3
}
```

---

## 10. Template Pronta-Copia

### 10.1 Template Patto TypeScript

Salva come `packages/chess-core/src/domain/pacts/definitions/TheTemplate.ts`:

```typescript
// packages/chess-core/src/domain/pacts/definitions/TheTemplate.ts

import { definePact } from '../PactLogic';
import { Effects }    from '../PactEffects';
import { PactUtils }  from '../PactUtils';

// TODO: Definisci l'interfaccia dello stato se necessario
// Rimuovi questo blocco se il Patto è stateless.
interface TemplateBonusState {
    // TODO: aggiungi campi serializzabili
    // Esempio: turnsActive: number;
}

interface TemplateMalusState {
    // TODO: aggiungi campi serializzabili
}

/**
 * Patto: The Template
 *
 * BONUS "{bonus_name}" (rank: TODO +1..+5):
 *   TODO: descrizione del vantaggio
 *
 * MALUS "{malus_name}" (rank: TODO -1..-5):
 *   TODO: descrizione dello svantaggio
 *
 * Tags: TODO (es. movement, pawn, knight, global)
 */
export const TheTemplate = definePact<TemplateBonusState, TemplateMalusState>('template')
    .bonus('template_bonus', {
        target: 'self', // TODO: 'self' | 'enemy' | 'global'

        // TODO: rimuovi le sezioni non necessarie

        // -- Stato iniziale (rimuovi se stateless) --
        initialState: () => ({
            // TODO
        }),

        // -- Effetti predefiniti dal catalogo --
        effects: [
            // TODO: es. Effects.movement.maxRange(3)
            // TODO: es. Effects.pawn.canCaptureStraight()
        ],

        // -- Modificatori di Regola personalizzati --
        modifiers: {
            // Riceve le mosse correnti e deve restituire l'array modificato
            onModifyMoves: (currentMoves, params, context) => { 
                // return [...currentMoves, ...newMoves];
                return currentMoves; 
            },
            canCapture: (params, context) => true,
        },

        // -- Event Hooks --
        // onMove:     (move, context) => { ... },
        // onCapture:  (payload, context) => { ... },
        // onTurnStart:(context) => { ... },
        // onTurnEnd:  (context) => { ... },

        // -- Abilità Attiva (rimuovi se non necessario) --
        // activeAbility: {
        //     id: 'template_ability',
        //     name: 'ability.template.name',
        //     description: 'ability.template.desc',
        //     icon: 'zap',
        //     targetType: 'square',
        //     consumesTurn: true,
        //     execute: (context, params) => {
        //         // TODO
        //         return true;
        //     }
        // },

        // -- Counters UI (rimuovi se non necessario) --
        // getTurnCounters: (context) => [],
    })
    .malus('template_malus', {
        target: 'self', // TODO

        initialState: () => ({
            // TODO
        }),

        effects: [
            // TODO
        ],

        modifiers: {
            // TODO
        },
    })
    .build();
```

### 10.2 Template Unit Test

Salva come `packages/chess-core/src/domain/pacts/definitions/TheTemplate.test.ts`:

```typescript
// packages/chess-core/src/domain/pacts/definitions/TheTemplate.test.ts

import { TheTemplate } from './TheTemplate';
import { PactRegistry } from '../PactRegistry';

// TODO: importa i tuoi test helpers
// import { buildTestGame, buildTestBoard, buildMockGame, coord, buildPiece } from '../../test-utils/GameBuilder';

describe('TheTemplate', () => {

    describe('Pact Structure', () => {
        it('deve avere id, bonus e malus definiti', () => {
            expect(TheTemplate.id).toBe('template');
            expect(TheTemplate.bonus).toBeDefined();
            expect(TheTemplate.malus).toBeDefined();
            expect(TheTemplate.bonus.id).toBe('template_bonus');
            expect(TheTemplate.malus.id).toBe('template_malus');
        });
    });

    describe('Bonus: template_bonus', () => {

        it('TODO: descrivi il comportamento atteso', () => {
            // ARRANGE
            // const game = buildTestGame({ perks: { white: ['template_bonus'] } });
            // const board = buildTestBoard({ white: { /* ... */ } });

            // ACT
            // const moves = game.getLegalMoves(board, 'e4');

            // ASSERT
            // expect(moves.map(m => m.to.toAlgebraic())).toContain('...');
            expect(true).toBe(true); // TODO: sostituisci con asserzione reale
        });

    });

    describe('Malus: template_malus', () => {

        it('TODO: descrivi la restrizione attesa', () => {
            // ARRANGE
            // const game = buildTestGame({ perks: { black: ['template_malus'] } });
            // const board = buildTestBoard({ black: { /* ... */ } });

            // ACT
            // const moves = game.getLegalMoves(board, '...');

            // ASSERT
            // expect(moves).toHaveLength(0);
            expect(true).toBe(true); // TODO: sostituisci con asserzione reale
        });

    });

    describe('Stateful behavior (se applicabile)', () => {

        it('TODO: testa transizioni di stato', () => {
            // ARRANGE: state iniziale
            // ACT: triggera un evento
            // ASSERT: verifica lo stato successivo in game.pactState
            expect(true).toBe(true); // TODO
        });

    });

});
```

### 10.3 Template Entry in PactFactory

```typescript
// Da aggiungere in packages/chess-core/src/domain/pacts/PactFactory.ts

// 1. Import (in cima al file, in ordine alfabetico):
import { TheTemplate } from './definitions/TheTemplate';

// 2. Array PACTS (dentro PactFactory class):
private static readonly PACTS: PactDefinition[] = [
    // ... patti esistenti ...
    TheTemplate, // ← aggiungi qui
];
```

---

## Appendice: Mappa delle Interfacce Chiave

```
PactDefinition
├── id: string
├── bonus: PactLogic<TBonus>
│   ├── id: string
│   ├── target: 'self'|'enemy'|'global'
│   ├── getInitialState() → T | null
│   ├── getRuleModifiers() → RuleModifiers
│   ├── onEvent(event, payload, context) → void
│   ├── createContextWithState(ctx) → PactContextWithState<T>
│   └── activeAbility?: ActiveAbilityConfig<T>
└── malus: PactLogic<TMalus>
    └── (stessa struttura di bonus)

PactContextWithState<T>
├── game: IChessGame
├── playerId: PieceColor
├── pactId: string
├── state: T
└── updateState(Partial<T> | (prev: T) => T) → void

RuleModifiers (hook facoltativi)
├── onModifyMoves(currentMoves, params, ctx) → Move[] (Pipeline Pura)
├── canCapture(params, ctx) → boolean
├── canBeCaptured(params, ctx) → boolean
├── canMovePiece(params, ctx) → boolean
├── modifyNextTurn(params, ctx) → PieceColor | null
├── onExecuteMove(game, move, ctx) → void
├── getAllowedPromotionTypes(piece, ctx) → PieceType[]
├── getMaxRange(piece, ctx) → number
├── canCastle(piece, ctx) → boolean
├── mustMoveKingInCheck(color, ctx) → boolean
└── isImmuneToCheckmate(game, ctx) → boolean
```

---

*Documento generato il 06/03/2026 — PactChess v2*
