import { relative, resolve as resolveDir } from 'node:path';
import { defineConfig, type Options } from 'tsup';
import { readFileSync, readdirSync } from 'node:fs';

const packages = readdirSync(resolveDir(__dirname, '../packages'));
const excludes = packages.map<string>((name) => {
    if (name.startsWith('.')) {
        return null;
    }

    try {
        const json = JSON.parse(readFileSync(resolveDir(__dirname, '../packages', name, 'package.json'), 'utf-8'));

        return json.name;
    } catch {
        return null;
    }
}).filter(Boolean);

const baseOptions: Options = {
    clean: true,
    dts: true,
    entry: ['src/index.ts'],
    minify: false,
    skipNodeModulesBundle: true,
    external: excludes,
    sourcemap: true,
    target: 'es2020',
    tsconfig: relative(__dirname, resolveDir(process.cwd(), 'tsconfig.build.json')),
    keepNames: true,
    treeshake: false,
};

export function createTsupConfig(options: EnhancedTsupOptions) {
    return [
        defineConfig({
            ...baseOptions,
            outDir: 'dist/cjs',
            format: 'cjs',
            outExtension: () => ({ js: '.cjs' }),
            ...options.cjsOptions,
            esbuildOptions(esbuildOptions, context) {
                if (options.cjsOptions?.esbuildOptions) {
                    options.cjsOptions.esbuildOptions(esbuildOptions, context);
                }

                esbuildOptions.target = options.cjsOptions?.target ?? baseOptions.target;
            },
        }),
        defineConfig({
            ...baseOptions,
            outDir: 'dist/esm',
            format: 'esm',
            ...options.esmOptions,
            esbuildOptions(esbuildOptions, context) {
                if (options.esmOptions?.esbuildOptions) {
                    options.esmOptions.esbuildOptions(esbuildOptions, context);
                }

                esbuildOptions.target = options.esmOptions?.target ?? baseOptions.target;
            },
        }),
        ...(options.iifeOptions?.enabled
            ? [
                defineConfig({
                    ...baseOptions,
                    dts: false,
                    entry: ['src/index.ts'],
                    outDir: 'dist/iife',
                    format: 'iife',
                    ...options.iifeOptions,
                    esbuildOptions(esbuildOptions, context) {
                        if (options.iifeOptions?.esbuildOptions) {
                            options.iifeOptions.esbuildOptions(esbuildOptions, context);
                        }

                        esbuildOptions.target = options.iifeOptions?.target ?? baseOptions.target;
                    },
                }),
            ]
            : []
        ),
    ];
}

interface EnhancedTsupOptions {
    cjsOptions?: Options;
    esmOptions?: Options;
    iifeOptions?: Options & {
        enabled?: boolean;
    };
}
