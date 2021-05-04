/**
 * Email validation regexp adapted from https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
 * with our restriction that hostname must be a TLD! (will not match example@localhost)
 */
export const EMAIL_REGEX_STR = '[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+'; // eslint-disable-line max-len

/**
 * Matches a string containing valid email
 * Hostname must be a TLD! (will not match example@localhost)
 */
export const EMAIL_REGEX = new RegExp(`^${EMAIL_REGEX_STR}$`);

/**
 * Comes from https://github.com/jonschlinkert/is-git-url/ but we have:
 * - added support for ...:/dir/subdir syntax
 */
export const GIT_REPO_REGEX = /^(?:git|ssh|https?|git@[-\w.]+):(\/\/)?(.*?)(\/?|#[-\d\w._:/]+?)$/;

/**
 * Matches a string that might be used in a hostname (e.g. "my-host-name")
 */
export const DNS_SAFE_NAME_REGEX = /^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])$/;

/**
 * Regular expression to validate Apify Proxy group name and session ID.
 * This must correspond to REGEX_STR_USERNAME_VALUE in apify-system!
 */
export const APIFY_PROXY_VALUE_REGEX = /^[\w._~]+$/;

// Regular expression to validate proxy urls, matches
// http://asd:qweqwe@proxy.apify.com:8000
// http://asd:qweqwe@proxy.apify.com:8000/
// http://123123:qweqwe:asdasd@proxy.com:55555
// http://proxy.apify.com:5000
// http://root@proxy.apify.com:5000
export const PROXY_URL_REGEX = /^http:\/\/(([^:]+:)?[^@]*@)?[^.:@]+\.[^:]+:[\d]+?$/;

/**
 * AWS S3 docs say:
 * "The following character sets are generally safe for use in key names:
 * - Alphanumeric characters [0-9a-zA-Z]
 * - Special characters !, -, _, ., *, ', (, and )"
 * However, some of those characters are not valid across Win/Unix OS.
 * Therefore we allow only a subset and limit the length to 256 characters (TODO: document this)
 */
export const KEY_VALUE_STORE_KEY_REGEX = /^([a-zA-Z0-9!\-_.'()]{1,256})$/;

// taken from https://github.com/shinnn/github-username-regex
const GITHUB_REGEX_STR = '[a-z\\d](?:[a-z\\d]|-(?=[a-z\\d])){0,38}';

export const TWITTER_REGEX = /^@[a-z0-9_]{1,15}$/i;
export const GITHUB_REGEX = new RegExp(`^${GITHUB_REGEX_STR}$`, 'i');

// @TODO: Discontinue usage of this regexps, in favor of HTTP_URL_REGEX
export const URL_REGEX = /^https?:\/\//i;

// Inspired by https://gist.github.com/dperini/729294, but doesn't match FTP URLs
/* eslint-disable */
export const HTTP_URL_REGEX = new RegExp(
    '^' +
    // protocol identifier (optional)
    // short syntax // still required
    // NOTE: We removed "|ftp"
    '(?:(?:(?:https?):)?\\/\\/)' +
    // user:pass BasicAuth (optional)
    '(?:\\S+(?::\\S*)?@)?' +
    '(?:' +
    // IP address exclusion
    // private & local networks
    '(?!(?:10|127)(?:\\.\\d{1,3}){3})' +
    '(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})' +
    '(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})' +
    // IP address dotted notation octets
    // excludes loopback network 0.0.0.0
    // excludes reserved space >= 224.0.0.0
    // excludes network & broadcast addresses
    // (first & last IP address of each class)
    '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' +
    '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
    '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' +
    '|' +
    // host & domain names, may end with dot
    // can be replaced by a shortest alternative
    // (?![-_])(?:[-\\w\\u00a1-\\uffff]{0,63}[^-_]\\.)+
    '(?:' +
    '(?:' +
    '[a-z0-9\\u00a1-\\uffff]' +
    '[a-z0-9\\u00a1-\\uffff_-]{0,62}' +
    ')?' +
    '[a-z0-9\\u00a1-\\uffff]\\.' +
    ')+' +
    // TLD identifier name, may end with dot
    // NOTE: "|xn--[a-z0-9]+" is our addition to support IDNs like "http://xn--80aaxitdbjk.xn--p1ai",
    // they can be used in a browser, so we consider them valid
    '(?:[a-z\\u00a1-\\uffff]{2,}\\.?|xn--[a-z0-9]+)' +
    ')' +
    // port number (optional)
    '(?::\\d{2,5})?' +
    // resource path (optional)
    '(?:[/?#]\\S*)?' +
    '$', 'i',
);
/* eslint-enable */

// E.g. https://gist.github.com/jancurn/2dbe83fea77c439b1119fb3f118513e7
export const GITHUB_GIST_URL_REGEX = new RegExp(`^https:\\/\\/gist\\.github\\.com\\/${GITHUB_REGEX_STR}\\/[0-9a-f]{32}$`, 'i');

// Split's path /aaa/bbb/ccc into an array ['aaa', 'bbb', 'ccc].
export const SPLIT_PATH_REGEX = /[^/]+/g;

// Check if a URL is relative, i.e. does not start with a protocol
export const RELATIVE_URL_REGEX = new RegExp('^(?!www.|(?:http|ftp)s?://|[A-Za-z]:\\|//).*', 'i');

// Check if a link is a mailto/tel/sms type
export const CONTACT_LINK_REGEX = new RegExp('^(mailto|tel|sms):.*$', 'i');
