import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace RoleConflictMemberCommands {
                interface Contract extends CommandCore.Contract {
                    readonly commands: Commands.Signature;
                }

                namespace Commands {
                    type Result = CommandCore.Execution.Result & {
                        readonly commands: globalThis.Commands.RoleConflictMember.Contract;
                        readonly service: jest.Mocked<
                            Pick<Services.RoleConflictMember.CommandContract, "create" | "purge">
                        >;
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
