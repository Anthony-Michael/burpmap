import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

// Flat config base to extend Next.js rules while adding strict TypeScript and code quality constraints.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const config = [
  // Next.js baseline (Core Web Vitals + TS)
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "dist/**",
      "coverage/**",
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: false,
      },
    },
    plugins: {
      "simple-import-sort": (await import("eslint-plugin-simple-import-sort")).default,
      "unused-imports": (await import("eslint-plugin-unused-imports")).default,
      // Next.js config already provides TS plugin and import plugin
    },
    rules: {
      // TypeScript strictness
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      "@typescript-eslint/no-explicit-any": ["error", { ignoreRestArgs: false }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // Import hygiene and order
      "import/first": "error",
      "import/no-duplicates": "error",
      "import/newline-after-import": ["error", { count: 1 }],
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",

      // Complexity limits (tune to keep cognitive load low)
      complexity: ["error", { max: 10 }],
      "max-depth": ["error", 3],
      "max-params": ["error", 4],
      "max-lines": ["error", { max: 400, skipBlankLines: true, skipComments: true }],
      "max-statements": ["error", 25, { ignoreTopLevelFunctions: true }],

      // Code clarity
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      eqeqeq: ["error", "smart"],
      "no-implicit-coercion": "error",
      curly: ["error", "all"],

      // Remove truly unused imports
      "unused-imports/no-unused-imports": "error",
    },
  },
  // Typed rules enabled only for project TS files (not config files)
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/require-await": "error",
    },
  },
  // Turn off stylistic rules in ESLint that conflict with Prettier
  ...compat.extends("prettier"),
];

export default config;
