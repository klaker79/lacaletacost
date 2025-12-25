import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';

export default [
    js.configs.recommended,
    prettierConfig,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                localStorage: 'readonly',
                fetch: 'readonly',
                console: 'readonly',
                alert: 'readonly',
                confirm: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
                // App globals
                Chart: 'readonly',
                XLSX: 'readonly',
                jsPDF: 'readonly',
                API_BASE: 'readonly',
                api: 'readonly'
            }
        },
        rules: {
            'no-console': ['warn', { allow: ['error', 'warn'] }],
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'prefer-const': 'error',
            'no-var': 'error',
            'eqeqeq': ['error', 'always'],
            'curly': ['error', 'multi-line'],
            'no-eval': 'error',
            'no-implied-eval': 'error'
        },
        ignores: [
            'node_modules/**',
            'dist/**',
            'coverage/**',
            '*.min.js'
        ]
    }
];
