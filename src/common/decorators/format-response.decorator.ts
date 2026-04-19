import { SetMetadata } from "@nestjs/common";

export const FORMAT_RESPONSE_DTO = Symbol("FORMAT_RESPONSE_DTO");

export const FormatResponse = (DTO: Class): MethodDecorator & ClassDecorator => {
    return SetMetadata(FORMAT_RESPONSE_DTO, DTO);
};
