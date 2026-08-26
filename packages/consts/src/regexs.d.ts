/**
 * Email validation regexp adapted from https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
 * with our restriction that hostname must be a TLD! (will not match example@localhost)
 * and two consecutive dots in name are not allowed (based on Mailgun convention, will not match ex..amle@example.com)
 */
export declare const EMAIL_REGEX_STR =
    "[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+";
/**
 * Matches a string containing valid email
 * Hostname must be a TLD! (will not match example@localhost)
 */
export declare const EMAIL_REGEX: RegExp;
/**
 * Matches a string containing single email or multiple emails separated by comma
 * Hostname must be a TLD! (will not match example@localhost)
 */
export declare const COMMA_SEPARATED_EMAILS_REGEX_STR =
    "([a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+)( *, *[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+)*";
/**
 * Matches a string containing single email or multiple emails separated by comma
 * Hostname must be a TLD! (will not match example@localhost)
 */
export declare const COMMA_SEPARATED_EMAILS_REGEX: RegExp;
/**
 * Comes from https://github.com/jonschlinkert/is-git-url/ but we have:
 * - added support for ...:/dir/subdir syntax
 */
export declare const GIT_REPO_REGEX: RegExp;
/**
 * Matches a string that might be used in a hostname (e.g. "my-host-name")
 */
export declare const DNS_SAFE_NAME_REGEX: RegExp;
/**
 * Regular expression to validate Apify Proxy group name and session ID.
 * This must correspond to REGEX_STR_USERNAME_VALUE in apify-system!
 */
export declare const APIFY_PROXY_VALUE_REGEX: RegExp;
/**
 * Regular expression to validate proxy urls, matches
 * http://asd:qweqwe@proxy.apify.com:8000
 * http://123123:qweqwe:asdasd@proxy.com:55555
 * http://proxy.apify.com:5000
 * http://root@proxy.apify.com:5000
 */
export declare const PROXY_URL_REGEX: RegExp;
/**
 * AWS S3 docs say:
 * "The following character sets are generally safe for use in key names:
 * - Alphanumeric characters [0-9a-zA-Z]
 * - Special characters !, -, _, ., *, ', (, and )"
 * However, some of those characters are not valid across Win/Unix OS.
 * Therefore we allow only a subset and limit the length to 256 characters (TODO: document this)
 */
export declare const KEY_VALUE_STORE_KEY_REGEX: RegExp;
export declare const TWITTER_REGEX: RegExp;
export declare const GITHUB_REGEX: RegExp;
/**
 * For matching linkedin URLs for both profiles and companies.
 * Used for validating urls in user settings.
 */
export declare const LINKEDIN_PROFILE_REGEX: RegExp;
/**
 * @deprecated Discontinue usage of this regexps, in favor of HTTP_URL_REGEX
 */
export declare const URL_REGEX: RegExp;
export declare const HTTP_URL_REGEX: RegExp;
export declare const GITHUB_GIST_URL_REGEX: RegExp;
/**
 * Split's path /aaa/bbb/ccc into an array ['aaa', 'bbb', 'ccc].
 */
export declare const SPLIT_PATH_REGEX: RegExp;
/**
 * Check if a URL is relative, i.e. does not start with a protocol
 */
export declare const RELATIVE_URL_REGEX: RegExp;
/**
 * Check if a link is a mailto/tel/sms type
 */
export declare const CONTACT_LINK_REGEX: RegExp;
/**
 * Regular expression to match valid ID - 17 alphanumeric chars including chars restricted by SimpleSchema.RegEx.Id (1,l,0,O),
 * because we have user objects with that in database.
 * @type {RegExp}
 */
export declare const APIFY_ID_REGEX: RegExp;
