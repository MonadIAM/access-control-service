declare namespace Unit.Commands.PermissionOverride {
    interface Contract extends Core.Contract {
        commands: Commands.Signature;
    }

    namespace Commands {
        type Result = Core.Execution.Result & {
            commands: globalThis.Commands.PermissionOverride.Contract;
            service: Jest.Mocked<
                Pick<Services.PermissionOverride.CommandContract, "create" | "revoke" | "restore" | "purge" | "expire">
            >;
            cache: {
                checkRealm: Jest.Mock<InfrastructureServices.ProjectionCache.CheckRealm.Signature>;
            };
            repository: {
                find: Jest.Mock<Repositories.PermissionOverride.PublicContract["find"]>;
            };
        };

        type Signature = () => Result;
    }
}
