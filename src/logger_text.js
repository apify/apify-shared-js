import _ from 'underscore';
import chalk from 'chalk';
import Logger from './logger';
import { LOG_LEVEL_TO_STRING, LOG_LEVELS } from './log_consts';

const DEFAULT_OPTIONS = {
    skipTime: false,
};

const SHORTEN_LOG_LEVELS = {
    SOFT_FAIL: 'SFAIL',
    WARNING: 'WARN',
};

const LEVEL_TO_COLOR = {
    [LOG_LEVELS.ERROR]: 'red',
    [LOG_LEVELS.SOFT_FAIL]: 'red',
    [LOG_LEVELS.WARNING]: 'yellow',
    [LOG_LEVELS.INFO]: 'green',
    [LOG_LEVELS.DEBUG]: 'blue',
    [LOG_LEVELS.PERF]: 'magenta',
};

const SHORTENED_LOG_LEVES = LOG_LEVEL_TO_STRING.map(level => SHORTEN_LOG_LEVELS[level] || level);
const MAX_LOG_LEVEL_LENGTH_SPACES = Math.max(...SHORTENED_LOG_LEVES.map(l => l.length));

const getLevelIndent = (level) => {
    let spaces = '';

    for (let i = 0; i < MAX_LOG_LEVEL_LENGTH_SPACES - level.length; i++) spaces += ' ';

    return spaces;
};

export default class LoggerText extends Logger {
    constructor(options = {}) {
        super(Object.assign({}, DEFAULT_OPTIONS, options));
    }

    log(level, message, data, exception, { prefix, suffix }) {
        let maybeDate = '';
        if (!this.options.skipTime) {
            maybeDate = `${(new Date()).toISOString().replace('Z', '').replace('T', ' ')} `;
        }

        const errStack = exception ? this._parseException(exception) : '';
        const color = LEVEL_TO_COLOR[level];
        const levelStr = SHORTENED_LOG_LEVES[level];
        const spaces = getLevelIndent(levelStr);

        prefix = prefix ? ` ${prefix}` : '';
        suffix = suffix ? ` ${suffix}` : '';
        data = data ? ` ${JSON.stringify(data)}` : '';

        console.log(chalk`{gray ${maybeDate}}{${color} ${levelStr}}${spaces}{yellow ${prefix}} ${message}{gray ${data}}{yellow ${suffix}}${errStack}`); // eslint-disable-line
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
