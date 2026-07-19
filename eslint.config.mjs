// Flat config (ESLint 9+). Named .mjs explicitly so it's parsed as ESM
// regardless of the root package.json's own module type (CommonJS — see
// packages/db/README.md for why).
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/.next/**",
      "**/generated/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/.turbo/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Warn, not error — a leading-underscore-for-intentionally-unused
      // convention beats either silencing the rule entirely or blocking a
      // build over it during Phase 1's fast iteration.
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
);
