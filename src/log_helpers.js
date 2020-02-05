import _ from 'underscore';
import { truncate } from './utilities.client';
import { ENV_VARS } from './consts';
import { LEVELS } from './log_consts';

/**
 * Gets log level from env variable.
 * Both integers and strings (WARNING) are supported.
 */
export const getLogLevelFromEnv = () => {
    const envVar = process.env[ENV_VARS.LOG_LEVEL];

    if (!envVar) return LEVELS.INFO;
    if (LEVELS[envVar]) return LEVELS[envVar];

    return parseInt(envVar, 10);
};

/**
* Limits given object to given depth.
*
* ie. Replaces object's content by '[object]' and array's content
* by '[array]' when the value is nested more than given limit.
*/
export const limitDepth = (record, depth, maxStringLength) => {
    // handle common cases quickly
    const type = typeof (record);
    if (type === 'string') {
        return record.length > maxStringLength ? truncate(record, maxStringLength) : record;
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

    const nextCall = _.partial(limitDepth, _, depth - 1, maxStringLength);
    if (_.isArray(record)) return depth ? _.map(record, nextCall) : '[array]';
    if (_.isObject(record)) return depth ? _.mapObject(record, nextCall) : '[object]';

    // this shouldn't happen
    console.log(`WARNING: Object cannot be logged: ${record}`);

    return undefined;
};
