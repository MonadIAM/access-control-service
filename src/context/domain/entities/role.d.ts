import { RoleActorType, RoleArchetype } from "~context/enums";

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
                archetype: RoleArchetype;
                description?: string;
                isSystemManaged: boolean;
                nonDelegable: boolean;
                isRevoked: boolean;

                realm: Entities.Realm;

                delegationPoliciesAsDelegator: ORM.Collection<Entities.RoleDelegationPolicy>;
                delegationPoliciesAsTarget: ORM.Collection<Entities.RoleDelegationPolicy>;
                permissionAssignments: ORM.Collection<Entities.RolePermissionAssignment>;
                accountAssignment: ORM.Collection<Entities.AccountRoleAssignment>;
                conflictMemberships: ORM.Collection<Entities.RoleConflictMember>;

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
                archetype: RoleArchetype;
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
