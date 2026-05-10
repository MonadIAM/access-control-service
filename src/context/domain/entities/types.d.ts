import { PermissionOverrideEffect, RoleActorType, RoleProtoType } from "~context/enums";

import { RolePermissionAssignment as RolePermissionAssignmentEntity } from "./role-permission-assignment.entity";
import { AccountRoleAssignment as AccountRoleAssignmentEntity } from "./account-role-assignment.entity";
import { RoleDelegationPolicy as RoleDelegationPolicyEntity } from "./role-delegation-policy.entity";
import { RoleConflictMember as RoleConflictMemberEntity } from "./role-conflict-member.entity";
import { PermissionOverride as PermissionOverrideEntity } from "./permission-override.entity";
import { RoleConflictGroup as RoleConflictGroupEntity } from "./role-conflict-group.entity";
import { RoleClosure as RoleClosureEntity } from "./role-closure.entity";
import { Permission as PermissionEntity } from "./permission.entity";
import { Realm as RealmEntity } from "./realm.entity";
import { Role as RoleEntity } from "./role.entity";

declare global {
    namespace Entities {
        namespace Role {
            type MutableFields = Pick<RoleEntity, "name" | "description">;

            type ConstructorProps = {
                code: string;
                name: string;
                actorType: RoleActorType;
                protoType: RoleProtoType;
                description?: string;
                isSystemManaged?: boolean;
                nonDelegable?: boolean;
                isRevoked?: boolean;
                realm: RealmEntity;
            };

            type ChangeDataProps = {
                patch: Partial<MutableFields>;
            };
        }

        type Role = RoleEntity;

        namespace RolePermissionAssignment {
            type ConstructorProps = {
                isSystemManaged?: boolean;
                isRevoked?: boolean;
                permission: PermissionEntity;
                realm: RealmEntity;
                role: RoleEntity;
            };
        }

        type RolePermissionAssignment = RolePermissionAssignmentEntity;

        namespace RoleDelegationPolicy {
            type MutableFields = Pick<RoleDelegationPolicyEntity, "depthLimit" | "description">;

            type ConstructorProps = {
                description?: string;
                depthLimit?: number;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
                delegator: RoleEntity;
                target: RoleEntity;
                realm: RealmEntity;
            };

            type ChangeDataProps = {
                patch: Partial<MutableFields>;
            };
        }

        type RoleDelegationPolicy = RoleDelegationPolicyEntity;

        namespace RoleConflictMember {
            type ConstructorProps = {
                isSystemManaged?: boolean;
                isRevoked?: boolean;
                group: RoleConflictGroupEntity;
                role: RoleEntity;
            };
        }

        type RoleConflictMember = RoleConflictMemberEntity;

        namespace RoleConflictGroup {
            type MutableFields = Pick<RoleConflictGroupEntity, "name" | "description" | "maxAllowed">;

            type ConstructorProps = {
                code: string;
                name: string;
                maxAllowed: number;
                description?: string;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
                realm: RealmEntity;
            };

            type ChangeDataProps = {
                patch: Partial<MutableFields>;
            };
        }

        type RoleConflictGroup = RoleConflictGroupEntity;

        namespace RoleClosure {
            type ConstructorProps = {
                depth: number;
                descendant: RoleEntity;
                ancestor: RoleEntity;
                realm: RealmEntity;
            };
        }

        type RoleClosure = RoleClosureEntity;

        namespace Realm {
            type MutableFields = Pick<RealmEntity, "name" | "description">;

            type ConstructorProps = {
                owner: string;
                code: string;
                name: string;
                description?: string;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
            };

            type ChangeDataProps = {
                patch: Partial<MutableFields>;
            };
        }

        type Realm = RealmEntity;

        namespace Permission {
            type MutableFields = Pick<PermissionEntity, "name" | "description">;

            type ConstructorProps = {
                code: string;
                name: string;
                description?: string;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
                realm: RealmEntity;
            };

            type ChangeDataProps = {
                patch: Partial<MutableFields>;
            };
        }

        type Permission = PermissionEntity;

        namespace PermissionOverride {
            type ConstructorProps = {
                account: string;
                effect: PermissionOverrideEffect;
                isRevoked?: boolean;
                permission: PermissionEntity;
                realm: RealmEntity;
            };
        }

        type PermissionOverride = PermissionOverrideEntity;

        namespace AccountRoleAssignment {
            type ConstructorProps = {
                account: string;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
                realm: RealmEntity;
                role: RoleEntity;
            };
        }

        type AccountRoleAssignment = AccountRoleAssignmentEntity;
    }
}
