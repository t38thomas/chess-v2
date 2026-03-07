const fs = require('fs');
const path = require('path');

const LEGACY_PERK_LIBRARY = {
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

const dir = path.join(__dirname, '../src/domain/pacts/definitions');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'));

let changedCount = 0;
for (const f of files) {
    const filePath = path.join(dir, f);
    let original = fs.readFileSync(filePath, 'utf8');
    let content = original;

    // Use a RegExp to find the start of bonus and malus blocks
    const reg = /((?:\.bonus|\.malus)\s*\(\s*['"](\w+)['"]\s*,\s*\{)/g;

    content = content.replace(reg, (match, prefix, id) => {
        const perk = LEGACY_PERK_LIBRARY[id];
        if (!perk) return match;

        const idx = original.indexOf(match);
        const lookahead = original.substring(idx, idx + 150);
        // Avoid replacing twice
        if (lookahead.includes('icon:')) {
            return match;
        }

        return prefix + '\n        icon: \'' + perk.icon + '\',\n        ranking: ' + perk.ranking + ',\n        category: \'' + perk.category + '\',';
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        changedCount++;
        console.log('Migrated', f);
    }
}
console.log('Migrated', changedCount, 'files.');
