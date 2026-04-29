import { defineConfig } from '@apify/oxlint-config';

export default defineConfig({
    ignorePatterns: ['**/node_modules', '**/dist', 'coverage'],
    rules: {
        'typescript/no-explicit-any': 'off',
        'no-param-reassign': 'off',
    },
    overrides: [
        {
            files: ['*.config.ts', '*.config.mts', 'packages/*/tsup.config.ts'],
            rules: {
                'no-console': 'off',
                'import/no-default-export': 'off',
            },
        },
        {
            files: ['test/**'],
            rules: {
                'no-console': 'off',
                'no-useless-constructor': 'off',
                'typescript/ban-ts-comment': 'off',
                'jest/no-conditional-expect': 'off',
                'vitest/no-conditional-expect': 'off',
                'jest/expect-expect': 'off',
                'vitest/expect-expect': 'off',
                'jest/no-standalone-expect': 'off',
                'vitest/no-standalone-expect': 'off',
            },
        },
        {
            files: ['packages/json_schemas/scripts/**', 'packages/json_schemas/tools/**'],
            rules: {
                'no-console': 'off',
            },
        },
    ],
});
