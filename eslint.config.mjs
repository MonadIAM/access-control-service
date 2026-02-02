import importPlugin from "eslint-plugin-import";
import tslint from "typescript-eslint";
import globals from "globals";

import jsConfig from "./configs/eslint/js.config.mjs";
import tsConfig from "./configs/eslint/ts.config.mjs";
import prettierConfig from "./prettier.config.mjs";

export default [
    {
        ignores: [
            "dist/**/*",
            "configs/**/*",
            "node_modules/**/*",
            "./*.config.{mjs,ts}",
            "./configs/*.config.{mjs,ts}",
            "**/migrations/*.ts",
        ]
    },
    {
        files: ["src/**/*.ts"],
        languageOptions: {
            parser: tslint.parser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                project: "./tsconfig.json"
            },
            globals: {
                ...globals.node,
                ...globals.browser,
                ...globals.es2021
            }
        },
        plugins: {
            import: importPlugin
        },
        rules: {
            "import/prefer-default-export": "off",
            "import/order": [
                "error",
                {
                    groups: [
                        ["builtin", "external"],        // сначала встроенные и внешние пакеты (node и git modules)
                        ["internal"],                   // затем внутренние модули (path aliases)
                        ["parent", "sibling", "index"], // потом родительские, соседние и index (отновительные пути)
                    ],
                    pathGroups: [
                        {
                            pattern: "~*{/**,}",    // алиасы вида ~alias/... и ~alias
                            group: "internal",
                            position: "before"
                        },
                    ],
                    "newlines-between": "always" // пустая строка между каждой группой
                }
            ]
        }
    },
    ...jsConfig,
    ...tsConfig,
    ...prettierConfig
];
