import js from '@eslint/js';
import globals from 'globals';

// Configuração do ESLint para o backend. Antes deste arquivo, o ESLint cobria só a
// pasta vitrine-frontend, e o backend não tinha linter nenhum.
export default [
    {
        ignores: [
            'node_modules/**',
            'vitrine-frontend/**', // Tem a sua própria configuração de ESLint.
            'coverage/**'
        ]
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: 'commonjs',
            globals: {
                ...globals.node
            }
        },
        rules: {
            ...js.configs.recommended.rules,
            'no-unused-vars': ['error', { argsIgnorePattern: '^_|^req$|^next$' }],
            eqeqeq: ['error', 'always'],
            'no-var': 'error',
            'prefer-const': 'error',
            'no-console': 'off' // O servidor e o db:setup usam console de propósito.
        }
    },
    {
        // Os testes rodam no vitest com globals: true.
        files: ['tests/**/*.js'],
        languageOptions: {
            globals: {
                ...globals.node,
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                vi: 'readonly'
            }
        }
    },
    {
        // Arquivos de configuração em ESM.
        files: ['*.config.mjs', 'eslint.config.mjs'],
        languageOptions: {
            sourceType: 'module'
        }
    }
];
