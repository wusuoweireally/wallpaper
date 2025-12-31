import globals from 'globals'
import tseslint from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'
import vuePlugin from 'eslint-plugin-vue'

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', '*.config.*'] },
  ...tseslint.configs.recommended,
  ...vuePlugin.configs['flat/essential'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        sourceType: 'module',
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      // Vue 特定规则
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'warn',
      'vue/component-tags-order': ['error', {
        order: ['template', 'script', 'style']
      }],

      // TypeScript 规则
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',

      // JavaScript 规则
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',

      // 最佳实践
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error'
    }
  }
)
