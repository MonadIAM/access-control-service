import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Services {
        namespace RoleConflictGroup {
            interface Contract {
                restore(props: Restore.Props): Restore.Result;
                revoke(props: Revoke.Props): Revoke.Result;
                create(props: Create.Props): Create.Result;
                update(props: Update.Props): Update.Result;
                purge(props: Purge.Props): Purge.Result;
            }

            namespace Create {
                type Props = {
                    transaction: EntityManager;
                    input: {
                        members: Entities.Role[];
                        description: string;
                        maxAllowed: number;
                        code: string;
                        name: string;
                    };
                    realm: Entities.Realm;
                };

                type Result = Promise<void>;
            }

            namespace Update {
                type Props = {
                    patch: Partial<Entities.RoleConflictGroup.MutableFields>;
                    entity: Entities.RoleConflictGroup;
                };

                type Result = void;
            }

            namespace Purge {
                type Props = {
                    transaction: EntityManager;
                    entities: Entities.RoleConflictGroup[];
                };

                type Result = void;
            }

            namespace Revoke {
                type Props = {
                    entities: Entities.RoleConflictGroup[];
                };

                type Result = void;
            }

            namespace Restore {
                type Props = {
                    entities: Entities.RoleConflictGroup[];
                };

                type Result = void;
            }
        }
    }
}
