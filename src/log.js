import LoggerTextImported from './logger_text';
import LoggerJsonImported from './logger_json';
import { LEVELS as LEVELS_IMPORTED, LEVEL_TO_STRING, PREFIX_DELIMITER } from './log_consts';
import { limitDepth, getLogLevelFromEnv } from './log_helpers';

const getDefaultOptions = () => ({
    logLevel: getLogLevelFromEnv(),
    maxDepth: 4,
    maxStringLength: 2000,
    prefix: null,
    suffix: null,
    logger: new LoggerTextImported(),
});

export class Log {
    constructor(options = {}) {
        options = Object.assign({}, getDefaultOptions(), options);

        if (!LEVEL_TO_STRING[options.logLevel]) throw new Error('Options "logLevel" must be one of log.LEVELS enum!');
        if (typeof options.maxDepth !== 'number') throw new Error('Options "maxDepth" must be a number!');
        if (typeof options.maxStringLength !== 'number') throw new Error('Options "maxStringLength" must be a number!');
        if (options.prefix && typeof options.prefix !== 'string') throw new Error('Options "prefix" must be a string!');
        if (options.suffix && typeof options.suffix !== 'string') throw new Error('Options "suffix" must be a string!');
        if (typeof options.logger !== 'object') throw new Error('Options "logger" must be an object!');

        this.options = options;
        this.deprecationsReported = {};
    }

    _limitDepth(obj) {
        return limitDepth(obj, this.options.maxDepth);
    }

    _log(logLevel, message, data, exception) {
        if (logLevel > this.options.logLevel) return;

        data = this._limitDepth(data);
        exception = this._limitDepth(exception);

        this.options.logger.log(logLevel, message, data, exception, {
            prefix: this.options.prefix,
            suffix: this.options.suffix,
        });
    }

    setOptions(options) {
        this.options = Object.assign({}, this.options, options);
    }

    getOptions() {
        return Object.assign({}, this.options);
    }

    child(options) {
        let { prefix } = this.options;

        if (options.prefix) {
            prefix = prefix
                ? `${prefix}${PREFIX_DELIMITER}${options.prefix}`
                : options.prefix;
        }

        const newOptions = Object.assign({}, this.options, options, { prefix });

        return new Log(newOptions);
    }

    error(message, data) {
        this._log(LEVELS.ERROR, message, data);
    }

    exception(exception, message, data) {
        this._log(LEVELS.ERROR, message, data, exception);
    }

    softFail(message, data) {
        this._log(LEVELS.SOFT_FAIL, message, data);
    }

    warning(message, data) {
        this._log(LEVELS.WARNING, message, data);
    }

    info(message, data) {
        this._log(LEVELS.INFO, message, data);
    }

    debug(message, data) {
        this._log(LEVELS.DEBUG, message, data);
    }

    perf(message, data) {
        this._log(LEVELS.PERF, message, data);
    }

    /**
     * Creates info object about Meteor.js method call.
     *
     * @param {Object} self Meteor method this reference.
     * @param {String} methodName
     * @param {Object} args
     */
    _prepareMethodData(self, methodName, args) {
        return {
            // keep method name first!
            methodName,
            loggedUserId: self.userId,
            clientIp: self.connection ? self.connection.clientAddress : null,
            args: args || undefined,
        };
    }

    /**
     * Logs info about Meteor.js method call.
     *
     * @param {Object} self Meteor method this reference.
     * @param {String} methodName
     * @param {Object} args
     */
    methodCall(self, methodName, args) {
        this.info('Method called', this._prepareMethodData(self, methodName, args));
    }

    /**
     * Logs error info about exception thrown from Meteor.js method call.
     *
     * @param {Error} exception
     * @param {Object} self Meteor method this reference.
     * @param {String} methodName
     * @param {Object} args
     */
    methodException(exception, self, methodName, args) {
        this.exception(exception, 'Method threw an exception', this._prepareMethodData(self, methodName, args));
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

// Default export is an initialized instance of logger.
export default new Log();

export const LoggerText = LoggerTextImported;
export const LoggerJson = LoggerJsonImported;
export const LEVELS = LEVELS_IMPORTED;
