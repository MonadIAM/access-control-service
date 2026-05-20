import { SetMetadata } from "@nestjs/common";

import { FORMAT_RESPONSE_DTO } from "./tokens";

export const FormatResponse = (DTO: Class): MethodDecorator & ClassDecorator => {
    return SetMetadata(FORMAT_RESPONSE_DTO, DTO);
};
