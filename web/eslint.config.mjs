/**
 * 前端 ESLint（Flat Config）
 * - 只管代码质量；格式化交给 Prettier（pnpm -C web format）
 * - 与 web/.prettierrc 分离，避免 eslint-plugin-prettier 双重职责
 */
import globals from "globals"
import tseslint from "typescript-eslint"
import vueParser from "vue-eslint-parser"
import vuePlugin from "eslint-plugin-vue"

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "*.min.js",
      // 配置文件本身与构建产物
      "eslint.config.mjs",
      "vite.config.ts",
      "tailwind.config.js",
      "postcss.config.cjs",
      "scripts/**",
    ],
  },

  // TypeScript 推荐规则（.ts / .vue 的 script）
  ...tseslint.configs.recommended,

  // Vue 3 基础规则
  ...vuePlugin.configs["flat/essential"],

  {
    files: ["**/*.{ts,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".vue"],
        sourceType: "module",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // —— Vue ——
      "vue/multi-word-component-names": "off",
      "vue/no-v-html": "warn", // 论坛等处有 sanitize 后的 v-html
      // plugin-vue v9+ 推荐 block-order（component-tags-order 已弃用）
      "vue/block-order": [
        "error",
        {
          order: ["template", "script", "style"],
        },
      ],

      // —— TypeScript ——
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-empty-object-type": "off",

      // —— 通用 ——
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
    },
  },
)
