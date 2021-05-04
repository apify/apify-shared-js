import { LoggerJson, LogLevel, PREFIX_DELIMITER } from '@apify/log';

const CONSOLE_METHODS = ['log', 'warn', 'error', 'debug'];
const DATE_REGEX = /\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\.\d\d\dZ/;

describe('loggerJson', () => {
    let loggedLines: any;
    const originalConsoleMethods = {};

    beforeEach(() => {
        loggedLines = {};
        CONSOLE_METHODS.map((method) => {
            originalConsoleMethods[method] = console[method];
            console[method] = (line: string) => {
                loggedLines[method] = JSON.parse(line);
            };
        });
    });

    afterEach(() => {
        CONSOLE_METHODS.map((method) => {
            console[method] = originalConsoleMethods[method];
        });
    });

    it('works', () => {
        const logger = new LoggerJson();

        let level = LogLevel.INFO;
        let message = 'Some message';
        let data = { foo: 'bar' };
        const prefix = 'Before';
        const suffix = 'After';
        logger.log(level, message, data, null, { prefix, suffix });
        expect(loggedLines.log.time).toMatch(DATE_REGEX);
        expect(loggedLines.log.msg).toEqual(`${prefix}${PREFIX_DELIMITER} ${message} ${suffix}`);
        expect(loggedLines.log.foo).toBe(data.foo);
        expect(loggedLines.log.level).toBe(LogLevel[level]);
        expect(loggedLines.log.exception).toBe(undefined);

        level = LogLevel.ERROR;
        message = 'Some error happened';
        data = { foo: 'bar' };
        const err = new Error('some-error');
        const errObj = { name: err.name, message: err.message, stack: err.stack, ...(err as any) };
        logger.log(level, message, data, errObj);
        expect(loggedLines.error.time).toMatch(DATE_REGEX);
        expect(loggedLines.error.msg).toEqual(message);
        expect(loggedLines.error.foo).toBe(data.foo);
        expect(loggedLines.error.level).toBe(LogLevel[level]);
        expect(loggedLines.error.exception).toEqual(errObj);

        level = LogLevel.DEBUG;
        message = 'Some debug happened';
        data = { foo: 'bar' };
        logger.log(level, message, data);
        expect(loggedLines.debug.time).toMatch(DATE_REGEX);
        expect(loggedLines.debug.msg).toEqual(message);
        expect(loggedLines.debug.foo).toBe(data.foo);
        expect(loggedLines.debug.level).toBe(LogLevel[level]);

        level = LogLevel.WARNING;
        message = 'Some debug happened';
        data = { foo: 'bar' };
        logger.log(level, message, data);
        expect(loggedLines.warn.time).toMatch(DATE_REGEX);
        expect(loggedLines.warn.msg).toEqual(message);
        expect(loggedLines.warn.foo).toBe(data.foo);
        expect(loggedLines.warn.level).toBe(LogLevel[level]);
    });

    it('should support skipLevelInfo', () => {
        const logger = new LoggerJson({ skipLevelInfo: true });

        const level = LogLevel.INFO;
        const message = 'Some message';
        logger.log(level, message);

        expect(loggedLines.log.time).toMatch(DATE_REGEX);
        expect(loggedLines.log.msg).toEqual(message);
        expect(loggedLines.log.level).toBe(undefined);
    });

    it('should support skipTime', () => {
        const logger = new LoggerJson({ skipTime: true });

        const level = LogLevel.INFO;
        const message = 'Some message';
        logger.log(level, message);

        expect(loggedLines.log.time).toBe(undefined);
        expect(loggedLines.log.msg).toEqual(message);
        expect(loggedLines.log.level).toBe(LogLevel[level]);
    });

    it('should be eventEmitter', () => {
        const emitted: string[] = [];
        const logger = new LoggerJson({ skipTime: true });
        logger.on('line', (line) => emitted.push(line));

        logger.log(LogLevel.INFO, 'Some info message');
        logger.log(LogLevel.ERROR, 'Some error message');

        expect(emitted).toEqual([
            '{"level":"INFO","msg":"Some info message"}',
            '{"level":"ERROR","msg":"Some error message"}',
        ]);
    });
});
