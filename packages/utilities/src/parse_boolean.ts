/**
 * Strictly parses a value to a boolean, returning `null` if the value is invalid.
 * - Returns `true` for: `true`, `1`, `'1'`, `'true'` (case-insensitive).
 * - Returns `false` for: `false`, `0`, `'0'`, `'false'` (case-insensitive).
 * - Returns `null` for any other value.
 *
 * @param value - The value to parse (unknown type).
 * @returns {boolean | null} The parsed boolean or null if the input is invalid.
 */
export const parseBooleanOrNull = (value: unknown): boolean | null => {
    if (value === true || value === 1) return true;
    if (value === false || value === 0) return false;

    if (typeof value === 'string') {
        const lowerValue = value.trim().toLowerCase();
        if (lowerValue === 'true' || lowerValue === '1') return true;
        if (lowerValue === 'false' || lowerValue === '0') return false;
    }

    // Return null for invalid/ambiguous input
    return null;
};
