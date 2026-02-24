const warnRules = {
    "no-console": "warn",               // Warn on console.* usage (console.log, console.error, etc.)
    "no-useless-computed-key": "warn",  // Warn when key can be used instead of ["key"] in objects
};

const enabledRules = {
    "curly": "error",                   // Always use curly braces in if/else/for blocks, etc.
    "no-var": "error",                  // Disallow var declarations, use let/const only
    "no-eval": "error",                 // Disallow eval()
    "no-alert": "error",                // Disallow alert(), confirm(), prompt()
    "no-proto": "error",                // Disallow __proto__ access
    "no-caller": "error",               // Disallow arguments.caller and arguments.callee
    "no-bitwise": "error",              // Disallow bitwise operators
    "no-new-func": "error",             // Disallow Function constructor (eval-like)
    "prefer-const": "error",            // Use const for variables that are never reassigned
    "no-lonely-if": "error",            // Avoid standalone if inside else — use else if instead
    "no-label-var": "error",            // Disallow labels sharing names with variables
    "require-await": "error",           // Disallow async functions without await
    "accessor-pairs": "error",          // Require getter when setter is defined (and vice versa)
    "no-lone-blocks": "error",          // Disallow unnecessary blocks { … } outside control structures
    "prefer-template": "error",         // Prefer template literals (`…${}…`) over concatenation
    "no-multi-assign": "error",         // Disallow chained assignment: a = b = c
    "no-octal-escape": "error",         // Disallow octal escape sequences like \0xx
    "no-await-in-loop": "error",        // Disallow await inside loops (to avoid sequential execution)
    "no-empty-pattern": "error",        // Disallow empty destructuring: const {} = obj
    "consistent-return": "error",       // All function branches must either return a value or not
    "no-param-reassign": "error",       // Disallow reassigning function parameters
    "no-useless-return": "error",       // Disallow redundant return statements that return nothing
    "eqeqeq": ["error", "always"],      // Always use === and !== instead of == and !=
    "prefer-rest-params": "error",      // Prefer ...rest over arguments
    "no-unneeded-ternary": "error",     // Remove ternary when it can be simplified
    "no-negated-condition": "error",    // Avoid negated conditions, invert the branches instead
    "no-duplicate-imports": "error",    // Disallow duplicate imports from the same module
    "prefer-arrow-callback": "error",   // Prefer arrow functions in callbacks
    "prefer-numeric-literals": "error", // Disallow 0x and 0o, use 0b/0o prefixes or decimal literals
    // Use x += y instead of x = x + y
    "operator-assignment": ["error", "always"],
    // Always use double quotes, but allow escaping avoidance
    "quotes": ["error", "double", { avoidEscape: true }],
    // Prefer object destructuring for single variable access where possible
    "prefer-destructuring": ["error", { object: true, array: false }],
    "max-len": [
        "error",
        {
            "code": 124,                    // Maximum line length — 124 characters
            "ignoreUrls": true,             // Ignore URLs in length check
            "ignoreStrings": true,          // Ignore string literals
            "ignoreRegExpLiterals": true,   // Ignore regular expressions
            "ignoreTemplateLiterals": true, // Ignore template literals
            "ignoreComments": true,         // Ignore comments
        }
    ],
};

const disabledRules = {
    "no-use-before-define": "off", // Allow using functions/classes before their declaration
    "no-case-declarations": "off", // Allow variable declarations inside case without a block
    "no-implicit-coercion": "off", // Allow shorthand type conversions (+, !!, ~, etc.)
    "no-new-wrappers": "off",      // Allow new String(), new Number(), new Boolean()
    "no-fallthrough": "off",       // Allow case fallthrough without break
    "no-dupe-keys": "off",         // Disabled, but TS already prevents duplicate keys in literals
};

/**
 * Rule documentation for this config {@link [here](https://eslint.org/docs/latest/)}
 */
const jsConfig = [
    {
        rules: {
            ...warnRules,
            ...enabledRules,
            ...disabledRules,
        },
    },
];

export default jsConfig;
