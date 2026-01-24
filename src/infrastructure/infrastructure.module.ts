import { Module } from "@nestjs/common";

import { DatabaseModule } from "./database";
import { RedisModule } from "./redis";
import { KafkaModule } from "./kafka";

@Module({
    imports: [DatabaseModule, RedisModule, KafkaModule],
    exports: [DatabaseModule, RedisModule, KafkaModule],
})
export class InfrastructureModule {}
