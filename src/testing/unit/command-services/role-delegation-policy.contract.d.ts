declare namespace Unit.Commands.RoleDelegationPolicy {
    interface Contract extends Core.Contract {
        commands: Commands.Signature;
    }

    namespace Commands {
        type Result = Core.Execution.Result & {
            commands: globalThis.Commands.RoleDelegationPolicy.Contract;
            service: Jest.Mocked<
                Pick<
                    Services.RoleDelegationPolicy.CommandContract,
                    "create" | "update" | "revoke" | "restore" | "purge" | "expire"
                >
            >;
            repository: {
                find: Jest.Mock<Repositories.RoleDelegationPolicy.PublicContract["find"]>;
            };
        };

        type Signature = () => Result;
    }
}
