import { PermissionOverrideEffect } from "~context/enums";

declare global {
    namespace Fixtures.Core {
        interface Contract {
            createRolePermissionAssignment: CreateRolePermissionAssignment.Signature;
            createAccountRoleAssignment: CreateAccountRoleAssignment.Signature;
            createRoleDelegationPolicy: CreateRoleDelegationPolicy.Signature;
            createPermissionOverride: CreatePermissionOverride.Signature;
            createRoleConflictMember: CreateRoleConflictMember.Signature;
            createRoleConflictGroup: CreateRoleConflictGroup.Signature;
            createDetachedRole: CreateDetachedRole.Signature;
            createRoleClosure: CreateRoleClosure.Signature;
            createPermission: CreatePermission.Signature;
            createChangeLog: CreateChangeLog.Signature;
            createAuditLog: CreateAuditLog.Signature;
            createRealm: CreateRealm.Signature;
            createRole: CreateRole.Signature;
        }

        namespace CreateRealm {
            type Props = Partial<Entities.Realm.ConstructorProps> & {
                createdAt?: Date;
            };

            type Result = Promise<Entities.Realm>;

            type Signature = (props?: Props) => Result;
        }

        namespace CreateRole {
            type Props = Omit<Partial<Entities.Role.ConstructorProps>, "realm"> & {
                realm: Entities.Realm;
            };

            type Result = Promise<Entities.Role>;

            type Signature = (props: Props) => Result;
        }

        namespace CreateDetachedRole {
            type Props = CreateRole.Props;

            type Result = CreateRole.Result;

            type Signature = CreateRole.Signature;
        }

        namespace CreatePermission {
            type Props = Omit<Partial<Entities.Permission.ConstructorProps>, "realm"> & {
                realm: Entities.Realm;
            };

            type Result = Promise<Entities.Permission>;

            type Signature = (props: Props) => Result;
        }

        namespace CreateAccountRoleAssignment {
            type Props = Omit<Partial<Entities.AccountRoleAssignment.ConstructorProps>, "account" | "realm" | "role"> & {
                realm: Entities.Realm;
                role: Entities.Role;
                account: string;
            };

            type Result = Promise<Entities.AccountRoleAssignment>;

            type Signature = (props: Props) => Result;
        }

        namespace CreateRolePermissionAssignment {
            type Props = Omit<
                Partial<Entities.RolePermissionAssignment.ConstructorProps>,
                "permission" | "realm" | "role"
            > & {
                permission: Entities.Permission;
                realm: Entities.Realm;
                role: Entities.Role;
            };

            type Result = Promise<Entities.RolePermissionAssignment>;

            type Signature = (props: Props) => Result;
        }

        namespace CreateRoleDelegationPolicy {
            type Props = Omit<Partial<Entities.RoleDelegationPolicy.ConstructorProps>, "delegator" | "realm" | "target"> & {
                delegator: Entities.Role;
                realm: Entities.Realm;
                target: Entities.Role;
            };

            type Result = Promise<Entities.RoleDelegationPolicy>;

            type Signature = (props: Props) => Result;
        }

        namespace CreatePermissionOverride {
            type Props = Omit<
                Partial<Entities.PermissionOverride.ConstructorProps>,
                "account" | "effect" | "permission" | "realm"
            > & {
                effect: PermissionOverrideEffect;
                permission: Entities.Permission;
                realm: Entities.Realm;
                account: string;
            };

            type Result = Promise<Entities.PermissionOverride>;

            type Signature = (props: Props) => Result;
        }

        namespace CreateRoleConflictGroup {
            type Props = Omit<Partial<Entities.RoleConflictGroup.ConstructorProps>, "realm"> & {
                realm: Entities.Realm;
            };

            type Result = Promise<Entities.RoleConflictGroup>;

            type Signature = (props: Props) => Result;
        }

        namespace CreateRoleConflictMember {
            type Props = Omit<Partial<Entities.RoleConflictMember.ConstructorProps>, "group" | "role"> & {
                group: Entities.RoleConflictGroup;
                role: Entities.Role;
            };

            type Result = Promise<Entities.RoleConflictMember>;

            type Signature = (props: Props) => Result;
        }

        namespace CreateRoleClosure {
            type Props = Entities.RoleClosure.ConstructorProps;

            type Result = Promise<Entities.RoleClosure>;

            type Signature = (props: Props) => Result;
        }

        namespace CreateAuditLog {
            type Props = Omit<Partial<SystemEntities.AuditLog.ConstructorProps>, "context"> & {
                context?: Partial<Extract.Meta>;
            };

            type Result = Promise<SystemEntities.AuditLog>;

            type Signature = (props?: Props) => Result;
        }

        namespace CreateChangeLog {
            type Props = Omit<Partial<SystemEntities.ChangeLog.ConstructorProps>, "auditEntry"> & {
                auditEntry?: SystemEntities.AuditLog;
            };

            type Result = Promise<SystemEntities.ChangeLog>;

            type Signature = (props?: Props) => Result;
        }
    }
}
