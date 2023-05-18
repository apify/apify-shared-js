function base64urlToBase64(input: string) {
    // Replace non-url compatible chars with base64 standard chars
    input = input
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    // Pad out with standard base64 required padding characters
    const pad = input.length % 4;
    if (pad) {
        if (pad === 1) {
            throw new Error('InvalidLengthError: Input base64url string is the wrong length to determine padding');
        }
        input += new Array(5 - pad).join('=');
    }

    return input;
}

function base64ToBase64Url(input: string) {
    return input.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/m, '');
}

/**
 * Encodes object (e.g. input for actor) to a string hash.
 */
export function encodeInput<T extends object>(input: T) {
    const data = JSON.stringify(input);
    const buffer = Buffer.from(data, 'utf8');

    const base64 = buffer.toString('base64');
    return base64ToBase64Url(base64);
}

/**
 * Decodes a string hash produced via `encodeInput` back into the original object.
 */
export function decodeInput(urlHash: string) {
    const base64 = base64urlToBase64(urlHash);
    const buffer = Buffer.from(base64, 'base64');
    const decoded = buffer.toString('utf8');

    return JSON.parse(decoded);
}

/**
 * Extract import statements from the code.
 */
export function separateImports(code: string): { code: string; imports: string } {
    const lines = code.split('\n');
    return {
        code: lines.filter((line) => !line.trim().startsWith('import')).join('\n'),
        imports: lines.filter((line) => line.trim().startsWith('import')).join('\n'),
    };
}
