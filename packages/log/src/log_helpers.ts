import { ENV_VARS } from '@apify/consts';
import { LogLevel } from './log_consts';

/**
 * Ensures a string is shorter than a specified number of character, and truncates it if not, appending a specific suffix to it.
 * (copied from utilities package so logger do not have to depend on all of its dependencies)
 */
export function truncate(str: string, maxLength: number, suffix = '...[truncated]'): string {
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
    const envVar = process.env[ENV_VARS.LOG_LEVEL];

    if (!envVar) return LogLevel.INFO;
    if (Number.isFinite(+envVar)) return +envVar;
    if (LogLevel[envVar]) return LogLevel[envVar];

    return +envVar;
}

/**
 * Limits given object to given depth.
 *
 * ie. Replaces object's content by '[object]' and array's content
 * by '[array]' when the value is nested more than given limit.
 */
export function limitDepth<T>(record: T, depth: number, maxStringLength?: number): T | undefined {
    // handle common cases quickly
    if (typeof record === 'string') {
        return maxStringLength && record.length > maxStringLength ? truncate(record, maxStringLength) as unknown as T : record;
    }

    if (['number', 'boolean'].includes(typeof record) || record == null || record instanceof Date) {
        return record;
    }

    // WORKAROUND: Error's properties are not iterable, convert it to a simple object and preserve custom properties
    // NOTE: _.isError() doesn't work on Match.Error
    if (record instanceof Error) {
        const { name, message, stack, ...rest } = record;
        record = { name, message, stack, ...rest } as unknown as T;
    }

    const nextCall = (rec: T) => limitDepth(rec, depth - 1, maxStringLength);

    if (Array.isArray(record)) {
        return (depth ? record.map(nextCall) : '[array]') as unknown as T;
    }

    if (typeof record === 'object' && record !== null) {
        const mapObject = <U> (obj: U) => {
            const res = {} as U;
            Object.keys(obj).forEach((key) => {
                res[key] = nextCall(obj[key]);
            });
            return res;
        };

        return depth ? mapObject(record) : '[object]' as unknown as T;
    }

    // this shouldn't happen
    console.log(`WARNING: Object cannot be logged: ${record}`);

    return undefined;
}
