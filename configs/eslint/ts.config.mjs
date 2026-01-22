import globals from "globals";
import tslint from "typescript-eslint";

const warnRules = {
    "@typescript-eslint/no-explicit-any": ["warn"],              // Предупреждать при использовании типа any вместо конкретного типа
    "@typescript-eslint/prefer-optional-chain": ["warn"],        // Рекомендует вместо цепочек с && писать a?.b?.c
    "@typescript-eslint/prefer-nullish-coalescing": ["warn"],    // Рекомендует вместо x !== null && x !== undefined ? x : default писать x ?? default
    "@typescript-eslint/explicit-function-return-type": ["warn", // Рекомендует явно указывать возвращаемый тип функции, но разрешает в выражениях и при дженериках
        { allowExpressions: true, allowTypedFunctionExpressions: true }
    ],
};

const enabledRules = {
    // Запретить объявлять функции внутри циклов (избегаем захвата неправильной переменной)
    "@typescript-eslint/no-loop-func": ["error"],
    // Запретить все директивы подавления // @ts-…
    "@typescript-eslint/ban-ts-comment": ["error"],
    // Запретить использовать промисы в местах, где ожидаются void-функции
    "@typescript-eslint/no-misused-promises": ["error"],
    // Предпочитать T[] вместо Array<T>
    "@typescript-eslint/array-type": ["error", { default: "array" }],
    // Принуждает в интерфейсах писать методы как свойства с функцией, не как сигнатуры
    "@typescript-eslint/method-signature-style": ["error", "property"],
    // Запретить использовать переменные/классы до объявления, но функции можно
    "@typescript-eslint/no-use-before-define": ["error", { functions: false }],
    // Требовать явно указывать public/private/protected для полей и методов
    "@typescript-eslint/explicit-member-accessibility": ["error", { accessibility: "explicit" }],
    // Запретить неиспользуемые переменные, но позволять имена, начинающиеся с _
    "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
    }],
};

const disabledRules = {
    "@typescript-eslint/no-extraneous-class": "off",   // Разрешить пустые классы без статических членов (нужны для DI)
    "@typescript-eslint/no-non-null-assertion": "off", // Разрешить non nullable утверждения foo!
};

/**
 * Документация по правилам для этого конфига {@link [тут](https://typescript-eslint.io/getting-started/)}
 */
const tsConfig = [
    {
        files: ["src/**/*.{ts,tsx}"],
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
            "@typescript-eslint": tslint.plugin,
        },
        rules: {
            ...warnRules,
            ...enabledRules,
            ...disabledRules,
        },
    },
];

export default tsConfig;
