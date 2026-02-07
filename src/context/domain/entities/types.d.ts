import { AnyEntity, Ref } from "@mikro-orm/postgresql";

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
            now: Date;
            actor: string;
            reason: string;
        };

        namespace Role {
            type MutableFields = Pick<RoleEntity, "name" | "description">;

            type Seed = {
                code: string;
                name: string;
                actorType: RoleActorType;
                protoType: RoleProtoType;
                lastActions: DeltaAudit.LastActionsSnapshot<MutableFields>;
                description?: string;
                isSystemManaged?: boolean;
                nonDelegable?: boolean;
                isRevoked?: boolean;
            };

            type ConstructorProps = Seed & {
                realm: Ref<RealmEntity>;
            };

            type ChangeDataProps = BaseMethodProps & {
                patch: Partial<MutableFields>;
            };
        }

        namespace RolePermissionMatrix {
            type Seed = {
                lastActions: DeltaAudit.LastActionsSnapshot;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
            };

            type ConstructorProps = Seed & {
                permission: Ref<PermissionEntity>;
                realm: Ref<RealmEntity>;
                role: Ref<RoleEntity>;
            };
        }

        namespace RoleDelegationPolicy {
            type MutableFields = Pick<RoleDelegationPolicyEntity, "depthLimit" | "description">;

            type Seed = {
                lastActions: DeltaAudit.LastActionsSnapshot<MutableFields>;
                description?: string;
                depthLimit?: number;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
            };

            type ConstructorProps = Seed & {
                delegator: Ref<RoleEntity>;
                target: Ref<RoleEntity>;
                realm: Ref<RealmEntity>;
            };

            type ChangeDataProps = BaseMethodProps & {
                patch: Partial<MutableFields>;
            };
        }

        namespace RoleConflictMember {
            type Seed = {
                lastActions: DeltaAudit.LastActionsSnapshot;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
            };

            type ConstructorProps = Seed & {
                group: Ref<RoleConflictGroupEntity>;
                role: Ref<RoleEntity>;
            };
        }

        namespace RoleConflictGroup {
            type MutableFields = Pick<RoleConflictGroupEntity, "name" | "description" | "maxAllowed">;

            type Seed = {
                code: string;
                name: string;
                maxAllowed: number;
                lastActions: DeltaAudit.LastActionsSnapshot<MutableFields>;
                description?: string;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
            };

            type ConstructorProps = Seed & {
                realm: Ref<RealmEntity>;
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
                descendant: Ref<RoleEntity>;
                ancestor: Ref<RoleEntity>;
                realm: Ref<RealmEntity>;
            };
        }

        namespace Realm {
            type Seed = {
                code: string;
                name: string;
                lastActions: DeltaAudit.LastActionsSnapshot;
                description?: string;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
            };

            type ConstructorProps = Seed;
        }

        namespace Permission {
            type MutableFields = Pick<PermissionEntity, "name" | "description">;

            type Seed = {
                code: string;
                name: string;
                lastActions: DeltaAudit.LastActionsSnapshot<MutableFields>;
                description?: string;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
            };

            type ConstructorProps = Seed & {
                realm: Ref<RealmEntity>;
            };

            type ChangeDataProps = BaseMethodProps & {
                patch: Partial<MutableFields>;
            };
        }

        namespace PermissionOverride {
            type Seed = {
                accountId: string;
                effect: PermissionOverrideEffect;
                lastActions: DeltaAudit.LastActionsSnapshot;
                isRevoked?: boolean;
            };

            type ConstructorProps = Seed & {
                permission: Ref<PermissionEntity>;
                realm: Ref<RealmEntity>;
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
                accountId: string;
                lastActions: DeltaAudit.LastActionsSnapshot;
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
