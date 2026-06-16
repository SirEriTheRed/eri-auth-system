import js from "@eslint/js";
import tseslint from "typescript-eslint";
import unicorn from "eslint-plugin-unicorn";
import sonarjs from "eslint-plugin-sonarjs";
import security from "eslint-plugin-security";
import importPlugin from "eslint-plugin-import";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "dist/",
      "node_modules/",
      "coverage/",
      ".husky/",
      "eslint.config.js",
      "lint-staged.config.js",
      "vitest.config.ts",
      "knip.json",
      "commitlint.config.js"
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      unicorn,
      sonarjs,
      security,
      import: importPlugin,
    },
    rules: {
      // TypeScript
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/restrict-template-expressions": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/unbound-method": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],

      // Unicorn
      "unicorn/filename-case": ["error", { case: "kebabCase" }],
      "unicorn/prefer-node-protocol": "error",
      "unicorn/prefer-top-level-await": "error",
      "unicorn/no-array-reduce": "off",
      "unicorn/no-null": "off",
      "unicorn/prevent-abbreviations": "off",

      // SonarJS
      "sonarjs/cognitive-complexity": ["error", 20],
      "sonarjs/no-duplicate-string": "warn",
      "sonarjs/no-identical-functions": "error",
      "sonarjs/prefer-immediate-return": "error",

      // Security
      "security/detect-object-injection": "off",
      "security/detect-non-literal-fs-filename": "error",
      "security/detect-eval-with-expression": "error",
      "security/detect-unsafe-regex": "error",
      "security/detect-buffer-noassert": "error",
      "security/detect-child-process": "error",
      "security/detect-disable-mustache-escape": "error",
      "security/detect-new-buffer": "error",
      "security/detect-pseudoRandomBytes": "warn",

      // Imports
      "import/order": ["error", {
        groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
        "newlines-between": "always",
        alphabetize: { order: "asc" },
      }],
      "import/no-duplicates": "error",
      "import/no-default-export": "error",
    },
  },
  // Test files + test helpers — relax strict type-checked rules for vitest globals
  {
    files: ["**/*.test.ts", "**/*.spec.ts", "tests/helpers.ts"],
    languageOptions: {
      parserOptions: {
        project: "tsconfig.test.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/unbound-method": "off",
      "sonarjs/no-duplicate-string": "off",
      "unicorn/filename-case": "off",
      "import/no-default-export": "off",
    },
  },
  eslintConfigPrettier,
);
