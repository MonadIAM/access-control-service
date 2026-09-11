import { Collection } from "@mikro-orm/core";

declare global {
    namespace Unit {
        namespace Domain {
            namespace EntityFactory {
                interface Contract {
                    readonly createRolePermissionAssignment: CreateRolePermissionAssignment.Signature;
                    readonly createAccountRoleAssignment: CreateAccountRoleAssignment.Signature;
                    readonly createRoleDelegationPolicy: CreateRoleDelegationPolicy.Signature;
                    readonly attachRoleConflictMembers: AttachRoleConflictMembers.Signature;
                    readonly createPermissionOverride: CreatePermissionOverride.Signature;
                    readonly createRoleConflictMember: CreateRoleConflictMember.Signature;
                    readonly createRoleConflictGroup: CreateRoleConflictGroup.Signature;
                    readonly createPermission: CreatePermission.Signature;
                    readonly createChangeLog: CreateChangeLog.Signature;
                    readonly createAuditLog: CreateAuditLog.Signature;
                    readonly createRealm: CreateRealm.Signature;
                    readonly createRole: CreateRole.Signature;
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

                namespace AttachRoleConflictMembers {
                    type Props = {
                        readonly members: Entities.RoleConflictMember[];
                        readonly group: Entities.RoleConflictGroup;
                    };

                    type Result = Entities.RoleConflictGroup;

                    type Signature = (props: Props) => Result;
                }

                namespace CreateAuditLog {
                    type Props = Partial<SystemEntities.AuditLog>;

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
                        readonly items: T[];
                        readonly owner: object;
                    };

                    type Result<T extends object> = Collection<T>;

                    type Signature = <T extends object>(props: Props<T>) => Result<T>;
                }
            }
        }
    }
}
