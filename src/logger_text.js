import _ from 'underscore';
import chalk from 'chalk';
import Logger from './logger';
import { LEVEL_TO_STRING, LEVELS, PREFIX_DELIMITER } from './log_consts';

const SHORTEN_LEVELS = {
    SOFT_FAIL: 'SFAIL',
    WARNING: 'WARN',
};

const LEVEL_TO_COLOR = {
    [LEVELS.ERROR]: 'red',
    [LEVELS.SOFT_FAIL]: 'red',
    [LEVELS.WARNING]: 'yellow',
    [LEVELS.INFO]: 'green',
    [LEVELS.DEBUG]: 'blue',
    [LEVELS.PERF]: 'magenta',
};

const SHORTENED_LOG_LEVELS = LEVEL_TO_STRING.map(level => SHORTEN_LEVELS[level] || level);
const MAX_LEVEL_LENGTH_SPACES = Math.max(...SHORTENED_LOG_LEVELS.map(l => l.length));

const getLevelIndent = (level) => {
    let spaces = '';

    for (let i = 0; i < MAX_LEVEL_LENGTH_SPACES - level.length; i++) spaces += ' ';

    return spaces;
};

const DEFAULT_OPTIONS = {
    skipTime: false,
};

export default class LoggerText extends Logger {
    constructor(options = {}) {
        super(Object.assign({}, DEFAULT_OPTIONS, options));
    }

    _log(level, message, data, exception, opts = {}) {
        let { prefix, suffix } = opts;

        let maybeDate = '';
        if (!this.options.skipTime) {
            maybeDate = `${(new Date()).toISOString().replace('Z', '').replace('T', ' ')} `;
        }

        const errStack = exception ? this._parseException(exception) : '';
        const color = LEVEL_TO_COLOR[level];
        const levelStr = SHORTENED_LOG_LEVELS[level];
        const levelIndent = getLevelIndent(levelStr);

        prefix = prefix ? ` ${prefix}${PREFIX_DELIMITER}` : '';
        suffix = suffix ? ` ${suffix}` : '';
        data = data ? ` ${JSON.stringify(data)}` : '';

        const line = chalk`{gray ${maybeDate}}{${color} ${levelStr}}${levelIndent}{yellow ${prefix}} ${message}{gray ${data}}{yellow ${suffix}}${errStack}`; // eslint-disable-line

        console.error(line);

        return line;
    }

    _parseException(exception) {
        let errStack = '';

        // Parse error.type and error.details from ApifyClientError.
        const errDetails = [];
        if (exception.type) errDetails.push(`type=${exception.type}`);
        if (exception.details) {
            _.chain(exception.details).mapObject((val, key) => errDetails.push(`${key}=${val}`));
        }

        // Parse error stack lines.
        let errorLines = exception.stack || exception;
        errorLines = errorLines.split('\n');

        // Add details to a first line.
        if (errDetails.length) errorLines[0] += chalk`{gray (details: ${errDetails.join(', ')})}`;

        // Compose it back.
        errStack = errorLines.map(line => `  ${line}`).join('\n');
        errStack = `\n${errStack}`;

        return errStack;
    }
}
