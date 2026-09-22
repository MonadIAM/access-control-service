declare namespace Unit.Commands.Role {
    interface Contract extends Core.Contract {
        commands: Commands.Signature;
    }

    namespace Commands {
        type Result = Core.Execution.Result & {
            commands: globalThis.Commands.Role.Contract;
            service: Jest.Mocked<
                Pick<
                    Services.Role.CommandContract,
                    "create" | "update" | "move" | "revoke" | "restore" | "purge" | "purgeSubtree"
                >
            >;
        };

        type Signature = () => Result;
    }
}
