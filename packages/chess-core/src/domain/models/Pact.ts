export type PerkCategory =
    | 'Movement'
    | 'Promotion'
    | 'Turn Economy'
    | 'Capture Rules'
    | 'King Safety'
    | 'Board Transform'
    | 'Visibility'
    | 'Action'
    | 'Other';

export interface Perk {
    id: string;
    name: string; // Translation key
    icon: string;
    description: string; // Translation key
    ranking: number;
    category: PerkCategory;
}

export interface Pact {
    id: string;
    title: string; // Translation key
    bonus: Perk;
    malus: Perk;
    description: string; // Translation key
}

export const PERK_LIBRARY: Record<string, Perk> = {
    // --- 1. IL NEGROMANTE ---
    reclaimer: { id: 'reclaimer', name: 'reclaimer', icon: 'refresh', description: 'desc_reclaimer', ranking: 5, category: 'Action' },
    ascension_cost: { id: 'ascension_cost', name: 'ascension_cost', icon: 'currency-usd', description: 'desc_ascension_cost', ranking: -4, category: 'Turn Economy' },

    // --- 2. IL SABOTATORE ---
    diagonal_dash: { id: 'diagonal_dash', name: 'diagonal_dash', icon: 'arrow-top-right', description: 'desc_diagonal_dash', ranking: 3, category: 'Movement' },
    cut_supplies: { id: 'cut_supplies', name: 'cut_supplies', icon: 'package-variant-closed-minus', description: 'desc_cut_supplies', ranking: -3, category: 'Promotion' },

    // --- 3. CAVALLERIA PESANTE ---
    trample: { id: 'trample', name: 'trample', icon: 'horse-variant', description: 'desc_trample', ranking: 4, category: 'Capture Rules' },
    heavy_armor: { id: 'heavy_armor', name: 'heavy_armor', icon: 'shield-lock', description: 'desc_heavy_armor', ranking: -2, category: 'Movement' },

    // --- 4. IL MUTAFORMA ---
    mimicry: { id: 'mimicry', name: 'mimicry', icon: 'shape', description: 'desc_mimicry', ranking: 4, category: 'Movement' },
    unstable_identity: { id: 'unstable_identity', name: 'unstable_identity', icon: 'alert-circle-outline', description: 'desc_unstable_identity', ranking: -3, category: 'Board Transform' },

    // --- 5. IL BERSERKER ---
    frenzy: { id: 'frenzy', name: 'frenzy', icon: 'axe', description: 'desc_frenzy', ranking: 4, category: 'Turn Economy' },
    missing_knight: { id: 'missing_knight', name: 'missing_knight', icon: 'chess-knight', description: 'desc_missing_knight', ranking: -3, category: 'Board Transform' },

    // --- 6. IL CECCHINO ---
    long_sight: { id: 'long_sight', name: 'long_sight', icon: 'telescope', description: 'desc_long_sight', ranking: 4, category: 'Capture Rules' },
    reload: { id: 'reload', name: 'reload', icon: 'reload', description: 'desc_reload', ranking: -2, category: 'Turn Economy' },

    // --- 7. SIGNORE DELLE MAREE ---
    flow: { id: 'flow', name: 'flow', icon: 'water', description: 'desc_flow', ranking: 3, category: 'Movement' },
    ebb: { id: 'ebb', name: 'ebb', icon: 'waves', description: 'desc_ebb', ranking: -2, category: 'Capture Rules' },

    // --- 8. VEGGENTE CIECO ---
    echolocation: { id: 'echolocation', name: 'echolocation', icon: 'radar', description: 'desc_echolocation', ranking: 3, category: 'Visibility' },
    darkness: { id: 'darkness', name: 'darkness', icon: 'eye-off', description: 'desc_darkness', ranking: -4, category: 'Visibility' },

    // --- 9. SALTATORE DIMENSIONALE ---
    void_jump: { id: 'void_jump', name: 'void_jump', icon: 'axis-arrow', description: 'desc_void_jump', ranking: 5, category: 'Action' },
    ritual_sacrifice: { id: 'ritual_sacrifice', name: 'ritual_sacrifice', icon: 'skull', description: 'desc_ritual_sacrifice', ranking: -5, category: 'Board Transform' },

    // --- 10. L'ARCIERE ---
    snipe: { id: 'snipe', name: 'snipe', icon: 'bow-arrow', description: 'desc_snipe', ranking: 4, category: 'Action' },
    short_sighted: { id: 'short_sighted', name: 'short_sighted', icon: 'glasses', description: 'desc_short_sighted', ranking: -2, category: 'Movement' },

    // --- 11. L'ILLUSIONISTA ---
    displace: { id: 'displace', name: 'displace', icon: 'shimmer', description: 'desc_displace', ranking: 5, category: 'Action' },
    vanished_illusion: { id: 'vanished_illusion', name: 'vanished_illusion', icon: 'ghost', description: 'desc_vanished_illusion', ranking: -1, category: 'Board Transform' },

    // --- 12. L'ORACOLO ---
    prescience: { id: 'prescience', name: 'prescience', icon: 'eye-plus', description: 'desc_prescience', ranking: 2, category: 'Visibility' },
    inevitable_fate: { id: 'inevitable_fate', name: 'inevitable_fate', icon: 'death-star', description: 'desc_inevitable_fate', ranking: -4, category: 'Capture Rules' },

    // --- 13. IL VAMPIRO ---
    life_thirst: { id: 'life_thirst', name: 'life_thirst', icon: 'blood-bag', description: 'desc_life_thirst', ranking: 5, category: 'Capture Rules' },
    vampire_curse: { id: 'vampire_curse', name: 'vampire_curse', icon: 'cross', description: 'desc_vampire_curse', ranking: -5, category: 'King Safety' },

    // --- 14. L'OMBRA ---
    shadow_cloak: { id: 'shadow_cloak', name: 'shadow_cloak', icon: 'incognito', description: 'desc_shadow_cloak', ranking: 4, category: 'Capture Rules' },
    blind_light: { id: 'blind_light', name: 'blind_light', icon: 'spotlight', description: 'desc_blind_light', ranking: -3, category: 'Capture Rules' },

    // --- 15. LO SCIAME ---
    hydra: { id: 'hydra', name: 'hydra', icon: 'bacteria', description: 'desc_hydra', ranking: 5, category: 'Board Transform' },
    hive_queen: { id: 'hive_queen', name: 'hive_queen', icon: 'crown-circle', description: 'desc_hive_queen', ranking: -5, category: 'King Safety' },

    // --- 16. LA FENICE ---
    rebirth: { id: 'rebirth', name: 'rebirth', icon: 'fire', description: 'desc_rebirth', ranking: 4, category: 'Board Transform' },
    wingless: { id: 'wingless', name: 'wingless', icon: 'feather', description: 'desc_wingless', ranking: -3, category: 'Board Transform' },

    // --- 17. L'ALCHIMISTA ---
    transmutation: { id: 'transmutation', name: 'transmutation', icon: 'flask', description: 'desc_transmutation', ranking: 3, category: 'Action' },
    volatile_reagents: { id: 'volatile_reagents', name: 'volatile_reagents', icon: 'flask-outline', description: 'desc_volatile_reagents', ranking: -2, category: 'Other' },

    // --- 18. IL VETERANO ---
    bayonet: { id: 'bayonet', name: 'bayonet', icon: 'knife', description: 'desc_bayonet', ranking: 3, category: 'Capture Rules' },
    old_guard: { id: 'old_guard', name: 'old_guard', icon: 'human-cane', description: 'desc_old_guard', ranking: -1, category: 'Movement' },

    // --- 19. IL GOLEM ---
    stone_skin: { id: 'stone_skin', name: 'stone_skin', icon: 'wall', description: 'desc_stone_skin', ranking: 4, category: 'King Safety' },
    lead_feet: { id: 'lead_feet', name: 'lead_feet', icon: 'weight-kilogram', description: 'desc_lead_feet', ranking: -3, category: 'Movement' },

    // --- 20. LO SPETTRO ---
    incorporeal: { id: 'incorporeal', name: 'incorporeal', icon: 'ghost-outline', description: 'desc_incorporeal', ranking: 4, category: 'Movement' },
    possession: { id: 'possession', name: 'possession', icon: 'hand-pointing-right', description: 'desc_possession', ranking: -3, category: 'Board Transform' },

    // --- 21. LA SENTINELLA ---
    vigilance: { id: 'vigilance', name: 'vigilance', icon: 'shield-cross', description: 'desc_vigilance', ranking: 4, category: 'King Safety' },
    anchored: { id: 'anchored', name: 'anchored', icon: 'anchor', description: 'desc_anchored', ranking: -3, category: 'King Safety' },

    // --- 22. IL GLADIATORE ---
    arena: { id: 'arena', name: 'arena', icon: 'stadium', description: 'desc_arena', ranking: 3, category: 'King Safety' },
    disarmed: { id: 'disarmed', name: 'disarmed', icon: 'sword-cross', description: 'desc_disarmed', ranking: -2, category: 'Board Transform' },

    // --- 23. IL DIPLOMATICO ---
    diplomatic_immunity: { id: 'diplomatic_immunity', name: 'diplomatic_immunity', icon: 'passport', description: 'desc_diplomatic_immunity', ranking: 5, category: 'King Safety' },
    internal_sabotage: { id: 'internal_sabotage', name: 'internal_sabotage', icon: 'bomb', description: 'desc_internal_sabotage', ranking: -4, category: 'Movement' },

    // --- 24. IL FOLLE ---
    chaos: { id: 'chaos', name: 'chaos', icon: 'drama-masks', description: 'desc_chaos', ranking: 3, category: 'Movement' },
    jester: { id: 'jester', name: 'jester', icon: 'party-popper', description: 'desc_jester', ranking: -3, category: 'Movement' },

    // --- 25. IL TITANO ---
    earthquake: { id: 'earthquake', name: 'earthquake', icon: 'image-filter-hdr', description: 'desc_earthquake', ranking: 4, category: 'Board Transform' },
    gigantism: { id: 'gigantism', name: 'gigantism', icon: 'arrow-expand-all', description: 'desc_gigantism', ranking: -2, category: 'Movement' },

    // --- 26. IL LADRO ---
    pickpocket: { id: 'pickpocket', name: 'pickpocket', icon: 'hand-coin', description: 'desc_pickpocket', ranking: 4, category: 'Movement' },
    wanted: { id: 'wanted', name: 'wanted', icon: 'handcuffs', description: 'desc_wanted', ranking: -4, category: 'Promotion' },

    // --- 27. L'INGEGNERE ---
    turret: { id: 'turret', name: 'turret', icon: 'cctv', description: 'desc_turret', ranking: 3, category: 'Capture Rules' },
    design_flaw: { id: 'design_flaw', name: 'design_flaw', icon: 'alert-octagon', description: 'desc_design_flaw', ranking: -2, category: 'Movement' },

    // --- 28. IL FALCO ---
    high_flyer: { id: 'high_flyer', name: 'high_flyer', icon: 'bird', description: 'desc_high_flyer', ranking: 4, category: 'Movement' },
    distant_predator: { id: 'distant_predator', name: 'distant_predator', icon: 'eye-minus', description: 'desc_distant_predator', ranking: -2, category: 'Capture Rules' },

    // --- 29. L'EREDE ---
    bloodline: { id: 'bloodline', name: 'bloodline', icon: 'water-plus', description: 'desc_bloodline', ranking: 5, category: 'Board Transform' },
    young_queen: { id: 'young_queen', name: 'young_queen', icon: 'baby-carriage', description: 'desc_young_queen', ranking: -3, category: 'Capture Rules' },

    // --- 30. IL CRONOCRATE ---
    time_stop: { id: 'time_stop', name: 'time_stop', icon: 'clock-remove', description: 'desc_time_stop', ranking: 5, category: 'Action' },
    paradox: { id: 'paradox', name: 'paradox', icon: 'infinity', description: 'desc_paradox', ranking: -4, category: 'Board Transform' }
};

export const PACT_CARDS: Pact[] = [
    { id: 'necromancer', title: 'title_necromancer', bonus: PERK_LIBRARY.reclaimer, malus: PERK_LIBRARY.ascension_cost, description: 'desc_pact_necromancer' },
    { id: 'saboteur', title: 'title_saboteur', bonus: PERK_LIBRARY.diagonal_dash, malus: PERK_LIBRARY.cut_supplies, description: 'desc_pact_saboteur' },
    { id: 'heavy_cavalry', title: 'title_heavy_cavalry', bonus: PERK_LIBRARY.trample, malus: PERK_LIBRARY.heavy_armor, description: 'desc_pact_heavy_cavalry' },
    { id: 'changeling', title: 'title_changeling', bonus: PERK_LIBRARY.mimicry, malus: PERK_LIBRARY.unstable_identity, description: 'desc_pact_changeling' },
    { id: 'berserker', title: 'title_berserker', bonus: PERK_LIBRARY.frenzy, malus: PERK_LIBRARY.missing_knight, description: 'desc_pact_berserker' },
    { id: 'sniper', title: 'title_sniper', bonus: PERK_LIBRARY.long_sight, malus: PERK_LIBRARY.reload, description: 'desc_pact_sniper' },
    { id: 'tidecaller', title: 'title_tidecaller', bonus: PERK_LIBRARY.flow, malus: PERK_LIBRARY.ebb, description: 'desc_pact_tidecaller' },
    { id: 'blind_seer', title: 'title_blind_seer', bonus: PERK_LIBRARY.echolocation, malus: PERK_LIBRARY.darkness, description: 'desc_pact_blind_seer' },
    { id: 'void_jumper', title: 'title_void_jumper', bonus: PERK_LIBRARY.void_jump, malus: PERK_LIBRARY.ritual_sacrifice, description: 'desc_pact_void_jumper' },
    { id: 'ranger', title: 'title_ranger', bonus: PERK_LIBRARY.snipe, malus: PERK_LIBRARY.short_sighted, description: 'desc_pact_ranger' },
    { id: 'illusionist', title: 'title_illusionist', bonus: PERK_LIBRARY.displace, malus: PERK_LIBRARY.vanished_illusion, description: 'desc_pact_illusionist' },
    { id: 'oracle', title: 'title_oracle', bonus: PERK_LIBRARY.prescience, malus: PERK_LIBRARY.inevitable_fate, description: 'desc_pact_oracle' },
    { id: 'vampire', title: 'title_vampire', bonus: PERK_LIBRARY.life_thirst, malus: PERK_LIBRARY.vampire_curse, description: 'desc_pact_vampire' },
    { id: 'shadow', title: 'title_shadow', bonus: PERK_LIBRARY.shadow_cloak, malus: PERK_LIBRARY.blind_light, description: 'desc_pact_shadow' },
    { id: 'swarm', title: 'title_swarm', bonus: PERK_LIBRARY.hydra, malus: PERK_LIBRARY.hive_queen, description: 'desc_pact_swarm' },
    { id: 'phoenix', title: 'title_phoenix', bonus: PERK_LIBRARY.rebirth, malus: PERK_LIBRARY.wingless, description: 'desc_pact_phoenix' },
    { id: 'alchemist', title: 'title_alchemist', bonus: PERK_LIBRARY.transmutation, malus: PERK_LIBRARY.volatile_reagents, description: 'desc_pact_alchemist' },
    { id: 'veteran', title: 'title_veteran', bonus: PERK_LIBRARY.bayonet, malus: PERK_LIBRARY.old_guard, description: 'desc_pact_veteran' },
    { id: 'golem', title: 'title_golem', bonus: PERK_LIBRARY.stone_skin, malus: PERK_LIBRARY.lead_feet, description: 'desc_pact_golem' },
    { id: 'spectre', title: 'title_spectre', bonus: PERK_LIBRARY.incorporeal, malus: PERK_LIBRARY.possession, description: 'desc_pact_spectre' },
    { id: 'sentinel', title: 'title_sentinel', bonus: PERK_LIBRARY.vigilance, malus: PERK_LIBRARY.anchored, description: 'desc_pact_sentinel' },
    { id: 'gladiator', title: 'title_gladiator', bonus: PERK_LIBRARY.arena, malus: PERK_LIBRARY.disarmed, description: 'desc_pact_gladiator' },
    { id: 'diplomat', title: 'title_diplomat', bonus: PERK_LIBRARY.diplomatic_immunity, malus: PERK_LIBRARY.internal_sabotage, description: 'desc_pact_diplomat' },
    { id: 'jester', title: 'title_jester', bonus: PERK_LIBRARY.chaos, malus: PERK_LIBRARY.jester, description: 'desc_pact_jester' },
    { id: 'titan', title: 'title_titan', bonus: PERK_LIBRARY.earthquake, malus: PERK_LIBRARY.gigantism, description: 'desc_pact_titan' },
    { id: 'thief', title: 'title_thief', bonus: PERK_LIBRARY.pickpocket, malus: PERK_LIBRARY.wanted, description: 'desc_pact_thief' },
    { id: 'engineer', title: 'title_engineer', bonus: PERK_LIBRARY.turret, malus: PERK_LIBRARY.design_flaw, description: 'desc_pact_engineer' },
    { id: 'hawk', title: 'title_hawk', bonus: PERK_LIBRARY.high_flyer, malus: PERK_LIBRARY.distant_predator, description: 'desc_pact_hawk' },
    { id: 'heir', title: 'title_heir', bonus: PERK_LIBRARY.bloodline, malus: PERK_LIBRARY.young_queen, description: 'desc_pact_heir' },
    { id: 'timekeeper', title: 'title_timekeeper', bonus: PERK_LIBRARY.time_stop, malus: PERK_LIBRARY.paradox, description: 'desc_pact_timekeeper' },
];
