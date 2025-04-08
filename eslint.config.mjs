import tsEslint from 'typescript-eslint';

import apify from '@apify/eslint-config/ts';

// eslint-disable-next-line import/no-default-export
export default [
    {
        ignores: ['**/dist', 'node_modules', 'coverage', 'website/{build,.docusaurus}', '**/*.d.ts'],
    },
    ...apify,
    {
        languageOptions: {
            parser: tsEslint.parser,
            parserOptions: {
                project: 'tsconfig.json',
            },
        },
    },
    {
        plugins: {
            '@typescript-eslint': tsEslint.plugin,
        },
        rules: {
            'no-void': 0,
            'import/extensions': 0,
            'no-empty-function': 0,
            'no-param-reassign': 0,
            'no-use-before-define': 0,
            '@typescript-eslint/no-explicit-any': 0,
            '@typescript-eslint/no-empty-object-type': 0,
            '@typescript-eslint/no-empty-function': 1,
            '@typescript-eslint/no-unsafe-declaration-merging': 0,
        },
    },
    {
        files: ['test/**/*'],
        rules: {
            'no-console': 0,
            'no-void': 0,
            'no-useless-constructor': 0,
            'import/no-extraneous-dependencies': 0,
            'no-empty-function': 0,
            '@typescript-eslint/no-empty-function': 0,
            '@typescript-eslint/ban-ts-comment': 0,
        },
    },
];
