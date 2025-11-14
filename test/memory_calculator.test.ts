import type { EvalFunction } from 'mathjs';

import { LruCache } from '@apify/datastructures';
import { calculateDefaultMemoryFromExpression, DEFAULT_MEMORY_MBYTES_MAX_CHARS } from '@apify/utilities';

describe('calculateDefaultMemoryFromExpression', () => {
    const emptyContext = { input: {}, runOptions: {} };

    describe('Basic Evaluation', () => {
        it('correctly calculates and rounds memory from one-line expression', () => {
            const context = { input: { size: 10 }, runOptions: {} };
            // 10 * 1024 = 10240. log2(10240) ~ 13.32. round(13) -> 2^13 = 8192
            const result = calculateDefaultMemoryFromExpression('input.size * 1024', context);
            expect(result).toBe(8192);
        });

        it('correctly calculates and rounds memory from multi-line expression', () => {
            const context = { input: { base: 10, multiplier: 1024 }, runOptions: {} };
            const expr = `
                baseVal = input.base;
                multVal = input.multiplier;
                baseVal * multVal
            `;
            // 10 * 1024 = 10240. Rounds to 8192.
            const result = calculateDefaultMemoryFromExpression(expr, context);
            expect(result).toBe(8192);
        });

        it('correctly accesses runOptions from the context', () => {
            const context = { input: {}, runOptions: { timeoutSecs: 60 } };
            const expr = 'runOptions.timeoutSecs * 100'; // 60 * 100 = 6000
            // log2(6000) ~ 12.55. round(13) -> 2^13 = 8192
            const result = calculateDefaultMemoryFromExpression(expr, context);
            expect(result).toBe(8192);
        });

        it('correctly handles a single number expression', () => {
            // 2048 is 2^11
            const result = calculateDefaultMemoryFromExpression('2048', emptyContext);
            expect(result).toBe(2048);
        });

        it('correctly handles expressions with custom get() function', () => {
            const context = { input: { nested: { value: 20 } }, runOptions: {} };
            const expr = "get(input, 'nested.value', 10) * 50"; // 20 * 50 = 1000
            const result = calculateDefaultMemoryFromExpression(expr, context);
            expect(result).toBe(1024);
        });

        it('should use get() default value when path is invalid', () => {
            const context = { input: { user: {} }, runOptions: {} };
            const expr = "get(input, 'user.settings.memory', 512)";
            const result = calculateDefaultMemoryFromExpression(expr, context);
            expect(result).toBe(512);
        });
    });

    describe('Preprocessing with {{variable}}', () => {
        it('correctly replaces {{variable}} with valid runOptions.variable', () => {
            const context = { input: {}, runOptions: { memoryMbytes: 16 } };
            const expr = '{{memoryMbytes}} * 1024';
            // 16 * 1024 = 16384, which is 2^14
            const result = calculateDefaultMemoryFromExpression(expr, context);
            expect(result).toBe(16384);
        });

        it('should throw error for invalid variable in {{variable}} syntax', () => {
            const context = { input: {}, runOptions: { memoryMbytes: 16 } };
            const expr = '{{unexistingVariable}} * 1024';
            expect(() => calculateDefaultMemoryFromExpression(expr, context))
                .toThrow(`Invalid variable '{{unexistingVariable}}' in expression.`);
        });
    });

    describe('Rounding Logic', () => {
        it('should round down (e.g., 10240 -> 8192)', () => {
            // 2^13 = 8192, 2^14 = 16384.
            const result = calculateDefaultMemoryFromExpression('10240', emptyContext);
            expect(result).toBe(8192);
        });

        it('should round up (e.g., 13000 -> 16384)', () => {
            // 13000 is closer to 16384 than 8192.
            const result = calculateDefaultMemoryFromExpression('13000', emptyContext);
            expect(result).toBe(16384);
        });

        it('should handle values that are already powers of 2', () => {
            // 2^9 = 512
            const result = calculateDefaultMemoryFromExpression('512', emptyContext);
            expect(result).toBe(512);
        });
    });

    describe('Invalid/Error Handling', () => {
        it('should throw an error if expression length is too long', () => {
            const expr = '1'.repeat(DEFAULT_MEMORY_MBYTES_MAX_CHARS + 1); // Assuming max length is 1000
            expect(() => calculateDefaultMemoryFromExpression(expr, emptyContext))
                .toThrow(`The defaultMemoryMbytes expression is too long. Max length is ${DEFAULT_MEMORY_MBYTES_MAX_CHARS} characters.`);
        });

        it('should throw an error for invalid syntax', () => {
            const expr = '1 +* 2';
            // The original function does not have a try/catch, so it *should* throw
            expect(() => calculateDefaultMemoryFromExpression(expr, emptyContext))
                .toThrow();
        });

        it('should return undefined for a 0 result', () => {
            expect(() => calculateDefaultMemoryFromExpression('10 - 10', emptyContext)).toThrow(`Calculated memory value must be a positive number, greater than 0, got: 0`);
        });

        it('should return undefined for a negative result', () => {
            expect(() => calculateDefaultMemoryFromExpression('5 - 10', emptyContext)).toThrow(`Calculated memory value must be a positive number, greater than 0, got: -5`);
        });

        it('should return undefined for a NaN result', () => {
            expect(() => calculateDefaultMemoryFromExpression('0 / 0', emptyContext)).toThrow('Failed to round number to a power of 2.');
        });

        it('should return undefined for a non-numeric (string) result', () => {
            expect(() => calculateDefaultMemoryFromExpression("'hello'", emptyContext)).toThrow('Failed to round number to a power of 2.');
        });

        it('should return undefined for a non-numeric (object) result', () => {
            expect(() => calculateDefaultMemoryFromExpression('{ a: 1, b: 2 }', emptyContext)).toThrow('Failed to round number to a power of 2.');
        });

        it('should return error when disabled functionality of MathJS is used', () => {
            expect(() => calculateDefaultMemoryFromExpression('evaluate(512)', emptyContext)).toThrow('Function evaluate is disabled');
        });
    });

    describe('Caching', () => {
        let cache: LruCache<EvalFunction>;
        const context = { input: { size: 10 }, runOptions: {} };
        const expr = 'input.size * 1024';

        beforeEach(() => {
            cache = new LruCache<EvalFunction>({ maxLength: 10 });
        });

        it('correctly works with cache passed in options', () => {
            expect(cache.length()).toBe(0);

            // First call - cache miss
            const result1 = calculateDefaultMemoryFromExpression(expr, context, { cache });
            expect(result1).toBe(8192);
            expect(cache.length()).toBe(1); // Expression is now cached

            // Second call - cache hit
            const result2 = calculateDefaultMemoryFromExpression(expr, context, { cache });
            expect(result2).toBe(8192);
            expect(cache.length()).toBe(1); // Cache length is unchanged
        });

        it('should cache different expressions separately', () => {
            const expr2 = 'input.size * 2048'; // 10 * 2048 = 20480 -> 16384
            calculateDefaultMemoryFromExpression(expr, context, { cache });
            calculateDefaultMemoryFromExpression(expr2, context, { cache });
            expect(cache.length()).toBe(2);
        });
    });
});
