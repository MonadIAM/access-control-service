import { PermissionOverrideEffect, RoleActorType, RoleProtoType } from "~context/enums";

import { RoleDelegationPolicy as RoleDelegationPolicyEntity } from "./role-delegation-policy.entity";
import { RoleConflictGroup as RoleConflictGroupEntity } from "./role-conflict-group.entity";
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

        namespace RolePermissionAssignment {
            type ConstructorProps = {
                isSystemManaged?: boolean;
                isRevoked?: boolean;
                permission: PermissionEntity;
                realm: RealmEntity;
                role: RoleEntity;
            };
        }

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

        namespace RoleConflictMember {
            type ConstructorProps = {
                isSystemManaged?: boolean;
                isRevoked?: boolean;
                group: RoleConflictGroupEntity;
                role: RoleEntity;
            };
        }

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

        namespace RoleClosure {
            type ConstructorProps = {
                depth: number;
                descendant: RoleEntity;
                ancestor: RoleEntity;
                realm: RealmEntity;
            };
        }

        namespace Realm {
            type MutableFields = Pick<PermissionEntity, "name" | "description">;

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

        namespace PermissionOverride {
            type ConstructorProps = {
                account: string;
                effect: PermissionOverrideEffect;
                isRevoked?: boolean;
                permission: PermissionEntity;
                realm: RealmEntity;
            };
        }

        namespace AccountRoleAssignment {
            type ConstructorProps = {
                account: string;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
                realm: RealmEntity;
                role: RoleEntity;
            };
        }
    }
}
