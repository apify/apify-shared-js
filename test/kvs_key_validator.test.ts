import { describe, expect, it } from 'vitest';

import { assertValidKvsKey, KEY_VALUE_STORE_KEY_MAX_LENGTH, validateKvsKey } from '@apify/utilities';

describe('validateKvsKey()', () => {
    it('accepts keys made of the allowed character set', () => {
        for (const key of ['foo', 'INPUT', 'file.json', 'abc-123_XYZ.tar.gz', "it's-fine", 'a', '0']) {
            expect(validateKvsKey(key)).toEqual({ valid: true });
        }
    });

    it('accepts a key at the maximum length', () => {
        const key = 'a'.repeat(KEY_VALUE_STORE_KEY_MAX_LENGTH);
        expect(validateKvsKey(key)).toEqual({ valid: true });
    });

    it('rejects an empty key with a dedicated flag', () => {
        const result = validateKvsKey('');
        expect(result.valid).toBe(false);
        if (result.valid) return;
        expect(result.empty).toBe(true);
        expect(result.tooLong).toBe(false);
        expect(result.illegalCharacters).toEqual([]);
        expect(result.message).toContain('key is empty');
    });

    it('names the single illegal character in the failure message', () => {
        const result = validateKvsKey('price:yamaha-ysp-5600');
        expect(result.valid).toBe(false);
        if (result.valid) return;
        expect(result.illegalCharacters).toEqual([':']);
        expect(result.tooLong).toBe(false);
        expect(result.message).toContain('illegal character(s): ":" (colon)');
        // Should NOT falsely blame length.
        expect(result.message).not.toMatch(/length \d+ >/);
    });

    it('deduplicates illegal characters and preserves first-seen order', () => {
        const result = validateKvsKey('a:b/c:d/e');
        expect(result.valid).toBe(false);
        if (result.valid) return;
        expect(result.illegalCharacters).toEqual([':', '/']);
        expect(result.message).toMatch(/illegal character\(s\): ":" \(colon\), "\/" \(slash\)/);
    });

    it('reports both an illegal character AND excess length when both are wrong', () => {
        const key = `${'a'.repeat(KEY_VALUE_STORE_KEY_MAX_LENGTH)}::`;
        const result = validateKvsKey(key);
        expect(result.valid).toBe(false);
        if (result.valid) return;
        expect(result.tooLong).toBe(true);
        expect(result.illegalCharacters).toEqual([':']);
        expect(result.message).toContain(`length ${key.length} > ${KEY_VALUE_STORE_KEY_MAX_LENGTH}`);
        expect(result.message).toContain('illegal character(s): ":" (colon)');
    });

    it('reports length only when charset is fine but length exceeds the max', () => {
        const key = 'a'.repeat(KEY_VALUE_STORE_KEY_MAX_LENGTH + 1);
        const result = validateKvsKey(key);
        expect(result.valid).toBe(false);
        if (result.valid) return;
        expect(result.tooLong).toBe(true);
        expect(result.illegalCharacters).toEqual([]);
        expect(result.message).toContain(`length ${key.length} > ${KEY_VALUE_STORE_KEY_MAX_LENGTH}`);
        expect(result.message).not.toContain('illegal character');
    });

    it('gives readable names to whitespace and control characters', () => {
        const result = validateKvsKey('a b\tc\n');
        expect(result.valid).toBe(false);
        if (result.valid) return;
        expect(result.illegalCharacters).toEqual([' ', '\t', '\n']);
        expect(result.message).toContain('(space)');
        expect(result.message).toContain('(tab)');
        expect(result.message).toContain('(newline)');
    });
});

describe('assertValidKvsKey()', () => {
    it('returns silently for a valid key', () => {
        expect(() => assertValidKvsKey('valid_key.json')).not.toThrow();
    });

    it('throws TypeError naming the illegal character', () => {
        expect(() => assertValidKvsKey('price:foo')).toThrow(TypeError);
        expect(() => assertValidKvsKey('price:foo')).toThrow(/illegal character\(s\): ":" \(colon\)/);
    });
});
