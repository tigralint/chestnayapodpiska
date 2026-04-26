import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
    js.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: { jsx: true },
            },
            globals: {
                console: 'readonly',
                process: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            'react-hooks': reactHooksPlugin,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            '@typescript-eslint/no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            }],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-non-null-assertion': 'error',
            ...reactHooksPlugin.configs.recommended.rules,
            'no-undef': 'off',
            'no-unused-vars': 'off',
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'prefer-const': 'error',
        },
    },
    {
        // Специальные правила для тестов
        files: ['**/*.test.{ts,tsx}'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
        },
    },
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            'public/sw.js',
            '*.config.{js,ts}',
        ],
    },
];
