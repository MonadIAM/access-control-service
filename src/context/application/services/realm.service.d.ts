declare namespace Services {
    namespace Realm {
        interface PrivateContract {
            assignBasePermissions(props: AssignBasePermissions.Props): AssignBasePermissions.Result;
            createBaseRoles(props: CreateBaseRoles.Props): CreateBaseRoles.Result;
            assignBaseRoles(props: AssignBaseRoles.Props): AssignBaseRoles.Result;
        }

        interface Contract extends PrivateContract {
            restore(props: Restore.Props): Restore.Result;
            revoke(props: Revoke.Props): Revoke.Result;
            create(props: Create.Props): Create.Result;
            update(props: Update.Props): Update.Result;
            purge(props: Purge.Props): Purge.Result;
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
        }

        namespace Update {
            type Props = {
                patch: Partial<Entities.Realm.MutableFields>;
                entity: Entities.Realm;
            };

            type Result = void;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                entities: Entities.Realm[];
            };

            type Result = void;
        }

        namespace Revoke {
            type Props = {
                entities: Entities.Realm[];
            };

            type Result = void;
        }

        namespace Restore {
            type Props = {
                entities: Entities.Realm[];
            };

            type Result = void;
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
        }

        namespace AssignBasePermissions {
            type Props = {
                roles: CreateBaseRoles.Result["roles"];
                transaction: ORM.EntityManager;
                realm: Entities.Realm;
            };

            type Result = Promise<Entities.RolePermissionAssignment[]>;
        }

        namespace AssignBaseRoles {
            type Props = {
                roles: CreateBaseRoles.Result["roles"];
                transaction: ORM.EntityManager;
                realm: Entities.Realm;
                actor: string;
            };

            type Result = Entities.AccountRoleAssignment[];
        }
    }
}
