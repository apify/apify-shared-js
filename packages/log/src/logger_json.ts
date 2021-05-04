import { PREFIX_DELIMITER, LogLevel } from './log_consts';
import { Logger } from './logger';
import { Exception } from './logger_text';

const DEFAULT_OPTIONS = {
    skipLevelInfo: false,
    skipTime: false,
};

export class LoggerJson extends Logger {
    constructor(options = {}) {
        super({ ...DEFAULT_OPTIONS, ...options });
    }

    _log(level: LogLevel, message: string, data?: any, exception?: Exception, opts: Record<string, any> = {}) {
        const { prefix, suffix } = opts;

        if (exception) data = { ...data, exception };
        if (prefix) message = `${prefix}${PREFIX_DELIMITER} ${message}`;
        if (suffix) message = `${message} ${suffix}`;

        // Use short names to save log space.
        // In development mode show more concise log otherwise it's impossible to see anything in it.
        // Message must be shown early for people to see!
        // NOTE: not adding time and host on production, because LogDNA adds it by default and log space is expensive
        const rec = {
            time: !this.options.skipTime ? new Date() : undefined,
            level: this.options.skipLevelInfo && level === LogLevel.INFO ? undefined : LogLevel[level],
            msg: message,
            ...data,
        };

        const line = JSON.stringify(rec);
        this._outputWithConsole(level, line);

        return line;
    }
}
