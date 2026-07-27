declare namespace Services {
    namespace RolePermissionAssignment {
        interface Contract {
            restore(props: Restore.Props): Restore.Result;
            revoke(props: Revoke.Props): Revoke.Result;
            create(props: Create.Props): Create.Result;
            purge(props: Purge.Props): Purge.Result;
        }

        namespace Create {
            type Props = {
                transaction: ORM.EntityManager;
                realm: Entities.Realm;
                input: {
                    permissions: Entities.Permission[];
                    role: Entities.Role;
                };
            };

            type Result = Promise<Entities.RolePermissionAssignment[]>;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                entities: Entities.RolePermissionAssignment[];
            };

            type Result = void;
        }

        namespace Revoke {
            type Props = {
                entities: Entities.RolePermissionAssignment[];
            };

            type Result = void;
        }

        namespace Restore {
            type Props = {
                entities: Entities.RolePermissionAssignment[];
            };

            type Result = void;
        }
    }
}
