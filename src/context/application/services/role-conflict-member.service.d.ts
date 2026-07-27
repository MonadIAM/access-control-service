declare namespace Services {
    namespace RoleConflictMember {
        interface Contract {
            create(props: Create.Props): Create.Result;
            purge(props: Purge.Props): Purge.Result;
        }

        namespace Create {
            type Props = {
                transaction: ORM.EntityManager;
                input: {
                    group: Entities.RoleConflictGroup;
                    roles: Entities.Role[];
                };
            };

            type Result = Promise<void>;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                entities: Entities.RoleConflictMember[];
            };

            type Result = void;
        }
    }
}
