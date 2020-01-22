import { ENV_VARS } from './consts';
import LoggerText from './logger_text';
import LoggerJson from './logger_json';
import { LOG_LEVELS, LOG_LEVEL_TO_STRING } from './log_consts';
import { limitDepth } from './log_helpers';

const getDefaultOptions = () => ({
    logLevel: parseInt(process.env[ENV_VARS.LOG_LEVEL] || LOG_LEVELS.INFO, 10),
    maxDepth: 4,
    maxStringLength: 2000,
    prefix: null,
    suffix: null,
    logger: new LoggerText(),
});

class Log {
    constructor(options = {}) {
        options = Object.assign({}, getDefaultOptions(), options);

        if (!LOG_LEVEL_TO_STRING[options.logLevel]) throw new Error('Options "logLevel" must be one of 0,1,...,6!');
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
        return this.options;
    }

    child(options) {
        const newOptions = Object.assign({}, this.options, options);

        return new Log(newOptions);
    }

    error(message, data) {
        this._log(LOG_LEVELS.ERROR, message, data);
    }

    exception(exception, message, data) {
        this._log(LOG_LEVELS.ERROR, message, data, exception);
    }

    softFail(message, data) {
        this._log(LOG_LEVELS.SOFT_FAIL, message, data);
    }

    warning(message, data) {
        this._log(LOG_LEVELS.WARNING, message, data);
    }

    info(message, data) {
        this._log(LOG_LEVELS.INFO, message, data);
    }

    debug(message, data) {
        this._log(LOG_LEVELS.DEBUG, message, data);
    }

    perf(message, data) {
        this._log(LOG_LEVELS.PERF, message, data);
    }

    _prepareMethodData(self, methodName, args) {
        return {
            // keep method name first!
            methodName,
            loggedUserId: self.userId,
            clientIp: self.connection ? self.connection.clientAddress : null,
            args: args || undefined,
        };
    }

    methodCall(self, methodName, args) {
        this.info('Method called', this._prepareMethodData(self, methodName, args));
    }

    methodException(exception, self, methodName, args) {
        this.exception(exception, 'Method threw an exception', this._prepareMethodData(self, methodName, args));
    }

    deprecated(message) {
        if (this.deprecationsReported[message]) return;

        this.deprecationsReported[message] = true;
        this.warning(message);
    }
}

module.exports = new Log();
module.exports.Log = Log;
module.exports.LoggerText = LoggerText;
module.exports.LoggerJson = LoggerJson;
module.exports.LOG_LEVELS = LOG_LEVELS;
