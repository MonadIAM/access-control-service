import { Module, Global } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { BullMQOtel } from "bullmq-otel";

import { RedisConfig } from "~infrastructure/redis";

@Global()
@Module({
    imports: [
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                connection: RedisConfig.buildQueueOptions(config),
                telemetry: new BullMQOtel({ tracerName: `${config.getOrThrow<string>("SERVICE_NAME")}-bullmq` }),
            }),
        }),
    ],
})
export class BullMQModule {}
