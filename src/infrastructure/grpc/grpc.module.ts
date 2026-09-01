import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { GRPC_CONFIG } from "./tokens";

const ACCESS_CONTROL_PROTO_PATH = require.resolve("@monadiam/shared/grpc/access_control.proto");

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
                    package: "monadiam.grpc.access_control.v1",
                    protoPath: ACCESS_CONTROL_PROTO_PATH,
                },
            }),
        },
    ],
    exports: [GRPC_CONFIG],
})
export class GRPCModule {}
