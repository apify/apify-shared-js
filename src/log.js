import _ from 'underscore';
import { ENV_VARS } from './consts';
import { truncate } from './utilities.client';

// Cache these values to avoid unnecessary syscalls, they are not changing anyway
const isProduction = process.env.NODE_ENV === 'production';

const LOG_LEVELS = {
    // Turns off logging completely
    OFF: 0,
    // For unexpected errors in Apify system
    ERROR: 1,
    // For situations where error is caused by user (e.g. Meteor.Error), i.e. when the error is not
    // caused by Apify system, avoid the word "ERROR" to simplify searching in log
    SOFT_FAIL: 2,
    WARNING: 3,
    INFO: 4,
    DEBUG: 5,
    // for performance stats
    PERF: 6,
};

// Maps log level numbers above to log level names to be outputted.
const LOG_LEVEL_TO_STRING = ['OFF', 'ERROR', 'SOFT_FAIL', 'WARNING', 'INFO', 'DEBUG', 'PERF'];

/**
 * Represents selected log level with INFO as default.
 */
let logLevel = LOG_LEVELS.INFO;

// Use 4 to log Braintree webhook data and chooseWorker() info.
const MAX_DEPTH = 4;
const MAX_STRING_LENGTH = 2000;

/**
 * Limits given object to given depth.
 *
 * ie. Replaces object's content by '[object]' and array's content
 * by '[array]' when the value is nested more than given limit.
 */
const limitDepth = function (record, depth) {
    // handle common cases quickly
    const type = typeof (record);
    if (type === 'string') {
        return record.length > MAX_STRING_LENGTH ? truncate(record, MAX_STRING_LENGTH) : record;
    }
    if (type === 'number'
        || type === 'boolean'
        || record === null
        || record === undefined
        || _.isDate(record)) return record;

    // WORKAROUND: Error's properties are not iterable, convert it to a simple object and preserve custom properties
    // NOTE: _.isError() doesn't work on Match.Error
    if (record instanceof Error) {
        record = _.extend({ name: record.name, message: record.message, stack: record.stack }, record);
    }

    const nextCall = _.partial(limitDepth, _, depth - 1);
    if (_.isArray(record)) return depth ? _.map(record, nextCall) : '[array]';
    if (_.isObject(record)) return depth ? _.mapObject(record, nextCall) : '[object]';

    // this shouldn't happen
    console.log(`WARNING: Object cannot be logged: ${record}`);

    return undefined;
};

/**
 * Prepare internal JSON log line
 */
const prepareInternalJsonLogLine = function (message, data, level, exception) {
    if (exception) data = Object.assign({}, data, { exception });

    data = limitDepth(data, MAX_DEPTH);

    if (module.exports.skipLevelInfo && level === LOG_LEVELS.INFO) level = undefined;

    // Use short names to save log space.
    // In development mode show more concise log otherwise it's impossible to see anything in it.
    // Message must be shown early for people to see!
    // NOTE: not adding time and host on production, because LogDNA adds it by default and log space is expensive
    const rec = {
        time: !isProduction && !module.exports.skipTimeInDev ? new Date() : undefined,
        level: LOG_LEVEL_TO_STRING[level],
        msg: message,
    };

    Object.assign(rec, data);

    return JSON.stringify(rec);
};

/**
 * Prepare internal plain text log line
 */
const prepareInternalPlainLogLine = function (message, data, level, exception) {
    data = limitDepth(data, MAX_DEPTH);

    const parts = [];

    if (!isProduction && !module.exports.skipTimeInDev) parts.push(new Date());
    if (!module.exports.skipLevelInfo || level !== LOG_LEVELS.INFO) parts.push(`${LOG_LEVEL_TO_STRING[level]}:`);

    parts.push(message);
    if (data && !_.isEmpty(data)) parts.push(JSON.stringify(data));
    if (exception) {
        exception = limitDepth(exception, MAX_DEPTH);

        // Parse error.type and error.details from ApifyClientError.
        const details = [];
        if (exception.type) details.push(`type=${exception.type}`);
        if (exception.details) {
            _.chain(exception.details).mapObject((val, key) => details.push(`${key}=${val}`));
        }
        if (details.length) parts.push(`(error details: ${details.join(', ')})`);
    }

    const line = parts.join(' ');

    return exception
        ? `${line}\n  ${exception.stack || exception}`
        : line;
};

/**
 * Sets the log level. Only messages with log level at or below
 * the chosen level will be logged.
 *
 * @example log.setLevel(log.LEVELS.ERROR) // Only errors will be logged.
 *
 * @param {Number} level
 */
const setLogLevel = (level) => {
    if (typeof level !== 'number' || level < 0 || level > 6) {
        throw new Error('Invalid log level. Use the LEVELS constants.');
    }
    logLevel = level;
};

/**
 * Logs given object as JSON to standart output.
 */
const logInternal = function (message, data, level, exception) {
    if (!level) level = LOG_LEVELS.INFO;
    if (!module.exports.isDebugMode && level === LOG_LEVELS.DEBUG) return;
    if (level > logLevel) return;

    const line = module.exports.logJson
        ? prepareInternalJsonLogLine(message, data, level, exception)
        : prepareInternalPlainLogLine(message, data, level, exception);

    console.log(line); // eslint-disable-line no-console
};

const logWarning = function (message, data) { logInternal(message, data, LOG_LEVELS.WARNING); };
const logInfo = function (message, data) { logInternal(message, data, LOG_LEVELS.INFO); };
const logDebug = function (message, data) { logInternal(message, data, LOG_LEVELS.DEBUG); };
const logPerf = function (message, data) { logInternal(message, data, LOG_LEVELS.PERF); };
const logError = function (message, data) { logInternal(message, data, LOG_LEVELS.ERROR); };
const logSoftFail = function (message, data) { logInternal(message, data, LOG_LEVELS.SOFT_FAIL); };

const logException = function (exception, message, data) {
    if (!data) data = {};

    // If it's Meteor.Error then don't print stack trace and use "SOFT_FAIL" level
    // which is used for less serious errors.
    if (exception && exception.errorType === 'Meteor.Error') {
        const conciseException = {
            code: exception.error,
            reason: exception.reason || exception.message || exception.stack,
            details: exception.details,
        };

        // Determine log level
        const httpCode = (exception.details ? exception.details.httpCode : null) || 500;
        const forceSoftFail = exception.details ? exception.details.forceSoftFail : false;
        const level = httpCode >= 500 && !forceSoftFail ? LOG_LEVELS.ERROR : LOG_LEVELS.SOFT_FAIL;

        logInternal(message, data, level, conciseException);
    } else {
        logInternal(message, data, LOG_LEVELS.ERROR, exception);
    }
};

const deprecationReported = {};
const logDeprecated = function (message) {
    if (deprecationReported[message]) return;
    deprecationReported[message] = true;
    logWarning(message);
};

module.exports = {
    // Core functions
    LEVELS: LOG_LEVELS,
    internal: logInternal,
    prepareInternalLogLine: prepareInternalJsonLogLine, // For backwards compatiblity. TODO: is it used anywhere?
    prepareInternalJsonLogLine,
    prepareInternalPlainLogLine,

    // Indicates whether DEBUG messages will be printed or not
    get isDebugMode() { return logLevel >= LOG_LEVELS.DEBUG; },
    set isDebugMode(x) { logLevel = x ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO; },

    // Indicates that time should not be logged when running in non-production environment
    skipTimeInDev: true,

    // Indicates if log line should be a JSON or plain text
    logJson: true,

    // Indicates that level: "INFO" property should be skipped in the log.
    // This is useful to reduce log space
    // get skipLevelInfo() { return logLevel < LOG_LEVELS.INFO; },
    // set skipLevelInfo(x) { logLevel = x ? LOG_LEVELS.WARNING : LOG_LEVELS.INFO; },
    skipLevelInfo: false,

    // Sets log level
    setLevel: setLogLevel,
    getLevel: () => logLevel,

    // Helper functions for common usage
    warning: logWarning,
    info: logInfo,
    debug: logDebug,
    perf: logPerf,
    error: logError,
    exception: logException,
    softFail: logSoftFail,
    deprecated: logDeprecated,
};

// Attempt to set log level from environment
if (process.env[ENV_VARS.LOG_LEVEL]) {
    const level = process.env[ENV_VARS.LOG_LEVEL];
    try {
        if (level.match(/\d+/)) setLogLevel(parseInt(level, 10));
        else setLogLevel(LOG_LEVELS[level]);
    } catch (err) {
        logWarning(`Setting log level: ${level} from environment failed. Using level ${LOG_LEVEL_TO_STRING[logLevel]}`);
    }
}
