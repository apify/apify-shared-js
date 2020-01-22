import { LOG_LEVELS, LOG_LEVEL_TO_STRING } from './log_consts';
import Logger from './logger';

const DEFAULT_OPTIONS = {
    skipLevelInfo: false,
    skipTime: false,
};

export default class LoggerJson extends Logger {
    constructor(options = {}) {
        super(Object.assign({}, DEFAULT_OPTIONS, options));
    }

    log(logLevel, message, data, exception, { prefix, suffix }) {
        if (exception) data = Object.assign({}, data, { exception });
        if (this.options.skipLevelInfo && logLevel === LOG_LEVELS.INFO) logLevel = undefined;
        if (prefix) message = `${prefix} ${message}`;
        if (suffix) message = `${message} ${suffix}`;

        // Use short names to save log space.
        // In development mode show more concise log otherwise it's impossible to see anything in it.
        // Message must be shown early for people to see!
        // NOTE: not adding time and host on production, because LogDNA adds it by default and log space is expensive
        const rec = {
            time: !this.options.skipTime ? new Date() : undefined,
            level: LOG_LEVEL_TO_STRING[logLevel],
            msg: message,
        };

        Object.assign(rec, data);

        console.log(JSON.stringify(rec));
    }
}
