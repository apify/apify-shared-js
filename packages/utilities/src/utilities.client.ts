/*!
 * This module contains various client-side utility and helper functions.
 *
 * Author: Jan Curn (jan@apify.com)
 * Copyright(c) 2016 Apify. All rights reserved.
 *
 */

import { VERSION_INT_MAJOR_BASE, VERSION_INT_MINOR_BASE, RELATIVE_URL_REGEX } from '@apify/consts';

/**
 * Returns true if object equals null or undefined, otherwise returns false.
 */
export function isNullOrUndefined(obj: unknown): boolean {
    return obj == null;
}

export function isBuffer(obj: any): boolean {
    return obj != null && obj.constructor != null && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj);
}

/**
 * Converts Date object to ISO string.
 */
export function dateToString(date: Date, middleT: boolean): string {
    if (!(date instanceof Date)) { return ''; }
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // January is 0, February is 1, and so on.
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const millis = date.getMilliseconds();

    const pad = (num: number) => (num < 10 ? `0${num}` : num);
    const datePart = `${year}-${pad(month)}-${pad(day)}`;
    // eslint-disable-next-line no-nested-ternary
    const millisPart = millis < 10 ? `00${millis}` : (millis < 100 ? `0${millis}` : millis);
    const timePart = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${millisPart}`;

    return `${datePart}${middleT ? 'T' : ' '}${timePart}`;
}

/**
 * Ensures a string is shorter than a specified number of character, and truncates it if not,
 * appending a specific suffix to it.
 * @param str
 * @param maxLength
 * @param [suffix] Suffix to be appended to truncated string. Defaults to "...[truncated]".
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
 * Gets ordinal suffix for a number (e.g. "nd" for 2).
 */
export function getOrdinalSuffix(num: number) {
    // code from https://ecommerce.shopify.com/c/ecommerce-design/t/ordinal-number-in-javascript-1st-2nd-3rd-4th-29259
    const s = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}

interface Uri {
    protocol?: string;
    host?: string;
    path?: string;
    query?: string;
    fragment?: string;
    fragmentKey?: Record<string, unknown>;
}

/**
 * @deprecated use `new URL()` instead
 */
export function parseUrl(str: string): Uri {
    if (typeof str !== 'string') return {};
    const o = {
        strictMode: false,
        key: ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port',
            'relative', 'path', 'directory', 'file', 'query', 'fragment'],
        q: {
            name: 'queryKey',
            parser: /(?:^|&)([^&=]*)=?([^&]*)/g,
        },
        parser: {
            strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/, // eslint-disable-line max-len,no-useless-escape
            loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/, // eslint-disable-line max-len,no-useless-escape
        },
    };

    const m = o.parser[o.strictMode ? 'strict' : 'loose'].exec(str);
    const uri: Uri = {};
    let i = o.key.length;

    while (i--) uri[o.key[i]] = m![i] || '';

    uri[o.q.name] = {};
    uri[o.key[12]].replace(o.q.parser, ($0: any, $1: any, $2: any) => {
        if ($1) uri[o.q.name][$1] = $2;
    });

    // our extension - parse fragment using a query string format (i.e. "#key1=val1&key2=val2")
    // this format is used by many websites
    uri.fragmentKey = {};
    if (uri.fragment) {
        // casting as any, as the usage seems invalid, replacer should always return something (but keeping as is to mitigate unwanted BCs)
        uri.fragment.replace(o.q.parser, (($0: any, $1: any, $2: any) => {
            if ($1) uri.fragmentKey![$1] = $2;
        }) as any);
    }

    return uri;
}

export function normalizeUrl(url: string, keepFragment?: boolean) {
    if (typeof url !== 'string' || !url.length) {
        return null;
    }

    let urlObj;

    try {
        urlObj = new URL(url.trim());
    } catch {
        return null;
    }

    const { searchParams } = urlObj;

    for (const key of [...searchParams.keys()]) {
        if (key.startsWith('utm_')) {
            searchParams.delete(key);
        }
    }

    searchParams.sort();

    const protocol = urlObj.protocol.toLowerCase();
    const host = urlObj.host.toLowerCase();
    const path = urlObj.pathname.replace(/\/$/, '');
    const search = searchParams.toString() ? `?${searchParams}` : '';
    const hash = keepFragment ? urlObj.hash : '';

    return `${protocol}//${host}${path}${search}${hash}`;
}

// Helper function for markdown rendered marked
// Renders links outside apify.com in readme with rel="noopener noreferrer nofollow" and target="_blank" attributes
export function markedSetNofollowLinks(href: string, title: string, text: string) {
    let urlParsed: URL;
    try {
        urlParsed = new URL(href);
    } catch (e) {
        // Probably invalid url, go on
    }
    const isApifyLink = (urlParsed! && /(\.|^)apify\.com$/i.test(urlParsed.hostname));
    return (isApifyLink)
        ? `<a href="${href}">${title || text}</a>`
        : `<a rel="noopener noreferrer nofollow" target="_blank" href="${href}">${title || text}</a>`;
}

// Helper function for markdown rendered marked
// Decreases level of all headings by one, h1 -> h2
export function markedDecreaseHeadsLevel(text: string, level: number) {
    level += 1;
    return `<h${level}>${text}</h${level}>`;
}

/**
 * Converts integer version number previously generated by buildNumberToInt() or versionNumberToInt()
 * to string in a form 'MAJOR.MINOR' or 'MAJOR.MINOR.BUILD' in case build number is non-zero.
 */
export function buildOrVersionNumberIntToStr(int: number): string | null {
    if (typeof int !== 'number' || !(int >= 0)) return null;

    const major = Math.floor(int / VERSION_INT_MAJOR_BASE);
    const remainder = int % VERSION_INT_MAJOR_BASE;
    const minor = Math.floor(remainder / VERSION_INT_MINOR_BASE);
    const build = remainder % VERSION_INT_MINOR_BASE;

    let str = `${major}.${minor}`;
    if (build > 0) str += `.${build}`;

    return str;
}

// escaped variants for various strings
const ESCAPE_DOT = '\uFF0E'; // "."
const ESCAPE_DOLLAR = '\uFF04'; // "$"
const ESCAPE_TO_BSON = '\uFF54\uFF4F\uFF22\uFF33\uFF2F\uFF2E'; // "toBSON"
const ESCAPE_TO_STRING = '\uFF54\uFF4F\uFF33\uFF54\uFF52\uFF49\uFF4E\uFF47'; // "toString"
const ESCAPE_BSON_TYPE = '\uFF3F\uFF42\uFF53\uFF4F\uFF4E\uFF54\uFF59\uFF50\uFF45'; // "_bsontype"
const ESCAPE_NULL = ''; // "\0" (null chars are removed completely, they won't be recovered)

const REGEXP_IS_ESCAPED = new RegExp(`(${ESCAPE_DOT}|^${ESCAPE_DOLLAR}|^${ESCAPE_TO_BSON}$|^${ESCAPE_BSON_TYPE}|^${ESCAPE_TO_STRING}$)`);

const REGEXP_DOT = new RegExp(ESCAPE_DOT, 'g');
const REGEXP_DOLLAR = new RegExp(`^${ESCAPE_DOLLAR}`);
const REGEXP_TO_BSON = new RegExp(`^${ESCAPE_TO_BSON}$`);
const REGEXP_TO_STRING = new RegExp(`^${ESCAPE_TO_STRING}$`);
const REGEXP_BSON_TYPE = new RegExp(`^${ESCAPE_BSON_TYPE}$`);

/**
 * If a property name is invalid for MongoDB or BSON, the function transforms
 * it to a valid form, which can be (most of the time) reversed back using unescapePropertyName().
 * For a detailed list of transformations, see escapeForBson().
 * @private
 */
export function escapePropertyName(name: string) {
    // From MongoDB docs:
    // "Field names cannot contain dots (.) or null ("\0") characters, and they must not start with
    // a dollar sign (i.e. $). See faq-dollar-sign-escaping for an alternate approach."
    // Moreover, the name cannot be "toBSON" and "_bsontype" because they have a special meaning in BSON serialization.
    // Other special BSON properties like $id and $db are covered thanks to $ escape.
    // 2021-06-25: The `toString` string was added as a property to escape because
    // it generates issues due to a bug in mongo bson-ext package https://jira.mongodb.org/browse/NODE-3375.

    // pre-test to improve performance
    if (/(\.|^\$|^toBSON$|^_bsontype$|^toString$|\0)/.test(name)) {
        name = name.replace(/\./g, ESCAPE_DOT);
        name = name.replace(/^\$/, ESCAPE_DOLLAR);
        name = name.replace(/^toBSON$/, ESCAPE_TO_BSON);
        name = name.replace(/^toString$/, ESCAPE_TO_STRING);
        name = name.replace(/^_bsontype$/, ESCAPE_BSON_TYPE);
        name = name.replace(/\0/g, ESCAPE_NULL);
    }

    return name;
}

/**
 * Reverses a string transformed using escapePropertyName() back to its original form.
 * Note that the reverse transformation might not be 100% correct for certain unlikely-to-occur strings
 * (e.g. string contain null chars).
 * @private
 */
export function unescapePropertyName(name: string) {
    // pre-test to improve performance
    if (REGEXP_IS_ESCAPED.test(name)) {
        name = name.replace(REGEXP_DOT, '.');
        name = name.replace(REGEXP_DOLLAR, '$');
        name = name.replace(REGEXP_TO_BSON, 'toBSON');
        name = name.replace(REGEXP_TO_STRING, 'toString');
        name = name.replace(REGEXP_BSON_TYPE, '_bsontype');
    }

    return name;
}

/**
 * Traverses an object, creates a deep clone if requested and transforms object keys and values using a provided function.
 * The `traverseObject` is recursive, hence if the input object has circular references, the function will run into
 * and infinite recursion and crash the Node.js process.
 * @param obj Object to traverse, it must not contain circular references!
 * @param clone If true, object is not modified but cloned.
 * @param transformFunc Function used to transform the property names na value.
 *  It has the following signature: `(key, value) => [key, value]`.
 *  Beware that the transformed value is only set if it !== old value.
 * @returns {*}
 * @private
 */
export function traverseObject(obj: Record<string, any>, clone: boolean, transformFunc: (key: string, value: unknown) => [string, unknown]) {
    // Primitive types don't need to be cloned or further traversed.
    // Buffer needs to be skipped otherwise this will iterate over the whole buffer which kills the event loop.
    if (
        obj === null
        || typeof obj !== 'object'
        || Object.prototype.toString.call(obj) === '[object Date]'
        || isBuffer(obj)
    ) return obj;

    let result;

    if (Array.isArray(obj)) {
        // obj is an array, keys are numbers and never need to be escaped
        result = clone ? new Array(obj.length) : obj;
        for (let i = 0; i < obj.length; i++) {
            const val = traverseObject(obj[i], clone, transformFunc);
            if (clone) result[i] = val;
        }

        return result;
    }

    // obj is an object, all keys need to be checked
    result = clone ? {} : obj;
    for (const key in obj) { // eslint-disable-line no-restricted-syntax, guard-for-in
        const val = traverseObject(obj[key], clone, transformFunc);
        const [transformedKey, transformedVal] = transformFunc(key, val);
        if (key === transformedKey) {
            // For better efficiency, skip setting the key-value if not cloning and nothing changed
            if (clone || val !== transformedVal) result[key] = transformedVal;
        } else {
            // Key has been renamed
            result[transformedKey] = transformedVal;
            if (!clone) delete obj[key];
        }
    }

    return result;
}

/**
 * Transforms an object so that it can be stored to MongoDB or serialized to BSON.
 * It does so by transforming prohibited property names (e.g. names starting with "$",
 * containing "." or null char, equal to "toBSON" or "_bsontype") to equivalent full-width Unicode chars
 * which are normally allowed. To revert this transformation, use unescapeFromBson().
 * @param obj Object to be transformed. It must not contain circular references or any complex types (e.g. Maps, Promises etc.)!
 * @param clone If true, the function transforms a deep clone of the object rather than the original object.
 * @returns {*} Transformed object
 */
export function escapeForBson(obj: Record<string, any>, clone = false) {
    return traverseObject(obj, clone, (key, value) => [escapePropertyName(key), value]);
}

/**
 * Reverts a transformation of object property names performed by escapeForBson().
 * Note that the reverse transformation might not be 100% equal to the original object
 * for certain unlikely-to-occur property name (e.g. one contain null chars or full-width Unicode chars).
 * @param obj Object to be transformed. It must not contain circular references or any complex types (e.g. Maps, Promises etc.)!
 * @param clone If true, the function transforms a deep clone of the object rather than the original object.
 * @returns {*} Transformed object.
 */
export function unescapeFromBson(obj: Record<string, any>, clone = false): Record<string, any> {
    return traverseObject(obj, clone, (key, value) => [unescapePropertyName(key), value]);
}

/**
 * Determines whether an object contains property names that cannot be stored to MongoDB.
 * See escapeForBson() for more details.
 * Note that this function only works with objects that are serializable to JSON!
 * @param obj Object to be checked. It must not contain circular references or any complex types (e.g. Maps, Promises etc.)!
 * @returns {boolean} Returns true if object is invalid, otherwise it returns false.
 */
export function isBadForMongo(obj: Record<string, any>): boolean {
    let isBad = false;
    try {
        traverseObject(obj, false, (key, value) => {
            const escapedKey = escapePropertyName(key);
            if (key !== escapedKey) {
                isBad = true;
                throw new Error();
            }
            return [key, value];
        });
    } catch (e) {
        if (!isBad) throw e;
    }
    return isBad;
}

export class JsonVariable {
    constructor(readonly name: string) { }

    getToken() {
        return `{{${this.name}}}`;
    }
}

/**
 * Stringifies provided value to JSON with a difference that supports functions that
 * are stringified using .toString() method.
 *
 * In addition to that supports instances of JsonVariable('my.token') that are replaced
 * with a {{my.token}}.
 */
export function jsonStringifyExtended(value: Record<string, any>, replacer?: ((k: string, val: unknown) => unknown) | null, space = 0): string {
    if (replacer && !(replacer instanceof Function)) throw new Error('Parameter "replacer" of jsonStringifyExtended() must be a function!');

    const replacements: Record<string, string> = {};

    const extendedReplacer = (key: string, val: unknown) => {
        val = replacer ? replacer(key, val) : val;

        if (val instanceof Function) return val.toString();
        if (val instanceof JsonVariable) {
            const randomToken = `<<<REPLACEMENT_TOKEN::${Math.random()}>>>`;
            replacements[randomToken] = val.getToken();
            return randomToken;
        }

        return val;
    };

    let stringifiedValue = JSON.stringify(value, extendedReplacer, space);
    Object.entries(replacements).forEach(([replacementToken, replacementValue]) => {
        stringifiedValue = stringifiedValue.replace(`"${replacementToken}"`, replacementValue);
    });

    return stringifiedValue;
}

/**
 * Splits a full name into the first name and last name, trimming all internal and external spaces.
 * Returns an array with two elements or null if splitting is not possible.
 */
export function splitFullName(fullName: string) {
    if (typeof fullName !== 'string') return [null, null];

    const names = (fullName || '').trim().split(' ');
    const nonEmptyNames = names.filter((val) => val);

    if (nonEmptyNames.length === 0) {
        return [null, null];
    }

    if (nonEmptyNames.length === 1) {
        return [null, nonEmptyNames[0]];
    }

    return [names[0], nonEmptyNames.slice(1).join(' ')];
}

/**
 * Perform a Regex test on a given URL to see if it is relative.
 */
export function isUrlRelative(url: string): boolean {
    return RELATIVE_URL_REGEX.test(url);
}
