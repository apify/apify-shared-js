import { expect } from 'chai';
import stripAnsi from 'strip-ansi';
import LoggerText from '../build/logger_text';
import { PREFIX_DELIMITER, LEVELS, LEVEL_TO_STRING } from '../build/log_consts';

const CONSOLE_METHODS = ['log', 'warn', 'error', 'debug'];
const DATE_REGEX = '\\d\\d\\d\\d-\\d\\d-\\d\\d \\d\\d:\\d\\d:\\d\\d\\.\\d\\d\\d';

describe('loggerText', () => {
    let loggedLines;
    const originalConsoleMethods = {};

    beforeEach(() => {
        loggedLines = {};
        CONSOLE_METHODS.map((method) => {
            originalConsoleMethods[method] = console[method];
            console[method] = (line) => {
                loggedLines[method] = stripAnsi(line);
            };
        });
    });

    afterEach(() => {
        CONSOLE_METHODS.map((method) => {
            console[method] = originalConsoleMethods[method];
        });
    });

    it('works', () => {
        const logger = new LoggerText();

        let level = LEVELS.INFO;
        let message = 'Some message';
        const prefix = 'Before';
        const suffix = 'After';
        const data = { foo: 'bar' };
        logger.log(level, message, data, null, { prefix, suffix });

        let line = loggedLines.log;
        let levelString = LEVEL_TO_STRING[level];
        let pattern = `^${levelString}\\s+${prefix}${PREFIX_DELIMITER} ${message} ${JSON.stringify(data)} ${suffix}$`;
        expect(line).to.match(new RegExp(pattern));

        level = LEVELS.ERROR;
        message = 'Some error happened';
        const err = new Error('some-error');
        const errObj = Object.assign({ name: err.name, message: err.message, stack: err.stack }, err);
        logger.log(level, message, data, errObj);

        line = loggedLines.error;
        levelString = LEVEL_TO_STRING[level];
        pattern = `^${levelString}\\s+${message} ${JSON.stringify(data)}\\s+Error: ${err.message}`;
        expect(line).to.match(new RegExp(pattern));

        level = LEVELS.DEBUG;
        message = 'Some debug happened';
        logger.log(level, message, data);

        line = loggedLines.debug;
        levelString = LEVEL_TO_STRING[level];
        pattern = `^${levelString}\\s+${message} ${JSON.stringify(data)}$`;
        expect(line).to.match(new RegExp(pattern));

        level = LEVELS.WARNING;
        message = 'Some warning happened';
        logger.log(level, message, data);

        line = loggedLines.warn;
        levelString = LEVEL_TO_STRING[level];
        pattern = `^WARN\\s+${message} ${JSON.stringify(data)}$`;
        expect(line).to.match(new RegExp(pattern));
    });

    it('should support skipTime', () => {
        const logger = new LoggerText({ skipTime: false });

        const level = LEVELS.INFO;
        const message = 'Some message';
        logger.log(level, message);

        const line = loggedLines.log;
        const pattern = `^${DATE_REGEX} INFO\\s+${message}$`;
        expect(line).to.match(new RegExp(pattern));
    });

    it('should be eventEmitter', () => {
        const emitted = [];
        const logger = new LoggerText();
        logger.on('line', line => emitted.push(stripAnsi(line)));

        logger.log(LEVELS.INFO, 'Some info message');
        logger.log(LEVELS.ERROR, 'Some error message');

        expect(emitted).to.be.eql([
            'INFO  Some info message',
            'ERROR Some error message',
        ]);
    });
});
