import { Module, Global } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";

import { RedisConfig } from "~infrastructure/redis";

@Global()
@Module({
    imports: [
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                connection: RedisConfig.buildQueueOptions(config),
            }),
        }),
    ],
})
export class BullMQModule {}
