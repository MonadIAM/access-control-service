import { Module } from "@nestjs/common";

import { HTTP_CONTROLLERS } from "~context/interface/controllers";

import { SWAGGER_STUB_PROVIDERS } from "./stub-providers";

@Module({
    controllers: HTTP_CONTROLLERS,
    providers: SWAGGER_STUB_PROVIDERS,
})
export class SwaggerModule {}
