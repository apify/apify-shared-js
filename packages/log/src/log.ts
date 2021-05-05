import { LoggerText } from './logger_text';
import { Logger } from './logger';
import { LogLevel, PREFIX_DELIMITER } from './log_consts';
import { getLevelFromEnv, limitDepth } from './log_helpers';

export interface LoggerOptions {
    level: number;
    maxDepth: number;
    maxStringLength: number;
    prefix: string | null;
    suffix: string | null;
    logger: Logger;
    data: Record<string, unknown>,
}

const getDefaultOptions = () => ({
    level: getLevelFromEnv(),
    maxDepth: 4,
    maxStringLength: 2000,
    prefix: null,
    suffix: null,
    logger: new LoggerText(),
    data: {},
});

export class Log {
    readonly LEVELS = LogLevel; // for BC

    private options: LoggerOptions;

    private readonly deprecationsReported: Record<string, boolean> = {};

    constructor(options: Partial<LoggerOptions> = {}) {
        this.options = { ...getDefaultOptions(), ...options };

        if (!LogLevel[this.options.level]) throw new Error('Options "level" must be one of log.LEVELS enum!');
        if (typeof this.options.maxDepth !== 'number') throw new Error('Options "maxDepth" must be a number!');
        if (typeof this.options.maxStringLength !== 'number') throw new Error('Options "maxStringLength" must be a number!');
        if (this.options.prefix && typeof this.options.prefix !== 'string') throw new Error('Options "prefix" must be a string!');
        if (this.options.suffix && typeof this.options.suffix !== 'string') throw new Error('Options "suffix" must be a string!');
        if (typeof this.options.logger !== 'object') throw new Error('Options "logger" must be an object!');
        if (typeof this.options.data !== 'object') throw new Error('Options "data" must be an object!');
    }

    private _limitDepth(obj: any) {
        return limitDepth(obj, this.options.maxDepth);
    }

    getLevel() {
        return this.options.level;
    }

    setLevel(level: LogLevel) {
        if (!LogLevel[level]) throw new Error('Options "level" must be one of log.LEVELS enum!');

        this.options.level = level;
    }

    internal(level: LogLevel, message: string, data?: any, exception?: any) {
        if (level > this.options.level) return;

        data = { ...this.options.data, ...data };
        data = this._limitDepth(data);
        exception = this._limitDepth(exception);

        this.options.logger.log(level, message, data, exception, {
            prefix: this.options.prefix,
            suffix: this.options.suffix,
        });
    }

    setOptions(options: Partial<LoggerOptions>) {
        this.options = { ...this.options, ...options };
    }

    getOptions() {
        return { ...this.options };
    }

    child(options: Partial<LoggerOptions>) {
        let { prefix } = this.options;

        if (options.prefix) {
            prefix = prefix
                ? `${prefix}${PREFIX_DELIMITER}${options.prefix}`
                : options.prefix;
        }

        const data = options.data
            ? { ...this.options.data, ...options.data }
            : this.options.data;

        const newOptions = {
            ...this.options,
            ...options,
            prefix,
            data,
        };

        return new Log(newOptions);
    }

    error(message: string, data?: any) {
        this.internal(LogLevel.ERROR, message, data);
    }

    exception(exception: any, message: string, data?: any) {
        this.internal(LogLevel.ERROR, message, data, exception);
    }

    softFail(message: string, data?: any) {
        this.internal(LogLevel.SOFT_FAIL, message, data);
    }

    warning(message: string, data?: any) {
        this.internal(LogLevel.WARNING, message, data);
    }

    info(message: string, data?: any) {
        this.internal(LogLevel.INFO, message, data);
    }

    debug(message: string, data?: any) {
        this.internal(LogLevel.DEBUG, message, data);
    }

    perf(message: string, data?: any) {
        this.internal(LogLevel.PERF, message, data);
    }

    /**
     * Logs given message only once as WARNING. It's used to warn user that some feature he is using has been deprecated.
     */
    deprecated(message: string) {
        if (this.deprecationsReported[message]) return;

        this.deprecationsReported[message] = true;
        this.warning(message);
    }
}
