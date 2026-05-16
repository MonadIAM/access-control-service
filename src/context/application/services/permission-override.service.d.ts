import { EntityManager } from "@mikro-orm/postgresql";

import { PermissionOverrideEffect } from "~context/enums";

declare global {
    namespace Services {
        namespace PermissionOverride {
            interface Contract {
                restore: (props: Restore.Props) => Restore.Result;
                revoke: (props: Revoke.Props) => Revoke.Result;
                create: (props: Create.Props) => Create.Result;
                purge: (props: Purge.Props) => Purge.Result;
            }

            namespace Create {
                type Props = {
                    transaction: EntityManager;
                    input: {
                        effect: PermissionOverrideEffect;
                        permission: Entities.Permission;
                        account: string;
                    };
                    realm: Entities.Realm;
                };

                type Result = Promise<Entities.PermissionOverride>;
            }

            namespace Purge {
                type Props = {
                    transaction: EntityManager;
                    entities: Entities.PermissionOverride[];
                };

                type Result = void;
            }

            namespace Revoke {
                type Props = {
                    entities: Entities.PermissionOverride[];
                };

                type Result = void;
            }

            namespace Restore {
                type Props = {
                    entities: Entities.PermissionOverride[];
                };

                type Result = void;
            }
        }
    }
}
