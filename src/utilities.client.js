/*!
 * This module contains various client-side utility and helper functions.
 *
 * Author: Jan Curn (jan@apifier.com)
 * Copyright(c) 2016 Apifier. All rights reserved.
 *
 */

require('./polyfills');

/**
 * Returns true if object equals null or undefined, otherwise returns false.
 * @param obj
 * @returns {boolean}
 */
export const isNullOrUndefined = function isNullOrUndefined(obj) {
    return obj === undefined || obj === null;
};

/**
 * Converts Date object to ISO string.
 * @param date
 * @param middleT
 * @returns {*}
 */
export const dateToString = function dateToString(date, middleT) {
    if (!(date instanceof Date)) { return ''; }
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // January is 0, February is 1, and so on.
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const millis = date.getMilliseconds();

    return `${
        year}-${
        month < 10 ? `0${month}` : month}-${
        day < 10 ? `0${day}` : day
    }${middleT ? 'T' : ' '
    }${hours < 10 ? `0${hours}` : hours}:${
        minutes < 10 ? `0${minutes}` : minutes}:${
        seconds < 10 ? `0${seconds}` : seconds}.${
        millis < 10 ? `00${millis}` : (millis < 100 ? `0${millis}` : millis)}`;
};

/**
 * Ensures a string is shorter than a specified number of character, and truncates it if not,
 * appending a specific suffix to it.
 * @param str
 * @param maxLength
 * @param suffix Suffix to be appended to truncated string. If null or undefined, it defaults to "...[truncated]".
 */
export const truncate = function (str, maxLength, suffix) {
    maxLength |= 0;
    if (typeof (suffix) !== 'string') { suffix = '...[truncated]'; }
    // TODO: we should just ignore rest of the suffix...
    if (suffix.length > maxLength) { throw new Error('suffix string cannot be longer than maxLength'); }
    if (typeof (str) === 'string' && str.length > maxLength) { str = str.substr(0, maxLength - suffix.length) + suffix; }
    return str;
};

/**
 * Gets ordinal suffix for a number (e.g. "nd" for 2).
 */
export const getOrdinalSuffix = function (num) {
    // code from https://ecommerce.shopify.com/c/ecommerce-design/t/ordinal-number-in-javascript-1st-2nd-3rd-4th-29259
    const s = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
};
