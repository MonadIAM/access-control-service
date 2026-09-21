import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace RoleDelegationPolicyCommands {
                interface Contract extends CommandCore.Contract {
                    readonly commands: Commands.Signature;
                }

                namespace Commands {
                    type Result = CommandCore.Execution.Result & {
                        readonly commands: globalThis.Commands.RoleDelegationPolicy.Contract;
                        readonly service: jest.Mocked<
                            Pick<
                                Services.RoleDelegationPolicy.CommandContract,
                                "create" | "update" | "revoke" | "restore" | "purge" | "expire"
                            >
                        >;
                        readonly repository: {
                            readonly find: jest.Mock<Repositories.RoleDelegationPolicy.PublicContract["find"]>;
                        };
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
