const warnRules = {
    "no-console": "warn",               // Предупреждать при использовании console.* (console.log, console.error и т.д.)
    "no-useless-computed-key": "warn",  // Предупреждать если можно использовать key вместо ["key"] в объектах
};

const enabledRules = {
    "curly": "error",                   // Всегда использовать фигурные скобки в блоках if/else/for и т.д.
    "no-var": "error",                  // Запретить объявление переменных через var, только let/const
    "no-eval": "error",                 // Запретить использование eval()
    "no-alert": "error",                // Запретить alert(), confirm(), prompt()
    "no-proto": "error",                // Запретить доступ через __proto__
    "no-caller": "error",               // Запретить arguments.caller и arguments.callee
    "no-bitwise": "error",              // Запретить побитовые операторы
    "no-new-func": "error",             // Запретить конструктор Function (тоже eval-подобный)
    "prefer-const": "error",            // Переменные, которые не переназначаются, объявлять через const
    "no-lonely-if": "error",            // Избегать одиночных if внутри else — использовать else if
    "no-label-var": "error",            // Не использовать одинаковые имена меток и переменных
    "require-await": "error",           // Запретить async-функции без await внутри
    "accessor-pairs": "error",          // При наличии геттера должен быть и сеттер (и наоборот)
    "no-lone-blocks": "error",          // Запретить лишние блоки { … } вне конструкций
    "prefer-template": "error",         // Предпочитать шаблонные строки (`…${}…`) вместо конкатенации
    "no-multi-assign": "error",         // Запретить множественное присваивание: a = b = c
    "no-octal-escape": "error",         // Запретить escape-последовательности вида \0xx
    "no-await-in-loop": "error",        // Запретить await внутри циклов (во избежание последовательного выполнения)
    "no-empty-pattern": "error",        // Запретить пустые деструктуризации: const {} = obj
    "consistent-return": "error",       // Все ветки функции должны либо возвращать значение, либо не возвращать
    "no-param-reassign": "error",       // Не переназначать параметры функций
    "no-useless-return": "error",       // Запретить лишние return;, который ничего не возвращает
    "eqeqeq": ["error", "always"],      // Всегда использовать === и !== вместо == и !=
    "prefer-rest-params": "error",      // Предпочитать ...rest вместо arguments
    "no-unneeded-ternary": "error",     // Удалять тернар, если можно обойтись без него
    "no-negated-condition": "error",    // Избегать отрицания в условии, инвертировать ветки вместо этого
    "no-duplicate-imports": "error",    // Запретить дублирующиеся import из одного модуля
    "prefer-arrow-callback": "error",   // Предпочитать стрелочные функции в колбэках
    "prefer-numeric-literals": "error", // Запретить 0x и 0o, использовать префиксы 0b/0o или литералы десятичные
    // Использовать x += y вместо x = x + y
    "operator-assignment": ["error", "always"],
    // Всегда двойные кавычки, но позволять избегать экранирования
    "quotes": ["error", "double", { avoidEscape: true }],
    // По возможности предпочтительнее деструктуризация объектов в рамках одной переменной
    "prefer-destructuring": ["error", { object: true, array: false }],
    "max-len": [
        "error",
        {
            "code": 124,                    // Максимальная длина строки — 124 символа
            "ignoreUrls": true,             // Игнорировать URL в проверке длины
            "ignoreStrings": true,          // Игнорировать строковые литералы
            "ignoreRegExpLiterals": true,   // Игнорировать регулярные выражения
            "ignoreTemplateLiterals": true, // Игнорировать шаблонные строки
            "ignoreComments": true,         // Игнорировать комментарии
        }
    ],
};

const disabledRules = {
    "no-use-before-define": "off", // Разрешить использование функций/классов до их объявления
    "no-case-declarations": "off", // Разрешить объявления переменных внутри case без блока
    "no-implicit-coercion": "off", // Разрешить короткие преобразования типов (+, !!, ~ и т.д.)
    "no-new-wrappers": "off",      // Разрешить new String(), new Number(), new Boolean()
    "no-fallthrough": "off",       // Разрешить "провал" case без break
    "no-dupe-keys": "off",         // Отключено, но TS уже не позволяет дублировать ключи в литералах
};

/**
 * Документация по правилам для этого конфига {@link [тут](https://eslint.org/docs/latest/)}
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
