export const REDACTED_PLACEHOLDER = '[redacted]';

// The name has to end with the word: `tokenUrl`, `cookieBanner` or `passwordPolicy` describe a secret and do not hold one.
const SENSITIVE_WORDS = 'passw(?:or)?d|secret|token|(?:api|private|secret)[-_]?key|authorization|cookies?';
const SENSITIVE_KEY_REGEX = new RegExp(`(?:${SENSITIVE_WORDS})$`, 'i');
const PAGINATION_KEY_REGEX =
    /(?:page|pagination|paging|continuation|cancellation|next|sync|skip|delta|resume|cursor)[-_]?token$/i;
const PASSWORD_KEY_REGEX = /passw(?:or)?d$/i;
// Their values can hold spaces, e.g. `Bearer <token>`, `sid=<id>; theme=dark` or a passphrase
const SPACED_KEY_REGEX = /(?:authorization|cookies?|passw(?:or)?d)$/i;
// e.g. `includeToken: 'true'`
const FLAG_VALUE_REGEX = /^(?:true|false|yes|no|[01yn])$/i;
const MIN_SECRET_LENGTH = 8;

const isSensitiveKey = (key: PropertyKey): key is string =>
    typeof key === 'string' && SENSITIVE_KEY_REGEX.test(key) && !PAGINATION_KEY_REGEX.test(key);

// A value with a space is a sentence such as `Token has expired`, except for a header or a password.
// A short value is a status such as `none`, except for a password.
const isSecret = (key: string, value: unknown) =>
    typeof value === 'string' &&
    value !== '' &&
    !FLAG_VALUE_REGEX.test(value) &&
    (!/\s/.test(value) || SPACED_KEY_REGEX.test(key)) &&
    (value.length >= MIN_SECRET_LENGTH || PASSWORD_KEY_REGEX.test(key));

/**
 * Masks a string, or the strings of an array, in a field with a sensitive name, e.g. `password`, `apiToken` or `x-api-key`.
 * An array is cut to one item over `maxArrayLength`, so that the caller still sees that it is too long.
 */
export const redactField = (key: PropertyKey, value: unknown, maxArrayLength: number) => {
    if (!isSensitiveKey(key)) return value;
    const mask = (item: unknown) => (isSecret(key, item) ? REDACTED_PLACEHOLDER : item);
    return Array.isArray(value) ? value.slice(0, maxArrayLength + 1).map(mask) : mask(value);
};

// All patterns run in time linear in the string length.
const QUERY_PARAMETER_REGEX = new RegExp(
    `((?:[?&;#]|%3F|%26)([\\w.-]{0,64}?(?:${SENSITIVE_WORDS}))=)([^&\\s"'<>#)]+)`,
    'gi',
);
// A pattern runs only on a string that holds its marker, so a plain string costs a few `includes()` calls.
// Each marker is one character: a search for a longer one is slower than the pattern itself on a long string.
const FORMATS: [marker: string, pattern: RegExp, replacement: string][] = [
    // The signature is optional: the truncation can cut a long token before it.
    ['J', /(?<![\w-])eyJ[\w-]{8,}\.eyJ[\w-]{8,}(?:\.[\w-]*)?/g, REDACTED_PLACEHOLDER],
    ['_', /\b((?:apify_(?:[a-z]{1,16}_){1,4}|integration_api_token_))[A-Za-z0-9]{20,}/g, `$1${REDACTED_PLACEHOLDER}`],
    // Only after the header name: a bare `Basic ...` or `Bearer ...` is too often plain prose.
    [
        ':',
        /(authorization[\\"']{0,3}\s{0,8}:\s{0,8}[\\"']{0,3}(?:bearer|basic)\s{1,8})[\w.~+/=-]{16,}/gi,
        `$1${REDACTED_PLACEHOLDER}`,
    ],
    // Starts at the literal `://`: with a scheme in front, the engine would retry at every word of the text.
    // Characters that end a URL or a host are left out, so that a port and a later `@` are not taken for a password.
    ['@', /(:\/\/[^\s/:@?#"'<>]{0,256}):[^\s/@[\]?#"'<>,;]{1,256}@/g, `$1:${REDACTED_PLACEHOLDER}@`],
];

/** Masks secrets with a known format: Apify tokens, JWTs, `Authorization` credentials, URL passwords, query parameters. */
export const redactString = (text: string) => {
    const masked = FORMATS.reduce(
        (result, [marker, pattern, replacement]) =>
            result.includes(marker) ? result.replace(pattern, replacement) : result,
        text,
    );
    if (!masked.includes('=')) return masked;
    return masked.replace(QUERY_PARAMETER_REGEX, (match, prefix: string, name: string, value: string) =>
        isSensitiveKey(name) && isSecret(name, value) ? `${prefix}${REDACTED_PLACEHOLDER}` : match,
    );
};
