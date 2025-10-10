export enum LogLevel {
    // Turns off logging completely
    OFF = 0,
    // For unexpected errors in Apify system
    ERROR = 1,
    // For situations where error is caused by user (e.g. Meteor.Error), i.e. when the error is not
    // caused by Apify system, avoid the word "ERROR" to simplify searching in log
    SOFT_FAIL = 2,
    WARNING = 3,
    INFO = 4,
    DEBUG = 5,
    // for performance stats
    PERF = 6,
}

export enum LogFormat {
    JSON = 'JSON',
    TEXT = 'TEXT',
}

export const PREFIX_DELIMITER = ':';
export const LEVELS = LogLevel;

export const TRUNCATION_FLAG_KEY = '[TRUNCATED]';
export const TRUNCATION_SUFFIX = '...[truncated]';

export const PREFERRED_FIELDS = [
    // Core JS Error fields
    'name',
    'message',
    'stack',
    'cause',

    // Axios / HTTP-related error metadata
    'url',
    'method',
    'code',
    'status',
    'statusCode',
    'statusText',

    // Response-related / API-specific identifiers
    'errorCode',
    'errorMessage',
    'errorResponse',

    // Potentially large nested objects (kept last)
    'response',
    'request',
    'data',
    'payload',
    'details',
    'exception',
    'config',
    'headers',
] as const;

// Inverse of LOG_LEVELS = maps log level to string.
export const LEVEL_TO_STRING = Object.keys(LogLevel).filter((x) => Number.isNaN(+x));

/**
 * A symbol used to mark a limited depth object as having come from an error
 * @internal
 */
export const IS_APIFY_LOGGER_EXCEPTION = Symbol('apify.processed_error');
