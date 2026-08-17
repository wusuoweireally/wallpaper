/**
 * 后端 ESLint（Flat Config）
 * - TypeScript type-aware 规则 + Prettier 作为 ESLint 规则（与 .prettierrc 一致）
 * - 格式冲突由 eslint-plugin-prettier/recommended 统一
 */
// @ts-check
import eslint from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "eslint.config.mjs",
      "dist/**",
      "build/**",
      "node_modules/**",
      "coverage/**",
      "uploads/**",
      "scripts/**", // ts-node 手动工具脚本，不在 tsconfig 内
      "**/*.d.ts",
      "*.log",
      ".env*",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: "module",
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // 渐进收紧：历史代码里 unsafe 较多，先 warn 不挡提交
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
);
