/**
 * Centralized animation presets for react-native-reanimated.
 *
 * Usage:
 *   import { Motion } from '../constants/Motion';
 *   withSpring(targetValue, Motion.spring.snappy);
 *   withTiming(targetValue, Motion.timing.fast);
 */

import type { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

export const Motion = {
    spring: {
        /** Modal entry, card reveal — bouncy, soft landing */
        soft: { damping: 20, stiffness: 150, mass: 0.8 } satisfies WithSpringConfig,

        /** Button press, chip toggle — fast, responsive */
        snappy: { damping: 15, stiffness: 400, mass: 0.5 } satisfies WithSpringConfig,

        /** Board rotation — heavier, more inertia */
        board: { damping: 20, stiffness: 90, mass: 1 } satisfies WithSpringConfig,

        /** Hover feedback, very subtle micro-interaction */
        subtle: { damping: 25, stiffness: 300, mass: 0.3 } satisfies WithSpringConfig,
    },

    timing: {
        /** Quick feedback (dismiss, fade out) */
        fast: { duration: 120 } satisfies WithTimingConfig,

        /** Standard transitions */
        base: { duration: 200 } satisfies WithTimingConfig,

        /** Deliberate, noticeable transitions */
        slow: { duration: 350 } satisfies WithTimingConfig,

        /** Modal overlay fade */
        modal: { duration: 250 } satisfies WithTimingConfig,
    },
} as const;

// Board-specific spring configs (keep backward compat with existing imports)
export const BOARD_ROTATION_SPRING_CONFIG = {
    damping: 20,
    stiffness: 90,
    mass: 1,
};

export const BOARD_SCALE_SPRING_CONFIG = {
    damping: 15,
    stiffness: 150,
};
