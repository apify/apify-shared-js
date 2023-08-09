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
