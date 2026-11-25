import { APIFY_ENV_VARS } from '@apify/consts';

import {
    IS_APIFY_LOGGER_EXCEPTION,
    LogFormat,
    LogLevel,
    TRUNCATION_FLAG_KEY,
    TRUNCATION_SUFFIX,
} from './log_consts.js';
import { isSensitiveKey, omitAxiosRequest, REDACTED_PLACEHOLDER, redactString } from './redaction.js';

/**
 * Ensures a string is shorter than a specified number of character, and truncates it if not, appending a specific suffix to it.
 * (copied from utilities package so logger do not have to depend on all of its dependencies)
 */
export function truncate(str: string, maxLength: number, suffix = TRUNCATION_SUFFIX): string {
    maxLength = Math.floor(maxLength);

    // TODO: we should just ignore rest of the suffix...
    if (suffix.length > maxLength) {
        throw new Error('suffix string cannot be longer than maxLength');
    }

    if (typeof str === 'string' && str.length > maxLength) {
        str = str.substr(0, maxLength - suffix.length) + suffix;
    }

    return str;
}

/**
 * Gets log level from env variable. Both integers and strings (WARNING) are supported.
 */
export function getLevelFromEnv(): number {
    const envVar = process.env[APIFY_ENV_VARS.LOG_LEVEL] as keyof typeof LogLevel;

    if (!envVar) return LogLevel.INFO;
    if (Number.isFinite(+envVar)) return +envVar;
    if (LogLevel[envVar]) return LogLevel[envVar];

    return +envVar;
}

/**
 * Gets log format from env variable. Currently, values 'JSON' and 'TEXT' are supported.
 * Defaults to 'TEXT' if no value is specified.
 */
export function getFormatFromEnv(): LogFormat {
    const envVar = process.env[APIFY_ENV_VARS.LOG_FORMAT] || LogFormat.TEXT;

    switch (envVar.toLowerCase()) {
        case LogFormat.JSON.toLowerCase():
            return LogFormat.JSON;
        case LogFormat.TEXT.toLowerCase():
            return LogFormat.TEXT;
        default:
            // eslint-disable-next-line no-console
            console.warn(`Unknown value for environment variable ${APIFY_ENV_VARS.LOG_FORMAT}: ${envVar}`);
            return LogFormat.TEXT;
    }
}

type SanitizeDataOptions = {
    maxDepth?: number;
    gradualLimitFactor?: number;
    maxStringLength?: number;
    maxArrayLength?: number;
    maxFields?: number;
    preferredFieldsMap?: Record<PropertyKey, number>;
    truncationSuffix?: string;
    truncationFlagKey?: string;
    /** Masks secrets, see `LoggerOptions.redactSecrets`. */
    redactSecrets?: boolean;
    /** @internal The data sits under a field with a sensitive name. */
    isSensitive?: boolean;
};

/**
 * Sanitizes given object based on the given options.
 *
 * ie. Replaces object's content by '[object]' and array's content
 * by '[array]' when the value is nested more than given depth limit.
 */
export function sanitizeData(data: unknown, options: SanitizeDataOptions): unknown {
    const {
        maxDepth = Infinity,
        gradualLimitFactor = 1,
        maxStringLength = Infinity,
        maxArrayLength = Infinity,
        maxFields = Infinity,
        preferredFieldsMap = {},
        truncationSuffix = TRUNCATION_SUFFIX,
        truncationFlagKey = TRUNCATION_FLAG_KEY,
        redactSecrets = false,
        isSensitive = false,
    } = options;

    // handle common cases quickly
    if (typeof data === 'string') {
        if (isSensitive && data) return REDACTED_PLACEHOLDER;
        // Redact before truncating and read past the limit, so that a secret cut by it is still recognized
        const text = redactSecrets ? redactString(data.slice(0, maxStringLength + 256)) : data;
        return text.length > maxStringLength ? truncate(text, maxStringLength, truncationSuffix) : text;
    }

    if (['number', 'boolean', 'symbol', 'bigint'].includes(typeof data) || data == null || data instanceof Date) {
        return data;
    }

    // WORKAROUND: Error's properties are not iterable, convert it to a simple object and preserve custom properties
    // NOTE: _.isError() doesn't work on Match.Error
    if (data instanceof Error) {
        const isAxiosError = redactSecrets && (data as { isAxiosError?: unknown }).isAxiosError === true;
        const { name, message, stack, cause, ...rest } = data;
        const safeRest = isAxiosError ? omitAxiosRequest(rest) : rest;
        data = { name, message, stack, cause, ...safeRest, [IS_APIFY_LOGGER_EXCEPTION]: true };
    }

    const nextCall = (dat: unknown, isDatSensitive = isSensitive) =>
        sanitizeData(dat, {
            ...options,
            isSensitive: isDatSensitive,
            maxDepth: maxDepth - 1,
            maxStringLength: Math.max(
                Math.floor(maxStringLength * gradualLimitFactor),
                truncationSuffix.length, // always at least the length of the truncation suffix
            ),
            maxArrayLength: Math.floor(maxArrayLength * gradualLimitFactor),
            maxFields: Math.floor(maxFields * gradualLimitFactor),
        });

    if (Array.isArray(data)) {
        if (maxDepth <= 0) return '[array]';

        const sanitized = data.slice(0, maxArrayLength).map((item) => nextCall(item));

        if (data.length > maxArrayLength) {
            sanitized.push(truncationSuffix);
        }

        return sanitized;
    }

    if (typeof data === 'object' && data !== null) {
        if (maxDepth <= 0) return '[object]';

        // Sort preferred fields to the front
        const allKeys = Reflect.ownKeys(data);
        allKeys.sort((a, b) => {
            const aIndex = preferredFieldsMap[String(a)] ?? -1;
            const bIndex = preferredFieldsMap[String(b)] ?? -1;

            if (aIndex === -1 && bIndex === -1) return 0; // none is preferred
            if (aIndex === -1) return 1; // a is not preferred
            if (bIndex === -1) return -1; // b is not preferred
            return aIndex - bIndex; // both are preferred, sort by index
        });

        // Sanitize only up to maxFields fields (keeping preferred ones first)
        const sanitized: Record<PropertyKey, unknown> = {};
        allKeys.slice(0, maxFields).forEach((key) => {
            const isValueSensitive = isSensitive || (redactSecrets && isSensitiveKey(key));
            sanitized[key] = nextCall(data[key as keyof typeof data], isValueSensitive);
        });

        if (allKeys.length > maxFields) {
            sanitized[truncationFlagKey] = true;
        }

        return sanitized;
    }

    // Replaces all function with [function] string
    if (typeof data === 'function') {
        return '[function]';
    }

    // this shouldn't happen
    // eslint-disable-next-line no-console
    console.log(`WARNING: Object cannot be logged: ${data}`);

    return undefined;
}

// Like an error class, but turned into an object
export interface LimitedError {
    // used to identify this object as an error
    [IS_APIFY_LOGGER_EXCEPTION]: true;
    name: string;
    message: string;
    stack?: string;
    cause?: unknown;

    // Custom properties
    type?: string;
    details?: Record<string, unknown>;
    reason?: string;
    [key: string]: unknown;
}
