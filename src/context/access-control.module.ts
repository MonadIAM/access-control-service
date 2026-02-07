import { Module } from "@nestjs/common";

import { REPOSITORIES } from "./infrastructure/repositories";
import { CONTROLLERS } from "./interface/controllers";

@Module({
    providers: [...REPOSITORIES],
    controllers: [...CONTROLLERS],
})
export class AccessControlModule {}
