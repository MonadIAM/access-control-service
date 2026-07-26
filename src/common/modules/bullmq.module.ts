import { Module, Global } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";

@Global()
@Module({
    imports: [
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                connection: {
                    db: Number(config.getOrThrow<string>("REDIS_DB_QUEUE")),
                    password: config.getOrThrow<string>("REDIS_PASSWORD"),
                    port: Number(config.getOrThrow<string>("REDIS_PORT")),
                    host: config.getOrThrow<string>("REDIS_HOST"),
                },
            }),
        }),
    ],
})
export class BullMQModule {}
