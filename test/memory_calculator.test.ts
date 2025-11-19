import type { EvalFunction } from 'mathjs';

import { LruCache } from '@apify/datastructures';
import { calculateDefaultMemoryFromExpression, DEFAULT_MEMORY_MBYTES_MAX_CHARS } from '@apify/math-utils';

describe('calculateDefaultMemoryFromExpression', () => {
    const emptyContext = { input: {}, runOptions: {} };

    describe('Basic Evaluation', () => {
        it('correctly calculates and rounds memory from one-line expression', () => {
            const context = { input: { size: 10 }, runOptions: {} };
            // 10 * 1024 = 10240. log2(10240) ~ 13.32. round(13.32) -> 2^13 = 8192
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

        describe('operations supported', () => {
            const context = {
                input: { },
                runOptions: { timeoutSecs: 60, memoryMbytes: 512 },
            };

            const cases = [
                { expression: '5 + 5', desc: '+ allowed' },
                { expression: '6 - 5', desc: '- allowed' },
                { expression: '5 / 5', desc: '/ allowed' },
                { expression: '5 * 5', desc: '* allowed' },
                { expression: 'max(1, 2, 3)', desc: 'max() allowed' },
                { expression: 'min(1, 2, 3)', desc: 'min() allowed' },
                { expression: '(true and false) ? 0 : 5', desc: 'and allowed' },
                { expression: '(true or false) ? 5 : 0', desc: 'or allowed' },
                { expression: '(true xor false) ? 5 : 0', desc: 'xor allowed' },
                { expression: 'not(false) ? 5 : 0', desc: 'not allowed' },
                { expression: 'null ?? 256', desc: 'nullish coalescing allowed' },
                { expression: 'a = 5', desc: 'variable assignment' },
            ];

            it.each(cases)(
                '$desc',
                ({ expression }) => {
                    // in case operation is not supported, mathjs will throw
                    expect(calculateDefaultMemoryFromExpression(expression, context)).toBeDefined();
                },
            );
        });
    });

    describe('Preprocessing with {{variable}}', () => {
        it('should throw error if variable doesn\'t start with .runOptions or .input', () => {
            const context = { input: {}, runOptions: { memoryMbytes: 16 } };
            const expr = '{{unexistingVariable}} * 1024';
            expect(() => calculateDefaultMemoryFromExpression(expr, context))
                .toThrow(`Invalid variable '{{unexistingVariable}}' in expression. Variables must start with 'input.' or 'runOptions.'.`);
        });

        it('correctly replaces {{runOptions.variable}} with valid runOptions.variable', () => {
            const context = { input: {}, runOptions: { memoryMbytes: 16 } };
            const expr = '{{runOptions.memoryMbytes}} * 1024';
            const result = calculateDefaultMemoryFromExpression(expr, context);
            expect(result).toBe(16384);
        });

        it('correctly replaces {{input.variable}} with valid input.variable', () => {
            const context = { input: { value: 16 }, runOptions: { } };
            const expr = '{{input.value}} * 1024';
            const result = calculateDefaultMemoryFromExpression(expr, context);
            expect(result).toBe(16384);
        });

        it('should throw error if runOptions variable is invalid', () => {
            const context = { input: { value: 16 }, runOptions: { } };
            const expr = '{{runOptions.customVariable}} * 1024';
            expect(() => calculateDefaultMemoryFromExpression(expr, context))
                .toThrow(`Invalid variable '{{runOptions.customVariable}}' in expression. Only the following runOptions are allowed:`);
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

        it('should clamp to the minimum memory limit if the result is too low', () => {
            const result = calculateDefaultMemoryFromExpression('64', emptyContext);
            expect(result).toBe(128);
        });

        it('should clamp to the maximum memory limit if the result is too high', () => {
            const result = calculateDefaultMemoryFromExpression('100000', emptyContext);
            expect(result).toBe(32768);
        });
    });

    describe('Invalid/Error Handling', () => {
        it('should throw an error if expression length is greater than DEFAULT_MEMORY_MBYTES_MAX_CHARS', () => {
            const expr = '1'.repeat(DEFAULT_MEMORY_MBYTES_MAX_CHARS + 1); // Assuming max length is 1000
            expect(() => calculateDefaultMemoryFromExpression(expr, emptyContext))
                .toThrow(`The defaultMemoryMbytes expression is too long. Max length is ${DEFAULT_MEMORY_MBYTES_MAX_CHARS} characters.`);
        });

        it('should throw an error for invalid syntax', () => {
            const expr = '1 +* 2';
            expect(() => calculateDefaultMemoryFromExpression(expr, emptyContext))
                .toThrow();
        });

        it('should throw error if result is 0', () => {
            expect(() => calculateDefaultMemoryFromExpression('10 - 10', emptyContext)).toThrow(`Calculated memory value must be a positive number, greater than 0, got: 0`);
        });

        it('should throw error if result is negative', () => {
            expect(() => calculateDefaultMemoryFromExpression('5 - 10', emptyContext)).toThrow(`Calculated memory value must be a positive number, greater than 0, got: -5`);
        });

        it('should throw error if result is NaN', () => {
            expect(() => calculateDefaultMemoryFromExpression('0 / 0', emptyContext)).toThrow('Failed to round number to a power of 2.');
        });

        it('should throw error if result is a non-numeric (string)', () => {
            expect(() => calculateDefaultMemoryFromExpression("'hello'", emptyContext)).toThrow('Failed to round number to a power of 2.');
        });

        it('should throw error when disabled functionality of MathJS is used', () => {
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
