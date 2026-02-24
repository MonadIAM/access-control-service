import globals from "globals";
import tslint from "typescript-eslint";

const warnRules = {
    "@typescript-eslint/no-explicit-any": ["warn"],              // Warn when using any instead of a specific type
    "@typescript-eslint/prefer-optional-chain": ["warn"],        // Suggest using a?.b?.c instead of chaining with &&
    "@typescript-eslint/prefer-nullish-coalescing": ["warn"],    // Suggest using x ?? default instead of x !== null && x !== undefined ? x : default
    "@typescript-eslint/explicit-function-return-type": ["warn", // Suggest explicit function return types, but allow in expressions and typed function expressions
        { allowExpressions: true, allowTypedFunctionExpressions: true }
    ],
};

const enabledRules = {
    // Disallow function declarations inside loops (avoid capturing wrong variable)
    "@typescript-eslint/no-loop-func": ["error"],
    // Disallow all suppression directives // @ts-…
    "@typescript-eslint/ban-ts-comment": ["error"],
    // Disallow using promises where void functions are expected
    "@typescript-eslint/no-misused-promises": ["error"],
    // Prefer T[] over Array<T>
    "@typescript-eslint/array-type": ["error", { default: "array" }],
    // Enforce methods in interfaces as function properties, not method signatures
    "@typescript-eslint/method-signature-style": ["error", "property"],
    // Disallow using variables/classes before declaration, but allow functions
    "@typescript-eslint/no-use-before-define": ["error", { functions: false }],
    // Require explicit public/private/protected for class fields and methods
    "@typescript-eslint/explicit-member-accessibility": ["error", { accessibility: "explicit" }],
    // Disallow unused variables, but allow names starting with _
    "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
    }],
};

const disabledRules = {
    "@typescript-eslint/no-extraneous-class": "off",   // Allow empty classes without static members (needed for DI)
    "@typescript-eslint/no-non-null-assertion": "off", // Allow non-null assertions foo!
};

/**
 * Rule documentation for this config {@link [here](https://typescript-eslint.io/getting-started/)}
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
