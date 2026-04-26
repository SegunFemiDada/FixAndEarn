import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // Project overrides: keep correctness rules strict, relax noisy style rules.
  {
    rules: {
      // correctness (keep strict)
      "react-hooks/rules-of-hooks": "error",

      // noisy / not worth blocking shipping right now
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;