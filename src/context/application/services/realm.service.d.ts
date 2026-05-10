import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Services {
        namespace Realm {
            interface Contract {
                create: (props: Create.Props) => Promise<Create.Result>;
                restore: (props: Restore) => void;
                revoke: (props: Revoke) => void;
                update: (props: Update) => void;
                purge: (props: Purge) => void;
            }

            namespace Create {
                type Props = {
                    transaction: EntityManager;
                    input: {
                        description?: string;
                        code: string;
                        name: string;
                    };
                    actor: string;
                };

                type Result = {
                    assignments: {
                        permission: Entities.RolePermissionAssignment[];
                        role: Entities.AccountRoleAssignment[];
                    };
                    paths: Entities.RoleClosure[];
                    roles: Entities.Role[];
                    realm: Entities.Realm;
                };
            }

            type Update = {
                patch: Partial<Entities.Realm.MutableFields>;
                entity: Entities.Realm;
            };

            type Purge = {
                transaction: EntityManager;
                entities: Entities.Realm[];
            };

            type Revoke = {
                entities: Entities.Realm[];
            };

            type Restore = {
                entities: Entities.Realm[];
            };

            namespace CreateBaseRoles {
                type Props = {
                    input: Create.Props["input"];
                    transaction: EntityManager;
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
                    transaction: EntityManager;
                    realm: Entities.Realm;
                };

                type Result = Entities.RolePermissionAssignment[];
            }

            namespace AssignBaseRoles {
                type Props = {
                    roles: CreateBaseRoles.Result["roles"];
                    transaction: EntityManager;
                    realm: Entities.Realm;
                    actor: string;
                };

                type Result = Entities.AccountRoleAssignment[];
            }
        }
    }
}
