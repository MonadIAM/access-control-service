import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace PermissionOverrideCommands {
                interface Contract extends CommandCore.Contract {
                    readonly commands: Commands.Signature;
                }

                namespace Commands {
                    type Result = CommandCore.Execution.Result & {
                        readonly commands: globalThis.Commands.PermissionOverride.Contract;
                        readonly service: jest.Mocked<
                            Pick<
                                Services.PermissionOverride.CommandContract,
                                "create" | "revoke" | "restore" | "purge" | "expire"
                            >
                        >;
                        readonly cache: {
                            readonly checkRealm: jest.Mock<InfrastructureServices.ProjectionCache.CheckRealm.Signature>;
                        };
                        readonly repository: {
                            readonly find: jest.Mock<Repositories.PermissionOverride.PublicContract["find"]>;
                        };
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
