// This file contains polyfills to support older browsers,
// it might be removed in the future depending on browser market share.
// See https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        position = position || 0;

        return this.substr(position, searchString.length) === searchString;
    };
}
