import { Module } from "@nestjs/common";

import { REPOSITORIES } from "./infrastructure/repositories";
import { CONTROLLERS } from "./interface/controllers";
import { HANDLERS } from "./application/handlers";
import { SERVICES } from "./domain/services";

@Module({
    providers: [...REPOSITORIES, ...SERVICES, ...HANDLERS],
    controllers: [...CONTROLLERS],
})
export class AccessControlModule {}
