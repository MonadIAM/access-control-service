import { Collection } from "@mikro-orm/core";

import { RoleActorType, RolePrototype } from "~context/enums";

declare global {
    namespace Entities {
        type Role = Role.Contract;

        namespace Role {
            interface Contract {
                id: string;
                createdAt: Date;
                updatedAt?: Date;
                version: number;

                code: string;
                name: string;
                actorType: RoleActorType;
                prototype: RolePrototype;
                description?: string;
                isSystemManaged: boolean;
                nonDelegable: boolean;
                isRevoked: boolean;

                realm: Entities.Realm;

                delegationPoliciesAsDelegator: Collection<Entities.RoleDelegationPolicy>;
                delegationPoliciesAsTarget: Collection<Entities.RoleDelegationPolicy>;
                permissionAssignments: Collection<Entities.RolePermissionAssignment>;
                conflictMemberships: Collection<Entities.RoleConflictMember>;
                accountAssignment: Collection<Entities.AccountRoleAssignment>;

                update(props: ChangeDataProps): void;
                canPurge(): void;
                restore(): void;
                revoke(): void;
            }

            type MutableFields = Pick<Contract, "name" | "description">;

            type ConstructorProps = {
                code: string;
                name: string;
                actorType: RoleActorType;
                prototype: RolePrototype;
                description?: string;
                isSystemManaged?: boolean;
                nonDelegable?: boolean;
                isRevoked?: boolean;
                realm: Entities.Realm;
            };

            type ChangeDataProps = {
                patch: Partial<MutableFields>;
            };
        }
    }
}
