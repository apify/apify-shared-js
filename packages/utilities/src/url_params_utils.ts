/**
 * Encodes object (e.g. input for actor) to a string hash.
 */
export function encodeInput<T extends object>(input: T) {
    const data = JSON.stringify(input);
    const buffer = Buffer.from(data, 'utf8');

    return buffer.toString('base64url');
}

/**
 * Decodes a string hash produced via `encodeInput` back into the original object.
 */
export function decodeInput(urlHash: string) {
    const buffer = Buffer.from(urlHash, 'base64url');
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
