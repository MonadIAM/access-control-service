import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace AccountRoleAssignmentCommands {
                interface Contract extends CommandCore.Contract {
                    readonly commands: Commands.Signature;
                }

                namespace Commands {
                    type Result = CommandCore.Execution.Result & {
                        readonly overrides: jest.Mocked<Pick<Services.PermissionOverride.CommandContract, "clean">>;
                        readonly commands: globalThis.Commands.AccountRoleAssignment.Contract;
                        readonly assignments: jest.Mocked<
                            Pick<
                                Services.AccountRoleAssignment.CommandContract,
                                "create" | "ensure" | "purge" | "assign" | "revoke" | "restore" | "expire" | "clean"
                            >
                        >;
                        readonly cache: jest.Mocked<
                            Pick<
                                InfrastructureServices.ProjectionCache.PublicContract,
                                "checkRealm" | "validateAssignments"
                            >
                        >;
                        readonly repository: {
                            readonly find: jest.Mock<Repositories.AccountRoleAssignment.PublicContract["find"]>;
                        };
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
