// path: apps/api/.eslintrc.cjs
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  env: {
    node: true,
    jest: true
  },
  ignorePatterns: ["dist", "coverage", "node_modules"],
  rules: {
    // This repo currently uses `any` widely. Blocking on it breaks milestones.
    "@typescript-eslint/no-explicit-any": "off",

    // Allow unused parameters if prefixed with `_` (standard practice)
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }
    ],

    // You have intentional empty blocks in a few places. Don’t block milestones on it.
    "no-empty": "off"
  }
};