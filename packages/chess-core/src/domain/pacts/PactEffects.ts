import { PawnEffects, Vector } from './effects/PawnEffects';
import { UiEffects } from './effects/UiEffects';
import { MovementEffects } from './effects/MovementEffects';
import { CombatEffects } from './effects/CombatEffects';
import { RulesEffects } from './effects/RulesEffects';
import { BoardEffects } from './effects/BoardEffects';
import { GameEffects } from './effects/GameEffects';
import { StateEffects } from './effects/StateEffects';

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
    state: StateEffects,
};

/**
 * Re-exporting Vector utilities for general use in pacts.
 */
export { Vector };
