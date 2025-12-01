/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-require-imports */
const { fixupPluginRules, fixupConfigRules } = require('@eslint/compat');
const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const typescriptEslintEslintPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const { defineConfig, globalIgnores } = require('eslint/config');
const _import = require('eslint-plugin-import');
const jest = require('eslint-plugin-jest');
const unusedImports = require('eslint-plugin-unused-imports');
const globals = require('globals');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = defineConfig([
  {
    languageOptions: {
      parser: tsParser,
      sourceType: 'module',

      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: __dirname,
      },

      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },

    plugins: {
      import: fixupPluginRules(_import),
      'unused-imports': unusedImports,
    },

    extends: fixupConfigRules(
      compat.extends(
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript',
        'plugin:jest/recommended',
      ),
    ),

    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      'unused-imports/no-unused-imports': 'error',

      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],

      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'default', format: ['camelCase'] },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase', 'snake_case'],
        },
        { selector: 'function', format: ['camelCase'] },
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        { selector: 'typeLike', format: ['PascalCase', 'snake_case'] },
        {
          selector: 'enum',
          format: ['PascalCase', 'snake_case', 'UPPER_CASE'],
        },
        { selector: 'interface', format: ['PascalCase'], prefix: ['I'] },
        { selector: 'enumMember', format: ['UPPER_CASE'] },
        {
          selector: 'property',
          format: ['camelCase', 'PascalCase', 'snake_case'],
          leadingUnderscore: 'allow',
        },
      ],

      'no-console': 'warn',
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-return-await': 'error',
      'no-promise-executor-return': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],

      'prettier/prettier': ['error', { endOfLine: 'auto' }],

      'no-restricted-syntax': [
        'error',
        {
          selector:
            "MemberExpression[object.name='process'][property.name='env']",
          message:
            'Direct use of process.env is forbidden. Use a config service or environment abstraction instead.',
        },
      ],
    },

    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.ts', '.tsx', '.js', '.jsx'],
        },
      },
    },
  },
  globalIgnores(['**/.eslintrc.js']),
]);
