declare namespace Unit.Commands.RoleConflictGroup {
    interface Contract extends Core.Contract {
        commands: Commands.Signature;
    }

    namespace Commands {
        type Result = Core.Execution.Result & {
            commands: globalThis.Commands.RoleConflictGroup.Contract;
            service: Jest.Mocked<
                Pick<Services.RoleConflictGroup.CommandContract, "create" | "update" | "revoke" | "restore" | "purge">
            >;
        };

        type Signature = () => Result;
    }
}
