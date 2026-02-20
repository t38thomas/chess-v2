import { PawnEffects, Vector } from './effects/PawnEffects';
import { UiEffects } from './effects/UiEffects';
import { MovementEffects } from './effects/MovementEffects';
import { CombatEffects } from './effects/CombatEffects';
import { RulesEffects } from './effects/RulesEffects';

import { BoardEffects } from './effects/BoardEffects';
import { GameEffects } from './effects/GameEffects';

/**
 * Re-exporting modular effects via a centralized Effects object.
 */
export const Effects = {
    pawn: PawnEffects,
    ui: UiEffects,
    movement: MovementEffects,
    combat: CombatEffects,
    rules: RulesEffects,
    board: BoardEffects,
    game: GameEffects,
};

/**
 * Re-exporting Vector utilities for general use in pacts.
 */
export { Vector };
