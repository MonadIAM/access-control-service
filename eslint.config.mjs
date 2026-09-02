import { importX } from "eslint-plugin-import-x";
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
            "**/*.generated.ts",
        ]
    },
    {
        files: ["{src,cli}/**/*.ts"],
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
            "import-x": importX
        },
        rules: {
            "import-x/prefer-default-export": "off",
            "import-x/order": [
                "error",
                {
                    groups: [
                        ["builtin", "external"],        // built-in and external packages (node and git modules)
                        ["internal"],                   // internal modules (path aliases)
                        ["parent", "sibling", "index"], // parent, sibling, and index (relative paths)
                    ],
                    pathGroups: [
                        {
                            pattern: "~*{/**,}",        // aliases like ~alias/... and ~alias
                            group: "internal",
                            position: "before"
                        },
                    ],
                    "newlines-between": "always"        // blank line between each group
                }
            ]
        }
    },
    ...jsConfig,
    ...tsConfig,
    ...prettierConfig
];
