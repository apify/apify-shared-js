import { readFileSync, readdirSync } from 'node:fs';
import { relative, resolve as resolveDir } from 'node:path';
import { defineConfig, type Options } from 'tsup';

const packages = readdirSync(resolveDir(__dirname, '../packages'));
const excludes = packages
    .map<string>((name) => {
        if (name.startsWith('.')) {
            return null;
        }

        try {
            const json = JSON.parse(readFileSync(resolveDir(__dirname, '../packages', name, 'package.json'), 'utf-8'));

            return json.name;
        } catch {
            return null;
        }
    })
    .filter(Boolean);

export function createTsupConfig(options: Options = {}) {
    return defineConfig({
        clean: true,
        dts: true,
        entry: ['src/index.ts'],
        format: 'esm',
        outDir: 'dist',
        minify: false,
        skipNodeModulesBundle: true,
        external: excludes,
        sourcemap: true,
        target: 'node22',
        tsconfig: relative(__dirname, resolveDir(process.cwd(), 'tsconfig.build.json')),
        keepNames: true,
        treeshake: false,
        ...options,
    });
}
