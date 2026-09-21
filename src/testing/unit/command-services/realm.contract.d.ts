import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace RealmCommands {
                interface Contract extends CommandCore.Contract {
                    readonly commands: Commands.Signature;
                }

                namespace Commands {
                    type Result = CommandCore.Execution.Result & {
                        readonly commands: globalThis.Commands.Realm.Contract;
                        readonly service: jest.Mocked<
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
        }
    }
}
