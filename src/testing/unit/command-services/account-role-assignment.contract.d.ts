declare namespace Unit.Commands.AccountRoleAssignment {
    interface Contract extends Core.Contract {
        commands: Commands.Signature;
    }

    namespace Commands {
        type Result = Core.Execution.Result & {
            overrides: Jest.Mocked<Pick<Services.PermissionOverride.CommandContract, "clean">>;
            commands: globalThis.Commands.AccountRoleAssignment.Contract;
            assignments: Jest.Mocked<
                Pick<
                    Services.AccountRoleAssignment.CommandContract,
                    "create" | "ensure" | "purge" | "assign" | "revoke" | "restore" | "expire" | "clean"
                >
            >;
            cache: Jest.Mocked<
                Pick<InfrastructureServices.ProjectionCache.PublicContract, "checkRealm" | "validateAssignments">
            >;
            repository: {
                find: Jest.Mock<Repositories.AccountRoleAssignment.PublicContract["find"]>;
            };
        };

        type Signature = () => Result;
    }
}
