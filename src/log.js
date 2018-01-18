import _ from 'underscore';
import { truncate } from './utilities.client';

// Cache these values to avoid unnecessary syscalls, they are not changing anyway
const isProduction = process.env.NODE_ENV === 'production';

const LOG_LEVELS = {
    // For unexpected errors in Apifier system
    ERROR: 'ERROR',
    // For situations where error is caused by user (e.g. Meteor.Error), i.e. when the error is not
    // caused by Apifier system, avoid the word "ERROR" to simplify searching in log
    SOFT_FAIL: 'SOFT_FAIL',
    WARNING: 'WARNING',
    INFO: 'INFO',
    DEBUG: 'DEBUG',
    // for performance stats
    PERF: 'PERF',
};

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
 * Logs given object as JSON to standart output.
 */
const logInternal = function (message, data, level) {
    if (!level) level = LOG_LEVELS.INFO;

    if (!module.exports.isDebugMode && level === LOG_LEVELS.DEBUG) return;

    data = limitDepth(data, MAX_DEPTH);

    // Use short names to save log space.
    // In development mode show more concise log otherwise it's impossible to see anything in it.
    // Message must be shown early for people to see!
    // NOTE: not adding time and host on production, because LogDNA adds it by default and log space is expensive
    const rec = {
        time: !isProduction && !module.exports.skipTimeInDev ? new Date() : undefined,
        level,
        msg: message,
    };

    Object.assign(rec, data);

    console.log(JSON.stringify(rec));
};

const logWarning = function (message, data) { logInternal(message, data, LOG_LEVELS.WARNING); };
const logInfo = function (message, data) { logInternal(message, data, LOG_LEVELS.INFO); };
const logDebug = function (message, data) { logInternal(message, data, LOG_LEVELS.DEBUG); };
const logPerf = function (message, data) { logInternal(message, data, LOG_LEVELS.PERF); };
const logError = function (message, data) { logInternal(message, data, LOG_LEVELS.ERROR); };
const logSoftFail = function (message, data) { logInternal(message, data, LOG_LEVELS.SOFT_FAIL); };

const logException = function (exception, message, data) {
    if (!data) data = {};

    // if it's Meteor.Error then don't print stack trace and use "ERROR" level
    // which is used for more serious errors
    if (exception && exception.errorType === 'Meteor.Error') {
        const conciseException = {
            code: exception.error,
            reason: exception.reason || exception.message || exception.stack,
            details: exception.details,
        };
        logInternal(message, Object.assign({}, data, { exception: conciseException }), LOG_LEVELS.SOFT_FAIL);
    } else {
        logInternal(message, Object.assign({}, data, { exception }), LOG_LEVELS.ERROR);
    }
};


/**
 * Prepares log data for logMethodCall/logMethodException.
 */
const prepareData = function (self, methodName, args) {
    return {
        // keep method name first!
        methodName,
        loggedUserId: self.userId,
        clientIp: self.connection ? self.connection.clientAddress : null,
        args: args || undefined,
    };
};

// helper method to log server method invocation
const logMethodCall = function (self, methodName, args) {
    logInfo('Method called', prepareData(self, methodName, args));
};

// helper method to log Meteor server method exception
const logMethodException = function (exception, self, methodName, args) {
    logException(exception, 'Method threw an exception', prepareData(self, methodName, args));
};

module.exports = {
    // Core functions
    LEVELS: LOG_LEVELS,
    internal: logInternal,

    // Indicates whether DEBUG messages will be printed or not
    isDebugMode: false,

    // Indicates that time should not be logged when running in non-production environment
    skipTimeInDev: true,

    // Helper functions for common usage
    warning: logWarning,
    info: logInfo,
    debug: logDebug,
    perf: logPerf,
    error: logError,
    exception: logException,
    softFail: logSoftFail,
    methodCall: logMethodCall,
    methodException: logMethodException,
};
