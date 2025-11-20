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

type ActorRunOptions = {
    build?: string;
    timeoutSecs?: number;
    memoryMbytes?: number; // probably no one will need it, but let's keep it consistent
    diskMbytes?: number; // probably no one will need it, but let's keep it consistent
    maxItems?: number;
    maxTotalChargeUsd?: number;
    restartOnError?: boolean;
}

type MemoryEvaluationContext = {
    runOptions: ActorRunOptions;
    input: Record<string, unknown>;
}

export const DEFAULT_MEMORY_MBYTES_MAX_CHARS = 1000;

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
    // arithmetic dependencies
    addDependencies,
    subtractDependencies,
    multiplyDependencies,
    divideDependencies,
    // expression dependencies
    compileDependencies,
    evaluateDependencies,
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
const limitedEvaluate = math.evaluate;
const limitedCompile = math.compile;

// Disable potentially dangerous functions
math.import({
    // most important (hardly any functional impact)
    import() { throw new Error('Function import is disabled'); },
    createUnit() { throw new Error('Function createUnit is disabled'); },
    reviver() { throw new Error('Function reviver is disabled'); },

    // extra (has functional impact)
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
        throw new Error(`Failed to round number to a power of 2.`);
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
 * Replaces `{{variable}}` placeholders in an expression string with the variable name.
 * Enforces strict validation to allow `{{input.*}}` paths or whitelisted `{{runOptions.*}}` keys.
 *
 * @example
 * // Returns "runOptions.memoryMbytes + 1024"
 * preprocessDefaultMemoryExpression("{{runOptions.memoryMbytes}} + 1024");
 *
 * @param defaultMemoryMbytes The raw string expression, e.g., "{{runOptions.memoryMbytes}} * 2".
 * @returns A safe, processed expression for evaluation, e.g., "runOptions.memoryMbytes * 2".
 */
const preprocessRunMemoryExpression = (defaultMemoryMbytes: string): string => {
    const variableRegex = /{{\s*([a-zA-Z0-9_.]+)\s*}}/g;

    const processedExpression = defaultMemoryMbytes.replace(
        variableRegex,
        (_, variableName: string) => {
            // 1. Validate that the variable starts with either 'input.' or 'runOptions.'
            if (!variableName.startsWith('runOptions.') && !variableName.startsWith('input.')) {
                throw new Error(
                    `Invalid variable '{{${variableName}}}' in expression. Variables must start with 'input.' or 'runOptions.'.`,
                );
            }

            // 2. Check if the variable is accessing input (e.g. {{input.someValue}})
            // We do not validate the specific property name because input is dynamic.
            if (variableName.startsWith('input.')) {
                return variableName;
            }

            // 3. Check if the variable is accessing runOptions (e.g. {{runOptions.memoryMbytes}}) and validate the keys.
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

/**
 * Evaluates a dynamic memory expression string using the provided context.
 * Result is rounded to the closest power of 2 and clamped within allowed limits.
 *
 * @param defaultMemoryMbytes The string expression to evaluate (e.g., "get(input, 'size', 10) * 1024").
 * @param context The `MemoryEvaluationContext` (containing `input` and `runOptions`) available to the expression.
 * @returns The calculated memory value rounded to the closest power of 2 clamped within allowed limits.
*/
export const calculateRunDynamicMemory = (
    defaultMemoryMbytes: string,
    context: MemoryEvaluationContext,
    options: { cache: LruCache<EvalFunction> } | undefined = undefined,
) => {
    if (defaultMemoryMbytes.length > DEFAULT_MEMORY_MBYTES_MAX_CHARS) {
        throw new Error(`The defaultMemoryMbytes expression is too long. Max length is ${DEFAULT_MEMORY_MBYTES_MAX_CHARS} characters.`);
    }

    // Replaces all occurrences of {{variable}} with variable
    // e.g., "{{runOptions.memoryMbytes}} + 1024" becomes "runOptions.memoryMbytes + 1024"
    const preprocessedExpression = preprocessRunMemoryExpression(defaultMemoryMbytes);

    const preparedContext = {
        ...context,
        get: customGetFunc,
    };

    let finalResult: number | { entries: number[] };

    if (options?.cache) {
        let compiledExpr = options.cache.get(preprocessedExpression);

        if (!compiledExpr) {
            compiledExpr = limitedCompile(preprocessedExpression);
            options.cache.add(preprocessedExpression, compiledExpr!);
        }

        finalResult = compiledExpr.evaluate(preparedContext);
    } else {
        finalResult = limitedEvaluate(preprocessedExpression, preparedContext);
    }

    // Mathjs wraps multi-line expressions in an object, so we need to extract the last entry.
    // Note: one-line expressions return a number directly.
    if (finalResult && typeof finalResult === 'object' && 'entries' in finalResult) {
        const { entries } = finalResult;
        finalResult = entries[entries.length - 1];
    }

    return roundToClosestPowerOf2(finalResult);
};
