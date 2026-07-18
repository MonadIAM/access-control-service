import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { ACCESS_CONTROL_PROTO_PATH } from "@monadiam/shared";
import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { GRPC_CONFIG } from "./tokens";

@Global()
@Module({
    providers: [
        {
            provide: GRPC_CONFIG,
            inject: [ConfigService],
            useFactory: (config: ConfigService): MicroserviceOptions => ({
                transport: Transport.GRPC,
                options: {
                    url: `${config.getOrThrow<string>("GRPC_HOST")}:${config.getOrThrow<number>("GRPC_PORT")}`,
                    protoPath: ACCESS_CONTROL_PROTO_PATH,
                    package: "access_control",
                },
            }),
        },
    ],
    exports: [GRPC_CONFIG],
})
export class GRPCModule {}
