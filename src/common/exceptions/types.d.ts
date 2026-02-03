declare namespace Exception {
    type ResponseBody = {
        /* eslint-disable prettier/prettier */
        error: string;                // Тип/код ошибки (например, "Bad Request", "Forbidden").
        path?: string;                // Путь запроса.
        statusCode: number;           // HTTP-статус.
        timestamp?: string;           // Момент формирования ответа в ISO-формате.
        message: string | string[];   // Человекочитаемое сообщение или список сообщений.
        details?: ValidationDetail[]; // Детали валидации, если есть.
        /* eslint-enable prettier/prettier */
    };

    type ValidationDetail = {
        /* eslint-disable prettier/prettier */
        args?: Record<string, unknown> //
        invalidValue?: unknown;        // Значение поля, для которого сработала ошибка
        constraint: string;            // Имя сработавшего правила class-validator
        message: string;               // Человекочитаемое сообщение, предоставленное class-validator
        path: string;                  // Полный путь до поля
        /* eslint-enable prettier/prettier */
    };
}
