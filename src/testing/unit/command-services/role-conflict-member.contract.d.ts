declare namespace Unit.Commands.RoleConflictMember {
    interface Contract extends Core.Contract {
        commands: Commands.Signature;
    }

    namespace Commands {
        type Result = Core.Execution.Result & {
            commands: globalThis.Commands.RoleConflictMember.Contract;
            service: Jest.Mocked<Pick<Services.RoleConflictMember.CommandContract, "create" | "purge">>;
        };

        type Signature = () => Result;
    }
}
