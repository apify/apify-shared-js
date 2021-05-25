import stripAnsi from 'strip-ansi';
import { LoggerText, LogLevel, PREFIX_DELIMITER } from '@apify/log';

const CONSOLE_METHODS = ['log', 'warn', 'error', 'debug'];
const DATE_REGEX = '\\d\\d\\d\\d-\\d\\d-\\d\\d \\d\\d:\\d\\d:\\d\\d\\.\\d\\d\\d';

describe('loggerText', () => {
    let loggedLines: any;
    const originalConsoleMethods = {};

    beforeEach(() => {
        loggedLines = {};
        CONSOLE_METHODS.map((method) => {
            originalConsoleMethods[method] = console[method];
            console[method] = (line: string) => {
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

        let level = LogLevel.INFO;
        let message = 'Some message';
        const prefix = 'Before';
        const suffix = 'After';
        const data = { foo: 'bar' };
        logger.log(level, message, data, null, { prefix, suffix });

        let line = loggedLines.log;
        // console.log(level, LogLevel, LogLevel.INFO);
        let levelString = LogLevel[level];
        let pattern = `^${levelString}\\s+${prefix}${PREFIX_DELIMITER} ${message} ${JSON.stringify(data)} ${suffix}$`;
        expect(line).toMatch(new RegExp(pattern));

        level = LogLevel.ERROR;
        message = 'Some error happened';
        const err = new Error('some-error');
        const errObj = { name: err.name, message: err.message, stack: err.stack, ...(err as any) };
        logger.log(level, message, data, errObj);

        line = loggedLines.error;
        levelString = LogLevel[level];
        pattern = `^${levelString}\\s+${message} ${JSON.stringify(data)}\\s+Error: ${err.message}`;
        expect(line).toMatch(new RegExp(pattern));

        level = LogLevel.DEBUG;
        message = 'Some debug happened';
        logger.log(level, message, data);

        line = loggedLines.debug;
        levelString = LogLevel[level];
        pattern = `^${levelString}\\s+${message} ${JSON.stringify(data)}$`;
        expect(line).toMatch(new RegExp(pattern));

        level = LogLevel.WARNING;
        message = 'Some warning happened';
        logger.log(level, message, data);

        line = loggedLines.warn;
        levelString = LogLevel[level];
        pattern = `^WARN\\s+${message} ${JSON.stringify(data)}$`;
        expect(line).toMatch(new RegExp(pattern));
    });

    it('should support skipTime', () => {
        const logger = new LoggerText({ skipTime: false });

        const level = LogLevel.INFO;
        const message = 'Some message';
        logger.log(level, message);

        const line = loggedLines.log;
        const pattern = `^${DATE_REGEX} INFO\\s+${message}$`;
        expect(line).toMatch(new RegExp(pattern));
    });

    it('should be eventEmitter', () => {
        const emitted: string[] = [];
        const logger = new LoggerText();
        logger.on('line', (line) => emitted.push(stripAnsi(line)));

        logger.log(LogLevel.INFO, 'Some info message');
        logger.log(LogLevel.ERROR, 'Some error message');

        expect(emitted).toEqual([
            'INFO  Some info message',
            'ERROR Some error message',
        ]);
    });
});
