import { expect } from 'chai';
import LoggerJson from '../build/logger_json';
import { PREFIX_DELIMITER, LEVELS, LEVEL_TO_STRING } from '../build/log_consts';

const CONSOLE_METHODS = ['log', 'warn', 'error', 'debug'];
const DATE_REGEX = /\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\.\d\d\dZ/;

describe('loggerJson', () => {
    let loggedLines;
    const originalConsoleMethods = {};

    beforeEach(() => {
        loggedLines = {};
        CONSOLE_METHODS.map((method) => {
            // eslint-disable-next-line no-console
            originalConsoleMethods[method] = console[method];
            // eslint-disable-next-line no-console
            console[method] = (line) => {
                loggedLines[method] = JSON.parse(line);
            };
        });
    });

    afterEach(() => {
        CONSOLE_METHODS.map((method) => {
            // eslint-disable-next-line no-console
            console[method] = originalConsoleMethods[method];
        });
    });

    it('works', () => {
        const logger = new LoggerJson();

        let level = LEVELS.INFO;
        let message = 'Some message';
        let data = { foo: 'bar' };
        const prefix = 'Before';
        const suffix = 'After';
        logger.log(level, message, data, null, { prefix, suffix });
        expect(loggedLines.log.time).to.be.match(DATE_REGEX);
        expect(loggedLines.log.msg).to.eql(`${prefix}${PREFIX_DELIMITER} ${message} ${suffix}`);
        expect(loggedLines.log.foo).to.be.eql(data.foo);
        expect(loggedLines.log.level).to.be.eql(LEVEL_TO_STRING[level]);
        expect(loggedLines.log.exception).to.be.eql(undefined);

        level = LEVELS.ERROR;
        message = 'Some error happened';
        data = { foo: 'bar' };
        const err = new Error('some-error');
        const errObj = { name: err.name, message: err.message, stack: err.stack, ...err };
        logger.log(level, message, data, errObj);
        expect(loggedLines.error.time).to.be.match(DATE_REGEX);
        expect(loggedLines.error.msg).to.eql(message);
        expect(loggedLines.error.foo).to.be.eql(data.foo);
        expect(loggedLines.error.level).to.be.eql(LEVEL_TO_STRING[level]);
        expect(loggedLines.error.exception).to.be.eql(errObj);

        level = LEVELS.DEBUG;
        message = 'Some debug happened';
        data = { foo: 'bar' };
        logger.log(level, message, data);
        expect(loggedLines.debug.time).to.be.match(DATE_REGEX);
        expect(loggedLines.debug.msg).to.eql(message);
        expect(loggedLines.debug.foo).to.be.eql(data.foo);
        expect(loggedLines.debug.level).to.be.eql(LEVEL_TO_STRING[level]);

        level = LEVELS.WARNING;
        message = 'Some debug happened';
        data = { foo: 'bar' };
        logger.log(level, message, data);
        expect(loggedLines.warn.time).to.be.match(DATE_REGEX);
        expect(loggedLines.warn.msg).to.eql(message);
        expect(loggedLines.warn.foo).to.be.eql(data.foo);
        expect(loggedLines.warn.level).to.be.eql(LEVEL_TO_STRING[level]);
    });

    it('should support skipLevelInfo', () => {
        const logger = new LoggerJson({ skipLevelInfo: true });

        const level = LEVELS.INFO;
        const message = 'Some message';
        logger.log(level, message);

        expect(loggedLines.log.time).to.be.match(DATE_REGEX);
        expect(loggedLines.log.msg).to.eql(message);
        expect(loggedLines.log.level).to.be.eql(undefined);
    });

    it('should support skipTime', () => {
        const logger = new LoggerJson({ skipTime: true });

        const level = LEVELS.INFO;
        const message = 'Some message';
        logger.log(level, message);

        expect(loggedLines.log.time).to.be.eql(undefined);
        expect(loggedLines.log.msg).to.eql(message);
        expect(loggedLines.log.level).to.be.eql(LEVEL_TO_STRING[level]);
    });

    it('should be eventEmitter', () => {
        const emitted = [];
        const logger = new LoggerJson({ skipTime: true });
        logger.on('line', line => emitted.push(line));

        logger.log(LEVELS.INFO, 'Some info message');
        logger.log(LEVELS.ERROR, 'Some error message');

        expect(emitted).to.be.eql([
            '{"level":"INFO","msg":"Some info message"}',
            '{"level":"ERROR","msg":"Some error message"}',
        ]);
    });
});
