import { Module } from "@nestjs/common";

import { REPOSITORIES } from "./infrastructure/repositories";
import { RoleController } from "./interface";

@Module({
    providers: [...REPOSITORIES],
    controllers: [RoleController],
})
export class AccessControlModule {}
