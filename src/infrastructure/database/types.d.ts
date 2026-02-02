import { ConfigService } from "@nestjs/config";

declare global {
    namespace MikroORM {
        type ConnectionKind = "write" | "read";

        namespace Config {
            namespace ResolveHost {
                type Props = {
                    kind: MikroORM.ConnectionKind;
                    config: ConfigService;
                    cqrsEnabled: boolean;
                };
            }

            namespace ResolvePort {
                type Props = {
                    kind: MikroORM.ConnectionKind;
                    config: ConfigService;
                    cqrsEnabled: boolean;
                };
            }

            namespace ResolvePool {
                type Props = {
                    kind: MikroORM.ConnectionKind;
                    config: ConfigService;
                    cqrsEnabled: boolean;
                };
                type Result = {
                    idleTimeoutMillis: number;
                    max: number;
                };
            }
        }
    }
}
