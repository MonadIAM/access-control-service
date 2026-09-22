declare namespace Unit.Commands.Realm {
    interface Contract extends Core.Contract {
        commands: Commands.Signature;
    }

    namespace Commands {
        type Result = Core.Execution.Result & {
            commands: globalThis.Commands.Realm.Contract;
            service: Jest.Mocked<
                Pick<
                    Services.Realm.CommandContract,
                    | "create"
                    | "update"
                    | "revoke"
                    | "restore"
                    | "purge"
                    | "bootstrapOrganization"
                    | "bootstrapProject"
                    | "transferOwnership"
                    | "revokeBySystem"
                    | "restoreBySystem"
                    | "purgeBySystem"
                    | "purgeAccountAccess"
                    | "revokeAccountAccess"
                    | "restoreAccountAccess"
                >
            >;
        };

        type Signature = () => Result;
    }
}
