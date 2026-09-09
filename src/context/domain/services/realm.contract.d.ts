declare namespace Services {
    namespace Realm {
        interface Contract extends InternalContract, CommandContract {}

        interface InternalContract {
            assignBasePermissions: AssignBasePermissions.Signature;
            createBaseRoles: CreateBaseRoles.Signature;
            assignBaseRoles: AssignBaseRoles.Signature;
        }

        namespace AssignBasePermissions {
            type Props = {
                roles: CreateBaseRoles.Result["roles"];
                transaction: ORM.EntityManager;
                realm: Entities.Realm;
            };

            type Result = Promise<Entities.RolePermissionAssignment[]>;

            type Signature = (props: Props) => Result;
        }

        namespace CreateBaseRoles {
            type Props = {
                input: Create.Props["input"];
                transaction: ORM.EntityManager;
                realm: Entities.Realm;
            };

            type Result = {
                roles: Record<"admin" | "user" | "root", Entities.Role>;
                paths: Entities.RoleClosure[];
            };

            type Signature = (props: Props) => Result;
        }

        namespace AssignBaseRoles {
            type Props = {
                roles: CreateBaseRoles.Result["roles"];
                transaction: ORM.EntityManager;
                realm: Entities.Realm;
                actor: string;
            };

            type Result = Entities.AccountRoleAssignment[];

            type Signature = (props: Props) => Result;
        }

        interface CommandContract {
            restore: Restore.Signature;
            revoke: Revoke.Signature;
            create: Create.Signature;
            update: Update.Signature;
            purge: Purge.Signature;
        }

        namespace Restore {
            type Props = {
                transaction: ORM.EntityManager;
                identifiers: string[];
            };

            type Result = Promise<Entities.Realm[]>;

            type Signature = (props: Props) => Result;
        }

        namespace Create {
            type Props = {
                transaction: ORM.EntityManager;
                actor: string;
                input: {
                    description?: string;
                    code: string;
                    name: string;
                };
            };

            type Result = Promise<{
                assignments: {
                    permission: Entities.RolePermissionAssignment[];
                    role: Entities.AccountRoleAssignment[];
                };
                paths: Entities.RoleClosure[];
                roles: Entities.Role[];
                realm: Entities.Realm;
            }>;

            type Signature = (props: Props) => Result;
        }

        namespace Update {
            type Props = {
                patch: Partial<Entities.Realm.MutableFields>;
                transaction: ORM.EntityManager;
                id: string;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace Revoke {
            type Props = {
                transaction: ORM.EntityManager;
                identifiers: string[];
            };

            type Result = Promise<Entities.Realm[]>;

            type Signature = (props: Props) => Result;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                identifiers: string[];
            };

            type Result = Promise<Entities.Realm[]>;

            type Signature = (props: Props) => Result;
        }
    }
}
