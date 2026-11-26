export const REDACTED_PLACEHOLDER = '***';

// All patterns run in time linear in the string length.
const SENSITIVE_WORDS =
    'passw(?:or)?ds?|pwd|passphrase|secrets?|tokens?|authorization|bearer|cookies?|credentials?|signature' +
    '|connection[-_]?string|(?:api|private|encryption)[-_]?keys?';
// A whole word of the name has to match, so that `tokenizer` or `secretary` is kept.
const SENSITIVE_KEY_REGEX = new RegExp(`(?<![a-z])(?:${SENSITIVE_WORDS})(?![a-z])|^auth$`, 'i');
// Names that describe a secret instead of holding one, e.g. `tokenUrl`, `token_type`, `secretName`, `nextPageToken`.
const DESCRIPTIVE_KEY_REGEX =
    /[-_](?:ids?|name|type|ur[li]|endpoint|version|count|length|limit|expir\w*|consent|banner|policy)$|(?:page|pagination|continuation|cancellation|next)[-_]?token$/i;
const QUERY_PARAMETER_REGEX = new RegExp(
    `((?:[?&;#]|%3F|%26)((?=[\\w.[\\]-]{0,64}?(?:${SENSITIVE_WORDS}))[\\w.[\\]-]{1,64}|auth)=)[^&\\s"'<>#]+`,
    'gi',
);
// A pattern runs only on a string that holds its marker, so a plain string costs a few `includes()` calls.
// Each marker is one character: a search for a longer one is slower than the pattern itself on a long string.
const FORMATS: [marker: string, pattern: RegExp, replacement: string][] = [
    ['J', /\beyJ[\w-]{8,}\.eyJ[\w-]{8,}\.[\w-]*/g, REDACTED_PLACEHOLDER],
    ['_', /\b((?:apify_(?:[a-z]{1,16}_){1,4}|integration_api_token_))[A-Za-z0-9]{20,}/g, `$1${REDACTED_PLACEHOLDER}`],
    // Only after the header name: a bare `Basic ...` or `Bearer ...` is too often plain prose.
    [
        ':',
        /(authorization[\\"']{0,3}\s{0,8}:\s{0,8}[\\"']{0,3}(?:bearer|basic)\s{1,8})[\w.~+/=-]{8,}/gi,
        `$1${REDACTED_PLACEHOLDER}`,
    ],
    // Starts at the literal `://`: with a scheme in front, the engine would retry at every word of the text.
    ['@', /(:\/\/[^\s/:@]{0,256}):[^\s/@]{1,256}@/g, `$1:${REDACTED_PLACEHOLDER}@`],
];

const sensitiveKeys = new Map<string, boolean>();
const MAX_CACHED_KEYS = 1000;

/** Tells whether a field of this name holds a secret, e.g. `password`, `apiToken` or `x-api-key`, but not `tokenUrl`. */
export const isSensitiveKey = (key: PropertyKey) => {
    if (typeof key !== 'string') return false;
    const cached = sensitiveKeys.get(key);
    if (cached !== undefined) return cached;

    // The words are split first: `passwordValid` is not `..._id`, and `JWTToken` holds the word `token`
    const words = key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z])([A-Z][a-z])/g, '$1_$2');
    const isSensitive = SENSITIVE_KEY_REGEX.test(words) && !DESCRIPTIVE_KEY_REGEX.test(words);
    // Names can be generated, e.g. IDs used as keys, so the cache is emptied before it grows without limit
    if (sensitiveKeys.size >= MAX_CACHED_KEYS) sensitiveKeys.clear();
    sensitiveKeys.set(key, isSensitive);
    return isSensitive;
};

/** Masks secrets with a known format: Apify tokens, JWTs, `Authorization` credentials, URL passwords, query parameters. */
export const redactString = (text: string) => {
    const masked = FORMATS.reduce(
        (result, [marker, pattern, replacement]) =>
            result.includes(marker) ? result.replace(pattern, replacement) : result,
        text,
    );
    if (!masked.includes('=')) return masked;
    return masked.replace(QUERY_PARAMETER_REGEX, (match, prefix: string, name: string) =>
        isSensitiveKey(name) ? `${prefix}${REDACTED_PLACEHOLDER}` : match,
    );
};

type Masks = Record<string, (value: any) => unknown>;

/** Applies the mask of each field that is present, so that no field is added. */
const applyMasks = (object: Record<string, any>, masks: Masks) =>
    Object.fromEntries(
        Object.entries(object).map(([key, value]) => [
            key,
            value != null && Object.hasOwn(masks, key) ? masks[key](value) : value,
        ]),
    );

const mask = () => REDACTED_PLACEHOLDER;
const CONFIG_MASKS: Masks = {
    headers: mask,
    params: mask,
    data: mask,
    // The fragment is left to `redactString()`
    url: (url) => (typeof url === 'string' ? url.replace(/\?[^#]*/, `?${REDACTED_PLACEHOLDER}`) : url),
};
const RESPONSE_MASKS: Masks = { config: mask, request: mask };
const ERROR_MASKS: Masks = {
    request: mask,
    config: (config) => applyMasks(config, CONFIG_MASKS),
    response: (response) => applyMasks(response, RESPONSE_MASKS),
};

/** Masks the parts of an Axios error that hold the request headers, credentials and body, so that they stay visible as removed. */
export const maskAxiosRequest = (error: Record<string, any>) => applyMasks(error, ERROR_MASKS);
