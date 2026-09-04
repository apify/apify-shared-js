import { z } from 'zod';

// Messages are formatted (and asserted on by consumers) in English, regardless of any global locale.
const { localeError } = z.locales.en();

/** Formats a zod issue path like `groups[0]` or `countryCode`. */
function formatIssuePath(path: readonly PropertyKey[]): string {
    let out = '';
    for (const key of path) {
        if (typeof key === 'number') out += `[${key}]`;
        else out += out ? `.${String(key)}` : String(key);
    }
    return out;
}

/** Reads the value at `path` from the validated input, to include in the error. */
function valueAtPath(root: unknown, path: readonly PropertyKey[]): unknown {
    let current = root;
    for (const key of path) {
        if (current === null || typeof current !== 'object') return undefined;
        current = (current as Record<PropertyKey, unknown>)[key];
    }
    return current;
}

/** Names the runtime type of `value` the way zod's own messages do (`null`, `array`, `string`, …). */
function describeType(value: unknown): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
}

/** The bare custom-schema messages that stop at the expected type, e.g. `Invalid input: expected number`. */
const BARE_EXPECTED_TYPE_MESSAGE =
    /^Invalid input: expected (an array of .+|a typed array|an object|object|array|function|number|string|boolean)$/;

/**
 * How much of a received string the message renders. A rejected argument can be arbitrarily large - a
 * whole JSON payload passed where an object was expected - and its full text would swamp the message.
 */
const MAX_RENDERED_STRING_LENGTH = 200;

/** Renders a primitive received value for an error; skips objects/Dates (noisy). */
function describeReceived(value: unknown): string | undefined {
    switch (typeof value) {
        case 'string':
            // An empty string would render as bare backticks — make it visible.
            if (value === '') return "''";
            return value.length > MAX_RENDERED_STRING_LENGTH
                ? `${value.slice(0, MAX_RENDERED_STRING_LENGTH)}… (${value.length - MAX_RENDERED_STRING_LENGTH} more characters)`
                : value;
        case 'number':
        case 'boolean':
            return String(value);
        case 'bigint':
            // Keep the `n` suffix, so a rejected bigint is not mistaken for a number.
            return `${value}n`;
        default:
            return undefined;
    }
}

/** Renders the received side of a sentence: ``received the string `abc` ``, `received NaN`, `received array`. */
function describeReceivedClause(value: unknown): string {
    if (typeof value === 'number' && Number.isNaN(value)) return 'received NaN';
    if (value === '') return 'received an empty string';
    const rendered = describeReceived(value);
    return rendered === undefined
        ? `received ${describeType(value)}`
        : `received the ${describeType(value)} \`${rendered}\``;
}

/**
 * Renders the issue's own sentence, except where zod's contradicts itself: a value of the expected type
 * that fails that type's implicit constraint is still reported as the wrong *type*, giving "expected
 * number, received number" for `Infinity` / `NaN` and "expected date, received Date" for an invalid
 * `Date`. Name the constraint that actually failed instead.
 */
function describeIssue(issue: z.ZodError['issues'][number], value: unknown): string {
    if (issue.code === 'invalid_type') {
        if (issue.expected === 'number' && typeof value === 'number') {
            return 'Invalid input: expected a finite number';
        }
        // A tag check, not `instanceof`, so a `Date` from another realm is named too.
        if (issue.expected === 'date' && Object.prototype.toString.call(value) === '[object Date]') {
            return 'Invalid input: expected a valid date';
        }
    }
    return issue.message;
}

/**
 * How many issue lines the message renders, before a closing "... and N more" line. Validating a
 * large array - a dataset push, a request batch - can fail on every element, and rendering all of
 * them would make the message megabytes long. The full set stays on `issues` either way.
 */
const MAX_RENDERED_LINES = 10;

/**
 * How deep into the value the lines for `issue` would sit, as a path length. Computed without
 * rendering anything, so a union can weigh its arms before any string is built.
 */
function deepestIssueDepth(issue: z.ZodError['issues'][number], baseDepth: number): number {
    const depth = baseDepth + issue.path.length;
    if (issue.code === 'invalid_union') {
        let deepest = -1;
        for (const arm of issue.errors) {
            for (const nested of arm) deepest = Math.max(deepest, deepestIssueDepth(nested, depth));
        }
        return deepest;
    }
    return depth;
}

/** Collects one line per issue into `lines`; a union expands into a line per deepest-failing arm. */
function collectIssueLines(
    issue: z.ZodError['issues'][number],
    root: unknown,
    basePath: readonly PropertyKey[],
    lines: string[],
    counter: { total: number },
): void {
    const path = [...basePath, ...issue.path];
    // A union's own message is a bare "Invalid input" - the useful part is in `errors`,
    // whose paths are relative to the union, hence passing `path` down as the base.
    if (issue.code === 'invalid_union') {
        // Only the arms that reached deepest are reported. An arm that failed nearer the root rejected a
        // shape the value never had - for `[{ ok: 1 }, 2]` against `object | string | array`, the object
        // and string arms fail on the whole array, and only the array arm can point at `[1]`. When every
        // arm fails at the same depth, as for an argument of an outright wrong type, they are all kept.
        const armDepths = issue.errors.map((arm) =>
            arm.reduce((deepest, nested) => Math.max(deepest, deepestIssueDepth(nested, path.length)), -1),
        );
        const deepest = Math.max(...armDepths);
        for (const [index, arm] of issue.errors.entries()) {
            if (armDepths[index] !== deepest) continue;
            for (const nested of arm) collectIssueLines(nested, root, path, lines, counter);
        }
        return;
    }

    counter.total += 1;
    if (lines.length >= MAX_RENDERED_LINES) return;

    const location = path.length ? ` at \`${formatIssuePath(path)}\`` : '';
    const value = valueAtPath(root, path);
    const rendered = describeReceived(value);

    // ow named the received type ("expected `number` but received type `string`"). The received value is
    // folded into that clause (``received the string `3` ``) rather than dangling after the location: our
    // custom schemas stop at the expected type, so the clause is appended; zod's built-in messages already
    // end with `, received <type>`, so that tail is replaced with the enriched one.
    let message = describeIssue(issue, value);
    let got = '';
    const bareExpected = BARE_EXPECTED_TYPE_MESSAGE.exec(message);
    const zodReceived = /, received (\S+)$/.exec(message);
    // `arrayOf` messages name the element type — their expected runtime type is `array`.
    const expectedType = bareExpected?.[1].startsWith('an array of') ? 'array' : bareExpected?.[1];
    if (bareExpected && expectedType !== (Number.isNaN(value as number) ? 'NaN' : describeType(value))) {
        message += `, ${describeReceivedClause(value)}`;
    } else if (zodReceived && zodReceived[1] === describeType(value) && rendered !== undefined) {
        message = `${message.slice(0, zodReceived.index)}, ${describeReceivedClause(value)}`;
    } else if (rendered !== undefined && !message.endsWith(`received ${rendered}`)) {
        // Messages that never name a received type (regex, min/max, enums) keep the plain value suffix.
        got = `, got \`${rendered}\``;
    }

    lines.push(`${message}${location}${got}`);
}

/**
 * Formats a `ZodError` as a plain, human-readable message that names the
 * offending field *and* the value it received (e.g. ``must match pattern
 * /^[A-Z]{2}$/ at `countryCode`, got `CZE` ``) — closer to the old `ow` errors
 * than zod's default, which omits the received value.
 */
function formatZodError(error: z.ZodError, root: unknown, label?: string): string {
    const lines: string[] = [];
    const counter = { total: 0 };
    for (const issue of error.issues) collectIssueLines(issue, root, [], lines, counter);

    // The label names the validated interface, the way ow's errors ended with "in object `X`".
    const rendered = label ? lines.map((line) => `${line} in \`${label}\``) : [...lines];
    const hidden = counter.total - lines.length;
    if (hidden > 0) rendered.push(`... and ${hidden} more problem${hidden === 1 ? '' : 's'}`);
    return rendered.join('\n');
}

/**
 * Thrown when an argument fails schema validation.
 *
 * Its `message` is a human-readable sentence naming the offending field and the
 * value it received (rather than a raw JSON dump). The structured
 * {@link https://zod.dev | zod} issues are available on `issues`, and the
 * original `ZodError` on `cause`, for programmatic inspection.
 */
export class ArgumentValidationError extends Error {
    /** Structured issues from the underlying schema check. */
    readonly issues: z.ZodError['issues'];

    /** The raw zod error that triggered this. */
    override readonly cause: z.ZodError;

    constructor(error: z.ZodError, value: unknown, label?: string) {
        super(formatZodError(error, value, label), { cause: error });
        this.name = 'ArgumentValidationError';
        this.issues = error.issues;
        this.cause = error;
    }
}

/**
 * Parses `value` with `schema`, returning the typed result (with schema defaults applied).
 * Throws {@link ArgumentValidationError} on failure.
 *
 * The optional `label` names the interface being validated and is appended to every error line
 * (e.g. ``… at `maxRequestRetries` in `BasicCrawlerOptions` ``).
 * @internal
 */
export function parseArgument<TValue, TSchema extends z.ZodType>(
    value: TValue,
    schema: TSchema,
    label?: string,
): TValue & z.output<TSchema> {
    const result = schema.safeParse(value, { error: localeError });
    if (!result.success) throw new ArgumentValidationError(result.error, value, label);
    return result.data as TValue & z.output<TSchema>;
}

/**
 * Matches any non-null object, arrays included — the same values the old `ow.object`
 * accepted. A `z.custom()` predicate rather than an object schema, so parsing returns
 * the value itself instead of a copy.
 * @internal
 */
export const objectSchema = z.custom<object>((value) => typeof value === 'object' && value !== null, {
    error: 'Invalid input: expected object',
});
