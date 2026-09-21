import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace RoleCommands {
                interface Contract extends CommandCore.Contract {
                    readonly commands: Commands.Signature;
                }

                namespace Commands {
                    type Result = CommandCore.Execution.Result & {
                        readonly commands: globalThis.Commands.Role.Contract;
                        readonly service: jest.Mocked<
                            Pick<
                                Services.Role.CommandContract,
                                "create" | "update" | "move" | "revoke" | "restore" | "purge" | "purgeSubtree"
                            >
                        >;
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
