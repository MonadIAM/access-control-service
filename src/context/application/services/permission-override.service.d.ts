import { PermissionOverrideEffect } from "~context/enums";

declare global {
    namespace Services {
        namespace PermissionOverride {
            interface Contract extends CommandContract {}

            interface CommandContract {
                restore: Restore.Signature;
                create: Create.Signature;
                revoke: Revoke.Signature;
                purge: Purge.Signature;
            }

            namespace Restore {
                type Props = {
                    entities: Entities.PermissionOverride[];
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }

            namespace Create {
                type Props = {
                    transaction: ORM.EntityManager;
                    realm: Entities.Realm;
                    input: {
                        effect: PermissionOverrideEffect;
                        permission: Entities.Permission;
                        account: string;
                    };
                };

                type Result = Promise<Entities.PermissionOverride>;

                type Signature = (props: Props) => Result;
            }

            namespace Revoke {
                type Props = {
                    entities: Entities.PermissionOverride[];
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }

            namespace Purge {
                type Props = {
                    transaction: ORM.EntityManager;
                    entities: Entities.PermissionOverride[];
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
