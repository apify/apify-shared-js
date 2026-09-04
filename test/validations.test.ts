import { describe, expect, test } from 'vitest';
import { z } from 'zod';

import { ArgumentValidationError, objectSchema, parseArgument } from '@apify/validations';

const anyNumber = z.custom<number>((value) => typeof value === 'number' && !Number.isNaN(value), {
    error: 'Invalid input: expected number',
});

describe('objectSchema', () => {
    test.each([
        ['plain object', {}],
        ['array', [1, 2, 3]],
        ['class instance', new Date()],
    ])('accepts %s', (_, value) => {
        expect(objectSchema.safeParse(value).success).toBe(true);
    });

    test.each([
        ['null', null],
        ['undefined', undefined],
        ['string', 'foo'],
        ['number', 123],
        ['function', () => {}],
    ])('rejects %s', (_, value) => {
        expect(objectSchema.safeParse(value).success).toBe(false);
    });

    test('parsing returns the value itself instead of a copy', () => {
        const obj = { foo: 'bar' };
        expect(parseArgument(obj, objectSchema)).toBe(obj);
    });
});

describe('parseArgument', () => {
    test('throws ArgumentValidationError naming the received value', () => {
        let error!: ArgumentValidationError;
        try {
            parseArgument('not an object', objectSchema);
        } catch (err) {
            error = err as ArgumentValidationError;
        }

        expect(error).toBeInstanceOf(ArgumentValidationError);
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('ArgumentValidationError');
        expect(error.message).toBe('Invalid input: expected object, received the string `not an object`');
        expect(error.cause).toBeInstanceOf(z.ZodError);
        expect(error.issues).toBe(error.cause.issues);
        expect(error.issues.length).toBeGreaterThan(0);
    });

    test('message names the offending field and the value it received', () => {
        const schema = z
            .object({
                countryCode: z.string().regex(/^[A-Z]{2}$/),
                retries: z.number().optional(),
            })
            .strict();

        expect(() => parseArgument({ countryCode: 'CZE' }, schema)).toThrow(
            'Invalid string: must match pattern /^[A-Z]{2}$/ at `countryCode`, got `CZE`',
        );
    });

    test('message folds the received type and value into one clause', () => {
        expect(() => parseArgument({ retries: 'three' }, z.strictObject({ retries: anyNumber }))).toThrow(
            'Invalid input: expected number, received the string `three` at `retries`',
        );

        // `NaN` is named as itself, not as the self-contradictory "received number".
        expect(() => parseArgument(Number.NaN, anyNumber)).toThrow('Invalid input: expected number, received NaN');

        // An empty string would render as bare backticks — made visible instead.
        expect(() => parseArgument('', anyNumber)).toThrow('Invalid input: expected number, received an empty string');

        // Long strings are elided rather than dumped whole into the message.
        expect(() => parseArgument('a'.repeat(250), anyNumber)).toThrow(
            `Invalid input: expected number, received the string \`${'a'.repeat(200)}… (50 more characters)\``,
        );
    });

    test('message names the finiteness constraint where zod contradicts itself', () => {
        const schema = z.strictObject({ timeoutSecs: z.number() });

        // Zod's own sentence for these is the self-contradictory "expected number, received number".
        expect(() => parseArgument({ timeoutSecs: Infinity }, schema)).toThrow(
            'Invalid input: expected a finite number at `timeoutSecs`, got `Infinity`',
        );
        expect(() => parseArgument({ timeoutSecs: Number.NaN }, schema)).toThrow(
            'Invalid input: expected a finite number at `timeoutSecs`, got `NaN`',
        );
    });

    test('message names the validity constraint for an invalid Date', () => {
        const schema = z.strictObject({ startedBefore: z.date() });

        // Zod's own sentence for this one is the self-contradictory "expected date, received Date".
        expect(() => parseArgument({ startedBefore: new Date('nonsense') }, schema)).toThrow(
            'Invalid input: expected a valid date at `startedBefore`',
        );
    });

    test('message renders a bigint with its suffix', () => {
        const schema = z.strictObject({ retries: z.number() });

        expect(() => parseArgument({ retries: 1n }, schema)).toThrow(
            'Invalid input: expected number, received the bigint `1n` at `retries`',
        );
    });

    test('message points at the offending array element', () => {
        const schema = z.object({ groups: z.array(z.object({ name: z.string() })) });

        expect(() => parseArgument({ groups: [{ name: 'ok' }, { name: 7 }] }, schema)).toThrow(
            'Invalid input: expected string, received the number `7` at `groups[1].name`',
        );
    });

    test('label names the validated interface on every line', () => {
        const schema = z.strictObject({ retries: anyNumber, name: z.string() });

        expect(() => parseArgument({ retries: 'three', name: 7 }, schema, 'ExampleOptions')).toThrow(
            'Invalid input: expected number, received the string `three` at `retries` in `ExampleOptions`\n' +
                'Invalid input: expected string, received the number `7` at `name` in `ExampleOptions`',
        );
    });

    test('applies schema defaults in the returned value', () => {
        const schema = z.strictObject({ limit: z.number().default(42) });
        expect(parseArgument({}, schema)).toEqual({ limit: 42 });
    });
});

// Shaped like a dataset push argument: a value, or an array of those values.
const nestedUnionSchema = z.union([z.looseObject({}), z.string(), z.array(z.union([z.looseObject({}), z.string()]))]);

describe('union formatting', () => {
    test('message lists every failed arm of a union', () => {
        const schema = z.array(z.union([z.looseObject({}), z.string()]));

        expect(() => parseArgument([1], schema)).toThrow(
            'Invalid input: expected object, received the number `1` at `[0]`\n' +
                'Invalid input: expected string, received the number `1` at `[0]`',
        );
    });

    test('message drops the union arms that failed above the located problem', () => {
        let error!: ArgumentValidationError;
        try {
            parseArgument([{ foo: 'bar' }, [1, 2, 3]], nestedUnionSchema);
        } catch (err) {
            error = err as ArgumentValidationError;
        }
        const lines = error.message.split('\n');

        // The object and string arms fail on the whole array, so their lines carry no location.
        expect(lines).toHaveLength(2);
        expect(lines.every((line) => line.includes('at `[1]`'))).toBe(true);
    });

    test('message keeps every union arm when they all fail at the same depth', () => {
        let error!: ArgumentValidationError;
        try {
            parseArgument(42, nestedUnionSchema);
        } catch (err) {
            error = err as ArgumentValidationError;
        }
        const lines = error.message.split('\n');

        // Nothing located the problem more precisely than the argument itself, so no arm is redundant.
        expect(lines).toHaveLength(3);
        expect(lines.every((line) => line.includes('`42`'))).toBe(true);
    });
});

describe('message size limits', () => {
    test('message caps the rendered lines when a whole array is invalid', () => {
        const schema = z.array(z.union([z.looseObject({}), z.string()]));
        const value = Array.from({ length: 5000 }, () => 1);

        let error!: ArgumentValidationError;
        try {
            parseArgument(value, schema);
        } catch (err) {
            error = err as ArgumentValidationError;
        }
        const lines = error.message.split('\n');

        expect(lines).toHaveLength(11);
        expect(lines.at(-1)).toBe('... and 9990 more problems');
        // Nothing is lost - the full set stays on `issues`.
        expect(error.issues).toHaveLength(5000);
    });

    test('message does not count the dropped union arms in the hidden tally', () => {
        const value = Array.from({ length: 5000 }, () => [1]);

        let error!: ArgumentValidationError;
        try {
            parseArgument(value, nestedUnionSchema);
        } catch (err) {
            error = err as ArgumentValidationError;
        }
        const lines = error.message.split('\n');

        // Two arms per element, and the two top-level arms are dropped rather than merely hidden.
        expect(lines).toHaveLength(11);
        expect(lines.at(-1)).toBe('... and 9990 more problems');
    });
});
