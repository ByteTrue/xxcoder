import js from "@eslint/js"
import nodePlugin from "eslint-plugin-n"

export default [
  js.configs.recommended,
  nodePlugin.configs["flat/recommended-module"],
  {
    files: ["**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "n/no-unsupported-features/es-syntax": "off",
      "n/no-missing-import": "off",
      "n/hashbang": "off",
    },
  },
  {
    ignores: ["node_modules/", "binaries/", "codeagent-wrapper/", "templates/", ".worktrees/"],
  },
]
