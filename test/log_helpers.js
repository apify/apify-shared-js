import _ from 'underscore';
import { expect } from 'chai';
import { LEVELS, LEVEL_TO_STRING } from '../build/log_consts';
import { ENV_VARS } from '../src/consts';
import { limitDepth, getLevelFromEnv } from '../build/log_helpers';

describe('getLevelFromEnv()', () => {
    it('should support integers', () => {
        process.env[ENV_VARS.LOG_LEVEL] = `${LEVELS.SOFT_FAIL}`;
        expect(getLevelFromEnv()).to.be.eql(LEVELS.SOFT_FAIL);
        process.env[ENV_VARS.LOG_LEVEL] = `${LEVELS.WARNING}`;
        expect(getLevelFromEnv()).to.be.eql(LEVELS.WARNING);
        delete process.env[ENV_VARS.LOG_LEVEL];
    });

    it('should support strings', () => {
        process.env[ENV_VARS.LOG_LEVEL] = LEVEL_TO_STRING[LEVELS.SOFT_FAIL];
        expect(getLevelFromEnv()).to.be.eql(LEVELS.SOFT_FAIL);
        process.env[ENV_VARS.LOG_LEVEL] = LEVEL_TO_STRING[LEVELS.WARNING];
        expect(getLevelFromEnv()).to.be.eql(LEVELS.WARNING);
        delete process.env[ENV_VARS.LOG_LEVEL];
    });

    it('should support default to INFO', () => {
        delete process.env[ENV_VARS.LOG_LEVEL];
        expect(getLevelFromEnv()).to.be.eql(LEVELS.INFO);
    });
});

describe('limitDepth()', () => {
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
            str: 'soemthing',
            n: null,
            u: undefined,
            date,
        };

        expect(limitDepth(object, 2)).to.be.eql({
            a: {
                b: '[object]',
            },
            arr: [1, 2, '[object]'],
            boolean: true,
            int: 1,
            str: 'soemthing',
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
            err: _.extend({ name: err.name, message: err.message, stack: err.stack }, err),
        };

        expect(limitDepth(object, 2)).to.be.eql(limited);
        expect(err).to.not.be.eql(limited.err);

        expect(object).to.be.eql({
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

        expect(limitDepth(object, 2, 18)).to.be.eql({
            a: {
                bar: 'abcd...[truncated]',
                b: '[object]',
            },
            foo: 'abcd...[truncated]',
        });
    });
});
