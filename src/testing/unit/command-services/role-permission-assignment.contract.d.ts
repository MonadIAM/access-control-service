import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace RolePermissionAssignmentCommands {
                interface Contract extends CommandCore.Contract {
                    readonly commands: Commands.Signature;
                }

                namespace Commands {
                    type Result = CommandCore.Execution.Result & {
                        readonly commands: globalThis.Commands.RolePermissionAssignment.Contract;
                        readonly service: jest.Mocked<
                            Pick<
                                Services.RolePermissionAssignment.CommandContract,
                                "create" | "revoke" | "restore" | "purge"
                            >
                        >;
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
