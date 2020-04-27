import { LEVELS, LEVEL_TO_STRING, PREFIX_DELIMITER } from './log_consts';
import Logger from './logger';

const DEFAULT_OPTIONS = {
    skipLevelInfo: false,
    skipTime: false,
};

export default class LoggerJson extends Logger {
    constructor(options = {}) {
        super(Object.assign({}, DEFAULT_OPTIONS, options));
    }

    _log(level, message, data, exception, opts = {}) {
        const { prefix, suffix } = opts;

        if (exception) data = Object.assign({}, data, { exception });
        if (prefix) message = `${prefix}${PREFIX_DELIMITER} ${message}`;
        if (suffix) message = `${message} ${suffix}`;

        // Use short names to save log space.
        // In development mode show more concise log otherwise it's impossible to see anything in it.
        // Message must be shown early for people to see!
        // NOTE: not adding time and host on production, because LogDNA adds it by default and log space is expensive
        const rec = Object.assign({
            time: !this.options.skipTime ? new Date() : undefined,
            level: this.options.skipLevelInfo && level === LEVELS.INFO ? undefined : LEVEL_TO_STRING[level],
            msg: message,
        }, data);

        const line = JSON.stringify(rec);
        this._outputWithConsole(level, line);

        return line;
    }
}
