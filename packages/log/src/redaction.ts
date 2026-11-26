export const REDACTED_PLACEHOLDER = '***';

// The name has to end with the word: `tokenUrl`, `cookieBanner` or `passwordPolicy` describe a secret and do not hold one.
const SENSITIVE_WORDS = 'passw(?:or)?d|pwd|secret|token|(?:api|private|secret)[-_]?key|authorization|cookies?';
const SENSITIVE_KEY_REGEX = new RegExp(`(?:${SENSITIVE_WORDS})$`, 'i');
const PAGINATION_KEY_REGEX = /(?:page|pagination|continuation|cancellation|next)[-_]?token$/i;
// A flag kept as a string, e.g. `includeToken: 'true'`
const FLAG_REGEX = /^(?:true|false|[01yn])$/i;

/** Tells whether the value is a secret by the name of its field, e.g. `password`, `apiToken` or `x-api-key`. */
export const isSecret = (key: PropertyKey, value: unknown) =>
    typeof key === 'string' &&
    typeof value === 'string' &&
    value !== '' &&
    SENSITIVE_KEY_REGEX.test(key) &&
    !PAGINATION_KEY_REGEX.test(key) &&
    !FLAG_REGEX.test(value);

// All patterns run in time linear in the string length.
const QUERY_PARAMETER_REGEX = new RegExp(
    `((?:[?&;#]|%3F|%26)([\\w.[\\]-]{0,64}?(?:${SENSITIVE_WORDS}))=)([^&\\s"'<>#]+)`,
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
    ['@', /(:\/\/[^\s/:@]{0,256}):[^\s/@[\]]{1,256}@/g, `$1:${REDACTED_PLACEHOLDER}@`],
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
        isSecret(name, value) ? `${prefix}${REDACTED_PLACEHOLDER}` : match,
    );
};
