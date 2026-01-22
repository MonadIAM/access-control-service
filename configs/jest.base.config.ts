import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
    // Готовая конфигурация
    preset: "ts-jest",

    // Среда выполнения
    testEnvironment: "node",

    // Какие расширения файлов обрабатывать
    moduleFileExtensions: ["ts", "js", "json"],

    // Прекратить тестирование после первого сбоя
    bail: true,

    // Сбрасывать моки между тестами
    clearMocks: true,

    // Детектить "подвисшие" асинхронные операции
    detectOpenHandles: true,

    // Принудительно завершать процесс после тестов
    forceExit: true,

    // Подробный вывод
    verbose: true,

    // Передача глобальных переменных
    transform: {
        "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.json" }],
    },

    // Корневые папки для тестов
    roots: ["<rootDir>/src"],

    // Перенаправление путей
    moduleNameMapper: {
        "^~example$": "<rootDir>/src/example",
        "^~example/(.*)$": "<rootDir>/src/example/$1",
    },

    // Скрипты выполняемые до среды теста
    setupFiles: ["reflect-metadata"],
};

export default config;
