import parser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";
import globals from "globals";

const prettierConfig = [
    {
        ignores: [
            "dist/**/*",
            "configs/**/*",
            "node_modules/**/*",
            "**/*.config.{mjs,ts}",
        ]
    },
    {
        files: ["src/**/*.ts"],
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
                    bracketSameLine: true, // Держать закрывающую скобку JSX/HTML на той же строке
                    arrowParens: "always", // Всегда оборачивать параметры стрелочных функций в ()
                    trailingComma: "all",  // Ставить запятую на последнем элементе везде, где возможно
                    printWidth: 124,       // Переносить строки длиннее 124 символов
                    endOfLine: "lf",       // Принудительно использовать LF (Unix-переход строки)
                    tabWidth: 4,           // Отступ = 4 пробела
                    semi: true,            // Всегда вставлять точку с запятой
                }
            ],
        },
    }
];

export default prettierConfig;
