import { AnyEntity } from "@mikro-orm/postgresql";

import {
    PermissionOverrideEffect,
    AccessControlActionType,
    AccessControlEntityType,
    RoleActorType,
    RoleProtoType,
} from "~context/enums";

import { RoleDelegationPolicy as RoleDelegationPolicyEntity } from "./role-delegation-policy.entity";
import { RoleConflictGroup as RoleConflictGroupEntity } from "./role-conflict-group.entity";
import { Permission as PermissionEntity } from "./permission.entity";
import { Realm as RealmEntity } from "./realm.entity";
import { Role as RoleEntity } from "./role.entity";

declare global {
    namespace Entities {
        type BaseMethodProps = {
            actor: string;
            reason: string;
        };

        namespace Role {
            type MutableFields = Pick<RoleEntity, "name" | "description">;

            type ConstructorProps = {
                actor: string;
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

            type ChangeDataProps = BaseMethodProps & {
                patch: Partial<MutableFields>;
            };
        }

        namespace RolePermissionAssignment {
            type ConstructorProps = {
                actor: string;
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
                actor: string;
                description?: string;
                depthLimit?: number;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
                delegator: RoleEntity;
                target: RoleEntity;
                realm: RealmEntity;
            };

            type ChangeDataProps = BaseMethodProps & {
                patch: Partial<MutableFields>;
            };
        }

        namespace RoleConflictMember {
            type ConstructorProps = {
                actor: string;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
                group: RoleConflictGroupEntity;
                role: RoleEntity;
            };
        }

        namespace RoleConflictGroup {
            type MutableFields = Pick<RoleConflictGroupEntity, "name" | "description" | "maxAllowed">;

            type ConstructorProps = {
                actor: string;
                code: string;
                name: string;
                maxAllowed: number;
                description?: string;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
                realm: RealmEntity;
            };

            type ChangeDataProps = BaseMethodProps & {
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
                actor: string;
                code: string;
                name: string;
                description?: string;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
            };

            type ChangeDataProps = BaseMethodProps & {
                patch: Partial<MutableFields>;
            };
        }

        namespace Permission {
            type MutableFields = Pick<PermissionEntity, "name" | "description">;

            type ConstructorProps = {
                actor: string;
                code: string;
                name: string;
                description?: string;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
                realm: RealmEntity;
            };

            type ChangeDataProps = BaseMethodProps & {
                patch: Partial<MutableFields>;
            };
        }

        namespace PermissionOverride {
            type ConstructorProps = {
                actor: string;
                account: string;
                effect: PermissionOverrideEffect;
                isRevoked?: boolean;
                permission: PermissionEntity;
                realm: RealmEntity;
            };
        }

        namespace AuditJournal {
            type ConstructorProps = {
                realm?: string;
                entity: string;
                actionType: AccessControlActionType;
                entityType: AccessControlEntityType;
                by: string;
                at: Date;
                ip?: string;
                userAgent?: string;
                patch?: DeltaAudit.Patch<AnyEntity>;
                reason?: string;
            };
        }

        namespace AccountRoleAssignment {
            type ConstructorProps = {
                actor: string;
                account: string;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
                realm: RealmEntity;
                role: RoleEntity;
            };
        }
    }
}
