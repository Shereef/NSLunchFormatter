module.exports = [
    {
        ignores: ['node_modules/**', 'coverage/**']
    },
    {
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'module',
            globals: {
                browser: true,
                node: true
            }
        },
        rules: {
            indent: ['error', 4],
            quotes: ['error', 'single'],
            semi: ['error', 'always']
        },
        plugins: {
            prettier: {
                rules: {
                    'prettier/prettier': 'error'
                }
            }
        }
    }
];
