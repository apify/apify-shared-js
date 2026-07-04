import { KEY_VALUE_STORE_KEY_REGEX } from '@apify/consts';

/**
 * Max allowed length of a key-value store record key. Kept in sync with the
 * `{1,256}` quantifier on {@link KEY_VALUE_STORE_KEY_REGEX} in `@apify/consts`.
 */
export const KEY_VALUE_STORE_KEY_MAX_LENGTH = 256;

/**
 * Regex matching a single character that is allowed in a key-value store
 * record key (the character class from {@link KEY_VALUE_STORE_KEY_REGEX},
 * without the length quantifier). Used to compute the set of illegal
 * characters in a rejected key.
 */
const KEY_VALUE_STORE_KEY_ALLOWED_CHAR_REGEX = /[a-zA-Z0-9!\-_.'()]/;

/**
 * Human-readable name for a small set of characters that render ambiguously
 * (e.g. as invisible whitespace) in error messages. Improves the readability
 * of the "illegal character(s):" list.
 */
const CHARACTER_NAMES: Record<string, string> = {
    ' ': 'space',
    '\t': 'tab',
    '\n': 'newline',
    '\r': 'carriage return',
    '\v': 'vertical tab',
    '\f': 'form feed',
    '\0': 'null',
};

function describeCharacter(char: string): string {
    const named = CHARACTER_NAMES[char];
    if (named) return `${JSON.stringify(char)} (${named})`;

    // Common punctuation gets a friendly name so error messages read well.
    const punctuationNames: Record<string, string> = {
        ':': 'colon',
        ';': 'semicolon',
        '/': 'slash',
        '\\': 'backslash',
        '@': 'at-sign',
        '#': 'hash',
        $: 'dollar sign',
        '%': 'percent',
        '^': 'caret',
        '&': 'ampersand',
        '*': 'asterisk',
        '+': 'plus',
        '=': 'equals',
        '?': 'question mark',
        '<': 'less-than',
        '>': 'greater-than',
        '{': 'left curly brace',
        '}': 'right curly brace',
        '[': 'left square bracket',
        ']': 'right square bracket',
        '|': 'pipe',
        '~': '~ (tilde)',
        '`': 'backtick',
        '"': 'double quote',
        ',': 'comma',
    };
    const punctName = punctuationNames[char];
    if (punctName) return `${JSON.stringify(char)} (${punctName})`;

    // Control characters and other non-printables: show the U+xxxx codepoint.
    const codepoint = char.codePointAt(0);
    if (codepoint !== undefined && (codepoint < 0x20 || codepoint === 0x7f)) {
        return `U+${codepoint.toString(16).toUpperCase().padStart(4, '0')}`;
    }

    return JSON.stringify(char);
}

/**
 * Result of {@link validateKvsKey}. `valid: true` means the key is accepted by
 * {@link KEY_VALUE_STORE_KEY_REGEX}; otherwise the object describes each
 * distinct problem so callers can build a helpful error message.
 */
export type KvsKeyValidationResult =
    | { valid: true }
    | {
          valid: false;
          /** Distinct illegal characters, in order of first appearance in the key. Empty when only length is wrong. */
          illegalCharacters: string[];
          /** True when `key.length` exceeds {@link KEY_VALUE_STORE_KEY_MAX_LENGTH}. */
          tooLong: boolean;
          /** True when `key` is empty. */
          empty: boolean;
          /** Human-readable message combining all problems, ready to include in an error. */
          message: string;
      };

/**
 * Validate a key-value store record key against {@link KEY_VALUE_STORE_KEY_REGEX}.
 *
 * On failure, callers get back the exact list of illegal characters plus the
 * length check, so the resulting error message can point at the actual problem
 * (e.g. `illegal character(s): ":" (colon)`) instead of restating the whole
 * allowed charset.
 */
export function validateKvsKey(key: string): KvsKeyValidationResult {
    if (KEY_VALUE_STORE_KEY_REGEX.test(key)) {
        return { valid: true };
    }

    const empty = key.length === 0;
    const tooLong = key.length > KEY_VALUE_STORE_KEY_MAX_LENGTH;

    // Compute the set of illegal characters in order of first appearance.
    const seen = new Set<string>();
    const illegalCharacters: string[] = [];
    for (const char of key) {
        if (!KEY_VALUE_STORE_KEY_ALLOWED_CHAR_REGEX.test(char) && !seen.has(char)) {
            seen.add(char);
            illegalCharacters.push(char);
        }
    }

    const problems: string[] = [];
    if (empty) {
        problems.push('key is empty');
    }
    if (tooLong) {
        problems.push(`length ${key.length} > ${KEY_VALUE_STORE_KEY_MAX_LENGTH}`);
    }
    if (illegalCharacters.length > 0) {
        const rendered = illegalCharacters.map(describeCharacter).join(', ');
        problems.push(`illegal character(s): ${rendered}`);
    }

    const message =
        `Key-value store record key is invalid (${problems.join('; ')}). ` +
        `Allowed characters are a-zA-Z0-9 and !-_.'(), max length ${KEY_VALUE_STORE_KEY_MAX_LENGTH}.`;

    return {
        valid: false,
        illegalCharacters,
        tooLong,
        empty,
        message,
    };
}

/**
 * Throws a `TypeError` with a helpful message (see {@link validateKvsKey}) if
 * `key` is not a valid key-value store record key. Otherwise returns silently.
 */
export function assertValidKvsKey(key: string): void {
    const result = validateKvsKey(key);
    if (!result.valid) {
        throw new TypeError(result.message);
    }
}
