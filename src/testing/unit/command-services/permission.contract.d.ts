declare namespace Unit.Commands.Permission {
    interface Contract extends Core.Contract {
        commands: Commands.Signature;
    }

    namespace Commands {
        type Result = Core.Execution.Result & {
            commands: globalThis.Commands.Permission.Contract;
            service: Jest.Mocked<
                Pick<Services.Permission.CommandContract, "create" | "update" | "revoke" | "restore" | "purge">
            >;
        };

        type Signature = () => Result;
    }
}
