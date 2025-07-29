// Parts for building an email regex (email will be constructed as `name@domain`)
// name parts can be alnum + some special characters
const namePartSubRegexStr = '[a-zA-Z0-9!#$%&\'*+/=?^_`{|}~-]+';
// name is 1+ name parts joined by periods (no leading or dangling period, no consecutive periods)
const nameSubRegexStr = `${namePartSubRegexStr}(?:\\.${namePartSubRegexStr})*`;
// domain parts can be alnum and dash characters (no leading and dangling dashes, max 63 chars long)
const domainPartSubRegexStr = '[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?'; //
// doman is 2+ domain parts joined by periods (no leading or dangling period, no consecutive periods)
const domainSubRegexStr = `${domainPartSubRegexStr}(?:\\.${domainPartSubRegexStr})+`;

/**
 * Email validation regexp adapted from https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
 * with our restriction that hostname must be a TLD! (will not match example@localhost)
 * and two consecutive dots in name are not allowed (based on Mailgun convention, will not match ex..amle@example.com)
 */
export const EMAIL_REGEX_STR = `${nameSubRegexStr}@${domainSubRegexStr}`;

/**
 * Matches a string containing valid email
 * Hostname must be a TLD! (will not match example@localhost)
 */
export const EMAIL_REGEX = new RegExp(`^${EMAIL_REGEX_STR}$`);

/**
 * Matches a string containing single email or multiple emails separated by comma
 * Hostname must be a TLD! (will not match example@localhost)
 */
export const COMMA_SEPARATED_EMAILS_REGEX_STR = `(${EMAIL_REGEX_STR})( *, *${EMAIL_REGEX_STR})*`;

/**
 * Matches a string containing single email or multiple emails separated by comma
 * Hostname must be a TLD! (will not match example@localhost)
 */
export const COMMA_SEPARATED_EMAILS_REGEX = new RegExp(`^${COMMA_SEPARATED_EMAILS_REGEX_STR}$`);

/**
 * Comes from https://github.com/jonschlinkert/is-git-url/ but we have:
 * - added support for ...:/dir/subdir syntax
 */
export const GIT_REPO_REGEX = /^(?:git|ssh|https?|git@[-\w.]+):(\/\/)?(.*?)(\/?|#[-\d\w._:/]+?)$/;

/**
 * Matches a string that might be used in a hostname (e.g. "my-host-name")
 */
export const DNS_SAFE_NAME_REGEX = /^((?!.*[aA][pP][iI][fF][yY].*$)[a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])$/;

/**
 * Matches a string that might be used in a hostname (e.g. "my-host-name")
 * Less strict than DNS_SAFE_NAME_REGEX
 */
export const DNS_SAFE_NAME_REGEX_ADMIN = /^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])$/;

/**
 * Regular expression to validate Apify Proxy group name and session ID.
 * This must correspond to REGEX_STR_USERNAME_VALUE in apify-system!
 */
export const APIFY_PROXY_VALUE_REGEX = /^[\w._~]+$/;

/**
 * Regular expression to validate proxy urls, matches
 * http://asd:qweqwe@proxy.apify.com:8000
 * http://123123:qweqwe:asdasd@proxy.com:55555
 * http://proxy.apify.com:5000
 * http://root@proxy.apify.com:5000
 */
export const PROXY_URL_REGEX = /^(socks(4|4a|5|5h)?|https?):\/\/(([^:]+:)?[^@]*@)?[^.:@]+\.[^:]+:[\d]+?$/;

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

/**
 * For matching linkedin URLs for both profiles and companies.
 * Used for validating urls in user settings.
 */
export const LINKEDIN_PROFILE_REGEX = /^(https?:\/\/)?(www\.)?([a-z]{2}\.)?linkedin.com\/(in|company)\/([A-Za-z0-9_-]+)\/?$/;

/**
 * @deprecated Discontinue usage of this regexps, in favor of HTTP_URL_REGEX
 */
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

/**
 * Split's path /aaa/bbb/ccc into an array ['aaa', 'bbb', 'ccc].
 */
export const SPLIT_PATH_REGEX = /[^/]+/g;

/**
 * Check if a URL is relative, i.e. does not start with a protocol
 */
export const RELATIVE_URL_REGEX = /^(?!www\.|(?:http|ftp)s?:\/\/|[A-Za-z]:\|\/\/).*/i;

/**
 * Check if a link is a mailto/tel/sms type
 */
export const CONTACT_LINK_REGEX = /^(mailto|tel|sms):.*$/i;

/**
 * Regular expression to match valid ID - 17 alphanumeric chars including chars restricted by SimpleSchema.RegEx.Id (1,l,0,O),
 * because we have user objects with that in database.
 * @type {RegExp}
 */
// TODO: @fnesveda [2022-08-15] revert to stricter regex /^[a-zA-Z0-9]{17}$/ once we properly delete user yZtyxMUADJHyInTIdl
export const APIFY_ID_REGEX = /[a-zA-Z0-9]{17}/;
