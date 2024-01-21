import c from 'ansi-colors';
import { Logger } from './logger';
import { IS_APIFY_LOGGER_EXCEPTION, LEVEL_TO_STRING, LogLevel, PREFIX_DELIMITER } from './log_consts';
import { LimitedError } from './log_helpers';
import { getStackFrames } from './node_internals';

const SHORTEN_LEVELS = {
    SOFT_FAIL: 'SFAIL',
    WARNING: 'WARN',
};

const LEVEL_TO_COLOR = {
    [LogLevel.ERROR]: 'red',
    [LogLevel.SOFT_FAIL]: 'red',
    [LogLevel.WARNING]: 'yellow',
    [LogLevel.INFO]: 'green',
    [LogLevel.DEBUG]: 'blue',
    [LogLevel.PERF]: 'magenta',
};

const SHORTENED_LOG_LEVELS = LEVEL_TO_STRING.map((level) => SHORTEN_LEVELS[level] || level);
const MAX_LEVEL_LENGTH_SPACES = Math.max(...SHORTENED_LOG_LEVELS.map((l) => l.length));

const getLevelIndent = (level: string) => {
    let spaces = '';

    for (let i = 0; i < MAX_LEVEL_LENGTH_SPACES - level.length; i++) spaces += ' ';

    return spaces;
};

const DEFAULT_OPTIONS = {
    skipTime: true,
};

export class LoggerText extends Logger {
    constructor(options = {}) {
        super({ ...DEFAULT_OPTIONS, ...options });
    }

    _log(level: LogLevel, message: string, data?: any, exception?: unknown, opts: Record<string, any> = {}) {
        let { prefix, suffix } = opts;

        let maybeDate = '';
        if (!this.options.skipTime) {
            maybeDate = `${(new Date()).toISOString().replace('Z', '').replace('T', ' ')} `;
        }

        const errStack = exception ? this._parseException(exception) : '';
        const color = LEVEL_TO_COLOR[level];
        const levelStr = SHORTENED_LOG_LEVELS[level];
        const levelIndent = getLevelIndent(levelStr);
        const dataStr = !data ? '' : ` ${JSON.stringify(data)}`;

        prefix = prefix ? ` ${prefix}${PREFIX_DELIMITER}` : '';
        suffix = suffix ? ` ${suffix}` : '';

        const line = `${c.gray(maybeDate)}${c[color](levelStr)}${levelIndent}${c.yellow(prefix)} ${message || ''}${c.gray(dataStr)}${c.yellow(suffix)}${errStack}`; // eslint-disable-line
        this._outputWithConsole(level, line);

        return line;
    }

    protected _parseException(exception: unknown, indentLevel = 1) {
        if (!exception) {
            return '';
        }

        if (['string', 'boolean', 'number', 'symbol', 'undefined'].includes(typeof exception)) {
            return `\n${exception}`;
        }

        if (typeof exception === 'object' && IS_APIFY_LOGGER_EXCEPTION in exception) {
            return this._parseLoggerException(exception as LimitedError, indentLevel);
        }

        // Anything else we just stringify
        return `\n${JSON.stringify(exception, null, 2)}`;
    }

    private _parseLoggerException(exception: LimitedError, indentLevel = 1) {
        const errDetails = [];

        if (exception.type) {
            errDetails.push(`type=${exception.type}`);
        }

        if (exception.details) {
            Object.entries(exception.details).map(([key, val]) => errDetails.push(`${key}=${val}`));
        }

        // Parse the stack lines
        const errorString = exception.stack || exception.reason || exception.message;
        const isStack = errorString === exception.stack;
        const errorLines = getStackFrames(exception, errorString);

        if (isStack) {
            // Remove the useless `Error` prefix from stack traces
            errorLines[0] = exception.message || errorLines[0];
        }

        // Add details to the first line.
        if (errDetails.length) {
            errorLines[0] += c.gray(`(details: ${errDetails.join(', ')})`);
        }

        // Make stack lines gray
        for (let i = 1; i < errorLines.length; i++) {
            errorLines[i] = c.gray(errorLines[i]);
        }

        // Recursively parse the cause.
        if (exception.cause) {
            const causeString = this._parseException(exception.cause, indentLevel + 1);
            const causeLines = causeString.trim().split('\n');

            errorLines.push(c.red(`  CAUSE: ${c.reset(causeLines[0])}`), ...causeLines.slice(1));
        }

        return `\n${errorLines.map((line) => `${' '.repeat(indentLevel * 2)}${line}`).join('\n')}`;
    }
}
