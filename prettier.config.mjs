import parser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";
import globals from "globals";

const prettierConfig = [
    {
        ignores: [
            "dist/**/*",
            "configs/**/*",
            "coverage/**/*",
            "node_modules/**/*",
            "./*.config.{mjs,ts}",
            "./configs/*.config.{mjs,ts}",
            "**/migrations/*.ts",
            "**/*.generated.ts",
        ]
    },
    {
        files: ["{src,cli}/**/*.ts"],
        languageOptions: {
            parser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                project: "./tsconfig.json",
            },
            globals: {
                ...globals.node,
                ...globals.browser,
                ...globals.es2021,
            },
        },
        plugins: { prettier },
        rules: {
            "prettier/prettier": [
                "error",
                {
                    bracketSameLine: true, // Keep JSX/HTML closing bracket on the same line
                    arrowParens: "always", // Always wrap arrow function parameters in ()
                    trailingComma: "all",  // Add trailing comma wherever possible
                    printWidth: 124,       // Wrap lines longer than 124 characters
                    endOfLine: "lf",       // Enforce LF (Unix line endings)
                    tabWidth: 4,           // Indent with 4 spaces
                    semi: true,            // Always insert semicolons
                }
            ],
        },
    }
];

export default prettierConfig;
