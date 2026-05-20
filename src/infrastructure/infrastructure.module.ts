import { Module } from "@nestjs/common";

import { DatabaseModule } from "./database";
import { RedisModule } from "./redis";
import { KafkaModule } from "./kafka";
import { GRPCModule } from "./grpc";

@Module({
    imports: [DatabaseModule, RedisModule, KafkaModule, GRPCModule],
    exports: [DatabaseModule, RedisModule, KafkaModule, GRPCModule],
})
export class InfrastructureModule {}
