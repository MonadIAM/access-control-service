import { Module } from "@nestjs/common";

import { REPOSITORIES } from "./infrastructure/repositories";

@Module({
    providers: [...REPOSITORIES],
})
export class AccessControlModule {}
