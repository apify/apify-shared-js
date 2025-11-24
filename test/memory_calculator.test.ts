import type { EvalFunction } from 'mathjs';
import type { CompilationCache } from 'packages/actor-memory-expression/src/types';

import { calculateRunDynamicMemory, DEFAULT_MEMORY_MBYTES_EXPRESSION_MAX_LENGTH } from '@apify/actor-memory-expression';
import { LruCache } from '@apify/datastructures';

describe('calculateDefaultMemoryFromExpression', () => {
    const emptyContext = { input: {}, runOptions: {} };

    describe('Basic evaluation', () => {
        it('correctly calculates and rounds memory from one-line expression', async () => {
            const context = { input: { size: 10 }, runOptions: {} };
            // 10 * 1024 = 10240. log2(10240) ~ 13.32. round(13.32) -> 2^13 = 8192
            const result = await calculateRunDynamicMemory('input.size * 1024', context);
            expect(result).toBe(8192);
        });

        it('correctly calculates and rounds memory from multi-line expression', async () => {
            const context = { input: { base: 10, multiplier: 1024 }, runOptions: {} };
            const expr = `
                baseVal = input.base;
                multVal = input.multiplier;
                baseVal * multVal
            `;
            // 10 * 1024 = 10240. Rounds to 8192.
            const result = await calculateRunDynamicMemory(expr, context);
            expect(result).toBe(8192);
        });

        it('correctly accesses runOptions from the context', async () => {
            const context = { input: {}, runOptions: { timeoutSecs: 60 } };
            const expr = 'runOptions.timeoutSecs * 100'; // 60 * 100 = 6000
            // log2(6000) ~ 12.55. round(13) -> 2^13 = 8192
            const result = await calculateRunDynamicMemory(expr, context);
            expect(result).toBe(8192);
        });

        it('correctly handles a single number expression', async () => {
            const result = await calculateRunDynamicMemory('2048', emptyContext);
            expect(result).toBe(2048);
        });

        it('correctly handles expressions with custom get() function', async () => {
            const context = { input: { nested: { value: 20 } }, runOptions: {} };
            const expr = "get(input, 'nested.value', 10) * 50"; // 20 * 50 = 1000
            const result = await calculateRunDynamicMemory(expr, context);
            expect(result).toBe(1024);
        });

        it('should use get() default value when path is invalid', async () => {
            const context = { input: { user: {} }, runOptions: {} };
            const expr = "get(input, 'user.settings.memory', 512)";
            const result = await calculateRunDynamicMemory(expr, context);
            expect(result).toBe(512);
        });

        describe('operations supported', () => {
            const context = {
                input: { },
                runOptions: { timeoutSecs: 60, memoryMbytes: 512 },
            };

            // Note: all results are rounded to the closest power of 2 and clamped within limits.
            const cases = [
                { expression: '128 + 5', result: 128, name: '+' },
                { expression: '128 - 5', result: 128, name: '-' },
                { expression: '128 / 5', result: 128, name: '/' },
                { expression: '128 * 5', result: 512, name: '*' },
                { expression: 'max(128, 2, 3)', result: 128, name: 'max()' },
                { expression: 'min(128, 512, 1024)', result: 128, name: 'min()' },
                { expression: '(true and false) ? 0 : 128', result: 128, name: 'and' },
                { expression: '(true or false) ? 128 : 0', result: 128, name: 'or' },
                { expression: '(true xor false) ? 128 : 0', result: 128, name: 'xor' },
                { expression: 'not(false) ? 128 : 0', result: 128, name: 'not' },
                { expression: 'null ?? 256', result: 256, name: 'nullish coalescing' },
                { expression: 'a = 128', result: 128, name: '=' },
            ];

            it.each(cases)(
                `supports operation '$name'`,
                async ({ expression, result }) => {
                    // in case operation is not supported, mathjs will throw
                    // we round the result to the closest power of 2 and clamp within limits.
                    expect(await calculateRunDynamicMemory(expression, context)).toBe(result);
                },
            );
        });

        describe('operations supported', () => {
            const context = {
                input: { },
                runOptions: { timeoutSecs: 60, memoryMbytes: 512 },
            };

            // Note: all results are rounded to the closest power of 2 and clamped within limits.
            const cases = [
                { expression: 'evaluate(\'5 + 1\')', name: 'evaluate', error: 'Function evaluate is disabled.' },
                { expression: 'compile(\'5 + 1\')', name: 'compile', error: 'Function compile is disabled.' },
                { expression: "parse('3^2 + 4^2')", name: 'parse', error: 'Function parse is disabled.' },
                { expression: 'simplify(\'5 + 1\')', name: 'simplify', error: 'Undefined function simplify' },
                { expression: 'derivative(\'5 + 1\')', name: 'derivative', error: 'Undefined function derivative' },
                { expression: 'resolve(\'5 + 1\')', name: 'resolve', error: 'Undefined function resolve' },

                { expression: 'import({ myvalue: 42 })', name: 'import', error: 'Undefined function import' },
                { expression: 'createUnit(\'foo\')', name: 'createUnit', error: 'Undefined function createUnit' },
                { expression: 'reviver(\'{"mathjs":"Unit"}\')', name: 'reviver', error: 'Undefined function reviver' },
            ];

            it.each(cases)(
                `supports operation '$name'`,
                async ({ expression, error }) => {
                    // in case operation is not supported, mathjs will throw
                    // we round the result to the closest power of 2 and clamp within limits.
                    await expect(calculateRunDynamicMemory(expression, context)).rejects.toThrow(error);
                },
            );
        });
    });

    describe('Template {{variables}} support', () => {
        it('should throw error if variable doesn\'t start with runOptions. or input.', async () => {
            const context = { input: {}, runOptions: { memoryMbytes: 16 } };
            const expr = '{{nonexistentVariable}} * 1024';
            await expect(calculateRunDynamicMemory(expr, context))
                .rejects.toThrow(`Invalid variable '{{nonexistentVariable}}' in expression.`);
        });

        it('correctly evaluates valid runOptions property', async () => {
            const context = { input: {}, runOptions: { memoryMbytes: 16 } };
            const expr = '{{runOptions.memoryMbytes}} * 1024';
            const result = await calculateRunDynamicMemory(expr, context);
            expect(result).toBe(16384);
        });

        it('correctly evaluates input property', async () => {
            const context = { input: { value: 16 }, runOptions: { } };
            const expr = '{{input.value}} * 1024';
            const result = await calculateRunDynamicMemory(expr, context);
            expect(result).toBe(16384);
        });

        it('should throw error if runOptions property is not supported', async () => {
            const context = { input: { value: 16 }, runOptions: { } };
            const expr = '{{runOptions.customVariable}} * 1024';
            await expect(calculateRunDynamicMemory(expr, context))
                .rejects.toThrow(`Invalid variable '{{runOptions.customVariable}}' in expression. Only the following runOptions are allowed:`);
        });
    });

    describe('Rounding logic', () => {
        it('should round down (e.g., 10240 -> 8192)', async () => {
            // 2^13 = 8192, 2^14 = 16384.
            const result = await calculateRunDynamicMemory('10240', emptyContext);
            expect(result).toBe(8192);
        });

        it('should round up (e.g., 13000 -> 16384)', async () => {
            // 13000 is closer to 16384 than 8192.
            const result = await calculateRunDynamicMemory('13000', emptyContext);
            expect(result).toBe(16384);
        });

        it('should clamp to the minimum memory limit if the result is too low', async () => {
            const result = await calculateRunDynamicMemory('64', emptyContext);
            expect(result).toBe(128);
        });

        it('should clamp to the maximum memory limit if the result is too high', async () => {
            const result = await calculateRunDynamicMemory('100000', emptyContext);
            expect(result).toBe(32768);
        });
    });

    describe('Invalid/error handling', () => {
        it('should throw an error if expression length is greater than DEFAULT_MEMORY_MBYTES_MAX_CHARS', async () => {
            const expr = '1'.repeat(DEFAULT_MEMORY_MBYTES_EXPRESSION_MAX_LENGTH + 1);
            await expect(calculateRunDynamicMemory(expr, emptyContext))
                .rejects.toThrow(`The defaultMemoryMbytes expression is too long. Max length is ${DEFAULT_MEMORY_MBYTES_EXPRESSION_MAX_LENGTH} characters.`);
        });

        it('should throw an error for invalid syntax', async () => {
            const expr = '1 +* 2';
            await expect(calculateRunDynamicMemory(expr, emptyContext))
                .rejects.toThrow();
        });

        it('should throw error if result is 0', async () => {
            await expect(calculateRunDynamicMemory('10 - 10', emptyContext)).rejects.toThrow(`Calculated memory value must be a positive number, greater than 0, got: 0.`);
        });

        it('should throw error if result is negative', async () => {
            await expect(calculateRunDynamicMemory('5 - 10', emptyContext)).rejects.toThrow(`Calculated memory value must be a positive number, greater than 0, got: -5.`);
        });

        it('should throw error if result is NaN', async () => {
            await expect(calculateRunDynamicMemory('0 / 0', emptyContext)).rejects.toThrow('Calculated memory value is not a valid number: NaN.');
        });

        it('should throw error if result is Infinity', async () => {
            await expect(calculateRunDynamicMemory('Infinity', emptyContext)).rejects.toThrow('Calculated memory value is not a valid number: Infinity.');
            await expect(calculateRunDynamicMemory('-Infinity', emptyContext)).rejects.toThrow('Calculated memory value is not a valid number: -Infinity.');
        });

        it('should throw error if result is a non-numeric (string)', async () => {
            await expect(calculateRunDynamicMemory("'hello'", emptyContext)).rejects.toThrow('Calculated memory value is not a valid number: hello.');
        });

        it('should throw error when disabled functionality of MathJS is used', async () => {
            await expect(calculateRunDynamicMemory('evaluate(512)', emptyContext)).rejects.toThrow('Function evaluate is disabled.');
        });
    });

    describe('Caching', () => {
        let cache: CompilationCache;
        const context = { input: { size: 10 }, runOptions: {} };
        const expr = 'input.size * 1024';

        beforeEach(() => {
            const lruCache = new LruCache<EvalFunction>({ maxLength: 10 });
            cache = {
                get: async (expression: string) => lruCache.get(expression),
                set: async (expression: string, compilationResult: EvalFunction) => { lruCache.add(expression, compilationResult); },
                size: async () => lruCache.length(),
            };
        });

        it('correctly works with cache passed in options', async () => {
            expect(await cache.size()).toBe(0);

            // First call - cache miss
            const result1 = await calculateRunDynamicMemory(expr, context, { cache });
            expect(result1).toBe(8192);
            expect(await cache.size()).toBe(1); // Expression is now cached

            // Second call - cache hit
            const result2 = await calculateRunDynamicMemory(expr, context, { cache });
            expect(result2).toBe(8192);
            expect(await cache.size()).toBe(1); // Cache length is unchanged
        });

        it('should cache different expressions separately', async () => {
            const expr2 = 'input.size * 2048'; // 10 * 2048 = 20480 -> 16384
            await calculateRunDynamicMemory(expr, context, { cache });
            await calculateRunDynamicMemory(expr2, context, { cache });
            expect(await cache.size()).toBe(2);
        });
    });
});
