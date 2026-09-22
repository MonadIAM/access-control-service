declare namespace Unit.Commands.RolePermissionAssignment {
    interface Contract extends Core.Contract {
        commands: Commands.Signature;
    }

    namespace Commands {
        type Result = Core.Execution.Result & {
            commands: globalThis.Commands.RolePermissionAssignment.Contract;
            service: Jest.Mocked<
                Pick<Services.RolePermissionAssignment.CommandContract, "create" | "revoke" | "restore" | "purge">
            >;
        };

        type Signature = () => Result;
    }
}
