import { ApiExtraModels, ApiResponse, getSchemaPath } from "@nestjs/swagger";
import { applyDecorators } from "@nestjs/common";

import { EXCEPTION_EXAMPLES } from "~common/exceptions";
import { ErrorResponseBodyDTO } from "~common/dto";

export function EndpointExceptions(...statuses: (keyof typeof EXCEPTION_EXAMPLES)[]): MethodDecorator & ClassDecorator {
    return applyDecorators(
        ApiExtraModels(ErrorResponseBodyDTO),
        ...statuses.map((status) =>
            ApiResponse({
                status,
                schema: { $ref: getSchemaPath(ErrorResponseBodyDTO) },
                example: EXCEPTION_EXAMPLES[status],
            }),
        ),
    );
}
