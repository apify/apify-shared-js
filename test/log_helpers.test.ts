import { APIFY_ENV_VARS } from '@apify/consts';
import { getLevelFromEnv, IS_APIFY_LOGGER_EXCEPTION, LogLevel, sanitizeData } from '@apify/log';

describe('getLevelFromEnv()', () => {
    it('should support integers', () => {
        process.env[APIFY_ENV_VARS.LOG_LEVEL] = `${LogLevel.SOFT_FAIL}`;
        expect(getLevelFromEnv()).toBe(LogLevel.SOFT_FAIL);
        process.env[APIFY_ENV_VARS.LOG_LEVEL] = `${LogLevel.WARNING}`;
        expect(getLevelFromEnv()).toBe(LogLevel.WARNING);
        delete process.env[APIFY_ENV_VARS.LOG_LEVEL];
    });

    it('should support strings', () => {
        process.env[APIFY_ENV_VARS.LOG_LEVEL] = LogLevel[LogLevel.SOFT_FAIL];
        expect(getLevelFromEnv()).toBe(LogLevel.SOFT_FAIL);
        process.env[APIFY_ENV_VARS.LOG_LEVEL] = LogLevel[LogLevel.WARNING];
        expect(getLevelFromEnv()).toBe(LogLevel.WARNING);
        delete process.env[APIFY_ENV_VARS.LOG_LEVEL];
    });

    it('should support default to INFO', () => {
        delete process.env[APIFY_ENV_VARS.LOG_LEVEL];
        expect(getLevelFromEnv()).toBe(LogLevel.INFO);
    });
});

describe('sanitizeData()', () => {
    it('works', () => {
        const date = new Date();
        const object = {
            a: {
                b: {
                    c: {
                        d: 'e',
                    },
                },
            },
            arr: [1, 2, { foo: 'bar' }],
            boolean: true,
            int: 1,
            str: 'something',
            n: null,
            u: undefined,
            date,
        };

        expect(sanitizeData(object, { maxDepth: 2 })).toEqual({
            a: {
                b: '[object]',
            },
            arr: [1, 2, '[object]'],
            boolean: true,
            int: 1,
            str: 'something',
            n: null,
            u: undefined,
            date,
        });
    });

    it('should not modify source object, array or error', () => {
        const err = new Error('some-error');
        const object = {
            a: {
                b: {},
            },
            arr: [1, 2, { foo: 'bar' }],
            err,
        };
        const limited = {
            a: {
                b: '[object]',
            },
            arr: [1, 2, '[object]'],
            err: { name: err.name, message: err.message, stack: err.stack, ...err as any, cause: undefined, [IS_APIFY_LOGGER_EXCEPTION]: true },
        };

        expect(sanitizeData(object, { maxDepth: 2 })).toEqual(limited);
        expect(err).not.toBe(limited.err);

        expect(object).toEqual({
            a: {
                b: {},
            },
            arr: [1, 2, { foo: 'bar' }],
            err,
        });
    });

    it('supports truncation of strings', () => {
        const object = {
            a: {
                bar: 'abcdefghihabcdefghihabcdefghihabcdefghihgg',
                b: {
                    c: {
                        d: 'e',
                    },
                },
            },
            foo: 'abcdefghihabcdefghihabcdefghihabcdefghihgg',
        };

        expect(sanitizeData(object, { maxDepth: 2, maxStringLength: 18 })).toEqual({
            a: {
                bar: 'abcd...[truncated]',
                b: '[object]',
            },
            foo: 'abcd...[truncated]',
        });
    });

    it('should omit function with [function]', () => {
        // Object
        const object = {
            foo: {
                arrow: () => true,
                fce() {},
            },
            rest: 'bla bla',
        };

        expect(sanitizeData(object, { maxDepth: 2, maxStringLength: 18 })).toEqual({
            foo: {
                arrow: '[function]',
                fce: '[function]',
            },
            rest: 'bla bla',
        });

        // Error
        const error = new Error('My Error') as any;
        error.injectedArrow = () => {};
        error.injectedFce = function () {};
        expect(sanitizeData(error, { maxDepth: 2 })).toEqual({
            name: error.name,
            message: error.message,
            stack: error.stack,
            injectedArrow: '[function]',
            injectedFce: '[function]',
            cause: undefined,
            [IS_APIFY_LOGGER_EXCEPTION]: true,
        });
    });
});
