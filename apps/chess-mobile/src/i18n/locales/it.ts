import { Translations } from './en';

export const it: Translations = {
    common: {
        ok: 'OK',
        cancel: 'Annulla',
        close: 'Chiudi',
        back: 'Indietro',
        next: 'Avanti',
        save: 'Salva',
        loading: 'Caricamento...',
        copied: 'Copiato!',
        white: 'Bianco',
        black: 'Nero',
        or: 'O',
        backToMenu: 'Torna al Menu',
        copy: "Copia",
        home: 'Home',
        appName: 'Scacchi a Patti',
    },
    home: {
        playOnline: 'Gioca Online',
        playLocal: 'Gioca in Locale',
        joinMatch: 'Unisciti alla Partita',
        createMatch: 'Crea Partita',
        settings: 'Impostazioni',
        localGame: 'Partita Locale',
        localGameDesc: 'Gioca contro un amico sullo stesso dispositivo',
        onlineMatch: 'Partita Online',
        onlineMatchDesc: 'Sfida giocatori da tutto il mondo',
        subtitle: 'Domina il gioco con IA avanzata e gioco online',
        displayName: 'NOME VISUALIZZATO (OPZIONALE)',
        enterUsername: 'Inserisci il tuo nome utente...',
        poweredBy: 'Basato su un motore scacchistico avanzato',
    },
    settings: {
        title: 'Impostazioni',
        language: 'Lingua',
        theme: 'Tema',
        themeLight: 'Chiaro',
        themeDark: 'Scuro',
        themeSystem: 'Di Sistema',
        sound: 'Suoni',
        soundOn: 'Attivi',
        soundOff: 'Disattivati',
        rotatePieces: 'Ruota pezzi (Nero)',
        gameplay: 'Gioco',
        close: 'Chiudi',
    },
    createMatch: {
        title: 'Crea Partita',
        variantPreset: 'Preset Variante',
        startGame: 'Inizia Partita',
        shareCode: 'Condividi Codice',
        createDescription: "Crea una partita online e condividi il codice con il tuo avversario."
    },
    joinMatch: {
        title: 'Unisciti alla Partita',
        inputPlaceholder: 'Inserisci Codice Partita',
        join: 'Entra',
        invalidCode: 'Codice non valido',
        description: "Descrizione",
        enterCode: "Codice d'accesso"
    },
    lobby: {
        waitingForOpponent: 'In attesa dell\'avversario...',
        copyInvite: 'Copia Link Invito',
        copied: 'Copiato negli appunti',
    },
    matchConfig: {
        title: 'Configura Partita',
        activePactsMax: {
            label: 'Numero Massimo Patti Attivi',
        },
        pactChoicesAtStart: {
            label: 'Patti Iniziali Disponibili',
            auto: 'Assegnazione automatica dei patti.',
            manual: 'Scegli i tuoi patti a inizio partita.',
        },
        summary: {
            auto: 'Inizierai con {count} patti assegnati casualmente.',
            choice: 'Sceglierai tra {choices} patti fino a un massimo di {max} attivi.',
        },
        help: {
            title: 'Come funzionano i Patti?',
            desc: 'Ogni patto include un Bonus (potenziamento) e un Malus (penalità). Scegli saggiamente!',
        },
        enableTurnRotate90: {
            label: 'Abilita Rotazione Scacchiera',
            desc: 'I giocatori possono spendere un turno per ruotare la scacchiera di 90 gradi.',
        }
    },
    cta: {
        startLocal: 'Inizia Partita Locale',
        createRoom: 'Crea Stanza Online',
    },
    game: {
        yourTurn: 'Tocca a te',
        opponentTurn: "Turno di {player}",
        rotateBoard: 'Ruota Scacchiera',
        resign: 'Abbandona',
        resigned: 'Abbandonato',
        wonByResignation: 'ha vinto per abbandono',
        resignation: 'Resa',
        offerDraw: 'Offri Patta',
        drawAccepted: 'Patta Accettata',
        check: 'Scacco',
        checkmate: 'Scacco Matto',
        stalemate: 'Stallo',
        moves: 'Mosse',
        moves_one: '1 Mossa',
        moves_other: '{count} Mosse',
        turnLabel: 'TURNO',
        activePacts: 'PATTI ATTIVI',
        sharedCounters: 'INDICATORI GLOBALI',
        moveHistory: 'Cronologia Mosse',
        noMoves: 'Nessuna mossa giocata',

        rotate: 'Ruota',
        newGame: 'Nuova Partita',
        localGame: 'Partita Locale',
        onlineChess: 'PactChess Online',
        serverConnected: 'Server Connesso',
        connecting: 'Connessione...',
        createMatchDesc: 'Crea una Nuova Partita',
        joinMatchDesc: 'Unisciti a Partita Esistente',
        codePlaceholder: 'Codice',
        join: 'Unisciti',
        waiting: 'In attesa...',
        you: '(TU)',
        me: 'Io',
        matchStatus: 'STATO PARTITA',
        turnStatus: "TURNO DEL {color}",
        code: 'CODICE: ',
        codeCopied: 'Codice Copiato',
        codeCopiedDesc: 'Codice partita copiato negli appunti!',
        waitingForOpponent: 'In attesa dell\'avversario...',
        perkSelectionDelay: 'La selezione dei vantaggi inizierà quando entrambi i giocatori saranno connessi.',
        cancelWait: 'Annulla Attesa',
        choosePromotion: 'Scegli Pezzo per Promozione',
        selectPromotion: 'Seleziona Promozione',
        queen: 'Regina',
        rook: 'Torre',
        bishop: 'Alfiere',
        knight: 'Cavallo',
        onlineMatch: 'Partita Online',
        playOnlineDescription: 'Sfida giocatori da tutto il mondo',
        leaveMatch: 'Lascia Partita',
        yourColor: 'Il Tuo Colore',
        yourPacts: 'I Tuoi Patti',
        opponentPacts: 'Patti dell\'Avversario',
        waitingForWhite: 'In attesa del Bianco...',
        waitingForBlack: 'In attesa del Nero...',
        stalemateMessage: 'La partita è terminata in stallo. Nessun vincitore.',
        winnerMessage: '{winner} vince per Scacco Matto!',
        gameOver: 'Partita Terminata',
        draw: 'Patta',
        rematch: 'Rivincita',
        playAgain: 'Gioca Ancora',
        backHome: 'Torna alla Home',
        piecesLost: 'Pezzi Persi',
        piecesCaptured: 'Pezzi Catturati',
    },
    pact: {
        title: 'Forgia il tuo Patto',
        subtitle: 'Profeta {color}, sacrifica il controllo per un potere proibito.',
        ascension: 'ASCENSIONE',
        sacrifice: 'SACRIFICIO',
        embrace: 'SELEZIONA',
        activePacts: 'Patti Attivi',
        spectralActions: 'Azioni Spettrali',
        selectTargets: 'Seleziona Bersagli',
        abilityActivated: 'Abilità attivata!',
        noMoves: 'Nessuna mossa ancora',
        activePact: 'Patto Attivo',
        queen_initial: 'Immunità politica della regina',
        queen_successor: 'Successore (Attiva)',
        bonusPrefix: 'BONUS: {name}',
        malusPrefix: 'MALUS: {name}',
        searchPlaceholder: 'Cerca un patto...',
        gotIt: 'Ho Capito',
        Active: 'Attivo',
        Protected: 'Protetto',
        unstable_identity_progress: "Turni senza cattura",
        reloading: "Ricarica",
        volatile_reagents_cooldown: "Raffreddamento",
        stunned_label: "Pezzo Stordito",
        pickpocket_stun_label: "Nemici Storditi",
        snipe_ready: "Snipe Pronto",
        orientation_label: "Bussola",
        north: "NORD",
        south: "SUD",
        east: "EST",
        west: "OVEST",
        claws_ready: "Artigli Pronti",
        bayonets_ready: "Baionette Pronte",
        shadow_protected: "Protetto dall'Ombra",
        capture_required: "Cattura Richiesta",
        queen_rank: "Rango Regina",
        king_moves_streak: "Mosse del Re",
        queen_crossed: "Regina Oltre Metà",
        queen_protected: "Regina Protetta",
        mimicry_active_mimics: "Mimiche Attive",
        movement_swapped: "Movimento Scambiato",
        toasts: {
            swarm: {
                hydra: {
                    title: "Rinascita dell'Idra",
                    desc: "Un nuovo pedone è germogliato dal sacrificio!",
                },
                death: {
                    title: "Regina dell'Alveare Caduta",
                    desc: "La colonia non può sopravvivere senza la sua regina!",
                },
            },
            illusionist: {
                displace: {
                    title: 'Spostamento Illusorio',
                    desc: 'Il pezzo è svanito e riapparso nelle vicinanze!',
                },
                vanished_illusion: {
                    title: 'Illusione Svanita',
                    desc: 'Un pedone era solo un\'illusione ed è svanito!',
                }
            },
            spectre: {
                possession: {
                    title: "Possesso del Pedone",
                    desc: "Un pedone alleato è stato consumato dalla presenza spettrale!",
                },
            },
            sniper: {
                reload: {
                    title: "Ricarica in corso",
                    desc: "La tua Torre deve ricaricare e non potrà muoversi nel prossimo turno!",
                },
            },
            necromancer: {
                reclaimer: {
                    title: "Rianimazione",
                    desc: "Un alleato caduto è stato riportato in vita!",
                },
                ascension_cost: {
                    title: "Costo dell'Ascensione",
                    desc: "Un prezzo più alto è stato pagato per la promozione. L'avversario ottiene un turno extra!",
                },
            },
            heavy_cavalry: {
                trample: {
                    title: "Travolgimento!",
                    desc: "Un pedone nemico è stato schiacciato sotto la carica del tuo Cavaliere!",
                },
            },
            changeling: {
                mimicry: {
                    title: 'Mimica!',
                    desc: 'Il tuo pedone ha assunto il movimento della vittima!',
                },
                demotion: {
                    title: "Identità Instabile",
                    desc: "Un pezzo ha perso la sua forma ed è diventato un pedone!",
                },
            },
            berserker: {
                frenzy: {
                    title: "Cacciatore di Pedoni!",
                    desc: "Un pedone nemico è stato frantumato! Il Berserker imperversa — muovi di nuovo con questo pezzo.",
                },
            },
            alchemist: {
                stun: {
                    title: "Reazione Volatile",
                    desc: "Il tuo pezzo è instabile, emette fumi e non può muoversi nel prossimo turno!",
                },
            },
            thief: {
                pickpocket: {
                    title: 'Borseggio!',
                    desc: 'Un pedone vicino ha stordito il pezzo nemico!',
                },
            },
            timekeeper: {
                time_stop: {
                    title: 'Time Stop!',
                    desc: 'Hai fermato il tempo e ottenuto un turno extra!',
                },
                paradox: {
                    title: 'Paradosso!',
                    desc: 'La linea temporale si corregge! 3 pedoni amici sono stati cancellati dall\'esistenza.',
                },
            },
            phoenix: {
                rebirth: {
                    title: 'Rinascita!',
                    desc: 'Un fedele pedone è asceso per prendere il posto della Regina caduta!',
                },
            },
            void_jumper: {
                sacrifice: {
                    title: 'Sacrificio Rituale',
                    desc: 'Il teletrasporto ha richiesto una forza vitale. Il tuo pezzo più avanzato è stato sacrificato!',
                },
            },
            heir: {
                bloodline: {
                    title: 'Linea di Sangue!',
                    desc: 'La Regina è caduta, ma la dinastia continua! Un pezzo minore ha preso il comando.',
                },
                young_queen: {
                    title: 'Regina Giovane!',
                    desc: 'La Regina è troppo giovane per catturare. Deve aspettare il suo momento.',
                },
            },
            vampire: {
                life_thirst: {
                    title: 'Sete di Sangue!',
                    desc: 'La caduta della Regina ha risvegliato un vecchio alleato!',
                },
            },
            titan: {
                earthquake: {
                    title: 'Terremoto!',
                    desc: 'Il potere della tua Regina spinge via i pedoni adiacenti!',
                },
            },
            oracle: {
                punishment: {
                    title: 'Destino Ineluttabile',
                    desc: 'Hai ignorato un\'opportunità di cattura e il destino ha reclamato il tuo pezzo!',
                },
            },
            diplomat: {
                immunity_lost: {
                    title: 'Immunità Persa',
                    desc: 'La Regina ha effettuato una cattura e ha perso l\'immunità diplomatica!',
                },
                sabotage_ended: {
                    title: 'Sabotaggio Terminato',
                    desc: 'La Regina ha mostrato la sua forza. I tuoi Cavalli sono pronti alla battaglia!',
                },
            },
            hawk: {
                high_flyer_boost: {
                    title: 'Spinta in Volo',
                    desc: 'Il Falco prende il volo e guadagna slancio!',
                },
            },
            golem: {
                extra_turn: {
                    title: 'Passo del Golem',
                    desc: 'Il Golem si muove con forza implacabile e ottiene un turno extra!',
                },
            },
        },
    },
    pacts: {
        necromancer: { title: 'Il Negromante', description: 'Resuscita gli alleati, ma l\'ascensione ha un costo.' },
        saboteur: { title: 'Il Sabotatore', description: 'Pedoni rapidi ma rifornimenti tagliati.' },
        heavy_cavalry: { title: 'Cavalleria Pesante', description: 'Cariche devastanti ma manovrabilità ridotta.' },
        changeling: { title: 'Il Mutaforma', description: 'Adattabilità estrema ma identità instabile.' },
        berserker: { title: 'Il Berserker', description: 'Spietato cacciatore di pedoni, ma scende in campo monco.' },
        sniper: { title: 'Il Cecchino', description: 'Colpi a distanza ma tempi di ricarica lunghi.' },
        tidecaller: { title: 'Signore delle Maree', description: 'Controllo del flusso ma opzioni offensive limitate.' },
        blind_seer: { title: 'Veggente Cieco', description: 'Vista oltre i muri ma oscurità circostante.' },
        void_jumper: { title: 'Saltatore Dimensionale', description: 'Mobilità impossibile al prezzo di un sacrificio.' },
        ranger: { title: 'L\'Arciere', description: 'Tiro preciso ma mobilità a corto raggio.' },
        illusionist: { title: 'L\'Illusionista', description: 'Movimento ingannevole e presenza fragile.' },
        oracle: { title: 'L\'Oracolo', description: 'Conoscenza del futuro ma destino ineluttabile.' },
        vampire: { title: 'Il Vampiro', description: 'Immortalità condizionale ma re maledetto.' },
        shadow: { title: 'L\'Ombra', description: 'Immunità sul perimetro dai colpi distanti, ma disarmo centrale.' },
        swarm: { title: 'Lo Sciame', description: 'Numeri infiniti ma la Regina è tutto.' },
        phoenix: { title: 'La Fenice', description: 'Rinascita reale ma inizio senza torri.' },
        alchemist: { title: 'L\'Alchimista', description: 'Scambia la materia a piacimento, ma ogni cattura ha un prezzo.' },
        veteran: { title: 'Il Veterano', description: 'Combattimento frontale ma mobilità ridotta.' },
        golem: { title: 'Il Golem', description: 'Pelle dura ma piedi pesanti.' },
        jester: { title: 'Il Giullare', description: 'Caos totale nei ruoli.' },
        spectre: { title: 'Lo Spettro', description: 'Intangibilità pericolosa per i vivi.' },
        sentinel: { title: 'La Sentinella', description: 'Guardia perfetta ma re immobile.' },
        gladiator: { title: 'Il Gladiatore', description: 'Invincibile nell\'arena ma disarmato.' },
        diplomat: { title: 'Il Diplomatico', description: 'Immunità politica ma sabotaggio interno.' },
        titan: { title: 'Il Titano', description: 'Forza sismica ma dimensioni ingombranti.' },
        thief: { title: 'Il Ladro', description: 'Mani leste ma ricercato dalla legge.' },
        engineer: { title: 'L\'Ingegnere', description: 'Torrette difensive con difetti di design.' },
        hawk: { title: 'Il Falco', description: 'Predatore dei cieli ma cieco da vicino.' },
        heir: { title: 'L\'Erede', description: 'Dinastia assicurata ma regnante inesperto.' },
        timekeeper: { title: 'Il Cronocrate', description: 'Controllo del tempo al prezzo di paradossi.' },

    },
    perks: {
        /* BONUS */
        reclaimer: { name: 'Rianimatore', description: 'Resuscita l\'ultimo pezzo amico perso (eccetto Regina) sulla sua casella iniziale. (Ricarica: 5 turni)' },
        diagonal_dash: { name: 'Scatto Diagonale', description: 'I pedoni possono muovere di 1 casella in diagonale avanti (cattura permessa).' },
        trample: { name: 'Travolgere', description: 'I Cavalli e il Re catturano anche i pedoni nemici adiacenti all\'atterraggio.' },
        mimicry: { name: 'Mimica', description: 'Catturando, un pedone assume il movimento della vittima per il prossimo turno.' },
        frenzy: { name: 'Cacciatore di Pedoni', description: 'Dopo aver catturato un pedone, muovi di nuovo lo stesso pezzo (senza catturare).' },
        long_sight: { name: 'Vista Lunga', description: 'Le Torri possono catturare pezzi dietro esattamente un ostacolo.' },
        flow: { name: 'Flusso', description: 'I pedoni possono muovere indietro di 1 casella e catturare verticalmente all\'indietro.' },
        echolocation: { name: 'Ecolocalizzazione', description: 'I pezzi vedono e attaccano attraverso i muri.' },
        void_jump: { name: 'Salto del Vuoto', description: 'Scambia posizione a due pezzi amici. (3 usi, richiede sacrificio)' },
        snipe: { name: 'Tiro di Precisione', description: 'Gli Alfieri possono catturare a distanza 1-2 senza muoversi (Toggle persistente).' },
        displace: { name: 'Spostamento', description: 'Attiva: Muovi un pezzo in una casella vuota adiacente a tua scelta.' },
        prescience: { name: 'Prescienza', description: 'Vedi le mosse e le minacce nemiche.' },
        life_thirst: { name: 'Sete di Sangue', description: 'Catturare una Torre o Regina nemica resuscita un tuo pezzo minore.' },
        stealth: { name: 'Furtività', description: 'I pedoni laterali sono invisibili finché non agiscono.' },
        shadow_cloak: { name: 'Mantello d\'Ombra', description: 'I pezzi sul perimetro sono immuni alla cattura da nemici non adiacenti.' },
        hydra: { name: 'Idra', description: 'Quando un pedone muore, ne appare uno nuovo nelle retrovie.' },
        rebirth: { name: 'Rinascita', description: 'Se la Regina viene catturata, un pedone diventa una Regina immune per 1 turno. (Una sola volta)' },
        transmutation: { name: 'Trasmutazione', description: 'Scambia due pezzi amici (non il Re). (2 usi, ricarica: 2 turni)' },
        bayonet: { name: 'Baionetta', description: 'I pedoni catturano in avanti invece che in diagonale. (3 usi, ricarica: 3 turni)' },
        stone_skin: { name: 'Pelle di Pietra', description: 'Ogni 3 mosse del Re, ottieni un turno extra. Il Re è immune agli attacchi da lontano (> 3 caselle).' },
        incorporeal: { name: 'Incorporeo', description: 'I pezzi non-pedone attraversano i pedoni amici.' },
        vigilance: { name: 'Vigilanza', description: 'I pezzi adiacenti al Re (tranne se sotto scacco) non possono essere catturati.' },
        arena: { name: 'Arena', description: 'I pezzi sulle caselle nere sono immuni alle catture di pedoni e pezzi minori.' },
        diplomatic_immunity: { name: 'Immunità', description: 'La Regina non può essere catturata dai Pedoni finché non effettua una cattura.' },
        chaos: { name: 'Caos', description: 'Gli Alfieri si muovono come i Cavalli.' },
        earthquake: { name: 'Terremoto', description: 'Muovere la Regina spinge via tutti i pezzi adiacenti (tranne i Re) di 1 casella.' },
        pickpocket: { name: 'Borseggio', description: 'Pedone adiacente a Torre o Regina lo blocca per un turno.' },
        turret: { name: 'Torretta', description: 'Le Torri attaccano anche in diagonale (1 casella).' },
        high_flyer: { name: 'Volo Alto', description: 'Gli Alfieri possono saltare i pezzi amici.' },
        bloodline: { name: 'Linea di Sangue', description: 'Se la Regina muore, un pezzo minore diventa Regina.' },
        time_stop: { name: 'Time Stop', description: 'L\'avversario salta un turno. (Una sola volta)' },


        /* MALUS */
        ascension_cost: { name: 'Costo di Ascensione', description: 'Promuovere costa un turno (il nemico muove due volte).' },
        cut_supplies: { name: 'Rifornimenti Tagliati', description: 'I pedoni non possono promuovere a Regina.' },
        heavy_armor: { name: 'Armatura Pesante', description: 'I Cavalli non possono saltare i propri pedoni.' },
        unstable_identity: { name: 'Identità Instabile', description: 'Se non catturi per 5 turni, il tuo pezzo più avanzato diventa un pedone.' },
        missing_knight: { name: 'Monco', description: 'Inizi la partita con un Cavallo casuale rimosso dalla scacchiera.' },
        reload: { name: 'Ricarica', description: 'Una Torre che cattura salta il prossimo turno.' },
        ebb: { name: 'Riflusso', description: 'I pedoni non possono catturare in diagonale.' },
        darkness: { name: 'Oscurità', description: 'I pezzi a lungo raggio (Torre, Alfiere, Regina) hanno una portata massima di 3.' },
        ritual_sacrifice: { name: 'Sacrificio Rituale', description: 'Il teletrasporto uccide il tuo pezzo più avanzato.' },
        short_sighted: { name: 'Miopia', description: 'Gli Alfieri non possono muovere più di 4 caselle.' },
        vanished_illusion: { name: 'Illusione Svanita', description: 'Inizi con un pedone in meno.' },
        inevitable_fate: { name: 'Destino Ineluttabile', description: 'Se puoi mangiare un pezzo indifeso e non lo fai, perdi il pezzo.' },
        vampire_curse: { name: 'Maledizione', description: 'Il Re non può mai arroccare.' },
        blind_light: { name: 'Luce Accecante', description: 'I pezzi centrali non possono catturare.' },
        hive_queen: { name: 'Regina dell\'Alveare', description: 'Perdere la Regina significa perdere la partita.' },
        wingless: { name: 'Senza Ali', description: 'Inizi senza Torri.' },
        volatile_reagents: { name: 'Reagenti Volatili', description: 'Catturare o promuovere un pezzo lo stordisce per 2 turni.' },
        old_guard: { name: 'Vecchia Guardia', description: 'I pedoni non possono fare il doppio passo iniziale.' },
        lead_feet: { name: 'Piedi di Piombo', description: 'Il Re non può muovere in diagonale.' },
        possession: { name: 'Possessione', description: 'Attraversare un pedone amico lo uccide (max 1 per mossa).' },
        anchored: { name: 'Ancorato', description: 'Il Re non può muovere se ha pezzi adiacenti (tranne per fuggire allo scacco).' },
        disarmed: { name: 'Disarmato', description: 'Inizi senza Alfieri.' },
        internal_sabotage: { name: 'Sabotaggio', description: 'I Cavalli sono bloccati finché la Regina non supera la linea mediana.' },
        jester: { name: 'Giullare', description: 'I Cavalli muovono come Alfieri.' },
        gigantism: { name: 'Gigantismo', description: 'La Regina non può andare sui bordi.' },
        wanted: { name: 'Ricercato', description: 'I pedoni possono promuovere solo a Cavallo.' },
        design_flaw: { name: 'Difetto', description: 'Le Torri non possono muovere in orizzontale.' },
        distant_predator: { name: 'Predatore Distante', description: 'Gli Alfieri catturano a distanza 1 solo se hanno saltato un pezzo questo turno.' },
        young_queen: { name: 'Regina Giovane', description: 'Catture limitate per generazione (Gen 0: solo Re, Gen 1: no Regina/Torre).' },
        paradox: { name: 'Paradosso', description: 'Perdi 3 pedoni specifici dopo il Time Stop.' },

    },
    errors: {
        generic: 'Qualcosa è andato storto',
        networkDisconnected: 'Rete Disconnessa',
        reconnecting: 'Riconnessione in corso...',
        moveIllegal: 'Mossa Illegale',
        notYourTurn: 'Non è il tuo turno',
        matchEnded: 'Partita terminata',
        rotationTooEarly: 'Entrambi i giocatori devono muovere almeno una volta prima di ruotare la scacchiera',
        emailClientTitle: 'Impossibile aprire l’app Email',
        emailClientBody: 'Scrivi a {recipient}',
    },
    status: {
        online: 'Online',
        offline: 'Offline',
        reconnecting: 'Riconnessione',
    },
    help: {
        rotateBoard: 'Tocca per ruotare la vista della scacchiera',
    },
    support: {
        bugReportSubject: '[Bug] PactChess - {platform}',
        bugReportBody: `
Versione Board: {version}
Piattaforma: {platform}
Device: {device}

---
Cosa stavi facendo?


Cosa ti aspettavi?


Cosa è successo?


Step per riprodurre:
1.
2.
3.
`,
        pactIdeaSubject: '[Idea Patto] PactChess',
        pactIdeaBody: `
Nome Patto:

Bonus (Descrizione):


Malus (Descrizione):

Per quali pezzi / globale / azione:

Esempio pratico in partita:

`,
        reportBug: 'Segnala un Bug',
        proposePact: 'Proponi un nuovo Patto',
        feedback: 'Feedback',
    },
};
