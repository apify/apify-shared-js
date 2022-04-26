import { LoggerText } from './logger_text';
import { Logger } from './logger';
import { LogLevel, PREFIX_DELIMITER } from './log_consts';
import { getLevelFromEnv, limitDepth } from './log_helpers';

export interface LoggerOptions {
    /**
     * Sets the log level to the given value, preventing messages from less important log levels
     * from being printed to the console. Use in conjunction with the `log.LEVELS` constants.
     */
    level?: number;
    /** Max depth of data object that will be logged. Anything deeper than the limit will be stripped off. */
    maxDepth?: number;
    /** Max length of the string to be logged. Longer strings will be truncated. */
    maxStringLength?: number;
    /** Prefix to be prepended the each logged line. */
    prefix?: string | null;
    /** Suffix that will be appended the each logged line. */
    suffix?: string | null;
    /**
     * Logger implementation to be used. Default one is log.LoggerText to log messages as easily readable
     * strings. Optionally you can use `log.LoggerJson` that formats each log line as a JSON.
     */
    logger?: Logger;
    /** Additional data to be added to each log line. */
    data?: Record<string, unknown>,
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

type AdditionalData = Record<string, any> | null;

/**
 * The log instance enables level aware logging of messages and we advise
 * to use it instead of `console.log()` and its aliases in most development
 * scenarios.
 *
 * A very useful use case for `log` is using `log.debug` liberally throughout
 * the codebase to get useful logging messages only when appropriate log level is set
 * and keeping the console tidy in production environments.
 *
 * The available logging levels are, in this order: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `OFF`
 * and can be referenced from the `log.LEVELS` constant, such as `log.LEVELS.ERROR`.
 *
 * To log messages to the system console, use the `log.level(message)` invocation,
 * such as `log.debug('this is a debug message')`.
 *
 * To prevent writing of messages above a certain log level to the console, simply
 * set the appropriate level. The default log level is `INFO`, which means that
 * `DEBUG` messages will not be printed, unless enabled.
 *
 * **Example:**
 * ```js
 * const Apify = require('apify');
 * const { log } = Apify.utils;
 *
 * log.info('Information message', { someData: 123 }); // prints message
 * log.debug('Debug message', { debugData: 'hello' }); // doesn't print anything
 *
 * log.setLevel(log.LEVELS.DEBUG);
 * log.debug('Debug message'); // prints message
 *
 * log.setLevel(log.LEVELS.ERROR);
 * log.debug('Debug message'); // doesn't print anything
 * log.info('Info message'); // doesn't print anything
 *
 * log.error('Error message', { errorDetails: 'This is bad!' }); // prints message
 * try {
 *   throw new Error('Not good!');
 * } catch (e) {
 *   log.exception(e, 'Exception occurred', { errorDetails: 'This is really bad!' }); // prints message
 * }
 *
 * log.setOptions({ prefix: 'My actor' });
 * log.info('I am running!'); // prints "My actor: I am running"
 *
 * const childLog = log.child({ prefix: 'Crawler' });
 * log.info('I am crawling!'); // prints "My actor:Crawler: I am crawling"
 * ```
 *
 * Another very useful way of setting the log level is by setting the `APIFY_LOG_LEVEL`
 * environment variable, such as `APIFY_LOG_LEVEL=DEBUG`. This way, no code changes
 * are necessary to turn on your debug messages and start debugging right away.
 *
 * To add timestamps to your logs, you can override the default logger settings:
 * ```js
 * log.setOptions({
 *     logger: new log.LoggerText({ skipTime: false }),
 * });
 * ```
 * You can customize your logging further by extending or replacing the default
 * logger instances with your own implementations.
 */
export class Log {
    /**
     * Map of available log levels that's useful for easy setting of appropriate log levels.
     * Each log level is represented internally by a number. Eg. `log.LEVELS.DEBUG === 5`.
     */
    readonly LEVELS = LogLevel; // for BC

    private options: Required<LoggerOptions>;

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

    /**
     * Returns the currently selected logging level. This is useful for checking whether a message
     * will actually be printed to the console before one actually performs a resource intensive operation
     * to construct the message, such as querying a DB for some metadata that need to be added. If the log
     * level is not high enough at the moment, it doesn't make sense to execute the query.
     */
    getLevel() {
        return this.options.level;
    }

    /**
     * Sets the log level to the given value, preventing messages from less important log levels
     * from being printed to the console. Use in conjunction with the `log.LEVELS` constants such as
     *
     * ```
     * log.setLevel(log.LEVELS.DEBUG);
     * ```
     *
     * Default log level is INFO.
     */
    setLevel(level: LogLevel) {
        if (!LogLevel[level]) throw new Error('Options "level" must be one of log.LEVELS enum!');

        this.options.level = level;
    }

    internal(level: LogLevel, message: string, data?: any, exception?: any) {
        if (level > this.options.level) return;

        data = { ...this.options.data, ...data };
        data = Object.keys(data).length > 0 ? this._limitDepth(data) : undefined;
        exception = this._limitDepth(exception);

        this.options.logger.log(level, message, data, exception, {
            prefix: this.options.prefix,
            suffix: this.options.suffix,
        });
    }

    /**
     * Configures logger.
     */
    setOptions(options: Partial<LoggerOptions>) {
        this.options = { ...this.options, ...options };
    }

    /**
     * Returns the logger configuration.
     */
    getOptions(): Required<LoggerOptions> {
        return { ...this.options };
    }

    /**
     * Creates a new instance of logger that inherits settings from a parent logger.
     */
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

    /**
     * Logs an `ERROR` message. Use this method to log error messages that are not directly connected
     * to an exception. For logging exceptions, use the `log.exception` method.
     */
    error(message: string, data?: AdditionalData) {
        this.internal(LogLevel.ERROR, message, data);
    }

    /**
     * Logs an `ERROR` level message with a nicely formatted exception. Note that the exception is the first parameter
     * here and an additional message is only optional.
     */
    exception(exception: Error, message: string, data?: AdditionalData) {
        this.internal(LogLevel.ERROR, message, data, exception);
    }

    softFail(message: string, data?: AdditionalData) {
        this.internal(LogLevel.SOFT_FAIL, message, data);
    }

    /**
     * Logs a `WARNING` level message. Data are stringified and appended to the message.
     */
    warning(message: string, data?: AdditionalData) {
        this.internal(LogLevel.WARNING, message, data);
    }

    /**
     * Logs an `INFO` message. `INFO` is the default log level so info messages will be always logged,
     * unless the log level is changed. Data are stringified and appended to the message.
     */
    info(message: string, data?: AdditionalData) {
        this.internal(LogLevel.INFO, message, data);
    }

    /**
     * Logs a `DEBUG` message. By default, it will not be written to the console. To see `DEBUG`
     * messages in the console, set the log level to `DEBUG` either using the `log.setLevel(log.LEVELS.DEBUG)`
     * method or using the environment variable `APIFY_LOG_LEVEL=DEBUG`. Data are stringified and appended
     * to the message.
     */
    debug(message: string, data?: AdditionalData) {
        this.internal(LogLevel.DEBUG, message, data);
    }

    perf(message: string, data?: AdditionalData) {
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
