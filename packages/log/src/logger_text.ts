import chalk from 'chalk';
import { Logger } from './logger';
import { LEVEL_TO_STRING, LogLevel, PREFIX_DELIMITER } from './log_consts';

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

export interface Exception extends Error {
    type?: string;
    details?: Record<string, any>;
    reason?: string;
}

export class LoggerText extends Logger {
    constructor(options = {}) {
        super({ ...DEFAULT_OPTIONS, ...options });
    }

    _log(level: LogLevel, message: string, data?: any, exception?: Exception, opts: Record<string, any> = {}) {
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

        const line = chalk`{gray ${maybeDate}}{${color} ${levelStr}}${levelIndent}{yellow ${prefix}} ${message || ''}{gray ${dataStr}}{yellow ${suffix}}${errStack}`; // eslint-disable-line
        this._outputWithConsole(level, line);

        return line;
    }

    _parseException(exception: Exception) {
        let errStack = '';

        // Parse error.type and error.details from ApifyClientError.
        const errDetails = [];
        if (exception.type) errDetails.push(`type=${exception.type}`);
        if (exception.details) {
            Object.entries(exception.details).map(([key, val]) => errDetails.push(`${key}=${val}`));
        }

        // Parse error stack lines.
        // NOTE: Reason is here to support Meteor.js like errors.
        const errorString = exception.stack || exception.reason || exception.toString();
        const errorLines = errorString.split('\n');

        // Add details to a first line.
        if (errDetails.length) errorLines[0] += chalk`{gray (details: ${errDetails.join(', ')})}`;

        // Compose it back.
        errStack = errorLines.map((line) => `  ${line}`).join('\n');
        errStack = `\n${errStack}`;

        return errStack;
    }
}
