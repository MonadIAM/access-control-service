import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace RoleConflictGroupCommands {
                interface Contract extends CommandCore.Contract {
                    readonly commands: Commands.Signature;
                }

                namespace Commands {
                    type Result = CommandCore.Execution.Result & {
                        readonly commands: globalThis.Commands.RoleConflictGroup.Contract;
                        readonly service: jest.Mocked<
                            Pick<
                                Services.RoleConflictGroup.CommandContract,
                                "create" | "update" | "revoke" | "restore" | "purge"
                            >
                        >;
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
