/**
 * Theme helper utilities for color manipulation.
 * Zero-dependency — works with HEX strings only.
 */

/** Append alpha channel to a HEX color (e.g. '#6C5CE7' + 0.15 → 'rgba(108,92,231,0.15)') */
export function alpha(hex: string, opacity: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${opacity})`;
}

/** Create a muted version of a color (15% opacity) — for background hints */
export function muted(hex: string): string {
    return alpha(hex, 0.15);
}

/** Create a subtle version (8% opacity) — for very faint backgrounds */
export function subtle(hex: string): string {
    return alpha(hex, 0.08);
}

/** Append HEX alpha suffix (e.g. '#6C5CE7' + 0.5 → '#6C5CE780') */
export function hexAlpha(hex: string, opacity: number): string {
    const a = Math.round(opacity * 255).toString(16).padStart(2, '0');
    return `${hex}${a}`;
}
