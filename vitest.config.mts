import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: [
            { find: /^@apify\/(.*)$/, replacement: path.resolve(__dirname, 'packages/$1/src') },
        ],
    },
    test: {
        testTimeout: 30e3,
        environment: 'node',
        include: ['test/**/*.test.ts'],
        coverage: {
            include: ['packages/*/src/**/*.ts'],
        },
    },
});
