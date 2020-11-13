import LoggerText from './logger_text';
import LoggerJson from './logger_json';
import { LEVELS, LEVEL_TO_STRING, PREFIX_DELIMITER } from './log_consts';
import { limitDepth, getLevelFromEnv } from './log_helpers';

const getDefaultOptions = () => ({
    level: getLevelFromEnv(),
    maxDepth: 4,
    maxStringLength: 2000,
    prefix: null,
    suffix: null,
    logger: new LoggerText(),
    data: {},
});

class Log {
    constructor(options = {}) {
        options = { ...getDefaultOptions(), ...options };

        if (!LEVEL_TO_STRING[options.level]) throw new Error('Options "level" must be one of log.LEVELS enum!');
        if (typeof options.maxDepth !== 'number') throw new Error('Options "maxDepth" must be a number!');
        if (typeof options.maxStringLength !== 'number') throw new Error('Options "maxStringLength" must be a number!');
        if (options.prefix && typeof options.prefix !== 'string') throw new Error('Options "prefix" must be a string!');
        if (options.suffix && typeof options.suffix !== 'string') throw new Error('Options "suffix" must be a string!');
        if (typeof options.logger !== 'object') throw new Error('Options "logger" must be an object!');
        if (typeof options.data !== 'object') throw new Error('Options "data" must be an object!');

        this.options = options;
        this.deprecationsReported = {};
    }

    _limitDepth(obj) {
        return limitDepth(obj, this.options.maxDepth);
    }

    getLevel() {
        return this.options.level;
    }

    setLevel(level) {
        if (!LEVEL_TO_STRING[level]) throw new Error('Options "level" must be one of log.LEVELS enum!');

        this.options.level = level;
    }

    internal(level, message, data, exception) {
        if (level > this.options.level) return;

        data = { ...this.options.data, ...data };
        data = this._limitDepth(data);
        exception = this._limitDepth(exception);

        this.options.logger.log(level, message, data, exception, {
            prefix: this.options.prefix,
            suffix: this.options.suffix,
        });
    }

    setOptions(options) {
        this.options = { ...this.options, ...options };
    }

    getOptions() {
        return { ...this.options };
    }

    child(options) {
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

    error(message, data) {
        this.internal(LEVELS.ERROR, message, data);
    }

    exception(exception, message, data) {
        this.internal(LEVELS.ERROR, message, data, exception);
    }

    softFail(message, data) {
        this.internal(LEVELS.SOFT_FAIL, message, data);
    }

    warning(message, data) {
        this.internal(LEVELS.WARNING, message, data);
    }

    info(message, data) {
        this.internal(LEVELS.INFO, message, data);
    }

    debug(message, data) {
        this.internal(LEVELS.DEBUG, message, data);
    }

    perf(message, data) {
        this.internal(LEVELS.PERF, message, data);
    }

    /**
     * Logs given message only once as WARNING. It's used to warn user that some feature he is using
     * has been deprecated.
     */
    deprecated(message) {
        if (this.deprecationsReported[message]) return;

        this.deprecationsReported[message] = true;
        this.warning(message);
    }
}

const log = new Log();

log.Log = Log;
log.LEVELS = LEVELS;
log.LoggerText = LoggerText;
log.LoggerJson = LoggerJson;

// Default export is an initialized instance of logger.
export default log;
