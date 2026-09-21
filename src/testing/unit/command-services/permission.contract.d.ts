import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace PermissionCommands {
                interface Contract extends CommandCore.Contract {
                    readonly commands: Commands.Signature;
                }

                namespace Commands {
                    type Result = CommandCore.Execution.Result & {
                        readonly commands: globalThis.Commands.Permission.Contract;
                        readonly service: jest.Mocked<
                            Pick<Services.Permission.CommandContract, "create" | "update" | "revoke" | "restore" | "purge">
                        >;
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
