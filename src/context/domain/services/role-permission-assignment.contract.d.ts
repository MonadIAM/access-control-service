declare namespace Services {
    namespace RolePermissionAssignment {
        interface Contract extends CommandContract {}

        interface CommandContract {
            restore: Restore.Signature;
            create: Create.Signature;
            revoke: Revoke.Signature;
            purge: Purge.Signature;
        }

        namespace Restore {
            type Props = {
                entities: Entities.RolePermissionAssignment[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
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

            type Signature = (props: Props) => Result;
        }

        namespace Revoke {
            type Props = {
                entities: Entities.RolePermissionAssignment[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                entities: Entities.RolePermissionAssignment[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }
    }
}
