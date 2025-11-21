// MathJS bundle with only numbers is ~2x smaller than the default one.
import {
    addDependencies,
    andDependencies,
    compileDependencies,
    create,
    divideDependencies,
    type EvalFunction,
    evaluateDependencies,
    maxDependencies,
    minDependencies,
    multiplyDependencies,
    notDependencies,
    // @ts-expect-error nullishDependencies is not declared in types. https://github.com/josdejong/mathjs/issues/3597
    nullishDependencies,
    orDependencies,
    subtractDependencies,
    xorDependencies,
} from 'mathjs';

import { ACTOR_LIMITS } from '@apify/consts';

import type { LruCache } from '../../datastructures/src/lru_cache';
import type { ActorRunOptions, MemoryEvaluationContext } from './types.js';

// In theory, users could create expressions longer than 1000 characters,
// but in practice, it's unlikely anyone would need that much complexity.
// Later we can increase this limit if needed.
export const DEFAULT_MEMORY_MBYTES_EXPRESSION_MAX_LENGTH = 1000;

/**
 * A Set of allowed keys from ActorRunOptions that can be used in
 * the {{runOptions.variable}} syntax.
 */
const ALLOWED_RUN_OPTION_KEYS = new Set<keyof ActorRunOptions>([
    'build',
    'timeoutSecs',
    'memoryMbytes',
    'diskMbytes',
    'maxItems',
    'maxTotalChargeUsd',
    'restartOnError',
]);

/**
 * Create a mathjs instance with selected dependencies, then disable potentially dangerous ones.
 * MathJS security recommendations: https://mathjs.org/docs/expressions/security.html
 */
const math = create({
    // expression dependencies
    // Required for compiling and evaluating root expressions.
    // We disable it below to prevent users from calling `evaluate()` inside their expressions.
    // For example: defaultMemoryMbytes = "evaluate('2 + 2')"
    compileDependencies,
    evaluateDependencies,

    // arithmetic dependencies
    addDependencies,
    subtractDependencies,
    multiplyDependencies,
    divideDependencies,
    // statistics dependencies
    maxDependencies,
    minDependencies,
    // logical dependencies
    andDependencies,
    notDependencies,
    orDependencies,
    xorDependencies,
    // without that dependency 'null ?? 5', won't work
    nullishDependencies,
});
const { compile } = math;

// Disable potentially dangerous functions
math.import({
    // most important (hardly any functional impact)
    import() { throw new Error('Function import is disabled'); },
    createUnit() { throw new Error('Function createUnit is disabled'); },
    reviver() { throw new Error('Function reviver is disabled'); },

    // extra (has functional impact)
    // We disable evaluate to prevent users from calling it inside their expressions.
    // For example: defaultMemoryMbytes = "evaluate('2 + 2')"
    evaluate() { throw new Error('Function evaluate is disabled'); },
    parse() { throw new Error('Function parse is disabled'); },
    simplify() { throw new Error('Function simplify is disabled'); },
    derivative() { throw new Error('Function derivative is disabled'); },
    resolve() { throw new Error('Function resolve is disabled'); },
}, { override: true });

/**
 * Safely retrieves a nested property from an object using a dot-notation string path.
 *
 * This is custom function designed to be injected into the math expression evaluator,
 * allowing expressions like `get(input, 'user.settings.memory', 512)`.
 *
 * @param obj The source object to search within.
 * @param path A dot-separated string representing the nested path (e.g., "input.payload.size").
 * @param defaultVal The value to return if the path is not found or the value is `null` or `undefined`.
 * @returns The retrieved value, or `defaultVal` if the path is unreachable.
*/
const customGetFunc = (obj: any, path: string, defaultVal?: number) => {
    return (path.split('.').reduce((current, key) => current?.[key], obj)) ?? defaultVal;
};

/**
 * Rounds a number to the closest power of 2.
 * The result is clamped to the allowed range (ACTOR_LIMITS.MIN_RUN_MEMORY_MBYTES - ACTOR_LIMITS.MAX_RUN_MEMORY_MBYTES).
 * @param num The number to round.
 * @returns The closest power of 2 within min/max range.
*/
const roundToClosestPowerOf2 = (num: number): number | undefined => {
    if (typeof num !== 'number' || Number.isNaN(num)) {
        throw new Error(`Calculated memory value is not a valid number: ${num}.`);
    }

    // Handle 0 or negative values.
    if (num <= 0) {
        throw new Error(`Calculated memory value must be a positive number, greater than 0, got: ${num}`);
    }

    const log2n = Math.log2(num);

    const roundedLog = Math.round(log2n);
    const result = 2 ** roundedLog;

    return Math.max(ACTOR_LIMITS.MIN_RUN_MEMORY_MBYTES, Math.min(result, ACTOR_LIMITS.MAX_RUN_MEMORY_MBYTES));
};

/**
 * Replaces all `{{variable}}` placeholders in an expression into direct
 * property access (e.g. `{{runOptions.memoryMbytes}}` → `runOptions.memoryMbytes`).
 *
 * Only variables starting with `input.` or whitelisted `runOptions.` keys are allowed.
 * All `input.*` values are accepted, while `runOptions.*` are validated (only 7 variables - ALLOWED_RUN_OPTION_KEYS).
 *
 * Note: this approach allows developers to use a consistent double-brace
 * syntax (`{{runOptions.timeoutSecs}}`) across the platform.
 *
 * @example
 * // Returns "runOptions.memoryMbytes + 1024"
 * preprocessDefaultMemoryExpression("{{runOptions.memoryMbytes}} + 1024");
 *
 * @param defaultMemoryMbytes The raw string expression, e.g., "{{runOptions.memoryMbytes}} * 2".
 * @returns A safe, processed expression for evaluation, e.g., "runOptions.memoryMbytes * 2".
 */
const processTemplateVariables = (defaultMemoryMbytes: string): string => {
    const variableRegex = /{{\s*([a-zA-Z0-9_.]+)\s*}}/g;

    const processedExpression = defaultMemoryMbytes.replace(
        variableRegex,
        (_, variableName: string) => {
            if (!variableName.startsWith('runOptions.') && !variableName.startsWith('input.')) {
                throw new Error(
                    `Invalid variable '{{${variableName}}}' in expression. Variables must start with 'input.' or 'runOptions.'.`,
                );
            }

            // 1. Check if the variable is accessing input (e.g. {{input.someValue}})
            // We do not validate the specific property name because `input` is dynamic.
            if (variableName.startsWith('input.')) {
                return variableName;
            }

            // 2. Check if the variable is accessing runOptions (e.g. {{runOptions.memoryMbytes}}) and validate the keys.
            if (variableName.startsWith('runOptions.')) {
                const key = variableName.slice('runOptions.'.length);
                if (!ALLOWED_RUN_OPTION_KEYS.has(key as keyof ActorRunOptions)) {
                    throw new Error(
                        `Invalid variable '{{${variableName}}}' in expression. Only the following runOptions are allowed: ${Array.from(ALLOWED_RUN_OPTION_KEYS).map((k) => `runOptions.${k}`).join(', ')}.`,
                    );
                }
                return variableName;
            }

            // 3. Throw error for unrecognized variables (e.g. {{someVariable}})
            throw new Error(
                `Invalid variable '{{${variableName}}}' in expression.`,
            );
        },
    );

    return processedExpression;
};

const getCompiledExpression = (expression: string, cache: LruCache<EvalFunction> | undefined): EvalFunction => {
    if (!cache) {
        return compile(expression);
    }

    let compiledExpression = cache.get(expression);

    if (!compiledExpression) {
        compiledExpression = compile(expression);
        cache.add(expression, compiledExpression!);
    }

    return compiledExpression;
};

/**
 * Evaluates a dynamic memory expression string using the provided context.
 * Result is rounded to the closest power of 2 and clamped within allowed limits.
 *
 * @param defaultMemoryMbytes The string expression to evaluate (e.g., `get(input, 'urls.length', 10) * 1024` for `input = { urls: ['url1', 'url2'] }`).
 * @param context The `MemoryEvaluationContext` (containing `input` and `runOptions`) available to the expression.
 * @returns The calculated memory value rounded to the closest power of 2 clamped within allowed limits.
*/
export const calculateRunDynamicMemory = (
    defaultMemoryMbytes: string,
    context: MemoryEvaluationContext,
    options: { cache: LruCache<EvalFunction> } | undefined = undefined,
) => {
    if (defaultMemoryMbytes.length > DEFAULT_MEMORY_MBYTES_EXPRESSION_MAX_LENGTH) {
        throw new Error(`The defaultMemoryMbytes expression is too long. Max length is ${DEFAULT_MEMORY_MBYTES_EXPRESSION_MAX_LENGTH} characters.`);
    }

    // Replaces all occurrences of {{variable}} with variable
    // e.g., "{{runOptions.memoryMbytes}} + 1024" becomes "runOptions.memoryMbytes + 1024"
    const preprocessedExpression = processTemplateVariables(defaultMemoryMbytes);

    const preparedContext = {
        ...context,
        get: customGetFunc,
    };

    const compiledExpression = getCompiledExpression(preprocessedExpression, options?.cache);

    let finalResult: number | { entries: number[] } = compiledExpression.evaluate(preparedContext);

    // Mathjs wraps multi-line expressions in an object, so we need to extract the last entry.
    // Note: one-line expressions return a number directly.
    if (finalResult && typeof finalResult === 'object' && 'entries' in finalResult) {
        const { entries } = finalResult;
        finalResult = entries[entries.length - 1];
    }

    return roundToClosestPowerOf2(finalResult);
};
