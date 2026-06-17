import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Services {
        namespace RoleConflictMember {
            interface Contract {
                create(props: Create.Props): Create.Result;
                purge(props: Purge.Props): Purge.Result;
            }

            namespace Create {
                type Props = {
                    transaction: EntityManager;
                    input: {
                        group: Entities.RoleConflictGroup;
                        roles: Entities.Role[];
                    };
                };

                type Result = Promise<void>;
            }

            namespace Purge {
                type Props = {
                    transaction: EntityManager;
                    entities: Entities.RoleConflictMember[];
                };

                type Result = void;
            }
        }
    }
}
