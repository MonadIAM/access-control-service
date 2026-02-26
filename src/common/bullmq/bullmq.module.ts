import { ConfigService } from "@nestjs/config";
import { Module, Global } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";

@Global()
@Module({
    imports: [
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                connection: {
                    host: config.getOrThrow<string>("REDIS_HOST"),
                    port: Number(config.getOrThrow<string>("REDIS_PORT")),
                    password: config.getOrThrow<string>("REDIS_PASSWORD"),
                    db: Number(config.getOrThrow<string>("REDIS_DB_QUEUE")),
                },
            }),
        }),
    ],
})
export class BullMQModule {}
