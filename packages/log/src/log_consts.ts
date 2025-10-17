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

export const LEVELS = LogLevel;
// Inverse of LEVELS = maps log level to string.
export const LEVEL_TO_STRING = Object.keys(LogLevel).filter((x) => Number.isNaN(+x));

export enum LogFormat {
    JSON = 'JSON',
    TEXT = 'TEXT',
}

/**
 * A symbol used to mark a limited depth object as having come from an error
 * @internal
 */
export const IS_APIFY_LOGGER_EXCEPTION = Symbol('apify.processed_error');

export const PREFIX_DELIMITER = ':';

export const TRUNCATION_FLAG_KEY = '[TRUNCATED]';
export const TRUNCATION_SUFFIX = '...[truncated]';

/** ID fields used in Apify system */
export const PREFERRED_ID_FIELDS = [
    '_id',
    'id',
    'userId',
    'impersonatedUserId',
    'impersonatingUserId',
    'adminUserId',
    'actorId',
    'actorTaskId',
    'taskId',
    'buildId',
    'buildNumber',
    'runId',
] as const;

/** Standard JS Error fields */
export const PREFERRED_ERROR_FIELDS = [
    'name',
    'message',
    'stack',
    'cause',
] as const;

/** Standard HTTP / network-related fields */
export const PREFERRED_HTTP_FIELDS = [
    'url',
    'method',
    'code',
    'status',
    'statusCode',
    'statusText',
] as const;

/** API error fields used in Apify system */
export const PREFERRED_API_ERROR_FIELDS = [
    'errorCode',
    'errorMessage',
    'errorResponse',
] as const;

/** Potentially large or nested data fields */
export const PREFERRED_DATA_FIELDS = [
    'response',
    'request',
    'data',
    'payload',
    'details',
    'exception',
    'config',
    'headers',
] as const;

export const PREFERRED_FIELDS = [
    ...PREFERRED_ID_FIELDS,
    ...PREFERRED_ERROR_FIELDS,
    ...PREFERRED_HTTP_FIELDS,
    ...PREFERRED_API_ERROR_FIELDS,
    ...PREFERRED_DATA_FIELDS,
] as const;
