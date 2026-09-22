declare namespace Testing.EntityFactory {
    interface Contract {
        createRolePermissionAssignment: CreateRolePermissionAssignment.Signature;
        createAccountRoleAssignment: CreateAccountRoleAssignment.Signature;
        createRoleDelegationPolicy: CreateRoleDelegationPolicy.Signature;
        attachRoleConflictMembers: AttachRoleConflictMembers.Signature;
        createPermissionOverride: CreatePermissionOverride.Signature;
        createRoleConflictMember: CreateRoleConflictMember.Signature;
        createRoleConflictGroup: CreateRoleConflictGroup.Signature;
        createRoleClosure: CreateRoleClosure.Signature;
        createPermission: CreatePermission.Signature;
        createChangeLog: CreateChangeLog.Signature;
        createAuditLog: CreateAuditLog.Signature;
        collection: CollectionFactory.Signature;
        createRealm: CreateRealm.Signature;
        createRole: CreateRole.Signature;
    }

    namespace CreateRealm {
        type Props = Partial<Entities.Realm.Contract>;

        type Result = Entities.Realm;

        type Signature = (props?: Props) => Result;
    }

    namespace CreateRole {
        type Props = Partial<Entities.Role.Contract>;

        type Result = Entities.Role;

        type Signature = (props?: Props) => Result;
    }

    namespace CreatePermission {
        type Props = Partial<Entities.Permission.Contract>;

        type Result = Entities.Permission;

        type Signature = (props?: Props) => Result;
    }

    namespace CreateAccountRoleAssignment {
        type Props = Partial<Entities.AccountRoleAssignment.Contract>;

        type Result = Entities.AccountRoleAssignment;

        type Signature = (props?: Props) => Result;
    }

    namespace CreateRolePermissionAssignment {
        type Props = Partial<Entities.RolePermissionAssignment.Contract>;

        type Result = Entities.RolePermissionAssignment;

        type Signature = (props?: Props) => Result;
    }

    namespace CreatePermissionOverride {
        type Props = Partial<Entities.PermissionOverride.Contract>;

        type Result = Entities.PermissionOverride;

        type Signature = (props?: Props) => Result;
    }

    namespace CreateRoleDelegationPolicy {
        type Props = Partial<Entities.RoleDelegationPolicy.Contract>;

        type Result = Entities.RoleDelegationPolicy;

        type Signature = (props?: Props) => Result;
    }

    namespace CreateRoleConflictGroup {
        type Props = Partial<Entities.RoleConflictGroup.Contract>;

        type Result = Entities.RoleConflictGroup;

        type Signature = (props?: Props) => Result;
    }

    namespace CreateRoleConflictMember {
        type Props = Partial<Entities.RoleConflictMember.Contract>;

        type Result = Entities.RoleConflictMember;

        type Signature = (props?: Props) => Result;
    }

    namespace CreateRoleClosure {
        type Props = Entities.RoleClosure.ConstructorProps;

        type Result = Entities.RoleClosure;

        type Signature = (props: Props) => Result;
    }

    namespace AttachRoleConflictMembers {
        type Props = {
            members: Entities.RoleConflictMember[];
            group: Entities.RoleConflictGroup;
        };

        type Result = Entities.RoleConflictGroup;

        type Signature = (props: Props) => Result;
    }

    namespace CreateAuditLog {
        type Props = Partial<SystemEntities.AuditLog> & {
            context?: Partial<SystemEntities.AuditLog.ConstructorProps["context"]>;
        };

        type Result = SystemEntities.AuditLog;

        type Signature = (props?: Props) => Result;
    }

    namespace CreateChangeLog {
        type Props = Partial<SystemEntities.ChangeLog>;

        type Result = SystemEntities.ChangeLog;

        type Signature = (props?: Props) => Result;
    }

    namespace CollectionFactory {
        type Props<T extends object> = {
            owner: object;
            items: T[];
        };

        type Result<T extends object> = ORM.Collection<T>;

        type Signature = <T extends object>(props: Props<T>) => Result<T>;
    }
}
