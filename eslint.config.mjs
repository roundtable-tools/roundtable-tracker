import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import stylisticJs from "@stylistic/eslint-plugin-js";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: Object.fromEntries(
        Object.entries(globals.browser).map(([key, value]) => [
          key.trim(),
          value,
        ])
      ),
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "@stylistic/js": stylisticJs,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@stylistic/js/padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: ["case", "default"], next: "*" },
        { blankLine: "always", prev: "*", next: ["case", "default"] },
        {
          blankLine: "any",
          prev: ["const", "let", "var"],
          next: ["const", "let", "var"],
        },
        { blankLine: "any", prev: ["import"], next: ["import"] },
        { blankLine: "always", prev: ["export"], next: ["export"] },
        { blankLine: "always", prev: ["*"], next: ["return"] },
      ],
    },
  }
);
