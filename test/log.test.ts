/* eslint-disable max-len */
import _ from 'underscore';
import { Log, LEVELS, Logger } from '@apify/log';
import { ENV_VARS } from '@apify/consts';

describe('log', () => {
    let loggerSpy: jest.SpyInstance;

    beforeEach(() => {
        loggerSpy = jest.spyOn(Logger.prototype, 'log');
    });

    afterEach(() => jest.resetAllMocks());

    it('allows to set/get options', () => {
        const log = new Log({ prefix: 'aaa' });
        const options1 = { ...log.getOptions() };
        log.setOptions({ prefix: 'bbb' });
        const options2 = { ...log.getOptions() };

        expect(options1.prefix).toBe('aaa');
        expect(options2.prefix).toBe('bbb');
    });

    it('correctly sets log level based on ENV_VAR', () => {
        process.env[ENV_VARS.LOG_LEVEL] = `${LEVELS.SOFT_FAIL}`;
        const log = new Log();
        expect(log.getOptions().level).toBe(LEVELS.SOFT_FAIL);

        process.env[ENV_VARS.LOG_LEVEL] = `${LEVELS.ERROR}`;
        const log2 = new Log();
        expect(log2.getOptions().level).toBe(LEVELS.ERROR);

        delete process.env[ENV_VARS.LOG_LEVEL];
    });

    it('should allow to retrieve and modify level using get|setLevel()', () => {
        process.env[ENV_VARS.LOG_LEVEL] = `${LEVELS.SOFT_FAIL}`;

        const log = new Log();
        expect(log.getLevel()).toBe(LEVELS.SOFT_FAIL);

        log.setLevel(LEVELS.ERROR);
        expect(log.getLevel()).toBe(LEVELS.ERROR);

        delete process.env[ENV_VARS.LOG_LEVEL];
    });

    it('should allow to create a child logger with inherited config', () => {
        const log1 = new Log({ prefix: 'aaa', data: { foo: 'bar' } });
        const log2 = log1.child({ prefix: 'bbb', suffix: 'sss', data: { hotel: 'restaurant' } });

        expect(log1.getOptions().prefix).toBe('aaa');
        expect(log1.getOptions().suffix).toBe(null);
        expect(log1.getOptions().data).toEqual({ foo: 'bar' });
        expect(log2.getOptions().prefix).toBe('aaa:bbb');
        expect(log2.getOptions().suffix).toBe('sss');
        expect(log2.getOptions().data).toEqual({ foo: 'bar', hotel: 'restaurant' });
    });

    it('should support internal() method', () => {
        const log = new Log();
        log.internal(LEVELS.ERROR, 'Something to be informed about happened', { foo: 'bar' });
        expect(loggerSpy).toBeCalledWith(LEVELS.ERROR, 'Something to be informed about happened', { foo: 'bar' }, undefined, { prefix: null, suffix: null });
    });

    it('should support error() method', () => {
        const log = new Log();
        log.error('Error happened', { foo: 'bar' });
        expect(loggerSpy).toBeCalledWith(LEVELS.ERROR, 'Error happened', { foo: 'bar' }, undefined, { prefix: null, suffix: null });
    });

    it('should support exception() method', () => {
        const log = new Log();
        const err = new Error('some-error');
        log.exception(err, 'Error happened', { foo: 'bar' });
        expect(loggerSpy).toBeCalledWith(LEVELS.ERROR, 'Error happened', { foo: 'bar' }, _.pick(err, 'name', 'message', 'stack'), { prefix: null, suffix: null });
    });

    it('should support softFail() method', () => {
        const log = new Log();
        log.softFail('Soft fail happened', { foo: 'bar' });
        expect(loggerSpy).toBeCalledWith(LEVELS.SOFT_FAIL, 'Soft fail happened', { foo: 'bar' }, undefined, { prefix: null, suffix: null });
    });

    it('should support warning() method', () => {
        const log = new Log();
        log.warning('Something to be warn about happened', { foo: 'bar' });
        expect(loggerSpy).toBeCalledWith(LEVELS.WARNING, 'Something to be warn about happened', { foo: 'bar' }, undefined, { prefix: null, suffix: null });
    });

    it('should support info() method', () => {
        const log = new Log();
        log.info('Something to be informed about happened', { foo: 'bar' });
        expect(loggerSpy).toBeCalledWith(LEVELS.INFO, 'Something to be informed about happened', { foo: 'bar' }, undefined, { prefix: null, suffix: null });
    });

    it('should support debug() method', () => {
        process.env[ENV_VARS.LOG_LEVEL] = `${LEVELS.DEBUG}`;

        const log = new Log();
        log.debug('Something to be debugged happened', { foo: 'bar' });
        expect(loggerSpy).toBeCalledWith(LEVELS.DEBUG, 'Something to be debugged happened', { foo: 'bar' }, undefined, { prefix: null, suffix: null });

        delete process.env[ENV_VARS.LOG_LEVEL];
    });

    it('should support perf() method', () => {
        process.env[ENV_VARS.LOG_LEVEL] = `${LEVELS.PERF}`;

        const log = new Log();
        log.perf('Some perf info', { foo: 'bar' });
        expect(loggerSpy).toBeCalledWith(LEVELS.PERF, 'Some perf info', { foo: 'bar' }, undefined, { prefix: null, suffix: null });

        delete process.env[ENV_VARS.LOG_LEVEL];
    });

    it('should support deprecated() method', () => {
        const log = new Log();

        log.deprecated('Message 1');
        log.deprecated('Message 2');
        log.deprecated('Message 3');
        log.deprecated('Message 1');
        log.deprecated('Message 2');
        log.deprecated('Message 3');
        log.deprecated('Message 1');
        log.deprecated('Message 2');
        log.deprecated('Message 3');

        expect(loggerSpy).toBeCalledWith(LEVELS.WARNING, 'Message 1', {}, undefined, { prefix: null, suffix: null });
        expect(loggerSpy).toBeCalledWith(LEVELS.WARNING, 'Message 2', {}, undefined, { prefix: null, suffix: null });
        expect(loggerSpy).toBeCalledWith(LEVELS.WARNING, 'Message 3', {}, undefined, { prefix: null, suffix: null });
    });

    it('should support data', () => {
        const log = new Log({ data: { foo: 'bar' } });
        log.info('Something to be informed about happened', { hotel: 'restaurant' });
        expect(loggerSpy).toBeCalledWith(LEVELS.INFO, 'Something to be informed about happened', { foo: 'bar', hotel: 'restaurant' }, undefined, { prefix: null, suffix: null });
    });
});
