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

            type Seed = {
                actor: string;
                code: string;
                name: string;
                actorType: RoleActorType;
                protoType: RoleProtoType;
                description?: string;
                isSystemManaged?: boolean;
                nonDelegable?: boolean;
                isRevoked?: boolean;
            };

            type ConstructorProps = Seed & {
                realm: RealmEntity;
            };

            type ChangeDataProps = BaseMethodProps & {
                patch: Partial<MutableFields>;
            };
        }

        namespace RolePermissionMatrix {
            type Seed = {
                actor: string;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
            };

            type ConstructorProps = Seed & {
                permission: PermissionEntity;
                realm: RealmEntity;
                role: RoleEntity;
            };
        }

        namespace RoleDelegationPolicy {
            type MutableFields = Pick<RoleDelegationPolicyEntity, "depthLimit" | "description">;

            type Seed = {
                actor: string;
                description?: string;
                depthLimit?: number;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
            };

            type ConstructorProps = Seed & {
                delegator: RoleEntity;
                target: RoleEntity;
                realm: RealmEntity;
            };

            type ChangeDataProps = BaseMethodProps & {
                patch: Partial<MutableFields>;
            };
        }

        namespace RoleConflictMember {
            type Seed = {
                actor: string;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
            };

            type ConstructorProps = Seed & {
                group: RoleConflictGroupEntity;
                role: RoleEntity;
            };
        }

        namespace RoleConflictGroup {
            type MutableFields = Pick<RoleConflictGroupEntity, "name" | "description" | "maxAllowed">;

            type Seed = {
                actor: string;
                code: string;
                name: string;
                maxAllowed: number;
                description?: string;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
            };

            type ConstructorProps = Seed & {
                realm: RealmEntity;
            };

            type ChangeDataProps = BaseMethodProps & {
                patch: Partial<MutableFields>;
            };
        }

        namespace RoleClosure {
            type Seed = {
                depth: number;
            };

            type ConstructorProps = Seed & {
                descendant: RoleEntity;
                ancestor: RoleEntity;
                realm: RealmEntity;
            };
        }

        namespace Realm {
            type MutableFields = Pick<PermissionEntity, "name" | "description">;

            type Seed = {
                actor: string;
                code: string;
                name: string;
                description?: string;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
            };

            type ConstructorProps = Seed;

            type ChangeDataProps = BaseMethodProps & {
                patch: Partial<MutableFields>;
            };
        }

        namespace Permission {
            type MutableFields = Pick<PermissionEntity, "name" | "description">;

            type Seed = {
                actor: string;
                code: string;
                name: string;
                description?: string;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
            };

            type ConstructorProps = Seed & {
                realm: RealmEntity;
            };

            type ChangeDataProps = BaseMethodProps & {
                patch: Partial<MutableFields>;
            };
        }

        namespace PermissionOverride {
            type Seed = {
                actor: string;
                account: string;
                effect: PermissionOverrideEffect;
                isRevoked?: boolean;
            };

            type ConstructorProps = Seed & {
                permission: PermissionEntity;
                realm: RealmEntity;
            };
        }

        namespace AuditJournal {
            type Seed = {
                action: AccessControlActionType;
                entity: AccessControlEntityType;
                realmId: string;
                entityId: string;
                by: string;
                at: Date;
                ip?: string;
                userAgent?: string;
                patch?: DeltaAudit.Patch<AnyEntity>;
                reason?: string;
            };

            type ConstructorProps = Seed;
        }

        namespace AccountRoleMatrix {
            type Seed = {
                actor: string;
                account: string;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
            };

            type ConstructorProps = Seed & {
                realm: RealmEntity;
                role: RoleEntity;
            };
        }
    }
}
